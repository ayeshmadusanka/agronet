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
        'status'
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
}

