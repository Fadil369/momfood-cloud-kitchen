# 🔌 API Specifications - MomFood Production Platform

## **API Overview**

This document defines the complete REST API specification for the MomFood national platform, designed to support web applications, mobile apps, and third-party integrations.

## **API Design Principles**

### **RESTful Standards**
- **Resource-based URLs**: `/api/v1/restaurants/{id}`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: Consistent use of HTTP status codes
- **Content-Type**: `application/json` for all requests/responses

### **Base URL Structure**
```
Production:  https://api.momfood.sa/v1
Staging:     https://staging-api.momfood.sa/v1
Development: http://localhost:3000/api/v1
```

## **Authentication & Authorization**

### **JWT Token Structure**
```json
{
  "iss": "momfood-api",
  "sub": "user-uuid-123",
  "aud": "momfood-app", 
  "exp": 1735689600,
  "iat": 1704153600,
  "role": "customer",
  "permissions": [
    "read:profile",
    "write:orders",
    "read:restaurants"
  ],
  "session_id": "session-uuid-456"
}
```

### **Request Headers**
```javascript
{
  "Authorization": "Bearer <jwt-token>",
  "Content-Type": "application/json",
  "Accept": "application/json",
  "X-API-Version": "v1",
  "Accept-Language": "ar|en",
  "X-Request-ID": "req-uuid-123",
  "User-Agent": "MomFood-App/1.0.0 (iOS 17.0)"
}
```

### **Response Format**
```javascript
// Success Response
{
  "success": true,
  "data": {}, // or []
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-uuid-123",
  "version": "v1"
}

// Error Response  
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-uuid-123"
}

// Paginated Response
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## **Error Codes Reference**

### **HTTP Status Codes**
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/expired token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resource)
- **422**: Unprocessable Entity (business logic errors)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### **Application Error Codes**
```javascript
const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: "Invalid email or password",
  AUTH_TOKEN_EXPIRED: "Access token has expired",
  AUTH_TOKEN_INVALID: "Invalid access token",
  AUTH_INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
  
  // Validation
  VALIDATION_ERROR: "Request validation failed",
  INVALID_EMAIL_FORMAT: "Invalid email format",
  INVALID_PHONE_FORMAT: "Invalid phone number format",
  PASSWORD_TOO_WEAK: "Password does not meet requirements",
  
  // Business Logic
  RESTAURANT_NOT_OPEN: "Restaurant is currently closed",
  ITEM_OUT_OF_STOCK: "Menu item is out of stock",
  MINIMUM_ORDER_NOT_MET: "Order does not meet minimum amount",
  DELIVERY_AREA_NOT_SERVED: "Address is outside delivery area",
  
  // Payment
  PAYMENT_FAILED: "Payment processing failed",
  INSUFFICIENT_FUNDS: "Insufficient funds",
  PAYMENT_METHOD_INVALID: "Invalid payment method",
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
  
  // System
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  MAINTENANCE_MODE: "System is under maintenance"
};
```

## **API Endpoints**

### **1. Authentication API**

#### **POST /auth/register**
Register a new user account.

```yaml
summary: Register new user
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [role, email, password, firstName, lastName]
        properties:
          role:
            type: string
            enum: [customer, restaurant_owner, driver]
          email:
            type: string
            format: email
          phone:
            type: string
            pattern: "^(\\+966|0)?[5-9][0-9]{8}$"
          password:
            type: string
            minLength: 8
            description: "Must contain uppercase, lowercase, number, and special character"
          firstName:
            type: string
            minLength: 2
            maxLength: 100
          lastName:
            type: string
            minLength: 2
            maxLength: 100
          firstNameAr:
            type: string
            maxLength: 100
          lastNameAr:
            type: string
            maxLength: 100
          acceptedTerms:
            type: boolean
            const: true
responses:
  201:
    description: User registered successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                user:
                  $ref: '#/components/schemas/User'
                accessToken:
                  type: string
                refreshToken:
                  type: string
                expiresIn:
                  type: integer
  400:
    description: Validation error
  409:
    description: Email or phone already exists
