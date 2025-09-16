<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'orders';

    protected $fillable = [
        'customer_id',
        'order_number',
        'subtotal',
        'platform_fee',
        'total_amount',
        'status', // pending, farmer_approved, farmer_rejected, ready_for_pickup, assigned_to_driver, picked_up, in_transit, delivered, completed, cancelled
        'payment_method',
        'shipping_address',
        'farmer_approval_status', // Array of farmer approvals for each item
        'ready_for_pickup_at',
        'driver_id',
        'driver_assigned_at',
        'picked_up_at',
        'in_transit_at',
        'delivered_at',
        'completed_at',
        'farmer_notes',
        'driver_notes',
        'rejection_reason'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'shipping_address' => 'array',
        'farmer_approval_status' => 'array',
        'ready_for_pickup_at' => 'datetime',
        'driver_assigned_at' => 'datetime',
        'picked_up_at' => 'datetime',
        'in_transit_at' => 'datetime',
        'delivered_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id', '_id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id', '_id');
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class, 'order_id', '_id');
    }

    // Get all farmers involved in this order
    public function getFarmers()
    {
        $farmerIds = $this->orderItems()
            ->with('product')
            ->get()
            ->pluck('product.farmer_id')
            ->unique()
            ->values();

        return User::whereIn('_id', $farmerIds)->get();
    }

    // Check if all farmers have approved the order
    public function allFarmersApproved()
    {
        $farmers = $this->getFarmers();
        $approvals = $this->farmer_approval_status ?? [];

        foreach ($farmers as $farmer) {
            if (!isset($approvals[$farmer->_id]) || $approvals[$farmer->_id]['status'] !== 'approved') {
                return false;
            }
        }

        return true;
    }

    // Check if any farmer has rejected the order
    public function anyFarmerRejected()
    {
        $approvals = $this->farmer_approval_status ?? [];

        foreach ($approvals as $approval) {
            if ($approval['status'] === 'rejected') {
                return true;
            }
        }

        return false;
    }

    // Update order status based on farmer approvals
    public function updateStatusBasedOnApprovals()
    {
        if ($this->anyFarmerRejected()) {
            $this->status = 'farmer_rejected';
        } elseif ($this->allFarmersApproved()) {
            $this->status = 'farmer_approved';
        }
        $this->save();
    }

    // Mark order as ready for pickup
    public function markReadyForPickup($farmerNotes = null)
    {
        $this->status = 'ready_for_pickup';
        $this->ready_for_pickup_at = now();
        if ($farmerNotes) {
            $this->farmer_notes = $farmerNotes;
        }
        $this->save();

        // Trigger driver assignment
        $this->assignDriver();
    }

    // Assign available driver
    public function assignDriver()
    {
        $availableDriver = Driver::where('is_available', true)
            ->where('status', 'active')
            ->whereDoesntHave('activeDeliveries')
            ->first();

        if ($availableDriver) {
            $this->driver_id = $availableDriver->_id;
            $this->driver_assigned_at = now();
            $this->status = 'assigned_to_driver';
            $this->save();

            // Create delivery record
            $this->createDeliveryRecord();

            return true;
        }

        return false;
    }

    // Create delivery record for the driver
    public function createDeliveryRecord()
    {
        if (!$this->driver_id) return;

        // Get pickup location (first farmer's location - could be enhanced for multiple farmers)
        $firstItem = $this->orderItems()->with('product.farmer')->first();
        if (!$firstItem) return;

        $farmer = $firstItem->product->farmer ?? User::find($firstItem->product->farmer_id);
        if (!$farmer) return;

        Delivery::create([
            'order_id' => $this->_id,
            'driver_id' => $this->driver_id,
            'farmer_id' => $farmer->_id,
            'buyer_id' => $this->customer_id,
            'pickup_location' => [
                'address' => $farmer->address ?? 'Farm location',
                'lat' => $farmer->current_location['lat'] ?? null,
                'lng' => $farmer->current_location['lng'] ?? null,
                'contact_phone' => $farmer->phone
            ],
            'delivery_location' => [
                'address' => $this->shipping_address['address'] ?? 'Delivery address',
                'lat' => $this->shipping_address['lat'] ?? null,
                'lng' => $this->shipping_address['lng'] ?? null,
                'contact_phone' => $this->shipping_address['phone'] ?? null
            ],
            'status' => 'assigned',
            'assigned_at' => now(),
            'estimated_delivery_time' => now()->addHours(2),
            'items' => $this->orderItems()->with('product')->get()->map(function ($item) {
                return [
                    'name' => $item->product->name ?? 'Unknown Product',
                    'quantity' => $item->quantity . ' ' . ($item->product->unit ?? 'kg'),
                    'price' => '$' . number_format($item->total_price, 2)
                ];
            })->toArray(),
            'delivery_fee' => 15.00 // Default delivery fee
        ]);
    }

    public static function generateOrderNumber()
    {
        return 'AG-' . date('Y') . '-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
    }

    // Status progression methods
    public function markPickedUp($driverNotes = null)
    {
        $this->status = 'picked_up';
        $this->picked_up_at = now();
        if ($driverNotes) {
            $this->driver_notes = $driverNotes;
        }
        $this->save();
    }

    public function markInTransit($driverNotes = null)
    {
        $this->status = 'in_transit';
        $this->in_transit_at = now();
        if ($driverNotes) {
            $this->driver_notes = $driverNotes;
        }
        $this->save();
    }

    public function markDelivered($driverNotes = null)
    {
        $this->status = 'delivered';
        $this->delivered_at = now();
        if ($driverNotes) {
            $this->driver_notes = $driverNotes;
        }
        $this->save();
    }

    public function markCompleted()
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();
    }
}