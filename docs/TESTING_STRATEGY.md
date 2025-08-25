# 🧪 Testing Strategy - MomFood Production Platform

## **Testing Strategy Overview**

This document outlines the comprehensive testing strategy for ensuring the MomFood platform meets production-grade quality, performance, and reliability standards.

## **Testing Pyramid Architecture**

```
                    E2E Tests (5%)
                   ┌─────────────────┐
                  │   UI, Integration │
                 └─────────────────────┘
               
            Integration Tests (25%)
           ┌─────────────────────────────┐
          │    API, Database, Services    │
         └─────────────────────────────────┘
         
      Unit Tests (70%)
    ┌─────────────────────────────────────┐
   │     Functions, Components, Models     │
  └─────────────────────────────────────────┘
```

## **1. Unit Testing Strategy**

### **Frontend Unit Tests (React/TypeScript)**

```typescript
// Example: Menu item component test
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuItem } from '@/components/menu/MenuItem';

describe('MenuItem Component', () => {
  const mockItem = {
    id: '1',
    name: 'Margherita Pizza',
    nameAr: 'بيتزا مارجريتا',
    description: 'Fresh tomatoes, mozzarella, basil',
    price: 45.00,
    image: '/images/pizza.jpg',
    isAvailable: true,
    preparationTime: 15
  };

  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders menu item with correct information', () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);
    
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('45.00 SAR')).toBeInTheDocument();
    expect(screen.getByText('Fresh tomatoes, mozzarella, basil')).toBeInTheDocument();
  });

  test('calls onAddToCart when add button is clicked', () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);
    
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockItem);
  });

  test('disables add button when item is unavailable', () => {
    const unavailableItem = { ...mockItem, isAvailable: false };
    render(<MenuItem item={unavailableItem} onAddToCart={mockOnAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addButton).toBeDisabled();
  });

  test('displays Arabic name when language is Arabic', () => {
    render(
      <MenuItem 
        item={mockItem} 
        onAddToCart={mockOnAddToCart} 
        language="ar" 
      />
    );
    
    expect(screen.getByText('بيتزا مارجريتا')).toBeInTheDocument();
  });
});
```

### **Backend Unit Tests (Node.js/Express)**

```typescript
// Example: Order service unit test
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { PaymentService } from '@/services/PaymentService';
import { NotificationService } from '@/services/NotificationService';

jest.mock('@/repositories/OrderRepository');
jest.mock('@/services/PaymentService');
jest.mock('@/services/NotificationService');

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockOrderRepository = new OrderRepository() as jest.Mocked<OrderRepository>;
    mockPaymentService = new PaymentService() as jest.Mocked<PaymentService>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;
    
    orderService = new OrderService(
      mockOrderRepository,
      mockPaymentService,
      mockNotificationService
    );
  });

  describe('createOrder', () => {
    const orderData = {
      customerId: 'customer-1',
      restaurantId: 'restaurant-1',
      items: [
        {
          menuItemId: 'item-1',
          quantity: 2,
          price: 25.00,
          customizations: []
        }
      ],
      deliveryAddress: {
        street: '123 Main St',
        city: 'Riyadh',
        coordinates: { lat: 24.7136, lng: 46.6753 }
      },
      paymentMethodId: 'payment-method-1'
    };

    test('creates order successfully with valid data', async () => {
      const expectedOrder = {
        id: 'order-1',
        ...orderData,
        status: 'pending',
        total: 50.00,
        createdAt: new Date()
      };

      mockOrderRepository.create.mockResolvedValue(expectedOrder);
      mockPaymentService.createPaymentIntent.mockResolvedValue({
        id: 'payment-intent-1',
        clientSecret: 'pi_test_1234'
      });

      const result = await orderService.createOrder(orderData);

      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: orderData.customerId,
          restaurantId: orderData.restaurantId,
          status: 'pending'
        })
      );
      expect(result).toEqual(expectedOrder);
    });

    test('throws error when restaurant is closed', async () => {
      mockOrderRepository.getRestaurantStatus.mockResolvedValue(false);

      await expect(orderService.createOrder(orderData))
        .rejects
        .toThrow('Restaurant is currently closed');
    });

    test('validates minimum order amount', async () => {
      const invalidOrderData = {
        ...orderData,
        items: [{
          menuItemId: 'item-1',
          quantity: 1,
          price: 5.00,
          customizations: []
        }]
      };

      mockOrderRepository.getRestaurantMinimumOrder.mockResolvedValue(20.00);

      await expect(orderService.createOrder(invalidOrderData))
        .rejects
        .toThrow('Order does not meet minimum amount');
    });
  });

  describe('updateOrderStatus', () => {
    test('updates order status and sends notifications', async () => {
      const orderId = 'order-1';
      const newStatus = 'confirmed';
      const estimatedTime = 30;

      const updatedOrder = {
        id: orderId,
        status: newStatus,
        estimatedDeliveryTime: new Date(Date.now() + estimatedTime * 60000)
      };

      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrderStatus(
        orderId, 
        newStatus, 
        { estimatedTime }
      );

      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        orderId, 
        newStatus, 
        expect.any(Object)
      );
      expect(mockNotificationService.sendOrderStatusUpdate).toHaveBeenCalledWith(
        updatedOrder
      );
      expect(result).toEqual(updatedOrder);
    });
  });
});
```

