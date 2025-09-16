# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

AgroNet is a full-stack agricultural marketplace platform with a subscription-based business model. The codebase is structured as:

- **Backend**: Laravel 12 API using MongoDB with Laravel Sanctum for authentication
- **Frontend**: React 19 application with Create React App setup
- **Database**: MongoDB for all data storage
- **User Types**: Farmers (sellers), Customers (buyers), Admins

### Key Business Model
- **Two-tier subscription system**: Basic (free, 10% commission) and Pro ($29/month, 0% commission)
- **Marketplace with prioritization**: Pro farmers' products appear first
- **Verification system**: Pro farmers get verified badges
- **Commission system**: Dynamic rates based on subscription tier

## Development Commands

### Backend (Laravel)
```bash
cd backend

# Development server with all services
composer run dev  # Runs server, queue, logs, and Vite concurrently

# Individual services
php artisan serve                    # Start development server (port 8000)
php artisan queue:listen --tries=1  # Start queue worker
php artisan pail --timeout=0        # View logs
npm run dev                          # Start Vite for assets

# Database
php artisan migrate                  # Run migrations
php artisan migrate:fresh --seed    # Fresh migration with seeders

# Testing
composer run test                    # Run PHPUnit tests
php artisan test                     # Alternative test command

# Code quality
vendor/bin/pint                      # Laravel Pint (code formatter)
```

### Frontend (React)
```bash
cd frontend

npm start        # Development server (port 3000)
npm run build    # Production build
npm test         # Run tests
```

## Core Models and Relationships

### User Model (`backend/app/Models/User.php`)
- Roles: farmer, customer, admin
- Subscription fields: `subscription_tier`, `is_verified`, `commission_rate`
- Relationships: products, orders, bids, contracts

### Product Model (`backend/app/Models/Product.php`)
- Belongs to farmer (User)
- Marketplace sorting prioritizes Pro farmers
- Commission calculated based on farmer's subscription tier

### Order/OrderItem Models
- Commission system applies farmer-specific rates
- Pro farmers: 0% commission, Basic farmers: 10% commission

## API Architecture

### Authentication
- Laravel Sanctum for token-based auth
- Middleware: `AdminMiddleware`, `FarmerMiddleware`, `CustomerMiddleware`
- All API routes in `backend/routes/api.php`

### Key API Endpoints
```
POST /api/auth/login                     # User authentication
GET  /api/farmer/subscription            # Get subscription details
POST /api/farmer/subscription/upgrade    # Upgrade to Pro
POST /api/farmer/subscription/downgrade  # Downgrade to Basic
GET  /api/farmer/stats                   # Dashboard statistics
GET  /api/marketplace/products           # Products with Pro priority
POST /api/contracts/{id}/apply           # Apply to contracts
GET  /api/orders                         # Order management
```

## Frontend Structure

### Main Components
- `src/App.js`: Main routing and auth wrapper
- `src/components/`: Reusable UI components
- `src/pages/`: Page-level components
- `src/services/`: API service functions
- `src/utils/`: Utility functions

### Key Features
- Role-based navigation and access control
- Farmer dashboard with three cards: Contracts, Sales, Subscription
- Subscription management with upgrade/downgrade
- Marketplace with Pro farmer prioritization
- Responsive design with mobile support

## Database Schema Notes

### MongoDB Collections
- Users: Includes subscription and verification fields
- Products: Linked to farmer users, used for marketplace sorting
- Orders/OrderItems: Commission calculations use farmer subscription rates
- Contracts: Farmers can apply, tracked for dashboard stats
- Bids: Bidding system for contracts

### Key Schema Changes
The subscription system added these fields to users:
- `subscription_tier`: ENUM('basic', 'pro') DEFAULT 'basic'
- `is_verified`: BOOLEAN DEFAULT false
- `commission_rate`: DECIMAL(5,2) DEFAULT 10.00
- `subscription_started_at`, `subscription_expires_at`: TIMESTAMP fields

## Testing Setup

### Test Data
Several shell scripts exist for creating test data:
- `setup_test_data.sh`: Basic user and product setup
- `create_test_data.sh`: Comprehensive test data creation
- `test_subscription.sh`: Subscription system testing
- `demo_subscription_features.sh`: Full feature demonstration

### Test Credentials
- Farmer: farmer@test.com / password123
- Customer: customer@test.com / password123

## Development Workflow

1. **Backend First**: Start Laravel server with `composer run dev`
2. **Frontend Second**: Start React with `npm start` in separate terminal
3. **Database**: Ensure MongoDB is running and migrated
4. **Testing**: Use provided test scripts and credentials

## Important Notes

- MongoDB is used instead of MySQL/PostgreSQL
- Commission rates are farmer-specific, not global
- Marketplace sorting logic prioritizes Pro farmers
- Dashboard stats are calculated in real-time from related data
- Subscription system is fully functional with upgrade/downgrade capabilities
- Frontend uses axios for API calls with authentication headers