```

#### **POST /auth/login**
Authenticate user and return tokens.

```yaml
summary: User login
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [password]
        properties:
          email:
            type: string
            format: email
          phone:
            type: string
          password:
            type: string
          rememberMe:
            type: boolean
            default: false
        oneOf:
          - required: [email]
          - required: [phone]
responses:
  200:
    description: Login successful
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                user:
                  $ref: '#/components/schemas/User'
                accessToken:
                  type: string
                refreshToken:
                  type: string
                expiresIn:
                  type: integer
  401:
    description: Invalid credentials
  423:
    description: Account locked
```

#### **POST /auth/refresh**
Refresh access token using refresh token.

```yaml
summary: Refresh access token
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [refreshToken]
        properties:
          refreshToken:
            type: string
responses:
  200:
    description: Token refreshed successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                accessToken:
                  type: string
                expiresIn:
                  type: integer
  401:
    description: Invalid refresh token
```

#### **POST /auth/logout**
Logout user and invalidate tokens.

```yaml
summary: User logout
security:
  - bearerAuth: []
responses:
  200:
    description: Logout successful
  401:
    description: Unauthorized
```

#### **POST /auth/forgot-password**
Initiate password reset process.

```yaml
summary: Request password reset
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        oneOf:
          - required: [email]
          - required: [phone]
        properties:
          email:
            type: string
            format: email
          phone:
            type: string
responses:
  200:
    description: Reset instructions sent
  404:
    description: User not found
  429:
    description: Too many reset requests
```

### **2. User Management API**

#### **GET /users/profile**
Get current user profile.

```yaml
summary: Get user profile
security:
  - bearerAuth: []
responses:
  200:
    description: Profile retrieved successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              $ref: '#/components/schemas/UserProfile'
  401:
    description: Unauthorized
```

#### **PUT /users/profile**
Update user profile.

```yaml
summary: Update user profile
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/UpdateUserProfile'
responses:
  200:
    description: Profile updated successfully
  400:
    description: Validation error
  401:
    description: Unauthorized
```

#### **GET /users/addresses**
Get user addresses.

```yaml
summary: Get user addresses
security:
  - bearerAuth: []
responses:
  200:
    description: Addresses retrieved successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: array
              items:
                $ref: '#/components/schemas/Address'
```

#### **POST /users/addresses**
Add new address.

```yaml
summary: Add new address
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateAddress'
responses:
  201:
    description: Address created successfully
  400:
    description: Validation error
```

### **3. Restaurant Management API**

#### **GET /restaurants**
Get list of restaurants with filtering and pagination.

```yaml
summary: Get restaurants list
parameters:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 50
      default: 20
  - name: cuisine
    in: query
    schema:
      type: string
      enum: [arabic, indian, asian, italian, american, mexican, mediterranean, fast_food, desserts, beverages]
  - name: featured
    in: query
    schema:
      type: boolean
  - name: search
    in: query
    schema:
      type: string
      minLength: 2
  - name: latitude
    in: query
    schema:
      type: number
      format: double
  - name: longitude
    in: query
    schema:
      type: number
      format: double
  - name: radius
    in: query
    schema:
      type: number
      default: 10
      description: "Search radius in kilometers"
  - name: minRating
    in: query
    schema:
      type: number
      minimum: 1
      maximum: 5
  - name: sortBy
    in: query
    schema:
      type: string
      enum: [rating, distance, deliveryTime, deliveryFee]
      default: rating
  - name: sortOrder
    in: query
    schema:
      type: string
      enum: [asc, desc]
      default: desc
responses:
  200:
    description: Restaurants retrieved successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: array
              items:
                $ref: '#/components/schemas/Restaurant'
            pagination:
              $ref: '#/components/schemas/Pagination'
```

#### **GET /restaurants/{id}**
Get restaurant details by ID.

```yaml
summary: Get restaurant details
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
responses:
  200:
    description: Restaurant details retrieved
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              $ref: '#/components/schemas/RestaurantDetails'
  404:
    description: Restaurant not found
```

#### **GET /restaurants/{id}/menu**
Get restaurant menu with categories and items.

```yaml
summary: Get restaurant menu
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
  - name: category
    in: query
    schema:
      type: string
  - name: available
    in: query
    schema:
      type: boolean
      default: true
  - name: search
    in: query
    schema:
      type: string
