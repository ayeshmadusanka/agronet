<?php

use App\Models\User;
use App\Models\Contract;
use App\Models\Bid;
use App\Models\Product;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request; // Add this to import the Request class
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;



Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json($request->user());
});




// Register Route
Route::post('/register', function (Request $request) {

    // Validate incoming request
    $request->validate([
        'name' => 'required|string',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6',
        'role' => 'required|in:farmer,customer,admin',  // Only 'farmer', 'customer', or 'admin'
        'address' => 'required|string',
    ]);

    // Create user
    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => $request->role,
        'address' => $request->address,
        'registration_date' => now(),
        'status' => $request->role === 'farmer' ? 'pending' : 'approved' // Farmers start as pending
    ]);

    return response()->json(['message' => 'User registered successfully!', 'user' => $user], 201);
});







// Login
Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
    ]);

    $user = User::where('email', $request->email)->first();

    if ($user && Hash::check($request->password, $user->password)) {
        // Create token
        $token = $user->createToken('token_name')->plainTextToken;
        return response()->json(['token' => $token]);
    }

    return response()->json(['message' => 'Invalid credentials'], 401);
});

// Logout
Route::middleware('auth:sanctum')->post('/logout', function (Request $request) {
    try {
        // Revoke all tokens for the user
        $request->user()->tokens()->delete();
        
        return response()->json(['message' => 'Successfully logged out'], 200);
    } catch (\Exception $e) {
        Log::error('Logout error: ' . $e->getMessage());
        return response()->json(['message' => 'Logout failed'], 500);
    }
});

// Logout from current device only
Route::middleware('auth:sanctum')->post('/logout-current', function (Request $request) {
    try {
        // Get the current token and revoke it
        $request->user()->currentAccessToken()->delete();
        
        return response()->json(['message' => 'Successfully logged out from current device'], 200);
    } catch (\Exception $e) {
        Log::error('Current device logout error: ' . $e->getMessage());
        return response()->json(['message' => 'Logout failed'], 500);
    }
});






// Farmers Applying for Contracts
Route::middleware(['auth:sanctum', 'farmer'])->post('/contracts/{contract}/apply', function (Request $request, $contractId) {
    $request->validate([
        'info' => 'required|string' // You can expand this as needed
    ]);

    $contract = Contract::find($contractId);
    if (!$contract) {
        return response()->json(['error' => 'Contract not found'], 404);
    }

    // You can store applications in a separate collection or as a field in Contract
    // Example: Add to contract's applicants array
    $application = [
        'farmer_id' => Auth::user()->_id,
        'info' => $request->info,
        'applied_at' => now()
    ];

    $contract->push('applicants', $application, true); // true for unique
    $contract->save();

    return response()->json(['message' => 'Application submitted!', 'application' => $application], 201);
});






// Admins Creating Contracts
Route::middleware(['auth:sanctum', 'admin'])->post('/create_contracts', function (Request $request) {
    Log::info('Full incoming request:', $request->all());
    Log::info('Selected farmer_ids:', $request->input('farmer_ids'));

    // Validate request
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'description' => 'required|string',
        'deadline' => 'required|date|after:now',
        'status' => 'required|string|in:pending,active,completed,cancelled',
        'farmer_ids' => 'sometimes|array|distinct', // Make farmer_ids optional and ensure no duplicates
        'farmer_ids.*' => 'exists:users,_id,role,farmer', // Validate each farmer exists
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // Handle farmer_ids (optional)
    $farmerIds = $request->input('farmer_ids', []);
    
    if (!empty($farmerIds)) {
        // Remove any null values
        $farmerIds = array_filter($farmerIds, function($id) {
            return !is_null($id);
        });
        
        if (!empty($farmerIds)) {
            // Ensure all farmer IDs are valid and belong to farmers
            $validFarmers = User::whereIn('_id', $farmerIds)->where('role', 'farmer')->pluck('_id')->toArray();

            if (count($validFarmers) !== count($farmerIds)) {
                return response()->json(['error' => 'One or more farmer IDs are invalid or not farmers.'], 422);
            }
        }
    }

    // Create contract
    $contract = Contract::create([
        'name' => $request->input('name'),
        'description' => $request->input('description'),
        'deadline' => $request->input('deadline'),
        'status' => $request->input('status'),
        'admin_id' => Auth::user()->_id, // Current authenticated admin
        'farmers' => $farmerIds, // Store array of farmer IDs (can be empty)
        'winning_bid_id' => null, // Initialize with no winning bid
    ]);

    return response()->json([
        'message' => 'Contract created successfully!',
        'contract' => $contract
    ], 201);
});





