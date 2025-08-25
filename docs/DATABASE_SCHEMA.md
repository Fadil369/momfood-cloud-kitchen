# 🗃️ Database Schema Design - MomFood Production Platform

## **Database Architecture Overview**

This document defines the complete database schema for the MomFood national platform, designed to support millions of users, thousands of restaurants, and real-time operations.

## **Database Technology Stack**

### **Primary Database: PostgreSQL 15+**
- **Purpose**: Transactional data, user management, orders, payments
- **Features**: ACID compliance, JSON support, full-text search, geospatial queries
- **Scaling**: Read replicas, connection pooling, query optimization

### **Cache Layer: Redis 7+**
- **Purpose**: Session management, real-time data, queue processing
- **Features**: Pub/Sub, geospatial commands, streams, clustering
- **Use Cases**: User sessions, order tracking, driver locations

### **Search Engine: Elasticsearch 8+**
- **Purpose**: Restaurant search, menu discovery, analytics
- **Features**: Full-text search, aggregations, real-time indexing
- **Languages**: Arabic and English search optimization

### **Analytics Database: MongoDB 6+**
- **Purpose**: Event logging, user behavior analytics, ML features
- **Features**: Document storage, time-series collections, aggregation pipeline
- **Use Cases**: Click tracking, recommendation engine data

## **Core Database Schema (PostgreSQL)**

### **1. User Management Schema**

```sql
-- Create custom types
CREATE TYPE user_role_enum AS ENUM (
    'customer', 
    'restaurant_owner', 
    'restaurant_staff', 
    'driver', 
    'admin',
    'support_agent'
);

CREATE TYPE user_status_enum AS ENUM (
    'active', 
    'inactive', 
    'suspended', 
    'pending_verification',
    'banned'
);

CREATE TYPE gender_enum AS ENUM (
    'male', 
    'female', 
    'other', 
    'prefer_not_to_say'
);

CREATE TYPE language_enum AS ENUM ('ar', 'en');

-- Base users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    role user_role_enum NOT NULL,
    status user_status_enum DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT users_email_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CONSTRAINT users_password_length CHECK (char_length(password_hash) >= 60)
);

-- Customer profiles
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_ar VARCHAR(100),
    last_name_ar VARCHAR(100),
    birth_date DATE,
    gender gender_enum,
    preferred_language language_enum DEFAULT 'ar',
    
    -- Preferences
    dietary_preferences TEXT[] DEFAULT '{}',
    food_allergies TEXT[] DEFAULT '{}',
    spice_preference VARCHAR(20) DEFAULT 'medium', -- mild, medium, hot
    
    -- Loyalty and gamification
    loyalty_points INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    customer_tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    
    -- Marketing preferences
    marketing_emails BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT true,
    
    -- Profile completion
    profile_completion_percentage INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT customer_birth_date_check CHECK (birth_date <= CURRENT_DATE - INTERVAL '13 years'),
    CONSTRAINT customer_loyalty_points_check CHECK (loyalty_points >= 0),
    CONSTRAINT customer_total_spent_check CHECK (total_spent >= 0)
);

-- Customer addresses
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL, -- Home, Work, etc.
    street_address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    building_number VARCHAR(20),
    floor_number VARCHAR(10),
    apartment_number VARCHAR(10),
    additional_directions TEXT,
    
    -- Geolocation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Address metadata
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    address_type VARCHAR(20) DEFAULT 'residential', -- residential, commercial
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT address_coordinates_check CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL)
    ),
    CONSTRAINT address_latitude_range CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT address_longitude_range CHECK (longitude BETWEEN -180 AND 180)
);

-- Driver profiles
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry_date DATE NOT NULL,
    
    -- Vehicle information
    vehicle_type vehicle_type_enum NOT NULL,
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_color VARCHAR(50),
    vehicle_registration_expiry DATE,
    insurance_expiry_date DATE,
    
    -- Performance metrics
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    
    -- Status and availability
    is_online BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    
    -- Current location (updated frequently)
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    last_location_update TIMESTAMP,
    
    -- Banking information (encrypted)
    bank_name VARCHAR(100),
    account_number_encrypted TEXT,
    iban_encrypted TEXT,
    
    -- Emergency contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT driver_rating_range CHECK (rating BETWEEN 0 AND 5),
    CONSTRAINT driver_license_expiry_check CHECK (license_expiry_date > CURRENT_DATE),
    CONSTRAINT driver_successful_deliveries_check CHECK (successful_deliveries <= total_deliveries)
);

-- Create vehicle type enum
CREATE TYPE vehicle_type_enum AS ENUM (
    'motorcycle', 
    'car', 
    'bicycle', 
    'van',
    'electric_scooter'
);
```