### **Database Model Tests**

```typescript
// Example: User model validation tests
import { User } from '@/models/User';
import { ValidationError } from '@/errors/ValidationError';

describe('User Model', () => {
  describe('validation', () => {
    test('validates required fields', () => {
      expect(() => new User({})).toThrow(ValidationError);
      expect(() => new User({ email: 'test@example.com' })).toThrow('Role is required');
    });

    test('validates email format', () => {
      expect(() => new User({
        email: 'invalid-email',
        role: 'customer'
      })).toThrow('Invalid email format');
    });

    test('validates phone number format', () => {
      expect(() => new User({
        email: 'test@example.com',
        phone: '123456',
        role: 'customer'
      })).toThrow('Invalid phone number format');
    });

    test('creates valid user', () => {
      const userData = {
        email: 'test@example.com',
        phone: '+966501234567',
        role: 'customer',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      expect(user.email).toBe(userData.email);
      expect(user.phone).toBe(userData.phone);
      expect(user.role).toBe(userData.role);
    });
  });

  describe('methods', () => {
    test('generates full name correctly', () => {
      const user = new User({
        email: 'test@example.com',
        role: 'customer',
        firstName: 'Ahmed',
        lastName: 'Mohammed'
      });

      expect(user.getFullName()).toBe('Ahmed Mohammed');
    });

    test('checks permissions correctly', () => {
      const customerUser = new User({
        email: 'customer@example.com',
        role: 'customer'
      });

      const adminUser = new User({
        email: 'admin@example.com',
        role: 'admin'
      });

      expect(customerUser.hasPermission('read:profile')).toBe(true);
      expect(customerUser.hasPermission('admin:users')).toBe(false);
      expect(adminUser.hasPermission('admin:users')).toBe(true);
    });
  });
});
```

## **2. Integration Testing Strategy**

### **API Integration Tests**

```typescript
// Example: Restaurant API integration test
import request from 'supertest';
import app from '@/app';
import { setupTestDatabase, cleanupTestDatabase } from '@/test/helpers/database';
import { createTestUser, createTestRestaurant } from '@/test/factories';

describe('Restaurant API Integration', () => {
  let authToken: string;
  let restaurantOwner: any;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    restaurantOwner = await createTestUser({ role: 'restaurant_owner' });
    authToken = generateTestToken(restaurantOwner);
  });

  describe('POST /api/restaurants', () => {
    const restaurantData = {
      name: 'Test Restaurant',
      nameAr: 'مطعم تجريبي',
      cuisineType: 'arabic',
      phone: '+966501234567',
      email: 'restaurant@test.com',
      address: {
        street: '123 Test St',
        city: 'Riyadh',
        latitude: 24.7136,
        longitude: 46.6753
      }
    };

    test('creates restaurant successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(restaurantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: restaurantData.name,
        nameAr: restaurantData.nameAr,
        status: 'pending'
      });
      expect(response.body.data.id).toBeDefined();
    });

    test('returns 400 for invalid data', async () => {
      const invalidData = { ...restaurantData };
      delete invalidData.name;

      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 401 for unauthenticated request', async () => {
      await request(app)
        .post('/api/restaurants')
        .send(restaurantData)
        .expect(401);
    });

    test('returns 403 for insufficient permissions', async () => {
      const customer = await createTestUser({ role: 'customer' });
      const customerToken = generateTestToken(customer);

      await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(restaurantData)
        .expect(403);
    });
  });

  describe('GET /api/restaurants', () => {
    beforeEach(async () => {
      // Create test restaurants
      await createTestRestaurant({ name: 'Restaurant 1', cuisineType: 'arabic' });
      await createTestRestaurant({ name: 'Restaurant 2', cuisineType: 'italian' });
      await createTestRestaurant({ name: 'Restaurant 3', cuisineType: 'asian' });
    });

    test('returns paginated restaurants list', async () => {
      const response = await request(app)
        .get('/api/restaurants?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        hasNext: true,
        hasPrev: false
      });
    });

    test('filters restaurants by cuisine type', async () => {
      const response = await request(app)
        .get('/api/restaurants?cuisine=arabic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].cuisineType).toBe('arabic');
    });

    test('searches restaurants by name', async () => {
      const response = await request(app)
        .get('/api/restaurants?search=Restaurant 1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Restaurant 1');
    });
  });
});
```