// Admins Approving or Rejecting Farmers
Route::middleware(['auth:sanctum', 'admin'])->patch('/farmers/{farmer}/approve', function ($farmerId) {
    $farmer = User::where('_id', $farmerId)->where('role', 'farmer')->first();
    if (!$farmer) {
        return response()->json(['error' => 'Farmer not found'], 404);
    }
    $farmer->status = 'approved';
    $farmer->save();
    return response()->json(['message' => 'Farmer approved!']);
});

Route::middleware(['auth:sanctum', 'admin'])->patch('/farmers/{farmer}/reject', function ($farmerId) {
    $farmer = User::where('_id', $farmerId)->where('role', 'farmer')->first();
    if (!$farmer) {
        return response()->json(['error' => 'Farmer not found'], 404);
    }
    $farmer->status = 'rejected';
    $farmer->save();
    return response()->json(['message' => 'Farmer rejected!']);
});









// Customers Bidding on Contracts
Route::middleware(['auth:sanctum', 'customer'])->post('/contracts/{contract}/bid', function (Request $request, $contractId) {
    $validator = Validator::make($request->all(), [
        'amount' => 'required|numeric|min:1',
        'message' => 'nullable|string'
    ]);
    if ($validator->fails()) {
        return response()->json(['error' => $validator->errors()->first()], 400);
    }

    $contract = Contract::find($contractId);
    if (!$contract) {
        return response()->json(['error' => 'Contract not found'], 404);
    }

    $currentHighest = Bid::where('contract_id', $contractId)->max('amount') ?? 0;
    $amount = $request->amount;

    if ($amount <= $currentHighest) {
        return response()->json(['error' => 'Bid must be higher than current highest bid'], 400);
    }

    $bid = Bid::create([
        'contract_id' => $contractId,
        'customer_id' => Auth::user()->_id,
        'amount' => $amount,
        'message' => $request->message,
        'created_at' => now()
    ]);

    $contract->highest_bid = $amount;
    $contract->save();

    return response()->json(['message' => 'Bid placed successfully!', 'bid' => $bid], 201);
});





// Get contract details for customers (used in bidding screen)
Route::middleware(['auth:sanctum', 'customer'])->get('/contracts/{contract}', function ($contractId) {
    $contract = Contract::find($contractId);
    if (!$contract) {
        return response()->json(['error' => 'Contract not found'], 404);
    }

    // Get highest bid for this contract
    $highestBid = Bid::where('contract_id', $contractId)
        ->orderBy('amount', 'desc')
        ->first();

    // Get bid count
    $bidCount = Bid::where('contract_id', $contractId)->count();

    $bidder = null;
    if ($highestBid) {
        $bidder = User::find($highestBid->customer_id);
    }

    // Add bid count to contract data
    $contractData = $contract->toArray();
    $contractData['bid_count'] = $bidCount;

    return response()->json([
        'contract' => $contractData,
        'highest_bid' => $highestBid,
        'bidder_name' => $bidder ? $bidder->name : null
    ]);
});




// Stats for the Admin Dashboard
Route::middleware(['auth:sanctum', 'admin'])->get('/admin/counts', function () {
    $farmers = User::where('role', 'farmer')->count();
    $customers = User::where('role', 'customer')->count();
    $contracts = Contract::count();
    return response()->json([
        'farmers' => $farmers,
        'customers' => $customers,
        'contracts' => $contracts
    ]);
});




