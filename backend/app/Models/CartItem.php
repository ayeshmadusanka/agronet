<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class CartItem extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'cart_items';

    protected $fillable = [
        'customer_id',
        'product_id',
        'quantity'
    ];

    protected $casts = [
        'quantity' => 'integer'
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id', '_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getTotalPriceAttribute()
    {
        return $this->product->price * $this->quantity;
    }
}