### **Database Integration Tests**

```typescript
// Example: Order repository integration test
import { OrderRepository } from '@/repositories/OrderRepository';
import { setupTestDatabase, cleanupTestDatabase } from '@/test/helpers/database';
import { createTestCustomer, createTestRestaurant, createTestMenuItem } from '@/test/factories';

describe('OrderRepository Integration', () => {
  let orderRepository: OrderRepository;
  let customer: any;
  let restaurant: any;
  let menuItem: any;

  beforeAll(async () => {
    await setupTestDatabase();
    orderRepository = new OrderRepository();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    customer = await createTestCustomer();
    restaurant = await createTestRestaurant();
    menuItem = await createTestMenuItem({ restaurantId: restaurant.id });
  });

  describe('create order', () => {
    test('creates order with correct data', async () => {
      const orderData = {
        customerId: customer.id,
        restaurantId: restaurant.id,
        items: [{
          menuItemId: menuItem.id,
          quantity: 2,
          unitPrice: menuItem.price,
          totalPrice: menuItem.price * 2
        }],
        subtotal: menuItem.price * 2,
        deliveryFee: 10.00,
        totalAmount: (menuItem.price * 2) + 10.00,
        deliveryAddress: {
          street: '123 Test St',
          city: 'Riyadh',
          coordinates: { lat: 24.7136, lng: 46.6753 }
        }
      };

      const order = await orderRepository.create(orderData);

      expect(order.id).toBeDefined();
      expect(order.customerId).toBe(customer.id);
      expect(order.restaurantId).toBe(restaurant.id);
      expect(order.status).toBe('pending');
      expect(order.totalAmount).toBe(orderData.totalAmount);
    });

    test('enforces foreign key constraints', async () => {
      const invalidOrderData = {
        customerId: 'invalid-customer-id',
        restaurantId: restaurant.id,
        items: [],
        subtotal: 50.00,
        totalAmount: 60.00
      };

      await expect(orderRepository.create(invalidOrderData))
        .rejects
        .toThrow('Foreign key constraint violation');
    });
  });

  describe('query orders', () => {
    beforeEach(async () => {
      // Create test orders
      await orderRepository.create({
        customerId: customer.id,
        restaurantId: restaurant.id,
        status: 'pending',
        items: [],
        subtotal: 50.00,
        totalAmount: 60.00
      });

      await orderRepository.create({
        customerId: customer.id,
        restaurantId: restaurant.id,
        status: 'delivered',
        items: [],
        subtotal: 30.00,
        totalAmount: 40.00
      });
    });

    test('finds orders by customer', async () => {
      const orders = await orderRepository.findByCustomer(customer.id);
      
      expect(orders).toHaveLength(2);
      expect(orders.every(order => order.customerId === customer.id)).toBe(true);
    });

    test('filters orders by status', async () => {
      const pendingOrders = await orderRepository.findByCustomer(
        customer.id, 
        { status: 'pending' }
      );
      
      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].status).toBe('pending');
    });

    test('orders by creation date', async () => {
      const orders = await orderRepository.findByCustomer(
        customer.id,
        { orderBy: 'created_at', direction: 'DESC' }
      );
      
      expect(orders[0].createdAt >= orders[1].createdAt).toBe(true);
    });
  });
});
```

## **3. End-to-End (E2E) Testing Strategy**

### **Customer Journey E2E Tests**