responses:
  200:
    description: Menu retrieved successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                restaurant:
                  $ref: '#/components/schemas/Restaurant'
                categories:
                  type: array
                  items:
                    $ref: '#/components/schemas/MenuCategory'
```

#### **POST /restaurants**
Register new restaurant (for restaurant owners).

```yaml
summary: Register new restaurant
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateRestaurant'
responses:
  201:
    description: Restaurant registered successfully
  400:
    description: Validation error
  401:
    description: Unauthorized
  403:
    description: Insufficient permissions
```

### **4. Order Management API**

#### **POST /orders**
Create new order.

```yaml
summary: Create new order
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateOrder'
responses:
  201:
    description: Order created successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              $ref: '#/components/schemas/Order'
  400:
    description: Validation error
  401:
    description: Unauthorized
  422:
    description: Business logic error (restaurant closed, minimum order not met, etc.)
```

#### **GET /orders**
Get user's orders with pagination.

```yaml
summary: Get user orders
security:
  - bearerAuth: []
parameters:
  - name: page
    in: query
    schema:
      type: integer
      default: 1
  - name: limit
    in: query
    schema:
      type: integer
      default: 20
  - name: status
    in: query
    schema:
      type: string
      enum: [pending, confirmed, preparing, ready, picked_up, delivered, cancelled]
  - name: from
    in: query
    schema:
      type: string
      format: date
  - name: to
    in: query
    schema:
      type: string
      format: date
responses:
  200:
    description: Orders retrieved successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: array
              items:
                $ref: '#/components/schemas/Order'
            pagination:
              $ref: '#/components/schemas/Pagination'
```

#### **GET /orders/{id}**
Get order details by ID.

```yaml
summary: Get order details
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
responses:
  200:
    description: Order details retrieved
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              $ref: '#/components/schemas/OrderDetails'
  404:
    description: Order not found
  403:
    description: Access denied
```

#### **PUT /orders/{id}/status**
Update order status (for restaurants and drivers).

```yaml
summary: Update order status
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [status]
        properties:
          status:
            type: string
            enum: [confirmed, preparing, ready, picked_up, delivered, cancelled]
          notes:
            type: string
          estimatedTime:
            type: integer
            description: "Estimated time in minutes"
          location:
            type: object
            properties:
              latitude:
                type: number
              longitude:
                type: number
responses:
  200:
    description: Order status updated
  400:
    description: Invalid status transition
  401:
    description: Unauthorized
  403:
    description: Insufficient permissions
  404:
    description: Order not found
```

#### **POST /orders/{id}/cancel**
Cancel order.

```yaml
summary: Cancel order
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [reason]
        properties:
          reason:
            type: string
            minLength: 10
            maxLength: 500
responses:
  200:
    description: Order cancelled successfully
  400:
    description: Order cannot be cancelled
  404:
    description: Order not found
```

### **5. Payment API**

#### **POST /payments/intent**
Create payment intent.

```yaml
summary: Create payment intent
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [orderId, paymentMethod]
        properties:
          orderId:
            type: string
            format: uuid
          paymentMethod:
            type: string
            enum: [credit_card, debit_card, digital_wallet, apple_pay, google_pay, stc_pay]
          paymentMethodId:
            type: string
            description: "Saved payment method ID"
          savePaymentMethod:
            type: boolean
            default: false
responses:
  200:
    description: Payment intent created
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                paymentIntentId:
                  type: string
                clientSecret:
                  type: string
                amount:
                  type: number
                currency:
                  type: string
                  default: SAR
  400:
    description: Invalid payment details
  404:
    description: Order not found
```

#### **POST /payments/confirm**
Confirm payment.

```yaml
summary: Confirm payment
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [paymentIntentId]
        properties:
          paymentIntentId:
            type: string
          paymentMethodDetails:
            type: object
responses:
  200:
    description: Payment confirmed
  400:
    description: Payment failed
  404:
    description: Payment intent not found
```

#### **GET /payments/methods**
Get saved payment methods.

```yaml
summary: Get payment methods
security:
  - bearerAuth: []
responses:
  200:
    description: Payment methods retrieved
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: array
              items:
                $ref: '#/components/schemas/PaymentMethod'
