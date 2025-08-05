<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Bid extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'bids';

    protected $fillable = [
        'contract_id', 'customer_id', 'amount', 'message', 'created_at'
    ];

    
    public function contract()
    {
        return $this->belongsTo(Contract::class, 'contract_id', '_id');
    }

}