```typescript
// Example: Complete order flow E2E test using Playwright
import { test, expect } from '@playwright/test';
import { setupTestData, cleanupTestData } from '@/test/helpers/e2e-setup';

test.describe('Customer Order Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestData();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('complete order flow from search to delivery', async ({ page }) => {
    // Step 1: Search for restaurants
    await page.fill('[data-testid=search-input]', 'pizza');
    await page.click('[data-testid=search-button]');
    
    // Verify search results
    await expect(page.locator('[data-testid=restaurant-card]')).toHaveCount(3);
    
    // Step 2: Select restaurant
    await page.click('[data-testid=restaurant-card]:first-child');
    
    // Verify restaurant page
    await expect(page.locator('[data-testid=restaurant-name]')).toBeVisible();
    await expect(page.locator('[data-testid=menu-category]')).toHaveCount.gte(1);
    
    // Step 3: Add items to cart
    await page.click('[data-testid=menu-item]:first-child [data-testid=add-to-cart]');
    await page.click('[data-testid=menu-item]:nth-child(2) [data-testid=add-to-cart]');
    
    // Verify cart updates
    await expect(page.locator('[data-testid=cart-item]')).toHaveCount(2);
    
    // Step 4: Proceed to checkout
    await page.click('[data-testid=checkout-button]');
    
    // Step 5: Fill delivery information
    await page.fill('[data-testid=delivery-street]', '123 Test Street');
    await page.fill('[data-testid=delivery-city]', 'Riyadh');
    await page.fill('[data-testid=delivery-phone]', '+966501234567');
    
    // Step 6: Select payment method
    await page.click('[data-testid=payment-method-card]');
    await page.fill('[data-testid=card-number]', '4242424242424242');
    await page.fill('[data-testid=card-expiry]', '12/25');
    await page.fill('[data-testid=card-cvc]', '123');
    
    // Step 7: Place order
    await page.click('[data-testid=place-order-button]');
    
    // Verify order confirmation
    await expect(page.locator('[data-testid=order-confirmation]')).toBeVisible();
    await expect(page.locator('[data-testid=order-number]')).toContainText(/ORD-\d+/);
    
    // Step 8: Track order
    const orderNumber = await page.locator('[data-testid=order-number]').textContent();
    await page.click('[data-testid=track-order-button]');
    
    // Verify tracking page
    await expect(page.locator('[data-testid=order-status]')).toContainText('Order Confirmed');
    await expect(page.locator('[data-testid=tracking-map]')).toBeVisible();
  });

  test('handles out of stock items gracefully', async ({ page }) => {
    // Navigate to restaurant with out of stock items
    await page.goto('/restaurant/test-restaurant-id');
    
    // Try to add out of stock item
    await page.click('[data-testid=menu-item][data-availability=false] [data-testid=add-to-cart]');
    
    // Verify error message
    await expect(page.locator('[data-testid=error-message]'))
      .toContainText('This item is currently out of stock');
    
    // Verify item was not added to cart
    await expect(page.locator('[data-testid=cart-item]')).toHaveCount(0);
  });

  test('validates delivery address', async ({ page }) => {
    // Add item to cart
    await page.goto('/restaurant/test-restaurant-id');
    await page.click('[data-testid=menu-item]:first-child [data-testid=add-to-cart]');
    await page.click('[data-testid=checkout-button]');
    
    // Try to proceed without valid address
    await page.click('[data-testid=place-order-button]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid=field-error-street]'))
      .toContainText('Street address is required');
    await expect(page.locator('[data-testid=field-error-city]'))
      .toContainText('City is required');
  });
});
```

### **Restaurant Dashboard E2E Tests**

