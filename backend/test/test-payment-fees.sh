#!/bin/bash

# Test script for new payment with fees API
# Requirements: Backend running on port 8080, PostgreSQL database populated with seed data

echo "========== Testing Payment with Fees API =========="
echo ""

# Base URL
BASE_URL="http://localhost:8080/api/v1"

# Test data from seed-test-data.ts
USER_ID=19              # driver1@test.com
PACKAGE_ID=1            # Basic package
VEHICLE_ID=1            # Tesla Model 3

echo "Test 1: Subscription with Deposit"
echo "=================================="
echo "Request:"
curl -X POST "$BASE_URL/payments/calculate-and-create-vnpay-url" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $USER_ID,
    \"package_id\": $PACKAGE_ID,
    \"vehicle_id\": $VEHICLE_ID,
    \"payment_type\": \"subscription_with_deposit\"
  }"

echo -e "\n\n"

echo "Test 2: Damage Fee (High)"
echo "========================="
echo "Request:"
curl -X POST "$BASE_URL/payments/calculate-and-create-vnpay-url" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $USER_ID,
    \"package_id\": $PACKAGE_ID,
    \"vehicle_id\": $VEHICLE_ID,
    \"payment_type\": \"damage_fee\",
    \"damage_type\": \"high\"
  }"

echo -e "\n\n"

echo "Test 3: Simple Subscription (No Fees)"
echo "===================================="
echo "Request:"
curl -X POST "$BASE_URL/payments/calculate-and-create-vnpay-url" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $USER_ID,
    \"package_id\": $PACKAGE_ID,
    \"vehicle_id\": $VEHICLE_ID,
    \"payment_type\": \"subscription\"
  }"

echo -e "\n\n"

echo "Test 4: Without Authentication (should fail)"
echo "==========================================="
echo "Request:"
curl -X POST "$BASE_URL/payments/calculate-and-create-vnpay-url" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $USER_ID,
    \"package_id\": $PACKAGE_ID,
    \"vehicle_id\": $VEHICLE_ID,
    \"payment_type\": \"subscription_with_deposit\"
  }"

echo -e "\n\n========== Test Complete =========="
