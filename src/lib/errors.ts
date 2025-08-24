/**
 * Custom error classes and error handling utilities for MomFood Cloud Kitchen
 * Provides structured error handling with bilingual support and recovery strategies
 */

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base application error class with bilingual support
 */
export abstract class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly messageAr: string;

  constructor(
    message: string,
    messageAr: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.messageAr = messageAr;

    // Maintains proper stack trace for where our error was thrown
    if ('captureStackTrace' in Error) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get localized error message
   */
  getLocalizedMessage(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' ? this.messageAr : this.message;
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      messageAr: this.messageAr,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validation errors for form and data validation
 */
export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string>;
  public readonly fieldErrorsAr: Record<string, string>;

  constructor(
    message: string = 'Validation failed',
    messageAr: string = 'فشل في التحقق من صحة البيانات',
    fieldErrors: Record<string, string> = {},
    fieldErrorsAr: Record<string, string> = {},
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, 'VALIDATION_ERROR', 400, true, context);
    this.fieldErrors = fieldErrors;
    this.fieldErrorsAr = fieldErrorsAr;
  }

  /**
   * Get localized field errors
   */
  getLocalizedFieldErrors(language: 'en' | 'ar' = 'en'): Record<string, string> {
    return language === 'ar' ? this.fieldErrorsAr : this.fieldErrors;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
      fieldErrorsAr: this.fieldErrorsAr,
    };
  }
}

/**
 * Business logic errors
 */
export class BusinessError extends AppError {
  constructor(
    message: string,
    messageAr: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, code, 400, true, context);
  }
}

/**
 * Network and API errors
 */
export class NetworkError extends AppError {
  public readonly originalError?: Error;

  constructor(
    message: string = 'Network request failed',
    messageAr: string = 'فشل في طلب الشبكة',
    code: string = 'NETWORK_ERROR',
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, code, 0, true, context);
    this.originalError = originalError;
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    resourceAr: string,
    context?: Record<string, unknown>
  ) {
    super(
      `${resource} not found`,
      `${resourceAr} غير موجود`,
      'NOT_FOUND',
      404,
      true,
      context
    );
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    messageAr: string = 'المصادقة مطلوبة',
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, 'AUTH_ERROR', 401, true, context);
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Access denied',
    messageAr: string = 'تم رفض الوصول',
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

/**
 * Order-related errors
 */
export class OrderError extends BusinessError {
  constructor(
    message: string,
    messageAr: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, `ORDER_${code}`, context);
  }
}

/**
 * Payment-related errors
 */
export class PaymentError extends BusinessError {
  constructor(
    message: string,
    messageAr: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, `PAYMENT_${code}`, context);
  }
}

/**
 * Kitchen/Restaurant errors
 */
export class KitchenError extends BusinessError {
  constructor(
    message: string,
    messageAr: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, `KITCHEN_${code}`, context);
  }
}

/**
 * Driver-related errors
 */
export class DriverError extends BusinessError {
  constructor(
    message: string,
    messageAr: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message, messageAr, `DRIVER_${code}`, context);
  }
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

/**
 * Create common order errors
 */
export const OrderErrors = {
  notFound: (orderId: string) =>
    new NotFoundError('Order', 'الطلب', { orderId }),
  
  alreadyCancelled: (orderId: string) =>
    new OrderError(
      'Order has already been cancelled',
      'تم إلغاء الطلب بالفعل',
      'ALREADY_CANCELLED',
      { orderId }
    ),
  
  cannotCancel: (status: string) =>
    new OrderError(
      `Cannot cancel order with status: ${status}`,
      `لا يمكن إلغاء الطلب بحالة: ${status}`,
      'CANNOT_CANCEL',
      { status }
    ),
  
  invalidStatus: (status: string) =>
    new OrderError(
      `Invalid order status: ${status}`,
      `حالة طلب غير صحيحة: ${status}`,
      'INVALID_STATUS',
      { status }
    ),
  
  itemNotAvailable: (itemName: string) =>
    new OrderError(
      `Menu item "${itemName}" is not available`,
      `العنصر "${itemName}" غير متوفر`,
      'ITEM_NOT_AVAILABLE',
      { itemName }
    ),
  
  restaurantClosed: (restaurantName: string) =>
    new OrderError(
      `Restaurant "${restaurantName}" is currently closed`,
      `المطعم "${restaurantName}" مغلق حالياً`,
      'RESTAURANT_CLOSED',
      { restaurantName }
    ),
  
  minimumOrderNotMet: (minimum: number, current: number) =>
    new OrderError(
      `Minimum order value is ${minimum}. Current order: ${current}`,
      `الحد الأدنى للطلب ${minimum}. الطلب الحالي: ${current}`,
      'MINIMUM_ORDER_NOT_MET',
      { minimum, current }
    ),
};

