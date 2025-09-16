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
        // Since we're using MongoDB, we need to clear collections manually
        // This migration clears existing contracts and bids to redesign the marketplace

        // Clear existing contracts and bids using Eloquent models
        \App\Models\Contract::truncate();
        \App\Models\Bid::truncate();

        // Document the new contract marketplace structure:
        // - Customers create contracts (demand for products)
        // - Farmers place bids on contracts
        // - Contract automatically awarded to lowest bidder
        // - New contract statuses: open, awarded, in_progress, completed, cancelled
        // - New bid statuses: pending, accepted, rejected
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback needed for data clearing
    }
};