// Get all farmers
Route::middleware(['auth:sanctum', 'admin'])->get('/farmers', function () {
    $farmers = User::where('role', 'farmer')->get();
    return response()->json(['farmers' => $farmers]);
});

// Get all customers
Route::middleware(['auth:sanctum', 'admin'])->get('/customers', function () {
    $customers = User::where('role', 'customer')->get();
    return response()->json(['customers' => $customers]);
});

// Get All Contracts (Works with both the admin and customer))
Route::middleware(['auth:sanctum'])->get('/contracts', function () {
    $contracts = Contract::all();
    return response()->json(['contracts' => $contracts]);
});




// Get details of a specific customer for the admin
Route::middleware(['auth:sanctum', 'admin'])->get('/customers/{customer}', function ($customerId) {
    try {
        $customer = User::where('_id', $customerId)->where('role', 'customer')->first();
        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }
        $bids = Bid::where('customer_id', $customerId)
            ->with('contract')
            ->get()
            ->map(function ($bid) {
                return [
                    'id' => $bid->_id,
                    'contractName' => $bid->contract->name ?? 'Unknown',
                    'amount' => $bid->amount,
                ];
            });
        return response()->json([
            'email' => $customer->email,
            'name' => $customer->name,
            'phone' => $customer->phone ?? '',
            'address' => $customer->address ?? '',
            'bids' => $bids,
        ]);
    } catch (\Exception $e) {
        Log::error('Customer details error: ' . $e->getMessage());
        return response()->json(['error' => 'Server error'], 500);
    }
});

// Get single contract details for admin
Route::middleware(['auth:sanctum', 'admin'])->get('/admin/contracts/{contract}', function ($contractId) {
    try {
        $contract = Contract::find($contractId);
        if (!$contract) {
            return response()->json(['error' => 'Contract not found'], 404);
        }
        return response()->json(['contract' => $contract]);
    } catch (\Exception $e) {
        Log::error('Contract details error: ' . $e->getMessage());
        return response()->json(['error' => 'Server error'], 500);
    }
});

// Update contract for admin
Route::middleware(['auth:sanctum', 'admin'])->put('/admin/contracts/{contract}', function (Request $request, $contractId) {
    try {
        $contract = Contract::find($contractId);
        if (!$contract) {
            return response()->json(['error' => 'Contract not found'], 404);
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'required|date',
            'status' => 'required|string|in:pending,active,completed,cancelled',
            'farmer_ids' => 'sometimes|array',
            'farmer_ids.*' => 'exists:users,_id,role,farmer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update contract fields
        $contract->name = $request->input('name');
        $contract->description = $request->input('description');
        $contract->deadline = $request->input('deadline');
        $contract->status = $request->input('status');
        
        if ($request->has('farmer_ids')) {
            $contract->farmers = $request->input('farmer_ids');
        }

        $contract->save();

        return response()->json([
            'message' => 'Contract updated successfully!',
            'contract' => $contract
        ]);
    } catch (\Exception $e) {
        Log::error('Contract update error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to update contract'], 500);
    }
});

// Delete contract for admin
Route::middleware(['auth:sanctum', 'admin'])->delete('/admin/contracts/{contract}', function ($contractId) {
    try {
        $contract = Contract::find($contractId);
        if (!$contract) {
            return response()->json(['error' => 'Contract not found'], 404);
        }

        // Delete associated bids first
        Bid::where('contract_id', $contractId)->delete();
        
        // Delete the contract
        $contract->delete();

        return response()->json(['message' => 'Contract deleted successfully!']);
    } catch (\Exception $e) {
        Log::error('Contract delete error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to delete contract'], 500);
    }
});

// ===========================================
// INSTANT BUY MODULE API ROUTES
// ===========================================

// PRODUCT MANAGEMENT ROUTES (FARMER)
// Get farmer's products
Route::middleware(['auth:sanctum', 'farmer'])->get('/farmer/products', function (Request $request) {
    try {
        $products = Product::where('farmer_id', Auth::user()->_id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['products' => $products]);
    } catch (\Exception $e) {
        Log::error('Farmer products error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch products'], 500);
    }
});

