<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'products';

    protected $fillable = [
        'farmer_id',
        'title',
        'description',
        'price',
        'image_url',
        'stock_quantity',
        'status'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'integer'
    ];

    // Mutator to ensure stock_quantity is always stored as integer
    public function setStockQuantityAttribute($value)
    {
        $this->attributes['stock_quantity'] = (int) $value;
    }

    // Accessor to ensure stock_quantity is always returned as integer
    public function getStockQuantityAttribute($value)
    {
        return (int) $value;
    }

    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id', '_id');
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeActive($query)
    {
        // Handle both string and integer comparison for stock_quantity in MongoDB
        return $query->where('status', 'active')
                    ->where(function($q) {
                        $q->where('stock_quantity', '>', 0)
                          ->orWhere('stock_quantity', '>', '0');
                    });
    }
}