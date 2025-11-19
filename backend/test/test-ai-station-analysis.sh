#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Testing AI Station Upgrade Analysis ===${NC}\n"

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-1234567890}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password123}"

echo -e "${YELLOW}Step 1: Login as admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"emailOrPhone\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

# Extract access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

echo -e "${YELLOW}Step 2: Call AI Station Analysis endpoint...${NC}"
echo "This may take 3-6 seconds (Gemini API processing)..."
echo ""

ANALYSIS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/ai/analyze-station-upgrades" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Check if response is valid JSON
if ! echo "$ANALYSIS_RESPONSE" | jq empty 2>/dev/null; then
  echo -e "${RED}❌ Invalid JSON response!${NC}"
  echo "Response: $ANALYSIS_RESPONSE"
  exit 1
fi

# Check for errors
ERROR_MESSAGE=$(echo $ANALYSIS_RESPONSE | jq -r '.message // empty')
if [ ! -z "$ERROR_MESSAGE" ]; then
  STATUS_CODE=$(echo $ANALYSIS_RESPONSE | jq -r '.statusCode // empty')
  echo -e "${RED}❌ API Error (Status: $STATUS_CODE)${NC}"
  echo "Message: $ERROR_MESSAGE"
  exit 1
fi

echo -e "${GREEN}✅ Analysis completed successfully!${NC}"
echo ""

# Parse and display results
ANALYSIS_DATE=$(echo $ANALYSIS_RESPONSE | jq -r '.analysis_date')
TOTAL_STATIONS=$(echo $ANALYSIS_RESPONSE | jq -r '.total_stations_analyzed')
RECOMMENDATIONS_COUNT=$(echo $ANALYSIS_RESPONSE | jq '.recommendations | length')

echo -e "${YELLOW}=== Analysis Summary ===${NC}"
echo "Date: $ANALYSIS_DATE"
echo "Total Stations Analyzed: $TOTAL_STATIONS"
echo "Stations with Recommendations: $RECOMMENDATIONS_COUNT"
echo ""

# Display summary
SUMMARY=$(echo $ANALYSIS_RESPONSE | jq -r '.summary')
echo -e "${YELLOW}Overall Summary:${NC}"
echo "$SUMMARY"
echo ""

# Display high priority stations
HIGH_PRIORITY=$(echo $ANALYSIS_RESPONSE | jq -r '.recommendations[] | select(.priority == "HIGH") | .station_name')
HIGH_PRIORITY_COUNT=$(echo $ANALYSIS_RESPONSE | jq '[.recommendations[] | select(.priority == "HIGH")] | length')

if [ $HIGH_PRIORITY_COUNT -gt 0 ]; then
  echo -e "${RED}⚠️  HIGH PRIORITY Stations ($HIGH_PRIORITY_COUNT):${NC}"
  echo "$HIGH_PRIORITY" | while read -r station; do
    echo "  - $station"
  done
  echo ""
fi

# Display medium priority stations
MEDIUM_PRIORITY=$(echo $ANALYSIS_RESPONSE | jq -r '.recommendations[] | select(.priority == "MEDIUM") | .station_name')
MEDIUM_PRIORITY_COUNT=$(echo $ANALYSIS_RESPONSE | jq '[.recommendations[] | select(.priority == "MEDIUM")] | length')

if [ $MEDIUM_PRIORITY_COUNT -gt 0 ]; then
  echo -e "${YELLOW}⚡ MEDIUM PRIORITY Stations ($MEDIUM_PRIORITY_COUNT):${NC}"
  echo "$MEDIUM_PRIORITY" | while read -r station; do
    echo "  - $station"
  done
  echo ""
fi

# Display low priority stations
LOW_PRIORITY=$(echo $ANALYSIS_RESPONSE | jq -r '.recommendations[] | select(.priority == "LOW") | .station_name')
LOW_PRIORITY_COUNT=$(echo $ANALYSIS_RESPONSE | jq '[.recommendations[] | select(.priority == "LOW")] | length')

if [ $LOW_PRIORITY_COUNT -gt 0 ]; then
  echo -e "${GREEN}ℹ️  LOW PRIORITY Stations ($LOW_PRIORITY_COUNT):${NC}"
  echo "$LOW_PRIORITY" | while read -r station; do
    echo "  - $station"
  done
  echo ""
fi

# Display detailed recommendations (first 2)
echo -e "${YELLOW}=== Sample Detailed Recommendations ===${NC}"
echo $ANALYSIS_RESPONSE | jq -r '.recommendations[:2][] | 
  "
Station: \(.station_name) (ID: \(.station_id))
Priority: \(.priority)
Recommendation: \(.recommendation)

Reasons:
\(.reasons | map("  - " + .) | join("\n"))

Suggested Improvements:
\(.suggested_improvements | map("  - " + .) | join("\n"))

Estimated Impact:
\(.estimated_impact)
---
"'

# Save full response to file
OUTPUT_FILE="ai-analysis-result-$(date +%Y%m%d-%H%M%S).json"
echo $ANALYSIS_RESPONSE | jq '.' > "$OUTPUT_FILE"

echo -e "${GREEN}✅ Full analysis saved to: $OUTPUT_FILE${NC}"
echo ""
echo -e "${YELLOW}=== Test Completed ===${NC}"