// Create new product (Farmer)
Route::middleware(['auth:sanctum', 'farmer'])->post('/farmer/products', function (Request $request) {
    try {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0.01',
            'stock_quantity' => 'required|integer|min:1',
            'image_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::create([
            'farmer_id' => Auth::user()->_id,
            'title' => $request->title,
            'description' => $request->description,
            'price' => $request->price,
            'stock_quantity' => $request->stock_quantity,
            'image_url' => $request->image_url,
            'status' => 'active'
        ]);

        return response()->json([
            'message' => 'Product created successfully!',
            'product' => $product
        ], 201);
    } catch (\Exception $e) {
        Log::error('Create product error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to create product'], 500);
    }
});

// Update product (Farmer)
Route::middleware(['auth:sanctum', 'farmer'])->put('/farmer/products/{product}', function (Request $request, $productId) {
    try {
        $product = Product::where('id', $productId)
            ->where('farmer_id', Auth::user()->_id)
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0.01',
            'stock_quantity' => 'required|integer|min:0',
            'image_url' => 'nullable|url',
            'status' => 'required|in:active,inactive,out_of_stock'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product->update([
            'title' => $request->title,
            'description' => $request->description,
            'price' => $request->price,
            'stock_quantity' => $request->stock_quantity,
            'image_url' => $request->image_url,
            'status' => $request->status
        ]);

        return response()->json([
            'message' => 'Product updated successfully!',
            'product' => $product
        ]);
    } catch (\Exception $e) {
        Log::error('Update product error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to update product'], 500);
    }
});

// Delete product (Farmer)
Route::middleware(['auth:sanctum', 'farmer'])->delete('/farmer/products/{product}', function ($productId) {
    try {
        $product = Product::where('id', $productId)
            ->where('farmer_id', Auth::user()->_id)
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Remove from all carts first
        CartItem::where('product_id', $productId)->delete();
        
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully!']);
    } catch (\Exception $e) {
        Log::error('Delete product error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to delete product'], 500);
    }
});

// MARKETPLACE ROUTES (CUSTOMER)
// Get all active products for marketplace (prioritize Pro subscribers)
Route::middleware(['auth:sanctum', 'customer'])->get('/marketplace/products', function (Request $request) {
    try {
        $products = Product::with(['farmer' => function($query) {
                $query->select('_id', 'name', 'subscription_tier', 'is_verified');
            }])
            ->active()
            ->get();

        // Sort products: Pro subscribers first, then by creation date
        $products = $products->sortBy([
            function ($product) {
                // Pro subscribers come first (0), basic subscribers come second (1)
                return $product->farmer->subscription_tier === 'pro' ? 0 : 1;
            },
            function ($product) {
                // Then sort by creation date (newest first)
                return -strtotime($product->created_at);
            }
        ])->values();

        return response()->json(['products' => $products])
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    } catch (\Exception $e) {
        Log::error('Marketplace products error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch products'], 500);
    }
});

// CART MANAGEMENT ROUTES (CUSTOMER)
// Get customer's cart
Route::middleware(['auth:sanctum', 'customer'])->get('/cart', function (Request $request) {
    try {
        $cartItems = CartItem::with(['product.farmer:_id,name'])
            ->where('customer_id', Auth::user()->_id)
            ->get();

        $subtotal = $cartItems->sum(function ($item) {
            return $item->product->price * $item->quantity;
        });

        // Calculate platform fee based on each farmer's commission rate
        $platformFee = 0;
        $farmerBreakdown = [];
        
        foreach ($cartItems as $item) {
            $farmer = User::find($item->product->farmer_id);
            $itemTotal = $item->product->price * $item->quantity;
            $commissionRate = $farmer->getCommissionRate() / 100;
            $itemCommission = $itemTotal * $commissionRate;
            $platformFee += $itemCommission;
            
            $farmerBreakdown[$farmer->_id] = [
                'commission_rate' => $farmer->getCommissionRate(),
                'item_total' => $itemTotal,
                'commission' => $itemCommission
            ];
        }
        
        $total = $subtotal + $platformFee;

        return response()->json([
            'cart_items' => $cartItems,
            'subtotal' => round($subtotal, 2),
            'platform_fee' => round($platformFee, 2),
            'total' => round($total, 2)
        ]);
    } catch (\Exception $e) {
        Log::error('Get cart error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch cart'], 500);
    }
});

