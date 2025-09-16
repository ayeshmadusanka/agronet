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

    // Base validation rules for all users
    $rules = [
        'name' => 'required|string',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6',
        'role' => 'required|in:farmer,customer,admin',
        'address' => 'required|string',
    ];

    // Additional validation for farmers
    if ($request->role === 'farmer') {
        $rules = array_merge($rules, [
            'phone' => 'required|string',
            'farm_location' => 'required|string',
            'district' => 'required|string',
            'city' => 'required|string',
            'crop_types' => 'required|array|min:1',
            'crop_types.*' => 'required|string'
        ]);
    }


    $request->validate($rules);

    // Create user data
    $userData = [
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => $request->role,
        'address' => $request->address,
        'registration_date' => now(),
        'status' => $request->role === 'farmer' ? 'pending' : 'approved'
    ];

    // Add farmer-specific fields if role is farmer
    if ($request->role === 'farmer') {
        $userData = array_merge($userData, [
            'phone' => $request->phone,
            'farm_location' => $request->farm_location,
            'district' => $request->district,
            'city' => $request->city,
            'crop_types' => $request->crop_types
        ]);
    }

    // Create user (farmer, customer, admin only)
    $user = User::create($userData);

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






// Farmers Place Bids on Customer Contracts (New Flow)
Route::middleware(['auth:sanctum', 'farmer'])->post('/contracts/{contract}/bid', function (Request $request, $contractId) {
    $request->validate([
        'quantity_offered' => 'required|numeric|min:0.01',
        'price_per_kilo' => 'required|numeric|min:0.01',
        'message' => 'nullable|string|max:500'
    ]);

    $contract = Contract::find($contractId);
    if (!$contract) {
        return response()->json(['error' => 'Contract not found'], 404);
    }

    // Check if contract can receive bids (new method)
    if (!$contract->canReceiveBids()) {
        return response()->json(['error' => 'Contract is no longer accepting bids'], 400);
    }

    // Check if farmer already has a bid on this contract
    $existingBid = Bid::where('contract_id', $contractId)
                     ->where('farmer_id', Auth::user()->_id)
                     ->first();

    if ($existingBid) {
        return response()->json(['error' => 'You have already placed a bid on this contract'], 400);
    }

    // Create the bid (total_amount is calculated automatically in model)
    $bid = Bid::create([
        'contract_id' => $contractId,
        'farmer_id' => Auth::user()->_id,
        'quantity_offered' => $request->quantity_offered,
        'price_per_kilo' => $request->price_per_kilo,
        'message' => $request->message,
        'status' => 'pending'
    ]);

    // Check if this bid should trigger automatic contract award
    $contract->refresh(); // Refresh contract data

    return response()->json([
        'message' => 'Bid placed successfully!',
        'bid' => $bid->load('farmer'),
        'contract_awarded' => $contract->status === 'awarded'
    ], 201);
});