### **2. Restaurant Management Schema**

```sql
-- Restaurant status types
CREATE TYPE restaurant_status_enum AS ENUM (
    'pending', 
    'under_review',
    'approved', 
    'rejected', 
    'suspended',
    'closed_temporarily',
    'closed_permanently'
);

CREATE TYPE cuisine_type_enum AS ENUM (
    'arabic',
    'indian',
    'asian',
    'italian',
    'american',
    'mexican',
    'mediterranean',
    'fast_food',
    'desserts',
    'beverages',
    'healthy',
    'seafood',
    'grill',
    'pizza',
    'other'
);

-- Main restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    
    -- Basic information
    name VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200),
    description TEXT,
    description_ar TEXT,
    cuisine_type cuisine_type_enum,
    
    -- Contact information
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    website_url VARCHAR(500),
    
    -- Business information
    business_license VARCHAR(100) NOT NULL,
    tax_id VARCHAR(100),
    commercial_registration VARCHAR(100),
    food_license VARCHAR(100),
    
    -- Operational settings
    status restaurant_status_enum DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    accepts_orders BOOLEAN DEFAULT true,
    
    -- Delivery settings
    delivery_fee DECIMAL(8, 2) DEFAULT 0.00,
    free_delivery_threshold DECIMAL(8, 2),
    minimum_order DECIMAL(8, 2) DEFAULT 0.00,
    maximum_order DECIMAL(10, 2),
    delivery_radius_km DECIMAL(5, 2) DEFAULT 10.00,
    
    -- Timing
    preparation_time_min INTEGER DEFAULT 30,
    preparation_time_max INTEGER DEFAULT 45,
    
    -- Ratings and reviews
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    
    -- Financial
    commission_rate DECIMAL(5, 4) DEFAULT 0.15, -- 15% default commission
    
    -- Media
    logo_url TEXT,
    cover_image_url TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    
    -- SEO and discovery
    search_tags TEXT[] DEFAULT '{}',
    featured_until TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT restaurant_rating_range CHECK (rating BETWEEN 0 AND 5),
    CONSTRAINT restaurant_delivery_fee_check CHECK (delivery_fee >= 0),
    CONSTRAINT restaurant_commission_rate_check CHECK (commission_rate BETWEEN 0 AND 1),
    CONSTRAINT restaurant_preparation_time_check CHECK (preparation_time_max >= preparation_time_min)
);

-- Restaurant addresses and service areas
CREATE TABLE restaurant_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Address details
    street_address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    building_number VARCHAR(20),
    floor_number VARCHAR(10),
    landmark TEXT,
    
    -- Geolocation
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Service areas (GeoJSON polygon for complex delivery zones)
    delivery_zones JSONB,
    
    -- Operating hours
    operating_hours JSONB NOT NULL DEFAULT '{
        "monday": {"open": "09:00", "close": "23:00", "is_open": true},
        "tuesday": {"open": "09:00", "close": "23:00", "is_open": true},
        "wednesday": {"open": "09:00", "close": "23:00", "is_open": true},
        "thursday": {"open": "09:00", "close": "23:00", "is_open": true},
        "friday": {"open": "14:00", "close": "23:00", "is_open": true},
        "saturday": {"open": "09:00", "close": "23:00", "is_open": true},
        "sunday": {"open": "09:00", "close": "23:00", "is_open": true}
    }',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT restaurant_latitude_range CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT restaurant_longitude_range CHECK (longitude BETWEEN -180 AND 180)
);

-- Menu categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Category details
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    description_ar TEXT,
    
    -- Display settings
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Media
    image_url TEXT,
    
    -- Timing restrictions
    available_from TIME,
    available_until TIME,
    available_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(restaurant_id, name)
);

-- Menu items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    
    -- Basic information
    name VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200),
    description TEXT,
    description_ar TEXT,
    
    -- Pricing
    price DECIMAL(8, 2) NOT NULL,
    original_price DECIMAL(8, 2), -- For showing discounts
    cost_price DECIMAL(8, 2), -- For profit calculations
    
    -- Timing and preparation
    preparation_time INTEGER DEFAULT 15,
    
    -- Nutritional information
    calories INTEGER,
    protein_g DECIMAL(5, 2),
    carbs_g DECIMAL(5, 2),
    fat_g DECIMAL(5, 2),
    fiber_g DECIMAL(5, 2),
    sugar_g DECIMAL(5, 2),
    sodium_mg DECIMAL(7, 2),
    
    -- Ingredients and allergens
    ingredients TEXT[] DEFAULT '{}',
    allergens TEXT[] DEFAULT '{}',
    
    -- Dietary flags
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    is_halal BOOLEAN DEFAULT true,
    is_spicy BOOLEAN DEFAULT false,
    spice_level INTEGER DEFAULT 0, -- 0-5 scale
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Inventory management
    stock_quantity INTEGER,
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- Media
    image_url TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    
    -- SEO and discovery
    search_tags TEXT[] DEFAULT '{}',
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT menu_item_price_check CHECK (price > 0),
    CONSTRAINT menu_item_spice_level_check CHECK (spice_level BETWEEN 0 AND 5),
    CONSTRAINT menu_item_stock_check CHECK (stock_quantity IS NULL OR stock_quantity >= 0)
);

-- Menu item customizations (addons, size variations, etc.)
CREATE TABLE menu_item_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    
    -- Customization details
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    type VARCHAR(20) NOT NULL, -- 'addon', 'size', 'option'
    
    -- Options
    options JSONB NOT NULL, -- [{"name": "Large", "name_ar": "كبير", "price": 5.00, "calories": 100}]
    
    -- Rules
    is_required BOOLEAN DEFAULT false,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 1,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT customization_min_max_check CHECK (max_selections >= min_selections)
);
```