```typescript
test.describe('Restaurant Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRestaurantOwner(page);
    await page.goto('/restaurant/dashboard');
  });

  test('manages menu items', async ({ page }) => {
    // Navigate to menu management
    await page.click('[data-testid=menu-management-tab]');
    
    // Add new menu item
    await page.click('[data-testid=add-menu-item-button]');
    await page.fill('[data-testid=item-name]', 'Test Pizza');
    await page.fill('[data-testid=item-name-ar]', 'بيتزا تجريبية');
    await page.fill('[data-testid=item-description]', 'Delicious test pizza');
    await page.fill('[data-testid=item-price]', '35.00');
    await page.selectOption('[data-testid=item-category]', 'main-course');
    
    // Upload image
    await page.setInputFiles('[data-testid=item-image]', 'test-files/pizza.jpg');
    
    // Save item
    await page.click('[data-testid=save-item-button]');
    
    // Verify item appears in menu
    await expect(page.locator('[data-testid=menu-item-name]'))
      .toContainText('Test Pizza');
    
    // Edit item
    await page.click('[data-testid=edit-item-button]:last-child');
    await page.fill('[data-testid=item-price]', '40.00');
    await page.click('[data-testid=save-item-button]');
    
    // Verify price update
    await expect(page.locator('[data-testid=menu-item-price]:last-child'))
      .toContainText('40.00');
  });

  test('processes incoming orders', async ({ page }) => {
    // Create test order via API
    await createTestOrder();
    
    // Refresh dashboard
    await page.reload();
    
    // Verify new order appears
    await expect(page.locator('[data-testid=pending-order]')).toHaveCount.gte(1);
    
    // Accept order
    await page.click('[data-testid=accept-order-button]:first-child');
    
    // Verify status update
    await expect(page.locator('[data-testid=order-status]:first-child'))
      .toContainText('Confirmed');
    
    // Update to preparing
    await page.click('[data-testid=start-preparing-button]:first-child');
    
    // Verify status update
    await expect(page.locator('[data-testid=order-status]:first-child'))
      .toContainText('Preparing');
    
    // Mark as ready
    await page.click('[data-testid=mark-ready-button]:first-child');
    
    // Verify status update
    await expect(page.locator('[data-testid=order-status]:first-child'))
      .toContainText('Ready for Pickup');
  });
});
```

## **4. Performance Testing Strategy**

### **Load Testing with Artillery**

```yaml
# artillery-config.yml
config:
  target: 'https://api.momfood.sa'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 600
      arrivalRate: 100
      name: "Sustained load"
    - duration: 300
      arrivalRate: 200
      name: "Peak load"

scenarios:
  - name: "User journey - Browse and order"
    weight: 70
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "{{ $randomEmail() }}"
            password: "testpassword"
          capture:
            - json: "$.data.accessToken"
              as: "authToken"
      
      - get:
          url: "/restaurants"
          headers:
            Authorization: "Bearer {{ authToken }}"
          
      - get:
          url: "/restaurants/{{ $randomRestaurantId() }}/menu"
          headers:
            Authorization: "Bearer {{ authToken }}"
            
      - post:
          url: "/orders"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            restaurantId: "{{ $randomRestaurantId() }}"
            items: [
              {
                menuItemId: "{{ $randomMenuItemId() }}",
                quantity: 2
              }
            ]
            deliveryAddress:
              street: "123 Test St"
              city: "Riyadh"

  - name: "Restaurant dashboard"
    weight: 20
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "restaurant@test.com"
            password: "testpassword"
          capture:
            - json: "$.data.accessToken"
              as: "authToken"
      
      - get:
          url: "/restaurants/dashboard/orders"
          headers:
            Authorization: "Bearer {{ authToken }}"
            
      - put:
          url: "/orders/{{ $randomOrderId() }}/status"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            status: "confirmed"

  - name: "Driver tracking"
    weight: 10
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "driver@test.com"
            password: "testpassword"
          capture:
            - json: "$.data.accessToken"
              as: "authToken"
      
      - post:
          url: "/tracking/driver/location"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            latitude: "{{ $randomLat() }}"
            longitude: "{{ $randomLng() }}"
```

### **Database Performance Tests**