// Add to cart
Route::middleware(['auth:sanctum', 'customer'])->post('/cart/add', function (Request $request) {
    try {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::find($request->product_id);
        
        if ($product->stock_quantity < $request->quantity) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        $cartItem = CartItem::where('customer_id', Auth::user()->_id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($cartItem) {
            $newQuantity = $cartItem->quantity + $request->quantity;
            if ($product->stock_quantity < $newQuantity) {
                return response()->json(['error' => 'Insufficient stock'], 400);
            }
            $cartItem->update(['quantity' => $newQuantity]);
        } else {
            $cartItem = CartItem::create([
                'customer_id' => Auth::user()->_id,
                'product_id' => $request->product_id,
                'quantity' => $request->quantity
            ]);
        }

        return response()->json([
            'message' => 'Product added to cart successfully!',
            'cart_item' => $cartItem->load('product')
        ]);
    } catch (\Exception $e) {
        Log::error('Add to cart error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to add to cart'], 500);
    }
});

// Update cart item quantity
Route::middleware(['auth:sanctum', 'customer'])->put('/cart/{cartItem}', function (Request $request, $cartItemId) {
    try {
        $cartItem = CartItem::where('id', $cartItemId)
            ->where('customer_id', Auth::user()->_id)
            ->first();

        if (!$cartItem) {
            return response()->json(['error' => 'Cart item not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($cartItem->product->stock_quantity < $request->quantity) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json([
            'message' => 'Cart updated successfully!',
            'cart_item' => $cartItem->load('product')
        ]);
    } catch (\Exception $e) {
        Log::error('Update cart error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to update cart'], 500);
    }
});

// Remove from cart
Route::middleware(['auth:sanctum', 'customer'])->delete('/cart/{cartItem}', function ($cartItemId) {
    try {
        $cartItem = CartItem::where('id', $cartItemId)
            ->where('customer_id', Auth::user()->_id)
            ->first();

        if (!$cartItem) {
            return response()->json(['error' => 'Cart item not found'], 404);
        }

        $cartItem->delete();

        return response()->json(['message' => 'Item removed from cart successfully!']);
    } catch (\Exception $e) {
        Log::error('Remove from cart error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to remove from cart'], 500);
    }
});

// ORDER MANAGEMENT ROUTES (CUSTOMER)
// Place order
Route::middleware(['auth:sanctum', 'customer'])->post('/orders', function (Request $request) {
    try {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'address' => 'required|string',
            'phone_number' => 'required|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cartItems = CartItem::with('product')
            ->where('customer_id', Auth::user()->_id)
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['error' => 'Cart is empty'], 400);
        }

        // Calculate totals with dynamic commission rates
        $subtotal = $cartItems->sum(function ($item) {
            return $item->product->price * $item->quantity;
        });
        
        $platformFee = 0;
        foreach ($cartItems as $item) {
            $farmer = User::find($item->product->farmer_id);
            $itemTotal = $item->product->price * $item->quantity;
            $commissionRate = $farmer->getCommissionRate() / 100;
            $platformFee += $itemTotal * $commissionRate;
        }
        
        $total = $subtotal + $platformFee;

        // Create order
        $order = Order::create([
            'customer_id' => Auth::user()->_id,
            'order_number' => Order::generateOrderNumber(),
            'subtotal' => $subtotal,
            'platform_fee' => $platformFee,
            'total_amount' => $total,
            'status' => 'pending',
            'payment_method' => 'cash_on_delivery',
            'shipping_address' => [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'address' => $request->address,
                'phone_number' => $request->phone_number
            ]
        ]);

        // Create order items and update stock
        foreach ($cartItems as $cartItem) {
            $product = $cartItem->product;
            
            // Check stock availability
            if ($product->stock_quantity < $cartItem->quantity) {
                $order->delete(); // Rollback
                return response()->json(['error' => "Insufficient stock for {$product->title}"], 400);
            }

            // Create order item
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'farmer_id' => $product->farmer_id,
                'quantity' => $cartItem->quantity,
                'unit_price' => $product->price,
                'total_price' => $product->price * $cartItem->quantity
            ]);

            // Update product stock
            $product->stock_quantity -= $cartItem->quantity;
            if ($product->stock_quantity == 0) {
                $product->status = 'out_of_stock';
            }
            $product->save();
        }

        // Clear cart
        CartItem::where('customer_id', Auth::user()->_id)->delete();

        return response()->json([
            'message' => 'Order placed successfully!',
            'order' => $order->load('orderItems.product')
        ], 201);
    } catch (\Exception $e) {
        Log::error('Place order error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to place order'], 500);
    }
});

