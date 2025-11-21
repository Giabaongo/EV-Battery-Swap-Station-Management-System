# AI Station Upgrade Analysis API

## Overview

API sử dụng Google Gemini AI để phân tích dữ liệu các trạm đổi pin và đề xuất nâng cấp hạ tầng dựa trên nhu cầu sử dụng thực tế.

## Setup

### 1. Cài đặt Google Generative AI Package

```bash
npm install @google/generative-ai
```

### 2. Thiết lập Gemini API Key

Thêm vào file `.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

**Lấy API key miễn phí tại:** https://aistudio.google.com/app/apikey

### 3. Kiểm tra cấu hình

Đảm bảo `ConfigModule` đã được import trong `app.module.ts`:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // other modules...
  ],
})
```

## API Endpoint

### Phân tích nâng cấp trạm

**Endpoint:** `GET /ai/analyze-station-upgrades`

**Authentication:** Yêu cầu JWT token (role: `admin`)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Format:**

```json
{
  "analysis_date": "2025-01-15T10:30:00.000Z",
  "total_stations_analyzed": 15,
  "recommendations": [
    {
      "station_id": 3,
      "station_name": "Trạm Quận 1",
      "priority": "HIGH",
      "recommendation": "Cần mở rộng số lượng pin và cải thiện hệ thống sạc",
      "reasons": [
        "Tỷ lệ pin khả dụng thấp (15%)",
        "Số lượt đổi pin trung bình cao (18 lượt/ngày)",
        "Giờ cao điểm quá tải (8 lượt/giờ)"
      ],
      "suggested_improvements": [
        "Tăng thêm 10-15 pin đầy để đáp ứng nhu cầu",
        "Lắp đặt thêm 3-5 trạm sạc nhanh",
        "Mở rộng diện tích trạm để lưu trữ nhiều pin hơn",
        "Tối ưu hóa quy trình sạc để tăng tỷ lệ pin khả dụng"
      ],
      "estimated_impact": "Sau khi nâng cấp, dự kiến tỷ lệ pin khả dụng tăng lên 50-60%, giảm thời gian chờ đợi và cải thiện trải nghiệm khách hàng"
    },
    {
      "station_id": 7,
      "station_name": "Trạm Bình Thạnh",
      "priority": "MEDIUM",
      "recommendation": "Cần cải thiện hệ thống quản lý pin",
      "reasons": [
        "Tỷ lệ pin khả dụng thấp (25%)",
        "Nhu cầu sử dụng trung bình (10 lượt/ngày)"
      ],
      "suggested_improvements": [
        "Tối ưu quy trình sạc pin",
        "Bảo trì định kỳ hệ thống",
        "Tăng thêm 5 pin để đảm bảo dự phòng"
      ],
      "estimated_impact": "Cải thiện khả năng phục vụ trong giờ cao điểm, tăng tỷ lệ pin khả dụng lên 40-45%"
    }
  ],
  "summary": "Tổng quan: Trong 15 trạm được phân tích, có 5 trạm cần nâng cấp khẩn cấp (HIGH), 3 trạm cần cải thiện (MEDIUM). Các trạm có mức độ sử dụng cao (>15 lượt/ngày) và tỷ lệ pin khả dụng thấp (<30%) cần được ưu tiên đầu tư. Khuyến nghị tập trung mở rộng số lượng pin và cải thiện hệ thống sạc để đáp ứng nhu cầu ngày càng tăng."
}
```

## Quy trình phân tích

### 1. Thu thập dữ liệu trạm

Service sẽ tự động lấy thông tin từ database:

- **Thông tin cơ bản:** station_id, name, address, status
- **Số lượng pin:** Tổng số pin và số pin khả dụng (status = 'full')
- **Lịch sử giao dịch:** Tổng số lượt đổi pin
- **Số lượt đổi pin trung bình:** Tính theo 30 ngày gần nhất
- **Giờ cao điểm:** Số lượt đổi nhiều nhất trong 1 giờ (7 ngày gần nhất)

### 2. Phân tích bằng Gemini AI

Dữ liệu được gửi đến Google Gemini Pro model với prompt chi tiết:

