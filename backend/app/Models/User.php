<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $connection = 'mongodb'; // Force MongoDB connection
    protected $collection = 'users';   // Explicit collection name

    // Add 'district' and 'address' for farmers and customers respectively
    protected $fillable = [
        'name', 
        'email', 
        'password', 
        'role', 
        'address', 
        'registration_date', 
        'status',
        'subscription_tier',
        'is_verified',
        'subscription_started_at',
        'subscription_expires_at',
        'commission_rate'
    ];

    // Hides the password when returning user data
    protected $hidden = [
        'password', 'remember_token',
    ];

    // Farmer
    public function isFarmer()
    {
        return $this->role === 'farmer';
    }

    // Customer
    public function isCustomer()
    {
        return $this->role === 'customer';
    }

    // Admin
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    // Check if farmer has pro subscription
    public function hasProSubscription()
    {
        return $this->subscription_tier === 'pro' && 
               $this->subscription_expires_at && 
               $this->subscription_expires_at->isFuture();
    }

    // Check if farmer is verified
    public function isVerified()
    {
        return $this->is_verified;
    }

    // Get farmer commission rate based on subscription
    public function getCommissionRate()
    {
        if ($this->hasProSubscription()) {
            return 0.00; // Pro subscribers get 0% commission rate (admin takes 0%)
        }
        return 10.00; // Basic subscribers get 10% commission rate (admin takes 10%)
    }
}