### **3. Order Management Schema**

```sql
-- Order status types
CREATE TYPE order_status_enum AS ENUM (
    'pending',           -- Order placed, waiting for restaurant confirmation
    'confirmed',         -- Restaurant confirmed the order
    'preparing',         -- Restaurant is preparing the food
    'ready',            -- Food is ready for pickup
    'assigned',         -- Driver assigned to order
    'picked_up',        -- Driver picked up the order
    'on_the_way',       -- Driver is delivering
    'delivered',        -- Order successfully delivered
    'cancelled',        -- Order cancelled
    'refunded'          -- Order refunded
);

CREATE TYPE payment_method_enum AS ENUM (
    'cash',
    'credit_card',
    'debit_card',
    'digital_wallet',
    'apple_pay',
    'google_pay',
    'stc_pay',
    'mada',
    'loyalty_points'
);

CREATE TYPE payment_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'partially_refunded',
    'cancelled'
);

CREATE TYPE payment_gateway_enum AS ENUM (
    'stripe',
    'mada',
    'stc_pay',
    'paypal',
    'hyperpay',
    'paytabs'
);

-- Main orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Relationships
    customer_id UUID REFERENCES customer_profiles(id),
    restaurant_id UUID REFERENCES restaurants(id),
    driver_id UUID REFERENCES driver_profiles(id),
    
    -- Order details
    status order_status_enum DEFAULT 'pending',
    order_type VARCHAR(20) DEFAULT 'delivery', -- delivery, pickup
    
    -- Pricing breakdown
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(8, 2) DEFAULT 0.00,
    service_fee DECIMAL(8, 2) DEFAULT 0.00,
    platform_fee DECIMAL(8, 2) DEFAULT 0.00,
    tax_amount DECIMAL(8, 2) DEFAULT 0.00,
    discount_amount DECIMAL(8, 2) DEFAULT 0.00,
    tip_amount DECIMAL(8, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Payment information
    payment_method payment_method_enum,
    payment_status payment_status_enum DEFAULT 'pending',
    
    -- Delivery information
    delivery_address JSONB NOT NULL,
    delivery_instructions TEXT,
    
    -- Timing
    estimated_preparation_time INTEGER, -- minutes
    estimated_delivery_time TIMESTAMP,
    confirmed_at TIMESTAMP,
    prepared_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Special requirements
    special_instructions TEXT,
    utensils_requested BOOLEAN DEFAULT true,
    contactless_delivery BOOLEAN DEFAULT false,
    
    -- Ratings and feedback
    customer_rating INTEGER,
    customer_feedback TEXT,
    restaurant_rating INTEGER,
    driver_rating INTEGER,
    
    -- Cancellation
    cancelled_by VARCHAR(20), -- customer, restaurant, driver, admin
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP,
    
    -- Commission and fees
    restaurant_commission DECIMAL(8, 2),
    driver_commission DECIMAL(8, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT order_rating_range CHECK (
        (customer_rating IS NULL OR customer_rating BETWEEN 1 AND 5) AND
        (restaurant_rating IS NULL OR restaurant_rating BETWEEN 1 AND 5) AND
        (driver_rating IS NULL OR driver_rating BETWEEN 1 AND 5)
    ),
    CONSTRAINT order_total_calculation CHECK (
        total_amount = subtotal + delivery_fee + service_fee + platform_fee + tax_amount - discount_amount + tip_amount
    )
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    
    -- Item details (snapshot at time of order)
    item_name VARCHAR(200) NOT NULL,
    item_name_ar VARCHAR(200),
    item_description TEXT,
    
    -- Pricing
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8, 2) NOT NULL,
    total_price DECIMAL(8, 2) NOT NULL,
    
    -- Customizations applied
    customizations JSONB DEFAULT '[]',
    
    -- Special instructions for this item
    special_instructions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT order_item_quantity_check CHECK (quantity > 0),
    CONSTRAINT order_item_price_check CHECK (unit_price > 0 AND total_price > 0),
    CONSTRAINT order_item_total_check CHECK (total_price = unit_price * quantity)
);

-- Order status history for tracking
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Status change details
    previous_status order_status_enum,
    new_status order_status_enum NOT NULL,
    changed_by_user_id UUID REFERENCES users(id),
    changed_by_role user_role_enum,
    
    -- Additional information
    notes TEXT,
    automated BOOLEAN DEFAULT false,
    
    -- Location when status changed (for drivers)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **4. Payment Management Schema**

```sql
-- Payment transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    
    -- Payment details
    payment_intent_id VARCHAR(255), -- Gateway payment intent ID
    transaction_id VARCHAR(255), -- Our internal transaction ID
    payment_method payment_method_enum NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    
    -- Status and processing
    status payment_status_enum DEFAULT 'pending',
    gateway payment_gateway_enum,
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Timing
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    failed_at TIMESTAMP,
    
    -- Failure handling
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Refund information
    refund_amount DECIMAL(10, 2) DEFAULT 0.00,
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    
    -- Security
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT payment_amount_check CHECK (amount > 0),
    CONSTRAINT payment_refund_check CHECK (refund_amount <= amount)
);

