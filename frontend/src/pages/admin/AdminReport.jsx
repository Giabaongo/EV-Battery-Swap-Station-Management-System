import React, { useState } from 'react'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import aiService from '../../services/aiService'
import RecommendationCard from '../../components/admin/RecommendationCard'

export default function AdminReport() {
  const [loading, setLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await aiService.analyzeStationUpgrades()
      setAnalysisData(result)
      toast.success('Phân tích trạm thành công!')
    } catch (err) {
      console.error('Error analyzing stations:', err)
      setError(err.message || 'Failed to analyze stations')
      toast.error('Lỗi phân tích trạm: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setAnalysisData(null)
    handleAnalyze()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const removeVietnameseTones = (str) => {
    const from = "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ"
    const to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy"

    for (let i = 0; i < from.length; i++) {
      str = str.replace(new RegExp(from[i], 'gi'), to[i])
    }

    const FROM = "ÀÁÃẢẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆĐÙÚỦŨỤƯỪỨỬỮỰÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÌÍỈĨỊÄËÏÎÖÜÛÑÇÝỲỸỴỶ"
    const TO = "AAAAAAAAAAAAAAAAAEEEEEEEEEEEDUUUUUUUUUUUOOOOOOOOOOOOOOOOOIIIIIAEIIOUUNCYYYYY"

    for (let i = 0; i < FROM.length; i++) {
      str = str.replace(new RegExp(FROM[i], 'gi'), TO[i])
    }

    return str
  }

  const handleExportPDF = () => {
    if (!analysisData) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Use courier font for better compatibility
    doc.setFont('courier')

    // Title
    doc.setFontSize(16)
    doc.setFont('courier', 'bold')
    doc.text('AI Goi y Nang Cap Tram', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Analysis date and summary
    doc.setFontSize(10)
    doc.setFont('courier', 'normal')
    doc.text(`Ngay phan tich: ${formatDate(analysisData.analysis_date)}`, 20, yPosition)
    yPosition += 5
    doc.text(`Tong so tram duoc phan tich: ${analysisData.total_stations_analyzed}`, 20, yPosition)
    yPosition += 10

    // Summary section
    doc.setFont('courier', 'bold')
    doc.text('Tom tat:', 20, yPosition)
    yPosition += 5
    doc.setFont('courier', 'normal')
    const summaryText = removeVietnameseTones(analysisData.summary)
    const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 40)
    doc.text(summaryLines, 20, yPosition)
    yPosition += summaryLines.length * 5 + 10

    // Recommendations
    analysisData.recommendations.forEach((rec, idx) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFont('courier', 'bold')
      doc.setFontSize(11)
      doc.text(`Khuyen nghi ${idx + 1}: ${removeVietnameseTones(rec.station_name)}`, 20, yPosition)
      yPosition += 6

      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
      doc.text(`Uu tien: ${rec.priority}`, 20, yPosition)
      yPosition += 5

      // Recommendation text
      doc.text('De xuat:', 20, yPosition)
      yPosition += 4
      const recText = removeVietnameseTones(rec.recommendation)
      const recLines = doc.splitTextToSize(recText, pageWidth - 40)
      doc.text(recLines, 25, yPosition)
      yPosition += recLines.length * 4 + 3

      // Reasons
      doc.text('Ly do:', 20, yPosition)
      yPosition += 4
      rec.reasons.forEach((reason) => {
        const reasonText = removeVietnameseTones(reason)
        const reasonLines = doc.splitTextToSize(`- ${reasonText}`, pageWidth - 45)
        doc.text(reasonLines, 25, yPosition)
        yPosition += reasonLines.length * 4
      })
      yPosition += 2

      // Suggested improvements
      doc.text('Cai tien duoc de xuat:', 20, yPosition)
      yPosition += 4
      rec.suggested_improvements.forEach((improvement) => {
        const impText = removeVietnameseTones(improvement)
        const impLines = doc.splitTextToSize(`+ ${impText}`, pageWidth - 45)
        doc.text(impLines, 25, yPosition)
        yPosition += impLines.length * 4
      })
      yPosition += 2

      // Estimated impact
      doc.setFont('courier', 'italic')
      const impactText = removeVietnameseTones(rec.estimated_impact)
      const impactLines = doc.splitTextToSize(`Tac dong du kien: ${impactText}`, pageWidth - 40)
      doc.text(impactLines, 20, yPosition)
      doc.setFont('courier', 'normal')
      yPosition += impactLines.length * 4 + 8
    })

    // Download PDF
    doc.save(`station-analysis-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Xuat PDF thanh cong!')
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 flex flex-1 justify-center py-10">
          <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Analyzing station data...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-900/20 rounded-xl p-8">
                <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-4">Analysis Error</p>
                <p className="text-red-500 dark:text-red-300 mb-6">{error}</p>
                <button
                  onClick={handleAnalyze}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <span className="truncate">Thử lại</span>
                </button>
              </div>
            )}

            {/* Initial State - No Analysis */}
            {!analysisData && !loading && !error && (
              <div className="flex flex-col flex-1 items-center justify-center text-center">
                <div className="flex flex-col gap-3 max-w-lg items-center">
                  <p className="text-4xl font-black leading-tight tracking-[-0.033em] dark:text-white">AI Suggested Station Upgrades</p>
                  <p className="text-[#617589] text-base font-normal leading-normal dark:text-gray-400">Analyze station performance and receive useful recommendations from AI.</p>
                </div>
                <div className="mt-8">
                  <button
                    onClick={handleAnalyze}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
                  >
                    <span className="truncate">Analyze Station Performance</span>
                  </button>
                </div>
                <div className="mt-16 text-center">
                  <p className="text-[#617589] text-sm dark:text-gray-500">Press 'Analyze Station Performance' to start.</p>
                </div>
              </div>
            )}

            {/* Results State */}
            {analysisData && !loading && (
              <div className="flex flex-col gap-8">
                {/* Header Section */}
                <div className="flex flex-wrap justify-between items-start gap-4 p-4">
                  <div className="flex flex-col gap-3">
                    <p className="text-3xl font-black leading-tight tracking-[-0.033em] dark:text-white">
                      AI Suggested Station Upgrades <span className="font-normal text-2xl text-[#617589] dark:text-gray-400">(analyzed on {formatDate(analysisData.analysis_date)})</span>
                    </p>
                    <p className="text-[#617589] text-base font-normal leading-normal dark:text-gray-400">
                      Total stations analyzed: {analysisData.total_stations_analyzed}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRetry}
                      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 text-primary dark:bg-primary/30 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors"
                    >
                      <span className="truncate">Retry Analysis</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
                    >
                      <span className="truncate">Export PDF</span>
                    </button>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="bg-white dark:bg-background-dark/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex items-start gap-4">
                  <div className="text-3xl mt-1">📊</div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold dark:text-white">Tóm tắt từ AI</h3>
                    <p className="text-[#617589] dark:text-gray-400">{analysisData.summary}</p>
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="flex flex-col gap-6">
                  {analysisData.recommendations && analysisData.recommendations.length > 0 ? (
                    analysisData.recommendations.map((rec, idx) => (
                      <RecommendationCard key={idx} recommendation={rec} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">No recommendations available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}