```

### **6. AI & Recommendations API**

#### **GET /ai/recommendations/{userId}**
Get personalized recommendations for user.

```yaml
summary: Get AI recommendations
security:
  - bearerAuth: []
parameters:
  - name: userId
    in: path
    required: true
    schema:
      type: string
      format: uuid
  - name: type
    in: query
    schema:
      type: string
      enum: [restaurants, menu_items, cuisine]
      default: restaurants
  - name: limit
    in: query
    schema:
      type: integer
      default: 10
  - name: context
    in: query
    schema:
      type: string
      enum: [home, work, current_location]
responses:
  200:
    description: Recommendations retrieved
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                recommendations:
                  type: array
                  items:
                    $ref: '#/components/schemas/Recommendation'
                confidence:
                  type: number
                  description: "Recommendation confidence score"
                reason:
                  type: string
                  description: "Reason for recommendation"
```

#### **POST /ai/feedback**
Submit feedback for recommendations to improve AI.

```yaml
summary: Submit recommendation feedback
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [recommendationId, feedback]
        properties:
          recommendationId:
            type: string
          feedback:
            type: string
            enum: [helpful, not_helpful, irrelevant]
          reason:
            type: string
responses:
  200:
    description: Feedback submitted
```

### **7. Real-time Tracking API**

#### **GET /tracking/order/{orderId}**
Get real-time order tracking information.

```yaml
summary: Get order tracking
security:
  - bearerAuth: []
parameters:
  - name: orderId
    in: path
    required: true
    schema:
      type: string
      format: uuid
responses:
  200:
    description: Tracking information retrieved
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              $ref: '#/components/schemas/OrderTracking'
  404:
    description: Order not found
```

#### **POST /tracking/driver/location**
Update driver location (for drivers only).

```yaml
summary: Update driver location
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [latitude, longitude]
        properties:
          latitude:
            type: number
            format: double
          longitude:
            type: number
            format: double
          accuracy:
            type: number
            description: "GPS accuracy in meters"
          heading:
            type: number
            description: "Direction in degrees"
          speed:
            type: number
            description: "Speed in km/h"
responses:
  200:
    description: Location updated
  401:
    description: Unauthorized
  403:
    description: Driver access required
```

### **8. Search API**

#### **GET /search/restaurants**
Search restaurants with advanced filters.

```yaml
summary: Search restaurants
parameters:
  - name: q
    in: query
    required: true
    schema:
      type: string
      minLength: 2
      description: "Search query"
  - name: location
    in: query
    schema:
      type: string
      description: "latitude,longitude"
  - name: radius
    in: query
    schema:
      type: number
      default: 10
  - name: cuisine
    in: query
    schema:
      type: array
      items:
        type: string
  - name: minRating
    in: query
    schema:
      type: number
  - name: maxDeliveryFee
    in: query
    schema:
      type: number
  - name: fastDelivery
    in: query
    schema:
      type: boolean
  - name: openNow
    in: query
    schema:
      type: boolean
responses:
  200:
    description: Search results
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                restaurants:
                  type: array
                  items:
                    $ref: '#/components/schemas/Restaurant'
                suggestions:
                  type: array
                  items:
                    type: string
                filters:
                  type: object
                  description: "Available filter options"
```

#### **GET /search/menu**
Search menu items across restaurants.

```yaml
summary: Search menu items
parameters:
  - name: q
    in: query
    required: true
    schema:
      type: string
      minLength: 2
  - name: location
    in: query
    schema:
      type: string
  - name: dietary
    in: query
    schema:
      type: array
      items:
        type: string
        enum: [vegetarian, vegan, gluten_free, halal]
  - name: maxPrice
    in: query
    schema:
      type: number
responses:
  200:
    description: Menu search results
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: array
              items:
                $ref: '#/components/schemas/MenuItemSearchResult'
```

## **Data Models**

### **User Models**

```yaml
User:
  type: object
  properties:
    id:
      type: string
      format: uuid
    email:
      type: string
      format: email
    phone:
      type: string
    role:
      type: string
      enum: [customer, restaurant_owner, driver, admin]
    status:
      type: string
      enum: [active, inactive, suspended, pending_verification]
    emailVerified:
      type: boolean
    phoneVerified:
      type: boolean
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time