```typescript
// Database performance test suite
import { performance } from 'perf_hooks';
import { OrderRepository } from '@/repositories/OrderRepository';
import { generateTestOrders } from '@/test/helpers/data-generators';

describe('Database Performance Tests', () => {
  let orderRepository: OrderRepository;

  beforeAll(async () => {
    await setupPerformanceTestDatabase();
    orderRepository = new OrderRepository();
    
    // Generate large dataset
    await generateTestOrders(100000);
  });

  test('order queries perform within acceptable limits', async () => {
    const testCases = [
      {
        name: 'Find orders by customer',
        query: () => orderRepository.findByCustomer('customer-1'),
        maxTime: 100 // milliseconds
      },
      {
        name: 'Find orders by restaurant with pagination',
        query: () => orderRepository.findByRestaurant('restaurant-1', { page: 1, limit: 20 }),
        maxTime: 150
      },
      {
        name: 'Search orders with filters',
        query: () => orderRepository.search({
          status: 'delivered',
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
          restaurantId: 'restaurant-1'
        }),
        maxTime: 200
      }
    ];

    for (const testCase of testCases) {
      const startTime = performance.now();
      await testCase.query();
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`${testCase.name}: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(testCase.maxTime);
    }
  });

  test('concurrent order creation handles load', async () => {
    const concurrentOrders = 100;
    const orderPromises = [];

    const startTime = performance.now();
    
    for (let i = 0; i < concurrentOrders; i++) {
      const orderData = generateTestOrderData();
      orderPromises.push(orderRepository.create(orderData));
    }

    await Promise.all(orderPromises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / concurrentOrders;

    console.log(`Created ${concurrentOrders} orders in ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per order: ${averageTime.toFixed(2)}ms`);

    expect(averageTime).toBeLessThan(50); // 50ms per order
    expect(totalTime).toBeLessThan(5000); // Total under 5 seconds
  });
});
```

## **5. Security Testing Strategy**

### **Authentication & Authorization Tests**

```typescript
describe('Security Tests', () => {
  describe('Authentication', () => {
    test('prevents SQL injection in login', async () => {
      const maliciousPayload = {
        email: "admin@test.com'; DROP TABLE users; --",
        password: "anything"
      };

      const response = await request(app)
        .post('/auth/login')
        .send(maliciousPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
      
      // Verify database integrity
      const userCount = await User.count();
      expect(userCount).toBeGreaterThan(0);
    });

    test('enforces rate limiting on login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/auth/login')
          .send(loginData);
      }

      // 11th attempt should be rate limited
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('validates JWT tokens properly', async () => {
      // Invalid token
      await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Expired token
      const expiredToken = generateExpiredToken();
      await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Malformed token
      await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);
    });
  });

  describe('Input Validation', () => {
    test('prevents XSS attacks', async () => {
      const xssPayload = {
        name: '<script>alert("XSS")</script>',
        description: '<img src="x" onerror="alert(\'XSS\')">'
      };

      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${validToken}`)
        .send(xssPayload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('sanitizes user input', async () => {
      const userData = {
        name: 'Restaurant <b>Name</b>',
        description: 'Description with <script>alert("test")</script> script'
      };

      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${validToken}`)
        .send(userData)
        .expect(201);

      // Verify script tags are removed but safe HTML is preserved
      expect(response.body.data.name).toBe('Restaurant Name');
      expect(response.body.data.description).not.toContain('<script>');
    });
  });

  describe('Authorization', () => {
    test('enforces role-based access control', async () => {
      const customerToken = generateTestToken({ role: 'customer' });
      const restaurantToken = generateTestToken({ role: 'restaurant_owner' });

      // Customer cannot access restaurant management
      await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validRestaurantData)
        .expect(403);

      // Restaurant owner cannot access admin endpoints
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${restaurantToken}`)
        .expect(403);
    });
  });
});
```

## **6. Test Automation & CI/CD Integration**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: momfood_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/momfood_test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: momfood_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/momfood_test
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/momfood_test

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Start application
      run: |
        npm run build
        npm run start &
        npx wait-on http://localhost:3000
      env:
        NODE_ENV: test
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install Artillery
      run: npm install -g artillery@latest
    
    - name: Run performance tests
      run: |
        npm run start &
        npx wait-on http://localhost:3000
        artillery run tests/performance/load-test.yml
    
    - name: Upload performance report
      uses: actions/upload-artifact@v3
      with:
        name: performance-report
        path: artillery-report.html
```

## **7. Test Quality Metrics**

### **Coverage Requirements**
- **Unit Tests**: 90% code coverage minimum
- **Integration Tests**: 80% API endpoint coverage
- **E2E Tests**: 100% critical user journey coverage

### **Performance Benchmarks**
- **Unit Tests**: Complete in <2 minutes
- **Integration Tests**: Complete in <5 minutes
- **E2E Tests**: Complete in <10 minutes
- **Performance Tests**: Run weekly, not blocking

### **Quality Gates**
```yaml
quality_gates:
  code_coverage:
    minimum: 90%
    fail_build: true
  
  test_execution_time:
    unit_tests_max: 120s
    integration_tests_max: 300s
    e2e_tests_max: 600s
  
  security_tests:
    vulnerability_scan: required
    dependency_audit: required
    
  performance_tests:
    response_time_p95: <200ms
    throughput_min: 1000rps
    error_rate_max: 0.1%
```

This comprehensive testing strategy ensures the MomFood platform meets production-grade quality, performance, and security standards while maintaining development velocity and reliability.