-- Customer payment methods
CREATE TABLE customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    
    -- Payment method details (PCI compliant - tokenized)
    payment_type payment_method_enum NOT NULL,
    gateway_token VARCHAR(255) NOT NULL, -- Tokenized card/account
    
    -- Card details (last 4 digits only)
    last_four_digits VARCHAR(4),
    brand VARCHAR(20), -- visa, mastercard, mada
    expiry_month INTEGER,
    expiry_year INTEGER,
    
    -- Digital wallet details
    wallet_email VARCHAR(255),
    wallet_phone VARCHAR(20),
    
    -- Settings
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT payment_method_expiry_check CHECK (
        (expiry_month IS NULL AND expiry_year IS NULL) OR
        (expiry_month BETWEEN 1 AND 12 AND expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE))
    )
);

-- Restaurant payout information
CREATE TABLE restaurant_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id),
    
    -- Payout period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Financial summary
    total_orders INTEGER NOT NULL,
    gross_revenue DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(8, 2) NOT NULL,
    adjustment_amount DECIMAL(8, 2) DEFAULT 0.00,
    net_payout DECIMAL(10, 2) NOT NULL,
    
    -- Payout details
    payout_method VARCHAR(20) DEFAULT 'bank_transfer',
    bank_account_id UUID,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    processed_at TIMESTAMP,
    
    -- Reference numbers
    payout_reference VARCHAR(100),
    bank_reference VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT payout_period_check CHECK (period_end >= period_start),
    CONSTRAINT payout_amounts_check CHECK (
        net_payout = gross_revenue - commission_amount - tax_amount + adjustment_amount
    )
);
```

### **5. Reviews and Ratings Schema**

```sql
-- Review types
CREATE TYPE review_type_enum AS ENUM (
    'restaurant',
    'driver',
    'order'
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    customer_id UUID REFERENCES customer_profiles(id),
    order_id UUID REFERENCES orders(id),
    restaurant_id UUID REFERENCES restaurants(id),
    driver_id UUID REFERENCES driver_profiles(id),
    
    -- Review details
    review_type review_type_enum NOT NULL,
    rating INTEGER NOT NULL,
    title VARCHAR(200),
    comment TEXT,
    
    -- Additional ratings (for restaurants)
    food_quality_rating INTEGER,
    delivery_speed_rating INTEGER,
    service_rating INTEGER,
    value_rating INTEGER,
    
    -- Media
    image_urls TEXT[] DEFAULT '{}',
    
    -- Moderation
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    
    -- Response from business
    business_response TEXT,
    business_response_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT review_additional_ratings_check CHECK (
        (food_quality_rating IS NULL OR food_quality_rating BETWEEN 1 AND 5) AND
        (delivery_speed_rating IS NULL OR delivery_speed_rating BETWEEN 1 AND 5) AND
        (service_rating IS NULL OR service_rating BETWEEN 1 AND 5) AND
        (value_rating IS NULL OR value_rating BETWEEN 1 AND 5)
    )
);

