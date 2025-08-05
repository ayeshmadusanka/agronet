<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_id'); // Reference to users table where role=customer
            $table->string('order_number')->unique(); // Generate unique order number
            $table->decimal('subtotal', 10, 2); // Total product cost
            $table->decimal('platform_fee', 10, 2); // 10% platform fee
            $table->decimal('total_amount', 10, 2); // Subtotal + platform fee
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $table->enum('payment_method', ['cash_on_delivery'])->default('cash_on_delivery');
            $table->json('shipping_address'); // Store customer address details
            $table->timestamps();
            
            $table->index('customer_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};