# AI Station Analysis Report Implementation

## Overview

Implemented a complete AI-powered station analysis and recommendation system for admin dashboard. Uses Gemini AI to analyze station performance and provide upgrade recommendations.

## Components & Services Added

### 1. **AI Service** (`frontend/src/services/aiService.js`)

- **Method**: `analyzeStationUpgrades()`
- **Purpose**: Calls backend endpoint to get AI analysis
- **Endpoint**: `GET /api/v1/ai/analyze-station-upgrades`
- **Authorization**: Admin only

```javascript
const aiService = {
  analyzeStationUpgrades: async () => {
    const response = await api.get(API_ENDPOINTS.AI.ANALYZE_STATION_UPGRADES);
    return response.data;
  },
};
```

### 2. **AdminReport Component** (`frontend/src/pages/admin/AdminReport.jsx`)

#### Features:

- **Three States**:
  1. **Initial State**: Shows title and "Phân tích hiệu suất trạm" button
  2. **Loading State**: Shows spinner while AI analyzes
  3. **Results State**: Displays recommendations with full details

#### UI Components:

- Header with analysis date and total stations
- Summary section with AI insights
- Recommendation cards with:
  - Station name and priority badge (HIGH/MEDIUM/LOW)
  - Station info grid
  - Detailed recommendation text
  - List of reasons
  - Suggested improvements with checkmarks
  - Estimated impact statement

#### Actions:

- **Phân tích hiệu suất trạm**: Trigger AI analysis
- **Phân tích lại**: Re-run analysis with updated data
- **Xuất CSV**: Export recommendations to CSV file

#### State Management:

```javascript
const [loading, setLoading] = useState(false);
const [analysisData, setAnalysisData] = useState(null);
const [error, setError] = useState(null);
```

## Backend Response Format

The backend `/api/v1/ai/analyze-station-upgrades` endpoint returns:

```json
{
  "analysis_date": "2025-11-11T14:35:33.717Z",
  "total_stations_analyzed": 11,
  "recommendations": [
    {
      "station_id": 6,
      "station_name": "Trạm SG-02",
      "priority": "HIGH",
      "recommendation": "Nâng cấp hạ tầng để đáp ứng nhu cầu...",
      "reasons": ["Không có pin khả dụng...", "..."],
      "suggested_improvements": ["Tăng số lượng pin...", "..."],
      "estimated_impact": "Giảm tình trạng hết pin..."
    }
  ],
  "summary": "Nhìn chung, một số trạm đang gặp tình trạng thiếu pin..."
}
```

## Constants

Located in `frontend/src/constants/index.js`:

```javascript
AI: {
  ANALYZE_STATION_UPGRADES: "/ai/analyze-station-upgrades",
}
```

## Features

### Priority Levels

- **HIGH** (Đỏ): Critical - requires immediate action
- **MEDIUM** (Cam): Important - should be addressed soon
- **LOW** (Xanh): Advisory - monitor and plan

### CSV Export

- Exports all recommendations to downloadable CSV file
- Filename format: `station-analysis-YYYY-MM-DD.csv`
- Includes all recommendation details

### Error Handling

- Shows error message if analysis fails
- Provides "Thử lại" button to retry
- Uses toast notifications for feedback

### Responsive Design

- Works on mobile, tablet, and desktop
- Dark mode support
- Tailwind CSS styling with project theme colors

## User Flow

1. Admin navigates to AdminReport page
2. Clicks "Phân tích hiệu suất trạm" button
3. Loading spinner appears while AI analyzes data
4. Results display with:
   - Summary from AI
   - Individual station recommendations sorted by priority
   - Action buttons for retry and export
5. Admin can review recommendations and take actions
6. Can export data to CSV for sharing/records

## Integration Points

- **Backend**: `GET /api/v1/ai/analyze-station-upgrades` (NestJS)
- **Frontend Service**: `aiService.analyzeStationUpgrades()`
- **Component**: `AdminReport.jsx`
- **Auth**: Requires admin role (enforced on backend)

## Styling

Uses project design system:

- Primary color: `#137fec` (blue)
- Background light: `#f6f7f8`
- Background dark: `#101922`
- Priority colors:
  - HIGH: `#DC3545` (red)
  - MEDIUM: `#FD7E14` (orange)
  - LOW: `#28A745` (green)

## Notes

- AI analysis uses Gemini API (backend)
- Analysis considers:
  - Available batteries at station
  - Total battery capacity
  - Location and demand
  - Historical usage patterns
- Recommendations are data-driven and AI-generated
- Export functionality uses browser download API
- All API calls include auth token via interceptor