/**
 * Create common payment errors
 */
export const PaymentErrors = {
  failed: (reason?: string) =>
    new PaymentError(
      `Payment failed${reason ? `: ${reason}` : ''}`,
      `فشل في الدفع${reason ? `: ${reason}` : ''}`,
      'FAILED',
      { reason }
    ),
  
  insufficientFunds: () =>
    new PaymentError(
      'Insufficient funds',
      'رصيد غير كافي',
      'INSUFFICIENT_FUNDS'
    ),
  
  invalidMethod: (method: string) =>
    new PaymentError(
      `Invalid payment method: ${method}`,
      `طريقة دفع غير صحيحة: ${method}`,
      'INVALID_METHOD',
      { method }
    ),
};

/**
 * Create common kitchen errors
 */
export const KitchenErrors = {
  itemOutOfStock: (itemName: string) =>
    new KitchenError(
      `"${itemName}" is out of stock`,
      `"${itemName}" نفد من المخزون`,
      'OUT_OF_STOCK',
      { itemName }
    ),
  
  preparationDelayed: (orderId: string, estimatedDelay: number) =>
    new KitchenError(
      `Order preparation delayed by ${estimatedDelay} minutes`,
      `تأخر تحضير الطلب ${estimatedDelay} دقيقة`,
      'PREPARATION_DELAYED',
      { orderId, estimatedDelay }
    ),
  
  kitchenBusy: () =>
    new KitchenError(
      'Kitchen is currently too busy to accept new orders',
      'المطبخ مشغول جداً حالياً لقبول طلبات جديدة',
      'KITCHEN_BUSY'
    ),
};

/**
 * Create common driver errors
 */
export const DriverErrors = {
  notAvailable: () =>
    new DriverError(
      'No drivers available for delivery',
      'لا يوجد سائقين متاحين للتوصيل',
      'NOT_AVAILABLE'
    ),
  
  locationUpdateFailed: () =>
    new DriverError(
      'Failed to update driver location',
      'فشل في تحديث موقع السائق',
      'LOCATION_UPDATE_FAILED'
    ),
  
  alreadyAssigned: (orderId: string) =>
    new DriverError(
      'Driver is already assigned to another order',
      'السائق مكلف بطلب آخر بالفعل',
      'ALREADY_ASSIGNED',
      { orderId }
    ),
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Type guard to check if error is an AppError
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

/**
 * Type guard to check if error is operational
 */
export const isOperationalError = (error: unknown): boolean => {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
};

/**
 * Extract error message with fallback
 */
export const getErrorMessage = (
  error: unknown,
  language: 'en' | 'ar' = 'en',
  fallback: string = 'An unexpected error occurred'
): string => {
  if (isAppError(error)) {
    return error.getLocalizedMessage(language);
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return fallback;
};

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Retry strategy for network errors
   */
  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Only retry on network errors or 5xx status codes
        if (isAppError(error) && error.statusCode >= 400 && error.statusCode < 500) {
          throw error; // Don't retry client errors
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  },

  /**
   * Circuit breaker pattern for preventing cascading failures
   */
  circuitBreaker: (() => {
    const failures = new Map<string, { count: number; lastFailure: number }>();
    const threshold = 5;
    const timeout = 60000; // 1 minute
    
    return <T>(
      key: string,
      fn: () => Promise<T>
    ): Promise<T> => {
      const failure = failures.get(key);
      const now = Date.now();
      
      // Check if circuit is open
      if (failure && failure.count >= threshold && now - failure.lastFailure < timeout) {
        throw new NetworkError(
          'Service temporarily unavailable',
          'الخدمة غير متاحة مؤقتاً',
          'CIRCUIT_BREAKER_OPEN'
        );
      }
      
      return fn()
        .then(result => {
          // Reset failure count on success
          failures.delete(key);
          return result;
        })
        .catch(error => {
          // Increment failure count
          const current = failure || { count: 0, lastFailure: now };
          failures.set(key, {
            count: current.count + 1,
            lastFailure: now
          });
          throw error;
        });
    };
  })(),

  /**
   * Graceful degradation - return fallback data on error
   */
  withFallback: async <T>(
    fn: () => Promise<T>,
    fallback: T,
    shouldUseFallback?: (error: unknown) => boolean
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (!shouldUseFallback || shouldUseFallback(error)) {
        return fallback;
      }
      throw error;
    }
  },
};