UserProfile:
  type: object
  properties:
    user:
      $ref: '#/components/schemas/User'
    profile:
      oneOf:
        - $ref: '#/components/schemas/CustomerProfile'
        - $ref: '#/components/schemas/DriverProfile'
        - $ref: '#/components/schemas/RestaurantOwnerProfile'

CustomerProfile:
  type: object
  properties:
    id:
      type: string
      format: uuid
    firstName:
      type: string
    lastName:
      type: string
    firstNameAr:
      type: string
    lastNameAr:
      type: string
    birthDate:
      type: string
      format: date
    gender:
      type: string
      enum: [male, female, other, prefer_not_to_say]
    preferredLanguage:
      type: string
      enum: [ar, en]
    dietaryPreferences:
      type: array
      items:
        type: string
    foodAllergies:
      type: array
      items:
        type: string
    loyaltyPoints:
      type: integer
    customerTier:
      type: string
      enum: [bronze, silver, gold, platinum]
    addresses:
      type: array
      items:
        $ref: '#/components/schemas/Address'

Address:
  type: object
  properties:
    id:
      type: string
      format: uuid
    title:
      type: string
    streetAddress:
      type: string
    area:
      type: string
    city:
      type: string
    district:
      type: string
    buildingNumber:
      type: string
    floorNumber:
      type: string
    apartmentNumber:
      type: string
    latitude:
      type: number
      format: double
    longitude:
      type: number
      format: double
    isDefault:
      type: boolean
    isVerified:
      type: boolean
```

### **Restaurant Models**

```yaml
Restaurant:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    nameAr:
      type: string
    description:
      type: string
    descriptionAr:
      type: string
    cuisineType:
      type: string
      enum: [arabic, indian, asian, italian, american, mexican, mediterranean, fast_food, desserts, beverages]
    rating:
      type: number
      minimum: 0
      maximum: 5
    totalReviews:
      type: integer
    deliveryFee:
      type: number
    minimumOrder:
      type: number
    preparationTime:
      type: object
      properties:
        min:
          type: integer
        max:
          type: integer
    isOpen:
      type: boolean
    isFeatured:
      type: boolean
    logoUrl:
      type: string
    coverImageUrl:
      type: string
    address:
      $ref: '#/components/schemas/RestaurantAddress'
    operatingHours:
      type: object
      additionalProperties:
        type: object
        properties:
          open:
            type: string
            format: time
          close:
            type: string
            format: time
          isOpen:
            type: boolean

RestaurantAddress:
  type: object
  properties:
    streetAddress:
      type: string
    area:
      type: string
    city:
      type: string
    latitude:
      type: number
    longitude:
      type: number
    deliveryRadius:
      type: number

MenuCategory:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    nameAr:
      type: string
    description:
      type: string
    displayOrder:
      type: integer
    imageUrl:
      type: string
    items:
      type: array
      items:
        $ref: '#/components/schemas/MenuItem'

MenuItem:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    nameAr:
      type: string
    description:
      type: string
    descriptionAr:
      type: string
    price:
      type: number
    originalPrice:
      type: number
    preparationTime:
      type: integer
    calories:
      type: integer
    ingredients:
      type: array
      items:
        type: string
    allergens:
      type: array
      items:
        type: string
    isVegetarian:
      type: boolean
    isVegan:
      type: boolean
    isGlutenFree:
      type: boolean
    isHalal:
      type: boolean
    spiceLevel:
      type: integer
      minimum: 0
      maximum: 5
    isAvailable:
      type: boolean
    imageUrl:
      type: string
    customizations:
      type: array
      items:
        $ref: '#/components/schemas/MenuItemCustomization'

MenuItemCustomization:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    nameAr:
      type: string
    type:
      type: string
      enum: [addon, size, option]
    isRequired:
      type: boolean
    minSelections:
      type: integer
    maxSelections:
      type: integer
    options:
      type: array
      items:
        type: object
        properties:
          id:
            type: string
          name:
            type: string
          nameAr:
            type: string
          price:
            type: number
          calories:
            type: integer
