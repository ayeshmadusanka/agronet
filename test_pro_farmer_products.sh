#!/bin/bash

echo "🌟 Testing Pro Farmer Product Prioritization"
echo "============================================="

# Login as farmer and upgrade to pro
echo "1. Setting up Pro farmer..."
FARMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@test.com", "password": "password123"}' | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -n "$FARMER_TOKEN" ]; then
  # Ensure farmer is Pro
  curl -s -X POST http://127.0.0.1:8000/api/farmer/subscription/upgrade \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" > /dev/null

  # Add a product as Pro farmer
  echo "2. Adding product as Pro farmer..."
  curl -s -X POST http://127.0.0.1:8000/api/farmer/products \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" \
    -d '{
      "title": "Premium Organic Lettuce - Pro Farmer",
      "description": "Fresh organic lettuce from a verified Pro farmer",
      "price": 5.99,
      "stock_quantity": 50,
      "image_url": "https://example.com/lettuce.jpg"
    }' | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'message' in data:
        print('✅', data['message'])
        print('Product ID:', data.get('product', {}).get('id'))
    else:
        print('❌ Product creation failed:', data)
except Exception as e:
    print('Error:', e)
"

  # Test marketplace with Pro farmer products first
  echo "3. Testing marketplace with Pro farmer products prioritized..."
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
    print('=' * 70)
    for i, product in enumerate(products):
        farmer = product.get('farmer', {})
        verified = '✅ Verified' if farmer.get('is_verified') else '❌ Basic'
        tier = farmer.get('subscription_tier', 'basic').upper()
        priority = '🌟 PRO' if tier == 'PRO' else '📦 BASIC'
        print(f'{priority} {i+1:2d}. {product.get(\"title\", \"N/A\")[:40]:<40} by {farmer.get(\"name\", \"N/A\")[:15]:<15} {verified}')
    
    # Count Pro vs Basic
    pro_count = sum(1 for p in products if p.get('farmer', {}).get('subscription_tier') == 'pro')
    basic_count = len(products) - pro_count
    print('')
    print(f'📊 Summary: {pro_count} Pro farmer products, {basic_count} Basic farmer products')
    
    if pro_count > 0:
        first_pro_index = next((i for i, p in enumerate(products) if p.get('farmer', {}).get('subscription_tier') == 'pro'), -1)
        if first_pro_index == 0:
            print('✅ Pro farmer products are correctly prioritized!')
        else:
            print(f'⚠️  First Pro product is at position {first_pro_index + 1}, should be at position 1')
    else:
        print('ℹ️  No Pro farmer products found')
        
except Exception as e:
    print('Error:', e)
"
  fi

else
  echo "❌ Farmer login failed"
fi

echo ""
echo "🎉 Pro farmer product prioritization test completed!"