// Get customer's orders
Route::middleware(['auth:sanctum', 'customer'])->get('/orders', function (Request $request) {
    try {
        $orders = Order::with(['orderItems.product', 'orderItems.farmer:_id,name'])
            ->where('customer_id', Auth::user()->_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['orders' => $orders]);
    } catch (\Exception $e) {
        Log::error('Get orders error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch orders'], 500);
    }
});

// Get farmer's orders (products sold)
Route::middleware(['auth:sanctum', 'farmer'])->get('/farmer/orders', function (Request $request) {
    try {
        $orderItems = OrderItem::with(['order.customer:_id,name', 'product'])
            ->where('farmer_id', Auth::user()->_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['order_items' => $orderItems]);
    } catch (\Exception $e) {
        Log::error('Get farmer orders error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch orders'], 500);
    }
});

// Update order status (Farmer)
Route::middleware(['auth:sanctum', 'farmer'])->put('/farmer/orders/{order}/status', function (Request $request, $orderId) {
    try {
        // Validate the status
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,preparing,shipped,delivered,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Find the order
        $order = Order::find($orderId);
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Check if farmer has items in this order
        $farmerHasItems = OrderItem::where('order_id', $orderId)
            ->where('farmer_id', Auth::user()->_id)
            ->exists();

        if (!$farmerHasItems) {
            return response()->json(['error' => 'You are not authorized to update this order'], 403);
        }

        // Validate status transition
        $currentStatus = $order->status;
        $newStatus = $request->status;
        
        // Define allowed status transitions
        $allowedTransitions = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['preparing', 'cancelled'],
            'preparing' => ['shipped', 'cancelled'],
            'shipped' => ['delivered'],
            'delivered' => [], // Final status
            'cancelled' => [] // Final status
        ];

        if (!in_array($newStatus, $allowedTransitions[$currentStatus] ?? [])) {
            return response()->json([
                'error' => "Cannot transition from {$currentStatus} to {$newStatus}"
            ], 400);
        }

        // Update the order status
        $order->status = $newStatus;
        $order->save();

        return response()->json([
            'message' => 'Order status updated successfully!',
            'order' => $order->load('orderItems.product', 'customer:_id,name')
        ]);
    } catch (\Exception $e) {
        Log::error('Update order status error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to update order status'], 500);
    }
});

// ==========================================
// SUBSCRIPTION MANAGEMENT ROUTES
// ==========================================

// Get farmer's subscription details
Route::middleware(['auth:sanctum', 'farmer'])->get('/farmer/subscription', function (Request $request) {
    try {
        $user = Auth::user();
        $subscription = [
            'tier' => $user->subscription_tier,
            'is_verified' => $user->is_verified,
            'started_at' => $user->subscription_started_at,
            'expires_at' => $user->subscription_expires_at,
            'commission_rate' => $user->getCommissionRate(),
            'has_active_pro' => $user->hasProSubscription()
        ];

        return response()->json(['subscription' => $subscription]);
    } catch (\Exception $e) {
        Log::error('Get subscription error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch subscription details'], 500);
    }
});