-- Review helpfulness votes
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customer_profiles(id),
    
    -- Vote details
    is_helpful BOOLEAN NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate votes
    UNIQUE(review_id, customer_id)
);
```

### **6. Notification and Communication Schema**

```sql
-- Notification types
CREATE TYPE notification_type_enum AS ENUM (
    'order_status',
    'promotion',
    'marketing',
    'system',
    'payment',
    'review',
    'driver_update'
);

CREATE TYPE notification_channel_enum AS ENUM (
    'push',
    'email',
    'sms',
    'in_app'
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipients
    user_id UUID REFERENCES users(id),
    
    -- Notification details
    type notification_type_enum NOT NULL,
    channel notification_channel_enum NOT NULL,
    title VARCHAR(200) NOT NULL,
    title_ar VARCHAR(200),
    message TEXT NOT NULL,
    message_ar TEXT,
    
    -- Delivery details
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed, read
    failure_reason TEXT,
    
    -- Metadata
    data JSONB DEFAULT '{}',
    
    -- External IDs
    push_notification_id VARCHAR(255),
    email_message_id VARCHAR(255),
    sms_message_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT notification_schedule_check CHECK (scheduled_for >= created_at)
);

-- Push notification tokens
CREATE TABLE push_notification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token details
    token VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL, -- ios, android, web
    
    -- Device information
    device_id VARCHAR(255),
    device_model VARCHAR(100),
    app_version VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate tokens
    UNIQUE(user_id, token)
);
```

## **Database Optimization and Indexing**

### **Performance Indexes**

```sql
-- Users table indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_role_status ON users(role, status);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- Customer profiles indexes
CREATE INDEX CONCURRENTLY idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX CONCURRENTLY idx_customer_profiles_tier ON customer_profiles(customer_tier);
CREATE INDEX CONCURRENTLY idx_customer_profiles_language ON customer_profiles(preferred_language);

