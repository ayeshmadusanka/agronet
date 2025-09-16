#!/bin/bash

echo "==================================="
echo "Testing Complete Authentication Flow"
echo "==================================="

# Start the Laravel server in background
cd backend
php artisan serve --port=8003 &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "1. Testing Registration for all roles..."
echo "-------------------------------------"

# Test Customer Registration
echo "Testing Customer Registration:"
curl -s -X POST http://127.0.0.1:8003/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "testcustomer@example.com",
    "password": "password123",
    "role": "customer",
    "address": "123 Customer St"
  }' | python3 -c "import json, sys; print('✅ Customer:', 'SUCCESS' if 'successfully' in json.load(sys.stdin).get('message', '') else 'FAILED')" 2>/dev/null || echo "❌ Customer: FAILED"

# Test Farmer Registration
echo "Testing Farmer Registration:"
curl -s -X POST http://127.0.0.1:8003/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farmer",
    "email": "testfarmer@example.com",
    "password": "password123",
    "role": "farmer",
    "address": "123 Farm St",
    "phone": "555-FARM",
    "farm_location": "Farm Valley",
    "district": "Farm District",
    "city": "Farm City",
    "crop_types": ["Rice", "Wheat"]
  }' | python3 -c "import json, sys; print('✅ Farmer:', 'SUCCESS' if 'successfully' in json.load(sys.stdin).get('message', '') else 'FAILED')" 2>/dev/null || echo "❌ Farmer: FAILED"

# Test Driver Registration
echo "Testing Driver Registration:"
curl -s -X POST http://127.0.0.1:8003/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Driver",
    "email": "testdriver@example.com",
    "password": "password123",
    "role": "driver",
    "address": "123 Driver St",
    "phone": "555-DRIVE",
    "vehicle_type": "Truck",
    "license_number": "DRV123",
    "vehicle_capacity": "1000",
    "experience_years": "5"
  }' | python3 -c "import json, sys; print('✅ Driver:', 'SUCCESS' if 'successfully' in json.load(sys.stdin).get('message', '') else 'FAILED')" 2>/dev/null || echo "❌ Driver: FAILED"

echo ""
echo "2. Testing Login for all roles..."
echo "--------------------------------"

# Test Customer Login
echo "Testing Customer Login:"
CUSTOMER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8003/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "password": "password123"
  }')
CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | python3 -c "import json, sys; print(json.load(sys.stdin).get('token', 'FAILED'))" 2>/dev/null)
echo "✅ Customer: $([ "$CUSTOMER_TOKEN" != "FAILED" ] && echo "SUCCESS" || echo "FAILED")"

# Test Farmer Login
echo "Testing Farmer Login:"
FARMER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8003/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testfarmer@example.com",
    "password": "password123"
  }')
FARMER_TOKEN=$(echo $FARMER_RESPONSE | python3 -c "import json, sys; print(json.load(sys.stdin).get('token', 'FAILED'))" 2>/dev/null)
echo "✅ Farmer: $([ "$FARMER_TOKEN" != "FAILED" ] && echo "SUCCESS" || echo "FAILED")"

# Test Driver Login
echo "Testing Driver Login:"
DRIVER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8003/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdriver@example.com",
    "password": "password123"
  }')
DRIVER_TOKEN=$(echo $DRIVER_RESPONSE | python3 -c "import json, sys; print(json.load(sys.stdin).get('token', 'FAILED'))" 2>/dev/null)
echo "✅ Driver: $([ "$DRIVER_TOKEN" != "FAILED" ] && echo "SUCCESS" || echo "FAILED")"

echo ""
echo "3. Testing user info endpoints..."
echo "--------------------------------"

if [ "$CUSTOMER_TOKEN" != "FAILED" ]; then
    echo "Testing Customer /user endpoint:"
    curl -s -X GET http://127.0.0.1:8003/api/user \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" | python3 -c "import json, sys; data=json.load(sys.stdin); print('✅ Customer user data:', 'SUCCESS' if data.get('name') else 'FAILED')" 2>/dev/null || echo "❌ Customer user data: FAILED"
fi

if [ "$FARMER_TOKEN" != "FAILED" ]; then
    echo "Testing Farmer /user endpoint:"
    curl -s -X GET http://127.0.0.1:8003/api/user \
      -H "Authorization: Bearer $FARMER_TOKEN" | python3 -c "import json, sys; data=json.load(sys.stdin); print('✅ Farmer user data:', 'SUCCESS' if data.get('name') else 'FAILED')" 2>/dev/null || echo "❌ Farmer user data: FAILED"
fi

if [ "$DRIVER_TOKEN" != "FAILED" ]; then
    echo "Testing Driver /user endpoint:"
    curl -s -X GET http://127.0.0.1:8003/api/user \
      -H "Authorization: Bearer $DRIVER_TOKEN" | python3 -c "import json, sys; data=json.load(sys.stdin); print('✅ Driver user data:', 'SUCCESS' if data.get('name') else 'FAILED')" 2>/dev/null || echo "❌ Driver user data: FAILED"
fi

echo ""
echo "4. Testing role-specific endpoints..."
echo "------------------------------------"

if [ "$DRIVER_TOKEN" != "FAILED" ]; then
    echo "Testing Driver profile endpoint:"
    curl -s -X GET http://127.0.0.1:8003/api/driver/profile \
      -H "Authorization: Bearer $DRIVER_TOKEN" | python3 -c "import json, sys; data=json.load(sys.stdin); print('✅ Driver profile:', 'SUCCESS' if data.get('driver') else 'FAILED')" 2>/dev/null || echo "❌ Driver profile: FAILED"
fi

echo ""
echo "5. Testing invalid role registration (should fail)..."
echo "---------------------------------------------------"
curl -s -X POST http://127.0.0.1:8003/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid User",
    "email": "invalid@example.com",
    "password": "password123",
    "role": "invalid_role",
    "address": "123 Invalid St"
  }' | python3 -c "import json, sys; data=json.load(sys.stdin); print('✅ Invalid role validation:', 'SUCCESS' if 'invalid' in data.get('message', '').lower() else 'FAILED')" 2>/dev/null || echo "❌ Invalid role validation: FAILED"

# Clean up
echo ""
echo "Cleaning up..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo ""
echo "==================================="
echo "Test completed!"
echo "==================================="