```

### **Order Models**

```yaml
Order:
  type: object
  properties:
    id:
      type: string
      format: uuid
    orderNumber:
      type: string
    status:
      type: string
      enum: [pending, confirmed, preparing, ready, picked_up, delivered, cancelled]
    customer:
      $ref: '#/components/schemas/CustomerSummary'
    restaurant:
      $ref: '#/components/schemas/RestaurantSummary'
    driver:
      $ref: '#/components/schemas/DriverSummary'
    items:
      type: array
      items:
        $ref: '#/components/schemas/OrderItem'
    pricing:
      $ref: '#/components/schemas/OrderPricing'
    deliveryAddress:
      $ref: '#/components/schemas/Address'
    specialInstructions:
      type: string
    estimatedDeliveryTime:
      type: string
      format: date-time
    tracking:
      $ref: '#/components/schemas/OrderTracking'
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time

OrderItem:
  type: object
  properties:
    id:
      type: string
      format: uuid
    menuItemId:
      type: string
      format: uuid
    name:
      type: string
    nameAr:
      type: string
    quantity:
      type: integer
    unitPrice:
      type: number
    totalPrice:
      type: number
    customizations:
      type: array
      items:
        type: object
        properties:
          name:
            type: string
          options:
            type: array
            items:
              type: string
          additionalPrice:
            type: number

OrderPricing:
  type: object
  properties:
    subtotal:
      type: number
    deliveryFee:
      type: number
    serviceFee:
      type: number
    taxAmount:
      type: number
    discountAmount:
      type: number
    tipAmount:
      type: number
    totalAmount:
      type: number

OrderTracking:
  type: object
  properties:
    currentStatus:
      type: string
    statusHistory:
      type: array
      items:
        type: object
        properties:
          status:
            type: string
          timestamp:
            type: string
            format: date-time
          notes:
            type: string
    driverLocation:
      type: object
      properties:
        latitude:
          type: number
        longitude:
          type: number
        lastUpdated:
          type: string
          format: date-time
    estimatedArrival:
      type: string
      format: date-time
```

### **Payment Models**

```yaml
PaymentMethod:
  type: object
  properties:
    id:
      type: string
      format: uuid
    type:
      type: string
      enum: [credit_card, debit_card, digital_wallet, apple_pay, google_pay]
    lastFourDigits:
      type: string
    brand:
      type: string
    expiryMonth:
      type: integer
    expiryYear:
      type: integer
    isDefault:
      type: boolean
    isVerified:
      type: boolean
```

## **Rate Limiting**

### **Rate Limit Headers**
```javascript
{
  "X-RateLimit-Limit": "1000",
  "X-RateLimit-Remaining": "999",
  "X-RateLimit-Reset": "1640995200",
  "X-RateLimit-Window": "3600"
}
```

### **Rate Limiting Rules**
- **General API**: 1000 requests per hour per IP
- **Authentication**: 10 attempts per 15 minutes per IP
- **Search**: 100 requests per minute per user
- **Location Updates**: 60 requests per minute per driver
- **Order Creation**: 10 orders per hour per customer

## **Webhook Events**

### **Order Events**
```javascript
// Order status changed
{
  "event": "order.status_changed",
  "data": {
    "orderId": "uuid",
    "previousStatus": "preparing",
    "newStatus": "ready",
    "timestamp": "2024-01-15T10:30:00Z",
    "restaurant": {...},
    "customer": {...}
  }
}

// Payment completed
{
  "event": "payment.completed",
  "data": {
    "paymentId": "uuid",
    "orderId": "uuid",
    "amount": 75.50,
    "currency": "SAR",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## **API Versioning Strategy**

### **Version Header**
```javascript
{
  "X-API-Version": "v1",
  "Accept": "application/vnd.momfood.v1+json"
}
```

### **Deprecation Notice**
```javascript
{
  "X-API-Deprecation": "true",
  "X-API-Sunset": "2024-12-31T23:59:59Z",
  "Link": "<https://api.momfood.sa/v2>; rel=\"successor-version\""
}
```

This comprehensive API specification provides the foundation for building a scalable, production-ready food delivery platform with proper authentication, error handling, and real-time capabilities.