-- Restaurant indexes
CREATE INDEX CONCURRENTLY idx_restaurants_status ON restaurants(status);
CREATE INDEX CONCURRENTLY idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX CONCURRENTLY idx_restaurants_featured ON restaurants(is_featured, rating DESC);
CREATE INDEX CONCURRENTLY idx_restaurants_rating ON restaurants(rating DESC);

-- Restaurant addresses geospatial index
CREATE INDEX CONCURRENTLY idx_restaurant_addresses_location 
ON restaurant_addresses USING gist(point(longitude, latitude));

-- Menu items indexes
CREATE INDEX CONCURRENTLY idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX CONCURRENTLY idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX CONCURRENTLY idx_menu_items_available ON menu_items(is_available);
CREATE INDEX CONCURRENTLY idx_menu_items_featured ON menu_items(is_featured, restaurant_id);

-- Orders indexes
CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id);
CREATE INDEX CONCURRENTLY idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX CONCURRENTLY idx_orders_driver_id ON orders(driver_id);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY idx_orders_restaurant_status ON orders(restaurant_id, status, created_at);

-- Order items indexes
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);
CREATE INDEX CONCURRENTLY idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Payments indexes
CREATE INDEX CONCURRENTLY idx_payments_order_id ON payments(order_id);
CREATE INDEX CONCURRENTLY idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY idx_payments_gateway ON payments(gateway, status);

-- Driver profiles indexes
CREATE INDEX CONCURRENTLY idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX CONCURRENTLY idx_driver_profiles_status ON driver_profiles(is_online, is_available);
CREATE INDEX CONCURRENTLY idx_driver_profiles_location 
ON driver_profiles USING gist(point(current_longitude, current_latitude))
WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;

-- Reviews indexes
CREATE INDEX CONCURRENTLY idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX CONCURRENTLY idx_reviews_driver_id ON reviews(driver_id);
CREATE INDEX CONCURRENTLY idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX CONCURRENTLY idx_reviews_rating ON reviews(rating);

-- Notifications indexes
CREATE INDEX CONCURRENTLY idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY idx_notifications_status ON notifications(status);
CREATE INDEX CONCURRENTLY idx_notifications_scheduled_for ON notifications(scheduled_for);
```

### **Full-Text Search Indexes**

```sql
-- Restaurant search index (Arabic and English)
CREATE INDEX CONCURRENTLY idx_restaurants_search 
ON restaurants USING gin(
    to_tsvector('arabic', COALESCE(name_ar, '')) ||
    to_tsvector('english', COALESCE(name, '')) ||
    to_tsvector('arabic', COALESCE(description_ar, '')) ||
    to_tsvector('english', COALESCE(description, ''))
);

-- Menu items search index
CREATE INDEX CONCURRENTLY idx_menu_items_search 
ON menu_items USING gin(
    to_tsvector('arabic', COALESCE(name_ar, '')) ||
    to_tsvector('english', COALESCE(name, '')) ||
    to_tsvector('arabic', COALESCE(description_ar, '')) ||
    to_tsvector('english', COALESCE(description, ''))
);
```

## **Data Migration Strategy**

### **From Mock Data to Production**

```sql
-- Migration script template
DO $$
DECLARE
    mock_restaurant RECORD;
    new_restaurant_id UUID;
    mock_menu_item RECORD;
