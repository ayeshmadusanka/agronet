#!/bin/bash

echo "🌟 Testing 0% Commission for Pro Farmers"
echo "========================================"

# Login as farmer
echo "1. Logging in and upgrading to Pro..."
FARMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@test.com", "password": "password123"}' | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -n "$FARMER_TOKEN" ]; then
  # Upgrade to Pro
  curl -s -X POST http://127.0.0.1:8000/api/farmer/subscription/upgrade \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" > /dev/null

  # Check Pro subscription details
  echo "2. Checking Pro farmer commission rate..."
  curl -s -X GET http://127.0.0.1:8000/api/farmer/subscription \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    sub = data.get('subscription', {})
    rate = sub.get('commission_rate', 10)
    tier = sub.get('tier', 'basic').upper()
    verified = 'Yes' if sub.get('is_verified') else 'No'
    
    print(f'   🌟 Tier: {tier}')
    print(f'   💰 Commission Rate: {rate}%')
    print(f'   ✓ Verified: {verified}')
    
    if rate == 0:
        print('   ✅ SUCCESS: Pro farmers have 0% commission!')
    else:
        print(f'   ❌ ERROR: Expected 0% but got {rate}%')
        
except Exception as e:
    print('   ❌ Error:', e)
"

  # Test cart calculation with Pro farmer product
  echo ""
  echo "3. Testing cart calculation with Pro farmer products..."
  
  # Login as customer
  CUSTOMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email": "customer@test.com", "password": "password123"}' | \
    python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

  if [ -n "$CUSTOMER_TOKEN" ]; then
    # Get Pro farmer products
    PRODUCTS=$(curl -s -X GET http://127.0.0.1:8000/api/marketplace/products \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    # Find a Pro farmer product
    PRO_PRODUCT_ID=$(echo "$PRODUCTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    products = data.get('products', [])
    for product in products:
        farmer = product.get('farmer', {})
        if farmer.get('subscription_tier') == 'pro':
            print(product.get('id', ''))
            break
except:
    pass
")

    if [ -n "$PRO_PRODUCT_ID" ]; then
      echo "   Found Pro farmer product: $PRO_PRODUCT_ID"
      
      # Add to cart
      curl -s -X POST http://127.0.0.1:8000/api/cart/add \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d "{\"product_id\": \"$PRO_PRODUCT_ID\", \"quantity\": 2}" > /dev/null
      
      # Check cart with commission calculation
      echo "   Cart calculation with Pro farmer product:"
      curl -s -X GET http://127.0.0.1:8000/api/cart \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" | \
        python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    subtotal = data.get('subtotal', 0)
    platform_fee = data.get('platform_fee', 0)
    total = data.get('total', 0)
    
    print(f'   💰 Subtotal: \${subtotal}')
    print(f'   🏛️  Platform Fee: \${platform_fee}')
    print(f'   💳 Total: \${total}')
    
    if platform_fee == 0:
        print('   ✅ SUCCESS: Pro farmer products have 0% platform fee!')
    else:
        print(f'   ❌ ERROR: Expected \$0 platform fee but got \${platform_fee}')
        
except Exception as e:
    print('   ❌ Error:', e)
"
      
      # Clear cart
      curl -s -X DELETE "http://127.0.0.1:8000/api/cart/clear" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" > /dev/null 2>&1 || true
        
    else
      echo "   ℹ️  No Pro farmer products found for cart test"
    fi
  fi

  # Test downgrade
  echo ""
  echo "4. Testing downgrade to Basic..."
  curl -s -X POST http://127.0.0.1:8000/api/farmer/subscription/downgrade \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'message' in data:
        sub = data.get('subscription', {})
        rate = sub.get('commission_rate', 10)
        tier = sub.get('tier', 'basic').upper()
        
        print(f'   📦 New Tier: {tier}')
        print(f'   💰 New Commission Rate: {rate}%')
        
        if rate == 10:
            print('   ✅ SUCCESS: Basic farmers have 10% commission!')
        else:
            print(f'   ❌ ERROR: Expected 10% but got {rate}%')
    else:
        print('   ❌ Downgrade failed:', data)
except Exception as e:
    print('   ❌ Error:', e)
"

  # Upgrade back for demo
  curl -s -X POST http://127.0.0.1:8000/api/farmer/subscription/upgrade \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" > /dev/null

else
  echo "❌ Farmer login failed"
fi

echo ""
echo "🎉 Commission Testing Complete!"
echo ""
echo "💰 Commission Structure:"
echo "   📦 Basic Plan: 10% commission"
echo "   🌟 Pro Plan: 0% commission (FREE!)"
echo ""
echo "🔥 Pro Plan Benefits:"
echo "   ✅ 0% platform commission"
echo "   ✅ Verified farmer badge"
echo "   ✅ Priority marketplace ranking"
echo "   ✅ Premium support"