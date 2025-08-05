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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('farmer_id'); // Reference to users table where role=farmer
            $table->string('title');
            $table->text('description');
            $table->decimal('price', 10, 2); // Product price set by farmer
            $table->string('image_url')->nullable(); // Product photo
            $table->integer('stock_quantity')->default(1);
            $table->enum('status', ['active', 'inactive', 'out_of_stock'])->default('active');
            $table->timestamps();
            
            $table->index('farmer_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};