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
        // Since we're using MongoDB, schema changes are handled automatically
        // This migration documents the new order flow structure

        // New Order Fields:
        // - farmer_approval_status (array): Individual farmer approvals
        // - ready_for_pickup_at (datetime): When farmer marks ready
        // - driver_id: Assigned driver
        // - driver_assigned_at: When driver was assigned
        // - picked_up_at: When driver picked up
        // - in_transit_at: When driver started transit
        // - delivered_at: When driver delivered
        // - completed_at: When order was completed
        // - farmer_notes: Notes from farmer
        // - driver_notes: Notes from driver
        // - rejection_reason: Why order was rejected

        // New Order Status Flow:
        // pending → farmer_approved/farmer_rejected → ready_for_pickup →
        // assigned_to_driver → picked_up → in_transit → delivered → completed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback changes if needed
    }
};