// Customers Create Contracts (Demand for crops) - New Flow
Route::middleware(['auth:sanctum', 'customer'])->post('/contracts', function (Request $request) {
    // Validate request
    $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'crop_type' => 'required|string|max:100',
        'quantity_needed' => 'required|numeric|min:0.01',
        'preferred_price_per_kilo' => 'required|numeric|min:0.01',
        'deadline' => 'required|date|after:now',
        'location' => 'required|string|max:255'
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // Create contract with new status flow
    $contract = Contract::create([
        'title' => $request->input('title'),
        'description' => $request->input('description'),
        'crop_type' => $request->input('crop_type'),
        'quantity_needed' => $request->input('quantity_needed'),
        'preferred_price_per_kilo' => $request->input('preferred_price_per_kilo'),
        'deadline' => $request->input('deadline'),
        'location' => $request->input('location'),
        'status' => 'open', // New contracts start as open for bidding
        'buyer_id' => Auth::user()->_id,
        'winning_bid_id' => null
    ]);

    return response()->json([
        'message' => 'Contract created successfully! Farmers can now place bids.',
        'contract' => $contract->load('buyer')
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









// Get all open contracts for farmers to view and bid on (New Flow)
Route::middleware(['auth:sanctum', 'farmer'])->get('/contracts', function (Request $request) {
    $farmerId = Auth::user()->_id;

    $contracts = Contract::with(['buyer', 'bids'])
        ->where('status', 'open')
        ->where('deadline', '>', now()) // Only show contracts that haven't expired
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($contract) use ($farmerId) {
            $bidCount = $contract->bids->count();
            $lowestBid = $contract->bids
                ->where('status', 'pending')
                ->sortBy('price_per_kilo')
                ->first();

            // Check if current farmer has already bid
            $userBid = $contract->bids
                ->where('farmer_id', $farmerId)
                ->first();

            return [
                'id' => $contract->_id,
                'title' => $contract->title,
                'description' => $contract->description,
                'crop_type' => $contract->crop_type,
                'quantity_needed' => $contract->quantity_needed,
                'preferred_price_per_kilo' => $contract->preferred_price_per_kilo,
                'deadline' => $contract->deadline,
                'location' => $contract->location,
                'status' => $contract->status,
                'status_text' => $contract->getStatusText(),
                'buyer' => [
                    'id' => $contract->buyer->_id,
                    'name' => $contract->buyer->name
                ],
                'bid_count' => $bidCount,
                'lowest_bid' => $lowestBid ? [
                    'price_per_kilo' => $lowestBid->price_per_kilo,
                    'quantity_offered' => $lowestBid->quantity_offered
                ] : null,
                'user_has_bid' => $userBid ? true : false,
                'user_bid' => $userBid ? [
                    'price_per_kilo' => $userBid->price_per_kilo,
                    'quantity_offered' => $userBid->quantity_offered,
                    'status' => $userBid->status
                ] : null,
                'can_receive_bids' => $contract->canReceiveBids(),
                'created_at' => $contract->created_at
            ];
        });

    return response()->json(['contracts' => $contracts]);
});





// Get customer's own contracts and their bids (New Flow)
Route::middleware(['auth:sanctum', 'customer'])->get('/my-contracts', function () {
    $contracts = Contract::with(['bids.farmer', 'winningBid.farmer'])
        ->where('buyer_id', Auth::user()->_id)
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($contract) {
            $bids = $contract->bids->map(function ($bid) {
                return [
                    'id' => $bid->_id,
                    'farmer' => [
                        'id' => $bid->farmer->_id,
                        'name' => $bid->farmer->name,
                        'phone' => $bid->farmer->phone ?? 'N/A'
                    ],
                    'quantity_offered' => $bid->quantity_offered,
                    'price_per_kilo' => $bid->price_per_kilo,
                    'total_amount' => $bid->total_amount,
                    'message' => $bid->message,
                    'status' => $bid->status,
                    'status_text' => $bid->getStatusText(),
                    'status_color' => $bid->getStatusColor(),
                    'meets_requirements' => $bid->meetsRequirements(),
                    'created_at' => $bid->created_at
                ];
            })->sortBy('price_per_kilo')->values();

            // Get the lowest qualifying bid
            $lowestBid = $contract->getLowestQualifiedBid();

            return [
                'id' => $contract->_id,
                'title' => $contract->title,
                'description' => $contract->description,
                'crop_type' => $contract->crop_type,
                'quantity_needed' => $contract->quantity_needed,
                'preferred_price_per_kilo' => $contract->preferred_price_per_kilo,
                'deadline' => $contract->deadline,
                'location' => $contract->location,
                'status' => $contract->status,
                'status_text' => $contract->getStatusText(),
                'can_receive_bids' => $contract->canReceiveBids(),
                'bids' => $bids,
                'bid_count' => $contract->bids->count(),
                'pending_bid_count' => $contract->bids->where('status', 'pending')->count(),
                'winning_bid' => $contract->winningBid ? [
                    'id' => $contract->winningBid->_id,
                    'farmer_name' => $contract->winningBid->farmer->name,
                    'farmer_phone' => $contract->winningBid->farmer->phone ?? 'N/A',
                    'price_per_kilo' => $contract->winningBid->price_per_kilo,
                    'quantity_offered' => $contract->winningBid->quantity_offered,
                    'total_amount' => $contract->winningBid->total_amount
                ] : null,
                'lowest_qualifying_bid' => $lowestBid ? [
                    'price_per_kilo' => $lowestBid->price_per_kilo,
                    'farmer_name' => $lowestBid->farmer->name
                ] : null,
                'created_at' => $contract->created_at
            ];
        });

    return response()->json(['contracts' => $contracts]);
});

// Get contract details with all bids (for customers to view bids on their contract)
Route::middleware(['auth:sanctum', 'customer'])->get('/contracts/{contract}', function ($contractId) {
    $contract = Contract::with(['bids.farmer', 'buyer'])
        ->find($contractId);

    if (!$contract) {
        return response()->json(['error' => 'Contract not found'], 404);
    }

    // Check if the current user owns this contract
    if ($contract->buyer_id !== Auth::user()->_id) {
        return response()->json(['error' => 'Unauthorized to view this contract'], 403);
    }

    $bids = $contract->bids->sortBy('price_per_kilo')->map(function ($bid) {
        return [
            'id' => $bid->_id,
            'farmer_name' => $bid->farmer->name,
            'farmer_phone' => $bid->farmer->phone,
            'quantity_offered' => $bid->quantity_offered,
            'price_per_kilo' => $bid->price_per_kilo,
            'total_amount' => $bid->total_amount,
            'message' => $bid->message,
            'status' => $bid->status,
            'created_at' => $bid->created_at
        ];
    });

    return response()->json([
        'contract' => [
            'id' => $contract->_id,
            'title' => $contract->title,
            'description' => $contract->description,
            'crop_type' => $contract->crop_type,
            'quantity_needed' => $contract->quantity_needed,
            'preferred_price_per_kilo' => $contract->preferred_price_per_kilo,
            'deadline' => $contract->deadline,
            'location' => $contract->location,
            'status' => $contract->status,
            'created_at' => $contract->created_at
        ],
        'bids' => $bids,
        'bid_count' => $contract->bids->count()
    ]);
});

// Accept a bid (customer action)
Route::middleware(['auth:sanctum', 'customer'])->post('/bids/{bid}/accept', function ($bidId) {
    $bid = Bid::with(['contract', 'farmer'])->find($bidId);

    if (!$bid) {
        return response()->json(['error' => 'Bid not found'], 404);
    }

    if ($bid->contract->buyer_id !== Auth::user()->_id) {
        return response()->json(['error' => 'Unauthorized to accept this bid'], 403);
    }

    if ($bid->status !== 'pending') {
        return response()->json(['error' => 'Bid is no longer pending'], 400);
    }

    // Accept this bid
    $bid->status = 'accepted';
    $bid->save();

    // Update contract with winning bid and close it
    $contract = $bid->contract;
    $contract->winning_bid_id = $bid->_id;
    $contract->status = 'completed';
    $contract->save();

    // Reject all other bids for this contract
    Bid::where('contract_id', $contract->_id)
        ->where('_id', '!=', $bid->_id)
        ->update(['status' => 'rejected']);

    return response()->json([
        'message' => 'Bid accepted successfully!',
        'bid' => $bid,
        'farmer_contact' => [
            'name' => $bid->farmer->name,
            'phone' => $bid->farmer->phone,
            'email' => $bid->farmer->email
        ]
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
        
        // Get contracts count - number of bids this farmer has placed
        $contractsCount = Bid::where('farmer_id', $farmerId)->count();
        
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

// ============================================
// NEW ORDER & APPROVAL FLOW ROUTES
// ============================================

// Get orders awaiting farmer approval (for farmers)
Route::middleware(['auth:sanctum', 'farmer'])->get('/farmer/pending-orders', function (Request $request) {
    try {
        $farmer = Auth::user();

        // Find orders that contain this farmer's products and need approval
        $orders = Order::whereIn('status', ['pending', 'farmer_approved'])
            ->whereHas('orderItems.product', function ($query) use ($farmer) {
                $query->where('farmer_id', $farmer->_id);
            })
            ->with(['orderItems.product', 'customer'])
            ->get()
            ->filter(function ($order) use ($farmer) {
                $approvals = $order->farmer_approval_status ?? [];
                return !isset($approvals[$farmer->_id]); // Only show orders not yet approved/rejected by this farmer
            });

        $formattedOrders = $orders->map(function ($order) use ($farmer) {
            $farmerItems = $order->orderItems->filter(function ($item) use ($farmer) {
                return $item->product->farmer_id === $farmer->_id;
            });

            return [
                'id' => $order->_id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer->name,
                'customer_phone' => $order->customer->phone ?? 'Not provided',
                'status' => $order->status,
                'total_amount' => $order->total_amount,
                'shipping_address' => $order->shipping_address,
                'created_at' => $order->created_at,
                'farmer_items' => $farmerItems->map(function ($item) {
                    return [
                        'product_name' => $item->product->name,
                        'quantity' => $item->quantity,
                        'unit' => $item->product->unit ?? 'kg',
                        'price_per_unit' => $item->price_per_unit,
                        'total_price' => $item->total_price
                    ];
                })->values()
            ];
        })->values();

        return response()->json([
            'orders' => $formattedOrders
        ]);
    } catch (\Exception $e) {
        Log::error('Get pending orders error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch pending orders'], 500);
    }
});

// Farmer approve/reject order
Route::middleware(['auth:sanctum', 'farmer'])->post('/farmer/orders/{orderId}/respond', function (Request $request, $orderId) {
    $validator = Validator::make($request->all(), [
        'action' => 'required|string|in:approve,reject',
        'notes' => 'nullable|string|max:500',
        'rejection_reason' => 'required_if:action,reject|string|max:255'
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    try {
        $farmer = Auth::user();
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Check if farmer has items in this order
        $hasItems = $order->orderItems()
            ->whereHas('product', function ($query) use ($farmer) {
                $query->where('farmer_id', $farmer->_id);
            })
            ->exists();

        if (!$hasItems) {
            return response()->json(['error' => 'You do not have items in this order'], 403);
        }

        // Update farmer approval status
        $approvals = $order->farmer_approval_status ?? [];
        $approvals[$farmer->_id] = [
            'status' => $request->action === 'approve' ? 'approved' : 'rejected',
            'notes' => $request->notes,
            'responded_at' => now(),
            'rejection_reason' => $request->action === 'reject' ? $request->rejection_reason : null
        ];

        $order->farmer_approval_status = $approvals;
        if ($request->action === 'reject') {
            $order->rejection_reason = $request->rejection_reason;
        }
        $order->save();

        // Update overall order status based on all farmer responses
        $order->updateStatusBasedOnApprovals();

        return response()->json([
            'message' => $request->action === 'approve' ? 'Order approved successfully' : 'Order rejected successfully',
            'order_status' => $order->status
        ]);
    } catch (\Exception $e) {
        Log::error('Order response error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to process order response'], 500);
    }
});

// Get approved orders for farmer (ready to mark as ready for pickup)
Route::middleware(['auth:sanctum', 'farmer'])->get('/farmer/approved-orders', function (Request $request) {
    try {
        $farmer = Auth::user();

        $orders = Order::where('status', 'farmer_approved')
            ->whereHas('orderItems.product', function ($query) use ($farmer) {
                $query->where('farmer_id', $farmer->_id);
            })
            ->with(['orderItems.product', 'customer'])
            ->get();

        $formattedOrders = $orders->map(function ($order) use ($farmer) {
            $farmerItems = $order->orderItems->filter(function ($item) use ($farmer) {
                return $item->product->farmer_id === $farmer->_id;
            });

            return [
                'id' => $order->_id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer->name,
                'customer_phone' => $order->customer->phone ?? 'Not provided',
                'status' => $order->status,
                'total_amount' => $order->total_amount,
                'shipping_address' => $order->shipping_address,
                'created_at' => $order->created_at,
                'farmer_items' => $farmerItems->map(function ($item) {
                    return [
                        'product_name' => $item->product->name,
                        'quantity' => $item->quantity,
                        'unit' => $item->product->unit ?? 'kg',
                        'price_per_unit' => $item->price_per_unit,
                        'total_price' => $item->total_price
                    ];
                })->values(),
                'approval_info' => $order->farmer_approval_status[$farmer->_id] ?? null
            ];
        })->values();

        return response()->json([
            'orders' => $formattedOrders
        ]);
    } catch (\Exception $e) {
        Log::error('Get approved orders error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch approved orders'], 500);
    }
});

// Mark order as ready for pickup
Route::middleware(['auth:sanctum', 'farmer'])->post('/farmer/orders/{orderId}/ready-for-pickup', function (Request $request, $orderId) {
    $validator = Validator::make($request->all(), [
        'notes' => 'nullable|string|max:500'
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    try {
        $farmer = Auth::user();
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($order->status !== 'farmer_approved') {
            return response()->json(['error' => 'Order is not in approved status'], 400);
        }

        // Check if farmer has items in this order
        $hasItems = $order->orderItems()
            ->whereHas('product', function ($query) use ($farmer) {
                $query->where('farmer_id', $farmer->_id);
            })
            ->exists();

        if (!$hasItems) {
            return response()->json(['error' => 'You do not have items in this order'], 403);
        }

        // Mark order as ready for pickup
        $order->markReadyForPickup($request->notes);

        $response = [
            'message' => 'Order marked as ready for pickup',
            'order' => [
                'id' => $order->_id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'ready_for_pickup_at' => $order->ready_for_pickup_at,
                'farmer_notes' => $order->farmer_notes
            ]
        ];


        return response()->json($response);
    } catch (\Exception $e) {
        Log::error('Mark ready for pickup error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to mark order as ready for pickup'], 500);
    }
});


// Get order tracking details (for customers)
Route::middleware(['auth:sanctum', 'customer'])->get('/customer/orders/{orderId}/tracking', function (Request $request, $orderId) {
    try {
        $customer = Auth::user();
        $order = Order::where('_id', $orderId)
            ->where('customer_id', $customer->_id)
            ->with(['orderItems.product.farmer'])
            ->first();

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Get farmer approval statuses
        $farmerApprovals = [];
        $farmers = $order->getFarmers();
        foreach ($farmers as $farmer) {
            $approval = $order->farmer_approval_status[$farmer->_id] ?? null;
            $farmerApprovals[] = [
                'farmer_name' => $farmer->name,
                'farmer_phone' => $farmer->phone,
                'status' => $approval['status'] ?? 'pending',
                'notes' => $approval['notes'] ?? null,
                'responded_at' => $approval['responded_at'] ?? null,
                'rejection_reason' => $approval['rejection_reason'] ?? null
            ];
        }

        $trackingData = [
            'order' => [
                'id' => $order->_id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'total_amount' => $order->total_amount,
                'created_at' => $order->created_at,
                'farmer_notes' => $order->farmer_notes,
            ],
            'timeline' => [
                [
                    'status' => 'Order Placed',
                    'timestamp' => $order->created_at,
                    'completed' => true,
                    'description' => 'Your order has been placed successfully'
                ],
                [
                    'status' => 'Farmer Approval',
                    'timestamp' => $order->status === 'farmer_approved' ?
                        collect($order->farmer_approval_status ?? [])->max('responded_at') : null,
                    'completed' => in_array($order->status, ['farmer_approved', 'ready_for_pickup', 'delivered', 'completed']),
                    'description' => $order->status === 'farmer_rejected' ? 'Order was rejected by farmer' : 'Waiting for farmer approval'
                ],
                [
                    'status' => 'Ready for Pickup',
                    'timestamp' => $order->ready_for_pickup_at,
                    'completed' => in_array($order->status, ['ready_for_pickup', 'delivered', 'completed']),
                    'description' => 'Order is prepared and ready for pickup'
                ],
                [
                    'status' => 'Delivered',
                    'timestamp' => $order->delivered_at,
                    'completed' => in_array($order->status, ['delivered', 'completed']),
                    'description' => 'Order has been delivered'
                ],
                [
                    'status' => 'Completed',
                    'timestamp' => $order->completed_at,
                    'completed' => $order->status === 'completed',
                    'description' => 'Order is complete'
                ]
            ],
            'farmer_approvals' => $farmerApprovals
        ];


        return response()->json($trackingData);
    } catch (\Exception $e) {
        Log::error('Get order tracking error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch order tracking'], 500);
    }
});