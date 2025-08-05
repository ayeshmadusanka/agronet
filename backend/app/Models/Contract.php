<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Contract extends Model
{

    protected $connection = 'mongodb'; // Use MongoDB connection
    protected $collection = 'contracts'; // Explicit collection name

    
        protected $fillable = [
        'name',
        'description', 
        'deadline',
        'status',
        'admin_id',
        'farmers',       // Array of farmer IDs
        'winning_bid_id',
        'created_at',
        'updated_at'
    ];

        // Cast fields to appropriate types
    protected $casts = [
        'deadline' => 'datetime',
        'farmers' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];


    // Relationships
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function biddingFarmers()
    {
        return $this->belongsToMany(User::class, null, 'farmers');
    }

    public function winningBid()
    {
        return $this->belongsTo(Bid::class, 'winning_bid_id');
    }
}
