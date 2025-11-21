import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { GeminiService } from './gemini.service';

export interface StationAnalysisData {
  station_id: number;
  name: string;
  address: string;
  status: string;
  totalSwaps: number;
  totalBatteries: number;
  availableBatteries: number;
  averageSwapsPerDay: number;
  peakHourSwaps: number;
}

export interface StationUpgradeRecommendation {
  station_id: number;
  station_name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  reasons: string[];
  suggested_improvements: string[];
  estimated_impact: string;
}

export interface AnalysisResult {
  analysis_date: string;
  total_stations_analyzed: number;
  recommendations: StationUpgradeRecommendation[];
  summary: string;
}

@Injectable()
export class StationAnalysisService {
  private readonly logger = new Logger(StationAnalysisService.name);

  constructor(
    private databaseService: DatabaseService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Collect station data with swap statistics
   */
  async collectStationData(): Promise<StationAnalysisData[]> {
    this.logger.log('Collecting station data...');

    // Get all stations with related data
    const stations = await this.databaseService.station.findMany({
      include: {
        batteries: {
          select: {
            battery_id: true,
            status: true,
          },
        },
        swap_transactions: {
          select: {
            transaction_id: true,
            createAt: true,
          },
          orderBy: {
            createAt: 'desc',
          },
        },
      },
    });

    // Process data for each station
    const stationData: StationAnalysisData[] = stations.map((station) => {
      const totalBatteries = station.batteries.length;
      const availableBatteries = station.batteries.filter(
        (b) => b.status === 'full',
      ).length;
      const totalSwaps = station.swap_transactions.length;

      // Calculate average swaps per day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSwaps = station.swap_transactions.filter(
        (swap) => new Date(swap.createAt) >= thirtyDaysAgo,
      );
      const averageSwapsPerDay = recentSwaps.length / 30;

      // Calculate peak hour swaps (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const weekSwaps = station.swap_transactions.filter(
        (swap) => new Date(swap.createAt) >= sevenDaysAgo,
      );
      
      // Group by hour to find peak
      const hourCounts: { [key: number]: number } = {};
      weekSwaps.forEach((swap) => {
        const hour = new Date(swap.createAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const peakHourSwaps = Math.max(...Object.values(hourCounts), 0);

      return {
        station_id: station.station_id,
        name: station.name,
        address: station.address,
        status: station.status,
        totalSwaps,
        totalBatteries,
        availableBatteries,
        averageSwapsPerDay: Math.round(averageSwapsPerDay * 10) / 10,
        peakHourSwaps,
      };
    });

    this.logger.log(`Collected data for ${stationData.length} stations`);
    return stationData;
  }

  /**
   * Analyze stations using Gemini AI and recommend upgrades
   */
  async analyzeStationsForUpgrade(): Promise<AnalysisResult> {
    try {
      this.logger.log('Starting station analysis for upgrade recommendations...');

      // Collect station data
      const stationData = await this.collectStationData();
      this.logger.log(`Station data collected: ${stationData.length} stations`);

      if (stationData.length === 0) {
        this.logger.warn('No station data found');
        return {
          analysis_date: new Date().toISOString(),
          total_stations_analyzed: 0,
          recommendations: [],
          summary: 'Không có dữ liệu trạm để phân tích.',
        };
      }

      // Build prompt for Gemini
      const prompt = this.buildAnalysisPrompt(stationData);
      this.logger.log('Prompt built, calling Gemini API...');

      // Get AI recommendations
      const aiResponse = await this.geminiService.generateStructuredResponse<{
        recommendations: StationUpgradeRecommendation[];
        summary: string;
      }>(prompt);

      this.logger.log('AI response received successfully');

      const result: AnalysisResult = {
        analysis_date: new Date().toISOString(),
        total_stations_analyzed: stationData.length,
        recommendations: aiResponse.recommendations || [],
        summary: aiResponse.summary || 'No summary provided',
      };

      this.logger.log('Station analysis completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Error during station analysis:', error);
      throw error;
    }
  }

  /**
   * Build prompt for Gemini AI analysis
   */
  private buildAnalysisPrompt(stationData: StationAnalysisData[]): string {
    return `
Bạn là chuyên gia phân tích hạ tầng trạm đổi pin xe điện. Hãy phân tích dữ liệu các trạm dưới đây và đề xuất những trạm nào cần nâng cấp hạ tầng dựa trên nhu cầu sử dụng.

DỮ LIỆU CÁC TRẠM:
${JSON.stringify(stationData, null, 2)}

YÊU CẦU PHÂN TÍCH:
1. Xác định các trạm có mức độ ưu tiên HIGH, MEDIUM, LOW dựa trên:
   - Tỷ lệ pin khả dụng so với tổng số pin (< 30% = HIGH)
   - Số lượt đổi pin trung bình mỗi ngày (> 15 lượt/ngày = HIGH)
   - Số lượt đổi pin trong giờ cao điểm (> 5 lượt/giờ = HIGH)
   - Tổng số lượt đổi pin (cho thấy mức độ sử dụng)
   - Trạng thái trạm (inactive/maintenance cần quan tâm)

2. Đối với mỗi trạm có vấn đề, cung cấp:
   - Lý do cụ thể (tối thiểu 2-3 lý do)
   - Đề xuất cải thiện cụ thể (tăng số pin, mở rộng diện tích, cải thiện quy trình, v.v.)
   - Ước tính tác động sau khi nâng cấp

3. Viết summary tổng quan về tình hình các trạm và khuyến nghị chung

ĐỊNH DẠNG TRÂINPUT (JSON):
{
  "recommendations": [
    {
      "station_id": number,
      "station_name": "string",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "recommendation": "string (mô tả ngắn gọn)",
      "reasons": ["lý do 1", "lý do 2", "lý do 3"],
      "suggested_improvements": ["cải thiện 1", "cải thiện 2"],
      "estimated_impact": "string (mô tả tác động dự kiến)"
    }
  ],
  "summary": "string (tổng quan và khuyến nghị chung)"
}

LƯU Ý:
- Chỉ đưa ra khuyến nghị cho các trạm thực sự cần nâng cấp (không bắt buộc phải có khuyến nghị cho tất cả trạm)
- Ưu tiên các trạm có dấu hiệu quá tải hoặc thiếu hụt tài nguyên
- Đảm bảo phản hồi là JSON hợp lệ, không có text thừa
- Sử dụng tiếng Việt cho tất cả nội dung text
`;
  }
}
