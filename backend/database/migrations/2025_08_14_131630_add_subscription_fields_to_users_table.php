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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('subscription_tier', ['basic', 'pro'])->default('basic');
            $table->boolean('is_verified')->default(false);
            $table->timestamp('subscription_started_at')->nullable();
            $table->timestamp('subscription_expires_at')->nullable();
            $table->decimal('commission_rate', 5, 2)->default(10.00); // Default 10% commission for Basic, 0% for Pro
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_tier',
                'is_verified',
                'subscription_started_at',
                'subscription_expires_at',
                'commission_rate'
            ]);
        });
    }
};