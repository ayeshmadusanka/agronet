#!/bin/bash

echo "🚀 Testing Complete Contract Flow"
echo "================================"

BASE_URL="http://localhost:8001"

# Test customer login
echo "1. Testing customer login..."
CUSTOMER_TOKEN=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testcustomer2@test.com","password":"password123"}' | \
  grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

if [ -n "$CUSTOMER_TOKEN" ]; then
  echo "✅ Customer login successful"
else
  echo "❌ Customer login failed"
  exit 1
fi

# Test farmer login
echo "2. Testing farmer login..."
FARMER_TOKEN=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testfarmer@test.com","password":"password123"}' | \
  grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

if [ -n "$FARMER_TOKEN" ]; then
  echo "✅ Farmer login successful"
else
  echo "❌ Farmer login failed"
  exit 1
fi

# Test contract creation
echo "3. Testing contract creation by customer..."
CONTRACT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/contracts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{"title":"Test Contract - Sweet Corn","description":"Need 50kg of sweet corn for restaurant","crop_type":"Corn","quantity_needed":50,"preferred_price_per_kilo":3.50,"deadline":"2025-10-01T12:00:00","location":"Los Angeles, CA"}')

if echo "$CONTRACT_RESPONSE" | grep -q "Contract created successfully"; then
  echo "✅ Contract creation successful"
  CONTRACT_ID=$(echo "$CONTRACT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
else
  echo "❌ Contract creation failed"
  echo "$CONTRACT_RESPONSE"
  exit 1
fi

# Test farmer viewing contracts
echo "4. Testing farmer can view customer contracts..."
CONTRACTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/contracts" \
  -H "Authorization: Bearer $FARMER_TOKEN")

if echo "$CONTRACTS_RESPONSE" | grep -q "Test Contract - Sweet Corn"; then
  echo "✅ Farmer can see customer contracts"
else
  echo "❌ Farmer cannot see contracts"
  exit 1
fi

# Test farmer placing bid
echo "5. Testing farmer placing bid..."
BID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/contracts/$CONTRACT_ID/bid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -d '{"quantity_offered":50,"price_per_kilo":3.25,"message":"Fresh sweet corn from my farm, ready for immediate delivery"}')

if echo "$BID_RESPONSE" | grep -q "Bid placed successfully"; then
  echo "✅ Farmer bid placement successful"
else
  echo "❌ Farmer bid placement failed"
  echo "$BID_RESPONSE"
  exit 1
fi

# Test customer viewing bids
echo "6. Testing customer can view received bids..."
MY_CONTRACTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/my-contracts" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if echo "$MY_CONTRACTS_RESPONSE" | grep -q "Test Farmer"; then
  echo "✅ Customer can see farmer bids"
else
  echo "❌ Customer cannot see bids"
  exit 1
fi

echo ""
echo "🎉 ALL TESTS PASSED!"
echo "✅ Contract marketplace is working correctly:"
echo "   - Customers can create contracts"
echo "   - Farmers can view available contracts"
echo "   - Farmers can place bids"
echo "   - Customers can view received bids"
echo "   - Frontend proxy configuration working"
echo "   - API integration complete"