**Tiêu chí phân tích:**
- Tỷ lệ pin khả dụng < 30% → HIGH priority
- Số lượt đổi pin > 15/ngày → HIGH priority
- Số lượt đổi giờ cao điểm > 5/giờ → HIGH priority
- Trạng thái trạm (inactive/maintenance)

**Yêu cầu đề xuất:**
- Lý do cụ thể (tối thiểu 2-3 lý do)
- Đề xuất cải thiện chi tiết
- Ước tính tác động sau nâng cấp

### 3. Parse và trả kết quả

Gemini trả về JSON response được parse và format lại theo chuẩn API.

## Architecture

```
Client Request
    ↓
AI Controller (GET /ai/analyze-station-upgrades)
    ↓
StationAnalysisService
    ├─ collectStationData()
    │   └─ Query database via Prisma
    │       - Station info
    │       - Battery counts
    │       - Swap transactions
    ↓
    ├─ buildAnalysisPrompt()
    │   └─ Format data + instructions
    ↓
    └─ GeminiService.generateStructuredResponse()
        └─ Call Gemini Pro API
            └─ Parse JSON response
    ↓
Response to Client
```

## Code Structure

```
backend/src/ai/
├── ai.module.ts                      # Module configuration
├── ai.controller.ts                  # API endpoints
├── ai.service.ts                     # Base AI service (auto-generated)
└── services/
    ├── gemini.service.ts             # Gemini API integration
    └── station-analysis.service.ts   # Station analysis logic
```

## Example Usage

### Using cURL:

```bash
# Login first to get JWT token
TOKEN=$(curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.access_token')

# Call AI analysis endpoint
curl -X GET http://localhost:8080/ai/analyze-station-upgrades \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### Using JavaScript/TypeScript:

```typescript
const response = await fetch('http://localhost:8080/ai/analyze-station-upgrades', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
  },
});

const analysis = await response.json();
console.log('Analysis Results:', analysis);

// Check high priority stations
const highPriority = analysis.recommendations.filter(
  r => r.priority === 'HIGH'
);
console.log(`Found ${highPriority.length} stations needing urgent upgrades`);
```

## Error Handling

### Common Errors:

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
→ Kiểm tra JWT token

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```
→ User không có role `admin`

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```
→ Kiểm tra:
- GEMINI_API_KEY có hợp lệ không
- Database connection
- Log file để xem chi tiết lỗi

## Performance Considerations

### Response Time:
- Thu thập dữ liệu: ~200-500ms (tùy số lượng trạm)
- Gemini AI processing: ~2-5 giây
- **Total:** ~3-6 giây

### Rate Limits:
- Gemini API (free tier): 60 requests/minute
- Khuyến nghị: Cache kết quả phân tích, chỉ chạy 1-2 lần/ngày

### Optimization:
```typescript
// TODO: Implement caching
@Get('analyze-station-upgrades')
@UseInterceptors(CacheInterceptor)
@CacheTTL(86400) // Cache 24 hours
async analyzeStationUpgrades(): Promise<AnalysisResult> {
  // ...
}
```

## Testing

### Manual Test:

1. Đảm bảo có dữ liệu test trong database
2. Login với admin account
3. Call endpoint `GET /ai/analyze-station-upgrades`
4. Verify response format

### Check logs:

```bash
# Backend logs will show:
# [StationAnalysisService] Collecting station data...
# [StationAnalysisService] Collected data for X stations
# [StationAnalysisService] Starting station analysis...
# [GeminiService] Calling Gemini API...
# [StationAnalysisService] Station analysis completed successfully
```

## Future Enhancements

1. **Historical Analysis:** Track recommendations over time
2. **Auto-scheduling:** Tự động chạy phân tích định kỳ
3. **Email Notifications:** Gửi thông báo khi có trạm HIGH priority
4. **Cost Estimation:** Tích hợp ước tính chi phí nâng cấp
5. **Custom Filters:** Cho phép filter theo khu vực, thời gian
6. **Comparison Reports:** So sánh trước/sau nâng cấp

## References

- [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [NestJS Guards](https://docs.nestjs.com/guards)
