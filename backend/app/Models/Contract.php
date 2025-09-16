<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Contract extends Model
{

    protected $connection = 'mongodb'; // Use MongoDB connection
    protected $collection = 'contracts'; // Explicit collection name

    protected $fillable = [
        'title',
        'description',
        'crop_type',
        'quantity_needed',
        'preferred_price_per_kilo',
        'deadline',
        'location',
        'status',
        'buyer_id',      // User who created the contract (customer/buyer)
        'winning_bid_id',
        'created_at',
        'updated_at'
    ];

    // Cast fields to appropriate types
    protected $casts = [
        'deadline' => 'datetime',
        'quantity_needed' => 'decimal:2',
        'preferred_price_per_kilo' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function bids()
    {
        return $this->hasMany(Bid::class, 'contract_id');
    }

    public function winningBid()
    {
        return $this->belongsTo(Bid::class, 'winning_bid_id');
    }

    // Get all active bids for this contract
    public function activeBids()
    {
        return $this->hasMany(Bid::class, 'contract_id')->where('status', 'pending');
    }

    // Find the lowest bid that meets the quantity requirement
    public function getLowestQualifiedBid()
    {
        return $this->activeBids()
            ->where('quantity_offered', '>=', $this->quantity_needed)
            ->orderBy('price_per_kilo', 'asc')
            ->first();
    }

    // Award contract to the lowest bidder
    public function awardToLowestBidder()
    {
        $lowestBid = $this->getLowestQualifiedBid();

        if ($lowestBid) {
            // Update contract
            $this->winning_bid_id = $lowestBid->_id;
            $this->status = 'awarded';
            $this->save();

            // Update winning bid
            $lowestBid->status = 'accepted';
            $lowestBid->save();

            // Reject all other bids
            $this->activeBids()
                ->where('_id', '!=', $lowestBid->_id)
                ->update(['status' => 'rejected']);

            return $lowestBid;
        }

        return null;
    }

    // Check if contract should be automatically awarded
    public function checkAutoAward()
    {
        if ($this->status === 'open' && $this->getLowestQualifiedBid()) {
            return $this->awardToLowestBidder();
        }

        return null;
    }

    // Get contract status display text
    public function getStatusText()
    {
        return match($this->status) {
            'open' => 'Open for Bids',
            'awarded' => 'Contract Awarded',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
            'expired' => 'Expired',
            default => ucfirst($this->status)
        };
    }

    // Check if contract is still accepting bids
    public function canReceiveBids()
    {
        return $this->status === 'open' &&
               $this->deadline > now() &&
               !$this->winning_bid_id;
    }
}
