<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Driver extends Authenticatable
{
    use HasApiTokens;

    protected $connection = 'mongodb';
    protected $collection = 'drivers';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'license_number',
        'vehicle_type',
        'vehicle_number',
        'address',
        'status', // active, inactive, suspended
        'current_location', // {lat, lng, address}
        'rating',
        'total_deliveries',
        'registration_date',
        'is_available',
        'documents' // Array of uploaded documents
    ];

    protected $hidden = [
        'password',
        'remember_token'
    ];

    protected $casts = [
        'current_location' => 'array',
        'documents' => 'array',
        'registration_date' => 'datetime',
        'is_available' => 'boolean',
        'rating' => 'decimal:2',
        'total_deliveries' => 'integer'
    ];

    // Relationships
    public function deliveries()
    {
        return $this->hasMany(Delivery::class, 'driver_id');
    }

    public function activeDeliveries()
    {
        return $this->hasMany(Delivery::class, 'driver_id')
            ->whereIn('status', ['assigned', 'picked_up', 'on_the_way']);
    }

    public function completedDeliveries()
    {
        return $this->hasMany(Delivery::class, 'driver_id')
            ->where('status', 'delivered');
    }

    // Helper methods
    public function isAvailable()
    {
        return $this->is_available && $this->status === 'active';
    }

    public function updateLocation($lat, $lng, $address = null)
    {
        $this->current_location = [
            'lat' => $lat,
            'lng' => $lng,
            'address' => $address,
            'updated_at' => now()
        ];
        $this->save();
    }
}