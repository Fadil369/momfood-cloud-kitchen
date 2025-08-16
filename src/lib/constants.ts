/**
 * Application constants
 */

// Order status types for type safety
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  KITCHEN: 'kitchen',
  DRIVER: 'driver'
} as const;

// LocalStorage keys to avoid duplicates
export const STORAGE_KEYS = {
  DRIVER_ONLINE_STATUS: 'driver-online-status',
  DRIVER_CURRENT_ORDER: 'driver-current-order',
  AVAILABLE_ORDERS: 'available-orders',
  COMPLETED_ORDERS: 'completed-orders',
  DRIVER_STATS: 'driver-stats',
  DRIVER_EARNINGS: 'driver-earnings',
  CUSTOMER_CART: 'customer-cart',
  SELECTED_RESTAURANT: 'selected-restaurant',
  KITCHEN_ORDERS: 'kitchen-orders',
  KITCHEN_STATS: 'kitchen-stats'
} as const;

// Animation constants
export const DELIVERY_PROGRESS_INTERVAL = 2000; // milliseconds
export const DELIVERY_PROGRESS_INCREMENT = 5; // percentage

// Default values
export const DEFAULT_DELIVERY_FEE = 5; // SAR
export const DEFAULT_PREPARATION_TIME = 15; // minutes
export const AVERAGE_DELIVERY_DISTANCE = 2.5; // km

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];