// ============================================================================
// ERROR LOGGING UTILITIES
// ============================================================================

/**
 * Error logger interface
 */
export interface ErrorLogger {
  log(error: AppError | Error, context?: Record<string, unknown>): void;
}

/**
 * Console error logger (for development)
 */
export class ConsoleErrorLogger implements ErrorLogger {
  log(error: AppError | Error, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(isAppError(error) && {
        code: error.code,
        statusCode: error.statusCode,
        context: error.context,
      }),
      ...(context && { additionalContext: context }),
    };
    
    console.error('Application Error:', JSON.stringify(errorInfo, null, 2));
  }
}

/**
 * Default error logger instance
 */
export const errorLogger = new ConsoleErrorLogger();

/**
 * Log error utility function
 */
export const logError = (
  error: AppError | Error,
  context?: Record<string, unknown>
): void => {
  errorLogger.log(error, context);
};

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Convert technical errors to user-friendly messages
 */
export const getUserFriendlyError = (
  error: unknown,
  language: 'en' | 'ar' = 'en'
): { message: string; canRetry: boolean; severity: 'low' | 'medium' | 'high' } => {
  // Default fallback
  const defaultError = {
    message: language === 'ar' 
      ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
      : 'An unexpected error occurred. Please try again.',
    canRetry: true,
    severity: 'medium' as const,
  };

  if (!isAppError(error)) {
    return defaultError;
  }

  const baseMessage = error.getLocalizedMessage(language);
  
  // Map error codes to user-friendly messages
  switch (error.code) {
    case 'NETWORK_ERROR':
      return {
        message: language === 'ar'
          ? 'مشكلة في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.'
          : 'Connection problem. Please check your internet and try again.',
        canRetry: true,
        severity: 'medium',
      };
    
    case 'VALIDATION_ERROR':
      return {
        message: baseMessage,
        canRetry: false,
        severity: 'low',
      };
    
    case 'ORDER_RESTAURANT_CLOSED':
      return {
        message: baseMessage,
        canRetry: false,
        severity: 'medium',
      };
    
    case 'PAYMENT_FAILED':
      return {
        message: language === 'ar'
          ? 'فشل في عملية الدفع. يرجى المحاولة مرة أخرى أو استخدام طريقة دفع أخرى.'
          : 'Payment failed. Please try again or use a different payment method.',
        canRetry: true,
        severity: 'high',
      };
    
    case 'DRIVER_NOT_AVAILABLE':
      return {
        message: language === 'ar'
          ? 'لا يوجد سائقين متاحين حالياً. سنحاول العثور على سائق قريباً.'
          : 'No drivers available right now. We\'ll try to find one soon.',
        canRetry: true,
        severity: 'medium',
      };
    
    default:
      return {
        message: baseMessage,
        canRetry: error.statusCode >= 500,
        severity: error.statusCode >= 500 ? 'high' : 'medium',
      };
  }
};