BEGIN
    -- Migrate restaurants
    FOR mock_restaurant IN 
        SELECT * FROM mock_restaurants_data 
    LOOP
        INSERT INTO restaurants (
            name, name_ar, cuisine_type, phone, description, 
            description_ar, rating, delivery_fee, preparation_time_min
        ) VALUES (
            mock_restaurant.name,
            mock_restaurant.name_ar,
            mock_restaurant.cuisine::cuisine_type_enum,
            mock_restaurant.phone,
            mock_restaurant.description,
            mock_restaurant.description_ar,
            mock_restaurant.rating,
            mock_restaurant.delivery_fee,
            mock_restaurant.preparation_time
        ) RETURNING id INTO new_restaurant_id;
        
        -- Migrate menu items for this restaurant
        FOR mock_menu_item IN 
            SELECT * FROM mock_menu_items_data 
            WHERE restaurant_id = mock_restaurant.id
        LOOP
            INSERT INTO menu_items (
                restaurant_id, name, name_ar, description, 
                description_ar, price, preparation_time
            ) VALUES (
                new_restaurant_id,
                mock_menu_item.name,
                mock_menu_item.name_ar,
                mock_menu_item.description,
                mock_menu_item.description_ar,
                mock_menu_item.price,
                mock_menu_item.preparation_time
            );
        END LOOP;
    END LOOP;
END $$;
```

## **Cache Strategy (Redis)**

### **Cache Patterns and Keys**

```javascript
// Cache key patterns
const cacheKeys = {
  // User sessions (TTL: 24 hours)
  userSession: (userId) => `session:user:${userId}`,
  userPermissions: (userId) => `permissions:user:${userId}`,
  
  // Restaurant data (TTL: 1 hour)
  restaurant: (id) => `restaurant:${id}`,
  restaurantMenu: (id) => `restaurant:menu:${id}`,
  restaurantHours: (id) => `restaurant:hours:${id}`,
  
  // Menu items (TTL: 30 minutes)
  menuItem: (id) => `menu_item:${id}`,
  menuItemCustomizations: (id) => `menu_item:customizations:${id}`,
  
  // Search results (TTL: 15 minutes)
  searchRestaurants: (query, filters) => `search:restaurants:${query}:${btoa(JSON.stringify(filters))}`,
  searchMenu: (restaurantId, query) => `search:menu:${restaurantId}:${query}`,
  
  // Real-time data (TTL: 30 seconds)
  driverLocation: (driverId) => `driver:location:${driverId}`,
  orderTracking: (orderId) => `order:tracking:${orderId}`,
  orderStatus: (orderId) => `order:status:${orderId}`,
  
  // Analytics (TTL: 1 hour)
  restaurantStats: (restaurantId) => `stats:restaurant:${restaurantId}`,
  driverStats: (driverId) => `stats:driver:${driverId}`,
  platformMetrics: () => `stats:platform:${new Date().toISOString().split('T')[0]}`,
  
  // Recommendations (TTL: 4 hours)
  userRecommendations: (userId) => `recommendations:user:${userId}`,
  popularItems: (area) => `popular:items:${area}`,
  
  // Rate limiting
  rateLimitAPI: (ip) => `rate_limit:api:${ip}`,
  rateLimitAuth: (ip) => `rate_limit:auth:${ip}`,
  
  // Temporary data
  otpCode: (phone) => `otp:${phone}`,
  passwordReset: (token) => `password_reset:${token}`,
  emailVerification: (token) => `email_verify:${token}`
};
```

This comprehensive database schema provides the foundation for a scalable, production-ready food delivery platform that can handle complex business logic, real-time operations, and millions of users while maintaining data integrity and performance.