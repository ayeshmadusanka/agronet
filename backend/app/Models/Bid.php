<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Bid extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'bids';

    protected $fillable = [
        'contract_id',
        'farmer_id',
        'quantity_offered',     // How many kilos the farmer can provide
        'price_per_kilo',       // Price per kilo offered by farmer
        'total_amount',         // Calculated: quantity_offered * price_per_kilo
        'message',
        'status',               // pending, accepted, rejected
        'created_at',
        'updated_at'
    ];

    // Cast fields to appropriate types
    protected $casts = [
        'quantity_offered' => 'decimal:2',
        'price_per_kilo' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function contract()
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    // Automatically calculate total_amount when saving
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($bid) {
            $bid->total_amount = $bid->quantity_offered * $bid->price_per_kilo;
        });

        // Check for auto-award after saving a new bid
        static::saved(function ($bid) {
            if ($bid->status === 'pending') {
                $contract = $bid->contract;
                if ($contract && $contract->canReceiveBids()) {
                    $contract->checkAutoAward();
                }
            }
        });
    }

    // Check if this bid meets the contract requirements
    public function meetsRequirements()
    {
        $contract = $this->contract;
        return $contract && $this->quantity_offered >= $contract->quantity_needed;
    }

    // Get bid status display text
    public function getStatusText()
    {
        return match($this->status) {
            'pending' => 'Pending Review',
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            default => ucfirst($this->status)
        };
    }

    // Get status color for UI
    public function getStatusColor()
    {
        return match($this->status) {
            'pending' => '#FF9800',
            'accepted' => '#4CAF50',
            'rejected' => '#f44336',
            default => '#666'
        };
    }
}


