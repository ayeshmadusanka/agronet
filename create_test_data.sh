#!/bin/bash

echo "🔧 Creating Test Data for Farmer Stats"
echo "======================================"

# Login as admin to create contracts
echo "1. Admin creating test contracts..."
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password123"}' | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -n "$ADMIN_TOKEN" ]; then
  # Create a few test contracts
  echo "   Creating contract 1..."
  CONTRACT1=$(curl -s -X POST http://127.0.0.1:8000/api/create_contracts \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "name": "Organic Vegetable Supply Contract",
      "description": "Supply organic vegetables for local restaurant chain",
      "deadline": "2025-12-31",
      "status": "active"
    }' | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('contract', {}).get('_id', ''))")

  echo "   Creating contract 2..."
  CONTRACT2=$(curl -s -X POST http://127.0.0.1:8000/api/create_contracts \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "name": "Fruit Delivery Partnership",
      "description": "Weekly fruit deliveries to grocery stores",
      "deadline": "2025-11-30",
      "status": "active"
    }' | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('contract', {}).get('_id', ''))")

  echo "   ✅ Created 2 test contracts"

  # Login as farmer and apply to contracts
  echo ""
  echo "2. Farmer applying to contracts..."
  FARMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email": "farmer@test.com", "password": "password123"}' | \
    python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

  if [ -n "$FARMER_TOKEN" ] && [ -n "$CONTRACT1" ]; then
    # Apply to first contract
    curl -s -X POST "http://127.0.0.1:8000/api/contracts/$CONTRACT1/apply" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $FARMER_TOKEN" \
      -d '{"info": "I am an experienced organic farmer with 10 years of experience growing vegetables."}' > /dev/null

    echo "   ✅ Applied to contract 1"

    if [ -n "$CONTRACT2" ]; then
      # Apply to second contract
      curl -s -X POST "http://127.0.0.1:8000/api/contracts/$CONTRACT2/apply" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $FARMER_TOKEN" \
        -d '{"info": "I specialize in growing fresh fruits and have reliable delivery capabilities."}' > /dev/null

      echo "   ✅ Applied to contract 2"
    fi
  fi

  echo ""
  echo "3. Creating sales data..."
  
  # Login as customer and make some purchases
  CUSTOMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email": "customer@test.com", "password": "password123"}' | \
    python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

  if [ -n "$CUSTOMER_TOKEN" ]; then
    # Get farmer's products
    PRODUCTS=$(curl -s -X GET http://127.0.0.1:8000/api/marketplace/products \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")

    # Find farmer's products
    FARMER_PRODUCT_IDS=$(echo "$PRODUCTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    products = data.get('products', [])
    farmer_products = []
    for product in products:
        farmer = product.get('farmer', {})
        if farmer.get('name') == 'Test Farmer':  # Our test farmer
            farmer_products.append(product.get('id', ''))
    print(' '.join(farmer_products[:2]))  # Get first 2 products
except:
    pass
")

    if [ -n "$FARMER_PRODUCT_IDS" ]; then
      # Add products to cart and place orders
      for PRODUCT_ID in $FARMER_PRODUCT_IDS; do
        if [ -n "$PRODUCT_ID" ]; then
          # Add to cart
          curl -s -X POST http://127.0.0.1:8000/api/cart/add \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $CUSTOMER_TOKEN" \
            -d "{\"product_id\": \"$PRODUCT_ID\", \"quantity\": 2}" > /dev/null
        fi
      done

      # Place an order
      ORDER_RESULT=$(curl -s -X POST http://127.0.0.1:8000/api/orders \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d '{
          "first_name": "Test",
          "last_name": "Customer", 
          "address": "123 Test Street, Test City",
          "phone_number": "123-456-7890"
        }')

      echo "   ✅ Placed test order with farmer products"
    else
      echo "   ⚠️  No farmer products found for test orders"
    fi
  fi

else
  echo "❌ Admin login failed"
fi

echo ""
echo "4. Testing farmer stats with real data..."
FARMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@test.com", "password": "password123"}' | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -n "$FARMER_TOKEN" ]; then
  curl -s -X GET http://127.0.0.1:8000/api/farmer/stats \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FARMER_TOKEN" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    stats = data.get('stats', {})
    contracts = stats.get('contracts', {})
    sales = stats.get('sales', {})
    
    print('📊 Updated Farmer Stats:')
    print(f'   📋 Contract Applications: {contracts.get(\"total\", 0)}')
    print(f'   💰 Total Sales: \${sales.get(\"total_amount\", 0)}')
    print(f'   🛒 Total Orders: {sales.get(\"total_orders\", 0)}')
    print(f'   📦 Items Sold: {sales.get(\"total_items_sold\", 0)}')
    print(f'   💵 Farmer Earnings: \${sales.get(\"farmer_earnings\", 0)}')
    print(f'   🏛️  Platform Commission: \${sales.get(\"platform_commission\", 0)}')
    
    if contracts.get('total', 0) > 0:
        print('   ✅ Contract applications found!')
    else:
        print('   ⚠️  No contract applications found')
        
    if sales.get('total_amount', 0) > 0:
        print('   ✅ Sales data found!')
    else:
        print('   ⚠️  No sales data found')
        
except Exception as e:
    print('❌ Error:', e)
"
fi

echo ""
echo "🎉 Test data creation completed!"