#!/bin/bash

echo "🛒 Testing Actual Purchase Flow"
echo "==============================="

# Login as customer
CUSTOMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@test.com", "password": "password123"}' | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -n "$CUSTOMER_TOKEN" ]; then
  echo "✅ Customer logged in"
  
  # Get marketplace products
  echo "1. Getting marketplace products..."
  PRODUCTS_RESPONSE=$(curl -s -X GET http://127.0.0.1:8000/api/marketplace/products \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN")
  
  # Find a product
  PRODUCT_INFO=$(echo "$PRODUCTS_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    products = data.get('products', [])
    if products:
        product = products[0]  # Take first product
        print(json.dumps({
            'id': product.get('id'),
            'title': product.get('title'),
            'price': product.get('price'),
            'stock': product.get('stock_quantity'),
            'farmer_name': product.get('farmer', {}).get('name', 'Unknown')
        }))
except Exception as e:
    print('')
")

  if [ -n "$PRODUCT_INFO" ]; then
    PRODUCT_ID=$(echo "$PRODUCT_INFO" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('id', ''))")
    PRODUCT_TITLE=$(echo "$PRODUCT_INFO" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('title', ''))")
    FARMER_NAME=$(echo "$PRODUCT_INFO" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('farmer_name', ''))")
    
    echo "   Selected: $PRODUCT_TITLE by $FARMER_NAME"
    
    # Clear cart first
    echo "2. Clearing cart..."
    curl -s -X GET http://127.0.0.1:8000/api/cart \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" | \
      python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    cart_items = data.get('cart_items', [])
    for item in cart_items:
        item_id = item.get('id')
        if item_id:
            print(f'Removing cart item: {item_id}')
except:
    pass
" | while read line; do
      if [[ $line == Removing* ]]; then
        ITEM_ID=$(echo $line | cut -d' ' -f4)
        curl -s -X DELETE "http://127.0.0.1:8000/api/cart/$ITEM_ID" \
          -H "Authorization: Bearer $CUSTOMER_TOKEN" > /dev/null
      fi
    done
    
    # Add product to cart
    echo "3. Adding product to cart..."
    ADD_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/cart/add \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -d "{\"product_id\": \"$PRODUCT_ID\", \"quantity\": 1}")
    
    echo "$ADD_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'message' in data:
        print(f'   ✅ {data[\"message\"]}')
    else:
        print(f'   ❌ Add to cart failed: {data.get(\"error\", \"Unknown error\")}')
except Exception as e:
    print(f'   ❌ Error: {e}')
"
    
    # Check cart
    echo "4. Checking cart contents..."
    CART_RESPONSE=$(curl -s -X GET http://127.0.0.1:8000/api/cart \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    echo "$CART_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    cart_items = data.get('cart_items', [])
    subtotal = data.get('subtotal', 0)
    platform_fee = data.get('platform_fee', 0)
    total = data.get('total', 0)
    
    print(f'   📦 Cart has {len(cart_items)} items')
    print(f'   💰 Subtotal: \${subtotal}')
    print(f'   🏛️ Platform Fee: \${platform_fee}')
    print(f'   💳 Total: \${total}')
except Exception as e:
    print(f'   ❌ Cart error: {e}')
"
    
    # Place order
    echo "5. Placing order..."
    ORDER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/orders \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -d '{
        "first_name": "Test",
        "last_name": "Customer",
        "address": "123 Main Street, Test City, TS 12345",
        "phone_number": "555-123-4567"
      }')
    
    echo "$ORDER_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'message' in data:
        order = data.get('order', {})
        print(f'   ✅ {data[\"message\"]}')
        print(f'   📋 Order Number: {order.get(\"order_number\", \"N/A\")}')
        print(f'   💰 Total: \${order.get(\"total_amount\", 0)}')
        
        # Check order items
        order_items = order.get('orderItems', [])
        print(f'   📦 Order Items: {len(order_items)}')
        for item in order_items:
            print(f'      - {item.get(\"quantity\", 0)}x Product {item.get(\"product_id\", \"N/A\")} = \${item.get(\"total_price\", 0)}')
    else:
        error_msg = data.get('error', data.get('errors', 'Unknown error'))
        print(f'   ❌ Order failed: {error_msg}')
except Exception as e:
    print(f'   ❌ Order processing error: {e}')
"
    
    # Wait for data to sync
    sleep 1
    
    # Check farmer stats again
    echo ""
    echo "6. Checking updated farmer stats..."
    FARMER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
      -H "Content-Type: application/json" \
      -d '{"email": "farmer@test.com", "password": "password123"}' | \
      python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")
    
    if [ -n "$FARMER_TOKEN" ]; then
      STATS_RESPONSE=$(curl -s -X GET http://127.0.0.1:8000/api/farmer/stats \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $FARMER_TOKEN")
      
      echo "$STATS_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    stats = data.get('stats', {})
    sales = stats.get('sales', {})
    debug = stats.get('debug', {})
    
    print('📊 Updated Farmer Stats:')
    print(f'   💰 Total Sales: \${sales.get(\"total_amount\", 0)}')
    print(f'   🛒 Total Orders: {sales.get(\"total_orders\", 0)}')
    print(f'   📦 Items Sold: {sales.get(\"total_items_sold\", 0)}')
    print(f'   💵 Farmer Earnings: \${sales.get(\"farmer_earnings\", 0)}')
    print('')
    print('🔍 Debug Info:')
    print(f'   👨‍🌾 Farmer ID: {debug.get(\"farmer_id\", \"N/A\")}')
    print(f'   📦 Products: {debug.get(\"farmer_products\", 0)}')
    print(f'   📋 Order Items Found: {debug.get(\"order_items_found\", 0)}')
    
    if sales.get('total_amount', 0) > 0:
        print('   ✅ SUCCESS: Sales data is now showing!')
    else:
        print('   ⚠️ Sales still showing 0')
        
except Exception as e:
    print(f'❌ Stats error: {e}')
"
    fi
    
  else
    echo "❌ No products found in marketplace"
  fi
else
  echo "❌ Customer login failed"
fi

echo ""
echo "🎉 Purchase test completed!"