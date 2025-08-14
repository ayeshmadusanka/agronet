#!/bin/bash

echo "🔧 Setting up Test Data for Farmer Dashboard"
echo "============================================"

# First check current farmer stats
echo "1. Current farmer stats (before adding data)..."
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
    
    print('📊 Current Stats:')
    print(f'   📋 Contracts: {contracts.get(\"total\", 0)}')
    print(f'   💰 Sales: \${sales.get(\"total_amount\", 0)}')
    print(f'   🛒 Orders: {sales.get(\"total_orders\", 0)}')
except Exception as e:
    print('❌ Error:', e)
"

  echo ""
  echo "2. Creating test purchases to generate sales data..."
  
  # Login as customer
  CUSTOMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email": "customer@test.com", "password": "password123"}' | \
    python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

  if [ -n "$CUSTOMER_TOKEN" ]; then
    # Get marketplace products
    echo "   Fetching marketplace products..."
    PRODUCTS=$(curl -s -X GET http://127.0.0.1:8000/api/marketplace/products \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")

    # Find a product from our test farmer
    FARMER_PRODUCT=$(echo "$PRODUCTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    products = data.get('products', [])
    for product in products:
        farmer = product.get('farmer', {})
        if farmer.get('name') == 'Test Farmer':
            print(json.dumps({
                'id': product.get('id'),
                'title': product.get('title'),
                'price': product.get('price')
            }))
            break
except Exception as e:
    pass
")

    if [ -n "$FARMER_PRODUCT" ]; then
      PRODUCT_ID=$(echo "$FARMER_PRODUCT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('id', ''))")
      PRODUCT_TITLE=$(echo "$FARMER_PRODUCT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('title', ''))")
      
      echo "   Found farmer product: $PRODUCT_TITLE ($PRODUCT_ID)"
      
      # Add multiple items to cart
      for i in {1..3}; do
        curl -s -X POST http://127.0.0.1:8000/api/cart/add \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $CUSTOMER_TOKEN" \
          -d "{\"product_id\": \"$PRODUCT_ID\", \"quantity\": 2}" > /dev/null
        echo "   Added 2x $PRODUCT_TITLE to cart (batch $i)"
      done

      # Place order
      echo "   Placing order..."
      ORDER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/orders \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d '{
          "first_name": "John",
          "last_name": "Customer",
          "address": "123 Test Street, Test City, TC 12345",
          "phone_number": "+1-234-567-8900"
        }')

      echo "$ORDER_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'message' in data:
        order = data.get('order', {})
        print(f'   ✅ Order placed successfully!')
        print(f'      Order #: {order.get(\"order_number\", \"N/A\")}')
        print(f'      Total: \${order.get(\"total_amount\", 0)}')
        print(f'      Items: {len(order.get(\"orderItems\", []))}')
    else:
        print(f'   ❌ Order failed: {data.get(\"error\", \"Unknown error\")}')
except Exception as e:
    print(f'   ❌ Error processing order response: {e}')
"

      # Wait a moment for data to be processed
      sleep 2

      echo ""
      echo "3. Checking updated farmer stats..."
      curl -s -X GET http://127.0.0.1:8000/api/farmer/stats \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $FARMER_TOKEN" | \
        python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print(f'❌ API Error: {data[\"error\"]}')
    else:
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
        
        # Check if data improved
        if sales.get('total_amount', 0) > 0:
            print('   ✅ SUCCESS: Sales data now showing!')
        else:
            print('   ⚠️  Sales still showing 0 - checking database...')
            
except Exception as e:
    print(f'❌ Error parsing stats: {e}')
"

    else
      echo "   ❌ No farmer products found in marketplace"
      echo "   Let's check what products exist..."
      echo "$PRODUCTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    products = data.get('products', [])
    print(f'   Found {len(products)} total products:')
    for i, product in enumerate(products[:5]):
        farmer = product.get('farmer', {})
        print(f'   {i+1}. {product.get(\"title\", \"N/A\")} by {farmer.get(\"name\", \"N/A\")}')
except Exception as e:
    print(f'   Error: {e}')
"
    fi
  else
    echo "❌ Customer login failed"
  fi

else
  echo "❌ Farmer login failed"
fi

echo ""
echo "🎉 Test data setup completed!"