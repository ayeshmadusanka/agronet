#!/bin/bash

echo "🔧 Testing Subscription System"
echo "==============================="

# Login as farmer
echo "1. Logging in as farmer..."
FARMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@test.com", "password": "password123"}' | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -n "$FARMER_TOKEN" ]; then
  echo "✅ Farmer login successful"
  
  # Get initial subscription details
  echo "2. Getting initial subscription details..."
  curl -s -X GET http://127.0.0.1:8000/api/farmer/subscription \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('Current subscription:', data.get('subscription', {}))
except Exception as e:
    print('Error:', e)
"

  # Upgrade to Pro
  echo "3. Upgrading to Pro subscription..."
  curl -s -X POST http://127.0.0.1:8000/api/farmer/subscription/upgrade \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'message' in data:
        print('✅', data['message'])
        print('New subscription:', data.get('subscription', {}))
    else:
        print('❌ Upgrade failed:', data)
except Exception as e:
    print('Error:', e)
"

  # Get farmer stats
  echo "4. Getting farmer stats..."
  curl -s -X GET http://127.0.0.1:8000/api/farmer/stats \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    stats = data.get('stats', {})
    print('📊 Farmer Stats:')
    print(f'  - Contracts: {stats.get(\"contracts\", {}).get(\"total\", 0)}')
    print(f'  - Sales: \${stats.get(\"sales\", {}).get(\"total_amount\", 0)}')
    print(f'  - Earnings: \${stats.get(\"sales\", {}).get(\"farmer_earnings\", 0)}')
except Exception as e:
    print('Error:', e)
"

  # Test marketplace with Pro farmer products prioritized
  echo "5. Testing marketplace prioritization..."
  CUSTOMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email": "customer@test.com", "password": "password123"}' | \
    python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

  if [ -n "$CUSTOMER_TOKEN" ]; then
    curl -s -X GET http://127.0.0.1:8000/api/marketplace/products \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" | \
      python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    products = data.get('products', [])
    print('🛒 Marketplace Products (Pro farmers should appear first):')
    for i, product in enumerate(products[:5]):  # Show first 5
        farmer = product.get('farmer', {})
        verified = '✅ Verified' if farmer.get('is_verified') else '❌ Basic'
        tier = farmer.get('subscription_tier', 'basic')
        print(f'  {i+1}. {product.get(\"title\", \"N/A\")} by {farmer.get(\"name\", \"N/A\")} ({tier.upper()}) {verified}')
except Exception as e:
    print('Error:', e)
"
  fi

else
  echo "❌ Farmer login failed"
fi

echo ""
echo "🎉 Subscription system test completed!"