/**
 * Comprehensive validation system for MomFood Cloud Kitchen
 * Using Zod for schema validation and sanitization
 */

import { z } from 'zod';

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Sanitizes input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Sanitizes HTML content more thoroughly
 */
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates Arabic text - checks if text contains Arabic characters
 */
export const isArabicText = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text);
};

/**
 * Phone number validation for Middle East region
 */
export const phoneNumberSchema = z.string()
  .min(8, 'Phone number must be at least 8 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
  .transform(sanitizeInput);

/**
 * Price validation - ensures positive number with max 2 decimal places
 */
export const priceSchema = z.number()
  .min(0.01, 'Price must be greater than 0')
  .max(999999.99, 'Price is too high')
  .refine(
    (value) => Number((value * 100).toFixed(0)) / 100 === value,
    'Price can have maximum 2 decimal places'
  );

/**
 * Arabic-English bilingual text schema
 */
export const bilingualTextSchema = z.object({
  en: z.string().min(1, 'English text is required').transform(sanitizeInput),
  ar: z.string().min(1, 'Arabic text is required').transform(sanitizeInput),
});

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Address title is required').transform(sanitizeInput),
  street: z.string().min(5, 'Street address must be at least 5 characters').transform(sanitizeInput),
  area: z.string().min(2, 'Area is required').transform(sanitizeInput),
  city: z.string().min(2, 'City is required').transform(sanitizeInput),
  building: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  floor: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  apartment: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  isDefault: z.boolean().default(false),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ============================================================================
// CORE DATA MODEL SCHEMAS
// ============================================================================

/**
 * Customer validation schema
 */
export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .transform(sanitizeInput),
  phone: phoneNumberSchema,
  email: z.string().email('Invalid email format').optional()
    .transform((val) => val ? sanitizeInput(val) : val),
  addresses: z.array(addressSchema).min(1, 'At least one address is required'),
  preferences: z.object({
    language: z.enum(['ar', 'en']).default('en'),
    notifications: z.boolean().default(true),
    dietaryRestrictions: z.array(z.string().transform(sanitizeInput)).optional(),
    paymentMethod: z.enum(['cash', 'card', 'wallet']).optional(),
  }).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Driver validation schema
 */
export const driverSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .transform(sanitizeInput),
  phone: phoneNumberSchema,
  vehicleType: z.enum(['motorcycle', 'car', 'bicycle']),
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .transform(sanitizeInput),
  rating: z.number().min(0).max(5),
  isOnline: z.boolean().default(false),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  stats: z.object({
    todayDeliveries: z.number().min(0),
    todayEarnings: z.number().min(0),
    rating: z.number().min(0).max(5),
    completionRate: z.number().min(0).max(100),
    totalDistance: z.number().min(0),
    avgDeliveryTime: z.number().min(0),
  }),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Restaurant validation schema
 */
export const restaurantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(2, 'Restaurant name must be at least 2 characters')
    .max(100, 'Restaurant name must not exceed 100 characters')
    .transform(sanitizeInput),
  nameAr: z.string()
    .min(2, 'Arabic name must be at least 2 characters')
    .max(100, 'Arabic name must not exceed 100 characters')
    .transform(sanitizeInput),
  cuisine: z.string().min(1, 'Cuisine type is required').transform(sanitizeInput),
  rating: z.number().min(0).max(5),
  deliveryTime: z.string()
    .regex(/^\d+-\d+\s*min$/, 'Delivery time format should be "30-45 min"')
    .transform(sanitizeInput),
  deliveryFee: priceSchema,
  image: z.string().url('Invalid image URL').transform(sanitizeInput),
  featured: z.boolean().default(false),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .transform(sanitizeHtml),
  descriptionAr: z.string()
    .min(10, 'Arabic description must be at least 10 characters')
    .max(500, 'Arabic description must not exceed 500 characters')
    .transform(sanitizeHtml),
  isOpen: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Menu item validation schema
 */
export const menuItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name must not exceed 100 characters')
    .transform(sanitizeInput),
  nameAr: z.string()
    .min(2, 'Arabic name must be at least 2 characters')
    .max(100, 'Arabic name must not exceed 100 characters')
    .transform(sanitizeInput),
  description: z.string()
    .min(5, 'Description must be at least 5 characters')
    .max(300, 'Description must not exceed 300 characters')
    .transform(sanitizeHtml),
  descriptionAr: z.string()
    .min(5, 'Arabic description must be at least 5 characters')
    .max(300, 'Arabic description must not exceed 300 characters')
    .transform(sanitizeHtml),
  price: priceSchema,
  category: z.string().min(1, 'Category is required').transform(sanitizeInput),
  image: z.string().url('Invalid image URL').transform(sanitizeInput),
  available: z.boolean().default(true),
  preparationTime: z.number()
    .min(5, 'Preparation time must be at least 5 minutes')
    .max(180, 'Preparation time must not exceed 180 minutes'),
  allergens: z.array(z.string().transform(sanitizeInput)).optional(),
  spicyLevel: z.enum(['none', 'mild', 'medium', 'hot', 'very-hot']).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Order item validation schema
 */
export const orderItemSchema = z.object({
  menuItemId: z.string().uuid('Invalid menu item ID'),
  name: z.string().min(1, 'Item name is required').transform(sanitizeInput),
  nameAr: z.string().min(1, 'Arabic item name is required').transform(sanitizeInput),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(20, 'Maximum 20 items allowed'),
  price: priceSchema,
  customizations: z.array(z.string().transform(sanitizeInput)).optional(),
});

/**
 * Order validation schema
 */
export const orderSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid('Invalid customer ID'),
  customerName: z.string()
    .min(2, 'Customer name must be at least 2 characters')
    .transform(sanitizeInput),
  customerPhone: phoneNumberSchema,
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  restaurantName: z.string()
    .min(2, 'Restaurant name must be at least 2 characters')
    .transform(sanitizeInput),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'])
    .default('pending'),
  total: priceSchema,
  deliveryFee: priceSchema,
  deliveryAddress: z.string()
    .min(10, 'Delivery address must be at least 10 characters')
    .transform(sanitizeInput),
  estimatedDeliveryTime: z.date().optional(),
  specialInstructions: z.string()
    .max(200, 'Special instructions must not exceed 200 characters')
    .optional()
    .transform((val) => val ? sanitizeHtml(val) : val),
  driverId: z.string().uuid().optional(),
  timestamp: z.date().default(() => new Date()),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ============================================================================
// FORM VALIDATION SCHEMAS
// ============================================================================

/**
 * Customer order form validation
 */
export const customerOrderFormSchema = z.object({
  restaurantId: z.string().uuid('Please select a restaurant'),
  items: z.array(z.object({
    menuItemId: z.string().uuid('Invalid menu item'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    customizations: z.array(z.string()).optional(),
  })).min(1, 'Please add at least one item to your order'),
  deliveryAddressId: z.string().uuid('Please select a delivery address'),
  specialInstructions: z.string()
    .max(200, 'Special instructions must not exceed 200 characters')
    .optional(),
  paymentMethod: z.enum(['cash', 'card', 'wallet']),
});

/**
 * Kitchen menu item form validation
 */
export const kitchenMenuItemFormSchema = z.object({
  name: z.string()
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name must not exceed 100 characters'),
  nameAr: z.string()
    .min(2, 'Arabic name must be at least 2 characters')
    .max(100, 'Arabic name must not exceed 100 characters'),
  description: z.string()
    .min(5, 'Description must be at least 5 characters')
    .max(300, 'Description must not exceed 300 characters'),
  descriptionAr: z.string()
    .min(5, 'Arabic description must be at least 5 characters')
    .max(300, 'Arabic description must not exceed 300 characters'),
  price: z.number()
    .min(0.01, 'Price must be greater than 0')
    .max(999999.99, 'Price is too high'),
  category: z.string().min(1, 'Please select a category'),
  preparationTime: z.number()
    .int()
    .min(5, 'Preparation time must be at least 5 minutes')
    .max(180, 'Preparation time must not exceed 180 minutes'),
  image: z.string().url('Please provide a valid image URL'),
  available: z.boolean(),
  allergens: z.array(z.string()).optional(),
  spicyLevel: z.enum(['none', 'mild', 'medium', 'hot', 'very-hot']).optional(),
});

/**
 * Driver update form validation
 */
export const driverUpdateFormSchema = z.object({
  isOnline: z.boolean(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  orderStatus: z.enum(['picked_up', 'delivered']).optional(),
  deliveryNotes: z.string()
    .max(200, 'Delivery notes must not exceed 200 characters')
    .optional(),
});

/**
 * Customer registration form validation
 */
export const customerRegistrationFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  phone: z.string()
    .min(8, 'Phone number must be at least 8 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.object({
    title: z.string().min(1, 'Address title is required'),
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    area: z.string().min(2, 'Area is required'),
    city: z.string().min(2, 'City is required'),
    building: z.string().optional(),
    floor: z.string().optional(),
    apartment: z.string().optional(),
  }),
  preferences: z.object({
    language: z.enum(['ar', 'en']).default('en'),
    notifications: z.boolean().default(true),
  }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Customer = z.infer<typeof customerSchema>;
export type Driver = z.infer<typeof driverSchema>;
export type Restaurant = z.infer<typeof restaurantSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type CustomerAddress = z.infer<typeof addressSchema>;

export type CustomerOrderForm = z.infer<typeof customerOrderFormSchema>;
export type KitchenMenuItemForm = z.infer<typeof kitchenMenuItemFormSchema>;
export type DriverUpdateForm = z.infer<typeof driverUpdateFormSchema>;
export type CustomerRegistrationForm = z.infer<typeof customerRegistrationFormSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates data against a schema and returns formatted errors
 */
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

/**
 * Validates form data and returns both validation result and sanitized data
 */
export const validateAndSanitizeForm = <T>(
  schema: z.ZodSchema<T>,
  formData: Record<string, unknown>
): {
  isValid: boolean;
  data?: T;
  errors: Record<string, string>;
} => {
  const validation = validateData(schema, formData);
  
  if (validation.success) {
    return {
      isValid: true,
      data: validation.data,
      errors: {},
    };
  }
  
  return {
    isValid: false,
    errors: validation.success ? {} : validation.errors || {},
  };
};