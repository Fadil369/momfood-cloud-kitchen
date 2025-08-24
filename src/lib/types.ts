/**
 * Global type definitions for the MomFood application
 */

import { ORDER_STATUS, USER_ROLES } from './constants';

// Re-export types for better organization
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Customer related types
export interface Customer extends BaseEntity {
  name: string;
  phone: string;
  email?: string;
  addresses: CustomerAddress[];
  preferences?: CustomerPreferences;
}

export interface CustomerAddress extends BaseEntity {
  title: string;
  street: string;
  area: string;
  city: string;
  building?: string;
  floor?: string;
  apartment?: string;
  isDefault: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CustomerPreferences {
  language: 'ar' | 'en';
  notifications: boolean;
  dietaryRestrictions?: string[];
  paymentMethod?: 'cash' | 'card' | 'wallet';
}

// Driver related types
export interface Driver extends BaseEntity {
  name: string;
  phone: string;
  vehicleType: 'motorcycle' | 'car' | 'bicycle';
  licenseNumber: string;
  rating: number;
  isOnline: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  stats: DriverStats;
}

export interface DriverStats {
  todayDeliveries: number;
  todayEarnings: number;
  rating: number;
  completionRate: number;
  totalDistance: number;
  avgDeliveryTime: number;
}

export interface EarningsData {
  deliveryFees: number;
  tips: number;
  bonuses: number;
  total: number;
  completedOrders: number;
}

// Kitchen/Restaurant related types
export interface KitchenStats {
  todayOrders: number;
  activeOrders: number;
  todayRevenue: number;
  avgPreparationTime: number;
  customerRating: number;
  completionRate: number;
}

// Utility types for better type safety
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Event types for better event handling
export interface AppEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
}