// Upgrade to Pro subscription
Route::middleware(['auth:sanctum', 'farmer'])->post('/farmer/subscription/upgrade', function (Request $request) {
    try {
        $user = Auth::user();
        
        if ($user->hasProSubscription()) {
            return response()->json(['error' => 'Already have active Pro subscription'], 400);
        }

        $user->subscription_tier = 'pro';
        $user->is_verified = true;
        $user->subscription_started_at = now();
        $user->subscription_expires_at = now()->addMonth(); // Pro subscription for 1 month
        $user->commission_rate = 0.00;
        $user->save();

        return response()->json([
            'message' => 'Successfully upgraded to Pro subscription!',
            'subscription' => [
                'tier' => $user->subscription_tier,
                'is_verified' => $user->is_verified,
                'started_at' => $user->subscription_started_at,
                'expires_at' => $user->subscription_expires_at,
                'commission_rate' => $user->commission_rate
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Upgrade subscription error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to upgrade subscription'], 500);
    }
});

// Downgrade to Basic subscription
Route::middleware(['auth:sanctum', 'farmer'])->post('/farmer/subscription/downgrade', function (Request $request) {
    try {
        $user = Auth::user();
        
        $user->subscription_tier = 'basic';
        $user->is_verified = false;
        $user->subscription_started_at = now();
        $user->subscription_expires_at = null;
        $user->commission_rate = 10.00;
        $user->save();

        return response()->json([
            'message' => 'Successfully downgraded to Basic subscription!',
            'subscription' => [
                'tier' => $user->subscription_tier,
                'is_verified' => $user->is_verified,
                'started_at' => $user->subscription_started_at,
                'expires_at' => $user->subscription_expires_at,
                'commission_rate' => $user->commission_rate
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Downgrade subscription error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to downgrade subscription'], 500);
    }
});

// Get farmer's stats for dashboard cards
Route::middleware(['auth:sanctum', 'farmer'])->get('/farmer/stats', function (Request $request) {
    try {
        $farmer = Auth::user();
        $farmerId = $farmer->_id;
        
        // Get contracts count - check all contracts for applications from this farmer
        $contractsCount = 0;
        $allContracts = Contract::all();
        
        foreach ($allContracts as $contract) {
            $applicants = $contract->applicants ?? [];
            foreach ($applicants as $applicant) {
                if (isset($applicant['farmer_id']) && $applicant['farmer_id'] == $farmerId) {
                    $contractsCount++;
                    break;
                }
            }
        }
        
        // Get sales data - check products and orders
        $farmerProducts = Product::where('farmer_id', $farmerId)->get();
        $productIds = $farmerProducts->pluck('id')->toArray();
        
        // Get order items for farmer's products
        $orderItems = collect();
        if (!empty($productIds)) {
            $orderItems = OrderItem::whereIn('product_id', $productIds)->get();
        }
        
        $totalSales = 0;
        $salesCount = $orderItems->count();
        $uniqueOrdersCount = 0;
        
        if ($orderItems->count() > 0) {
            $totalSales = $orderItems->sum('total_price') ?? 0;
            $uniqueOrdersCount = $orderItems->pluck('order_id')->unique()->count();
        }
        
        // Get commission earned (farmer's share after platform fee)
        $commissionRate = $farmer->getCommissionRate() / 100;
        $platformCommission = $totalSales * $commissionRate;
        $farmerEarnings = $totalSales - $platformCommission;
        
        return response()->json([
            'stats' => [
                'contracts' => [
                    'total' => $contractsCount,
                    'label' => 'Contract Applications'
                ],
                'sales' => [
                    'total_amount' => round($totalSales, 2),
                    'total_orders' => $uniqueOrdersCount,
                    'total_items_sold' => $salesCount,
                    'farmer_earnings' => round($farmerEarnings, 2),
                    'platform_commission' => round($platformCommission, 2),
                    'label' => 'Total Sales'
                ]
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Get farmer stats error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch farmer stats'], 500);
    }
});