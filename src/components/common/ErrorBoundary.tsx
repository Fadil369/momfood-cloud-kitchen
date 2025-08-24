/**
 * Comprehensive Error Boundary Component for MomFood Cloud Kitchen
 * Provides graceful error handling with retry capability and bilingual support
 */

import React, { Component, ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  WifiOffIcon,
  ServerCrashIcon,
  BugIcon,
  ShieldAlertIcon,
  ClockIcon,
  HomeIcon,
} from 'lucide-react';
import { isAppError, getUserFriendlyError, logError, AppError } from '../../lib/errors';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  language?: 'en' | 'ar';
  level?: 'page' | 'section' | 'component';
  maxRetries?: number;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  resetErrorBoundary: () => void;
  language?: 'en' | 'ar';
  level?: 'page' | 'section' | 'component';
  retryCount?: number;
  maxRetries?: number;
}

export type ComponentType<P = {}> = React.ComponentType<P>;

// ============================================================================
// ERROR TYPE DETECTION
// ============================================================================

const getErrorType = (error: Error): {
  type: 'network' | 'validation' | 'authentication' | 'authorization' | 'business' | 'system' | 'unknown';
  icon: React.ComponentType<{ className?: string }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
} => {
  if (isAppError(error)) {
    switch (true) {
      case error.code.includes('NETWORK'):
        return { type: 'network', icon: WifiOffIcon, severity: 'medium' };
      case error.code.includes('VALIDATION'):
        return { type: 'validation', icon: AlertTriangleIcon, severity: 'low' };
      case error.code.includes('AUTH'):
        return { type: 'authentication', icon: ShieldAlertIcon, severity: 'high' };
      case error.code.includes('AUTHORIZATION'):
        return { type: 'authorization', icon: ShieldAlertIcon, severity: 'high' };
      case error.statusCode >= 500:
        return { type: 'system', icon: ServerCrashIcon, severity: 'critical' };
      default:
        return { type: 'business', icon: AlertTriangleIcon, severity: 'medium' };
    }
  }
  
  // Check for common JavaScript errors
  if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
    return { type: 'network', icon: WifiOffIcon, severity: 'medium' };
  }
  
  return { type: 'unknown', icon: BugIcon, severity: 'high' };
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

const getErrorMessages = (language: 'en' | 'ar' = 'en') => ({
  en: {
    titles: {
      network: 'Connection Problem',
      validation: 'Input Error',
      authentication: 'Authentication Required',
      authorization: 'Access Denied',
      business: 'Service Error',
      system: 'System Error',
      unknown: 'Unexpected Error',
    },
    descriptions: {
      network: 'Please check your internet connection and try again.',
      validation: 'Please check your input and try again.',
      authentication: 'Please log in to continue.',
      authorization: 'You don\'t have permission to perform this action.',
      business: 'A service error occurred. Please try again.',
      system: 'Our system is experiencing issues. Please try again later.',
      unknown: 'An unexpected error occurred. Please try again.',
    },
    buttons: {
      retry: 'Try Again',
      goHome: 'Go Home',
      reload: 'Reload Page',
      reportBug: 'Report Bug',
    },
    labels: {
      errorDetails: 'Error Details',
      errorId: 'Error ID',
      retryAttempts: 'Retry Attempts',
      maxRetries: 'Maximum retries reached',
      timestamp: 'Time',
    },
  },
  ar: {
    titles: {
      network: 'مشكلة في الاتصال',
      validation: 'خطأ في الإدخال',
      authentication: 'المصادقة مطلوبة',
      authorization: 'تم رفض الوصول',
      business: 'خطأ في الخدمة',
      system: 'خطأ في النظام',
      unknown: 'خطأ غير متوقع',
    },
    descriptions: {
      network: 'يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
      validation: 'يرجى التحقق من الإدخال والمحاولة مرة أخرى.',
      authentication: 'يرجى تسجيل الدخول للمتابعة.',
      authorization: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
      business: 'حدث خطأ في الخدمة. يرجى المحاولة مرة أخرى.',
      system: 'نظامنا يواجه مشاكل. يرجى المحاولة لاحقاً.',
      unknown: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    },
    buttons: {
      retry: 'المحاولة مرة أخرى',
      goHome: 'الذهاب للرئيسية',
      reload: 'إعادة تحميل الصفحة',
      reportBug: 'الإبلاغ عن خطأ',
    },
    labels: {
      errorDetails: 'تفاصيل الخطأ',
      errorId: 'معرف الخطأ',
      retryAttempts: 'محاولات الإعادة',
      maxRetries: 'تم الوصول للحد الأقصى من المحاولات',
      timestamp: 'الوقت',
    },
  },
});

// ============================================================================
// ENHANCED ERROR FALLBACK COMPONENT
// ============================================================================

const EnhancedErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  resetErrorBoundary,
  language = 'en',
  level = 'section',
  retryCount = 0,
  maxRetries = 3,
}) => {
  const messages = getErrorMessages(language)[language];
  const { type, icon: ErrorIcon, severity } = getErrorType(error);
  const userFriendlyError = getUserFriendlyError(error, language);
  const isRtl = language === 'ar';
  
  const handleRetry = () => {
    resetError();
    resetErrorBoundary();
  };
  
  const handleReload = () => {
    window.location.reload();
  };
  
  const handleGoHome = () => {
    window.location.href = '/';
  };
  
  const handleReportBug = () => {
    const errorReport = {
      error: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
    
    // In a real app, you would send this to your error reporting service
    console.error('Bug Report:', errorReport);
    
    // For now, copy to clipboard
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2));
  };

  // Different layouts based on error level
  const getContainerClass = () => {
    switch (level) {
      case 'page':
        return 'min-h-screen flex items-center justify-center p-4 bg-background';
      case 'section':
        return 'min-h-[400px] flex items-center justify-center p-4';
      case 'component':
        return 'p-4 flex items-center justify-center';
      default:
        return 'min-h-[200px] flex items-center justify-center p-4';
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'low': return 'border-yellow-200 bg-yellow-50';
      case 'medium': return 'border-orange-200 bg-orange-50';
      case 'high': return 'border-red-200 bg-red-50';
      case 'critical': return 'border-red-500 bg-red-100';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={getContainerClass()} dir={isRtl ? 'rtl' : 'ltr'}>
      <Card className={`w-full max-w-lg ${getSeverityColor()}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
            <ErrorIcon className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-lg font-semibold">
            {messages.titles[type]}
          </CardTitle>
          <CardDescription>
            {userFriendlyError.message || messages.descriptions[type]}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Retry Information */}
          {retryCount > 0 && (
            <Alert>
              <ClockIcon className="h-4 w-4" />
              <AlertTitle>{messages.labels.retryAttempts}</AlertTitle>
              <AlertDescription>
                {retryCount} / {maxRetries}
                {retryCount >= maxRetries && (
                  <span className="block text-destructive font-medium mt-1">
                    {messages.labels.maxRetries}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Details (Development/Debug) */}
          {import.meta.env.DEV && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground mb-2">
                {messages.labels.errorDetails}
              </summary>
              <div className="bg-muted/50 p-3 rounded border space-y-2">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                <div>
                  <strong>Type:</strong> {error.name}
                </div>
                {isAppError(error) && (
                  <>
                    <div>
                      <strong>Code:</strong> {error.code}
                    </div>
                    <div>
                      <strong>Status:</strong> {error.statusCode}
                    </div>
                  </>
                )}
                <div>
                  <strong>{messages.labels.timestamp}:</strong> {new Date().toLocaleString()}
                </div>
                {error.stack && (
                  <pre className="text-xs overflow-auto max-h-32 bg-background p-2 rounded border">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {/* Primary Actions */}
          {userFriendlyError.canRetry && retryCount < maxRetries && (
            <Button onClick={handleRetry} className="w-full sm:w-auto" size="sm">
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              {messages.buttons.retry}
            </Button>
          )}
          
          {/* Secondary Actions */}
          <div className="flex gap-2 w-full sm:w-auto">
            {level === 'page' ? (
              <Button variant="outline" onClick={handleReload} className="flex-1" size="sm">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                {messages.buttons.reload}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleGoHome} className="flex-1" size="sm">
                <HomeIcon className="w-4 h-4 mr-2" />
                {messages.buttons.goHome}
              </Button>
            )}
            
            {import.meta.env.DEV && (
              <Button variant="ghost" onClick={handleReportBug} size="sm">
                <BugIcon className="w-4 h-4 mr-2" />
                {messages.buttons.reportBug}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// ============================================================================
// CLASS-BASED ERROR BOUNDARY (for backward compatibility)
// ============================================================================

export class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack || '',
      errorBoundary: this.constructor.name,
    };

    this.setState({ errorInfo: enhancedErrorInfo });

    // Log error
    logError(error, {
      ...enhancedErrorInfo,
      level: this.props.level,
      language: this.props.language,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler
    this.props.onError?.(error, enhancedErrorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  resetError = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  resetErrorBoundary = () => {
    this.resetError();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || EnhancedErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          resetErrorBoundary={this.resetErrorBoundary}
          language={this.props.language}
          level={this.props.level}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// FUNCTIONAL ERROR BOUNDARY (using react-error-boundary)
// ============================================================================

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
  onError,
  language = 'en',
  level = 'section',
  maxRetries = 3,
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack,
    };

    // Log error
    logError(error, {
      ...enhancedErrorInfo,
      level,
      language,
      retryCount,
    });

    // Call custom error handler
    onError?.(error, enhancedErrorInfo);
  };

  const handleReset = () => {
    setRetryCount(prev => prev + 1);
  };

  const fallbackComponent = React.useCallback(
    ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
      const FallbackComponent = fallback || EnhancedErrorFallback;
      
      return (
        <FallbackComponent
          error={error}
          resetError={handleReset}
          resetErrorBoundary={resetErrorBoundary}
          language={language}
          level={level}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    },
    [fallback, language, level, retryCount, maxRetries]
  );

  return (
    <ReactErrorBoundary
      FallbackComponent={fallbackComponent}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
};

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

/**
 * Network Error Boundary - specifically for network-related errors
 */
export const NetworkErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      level="section"
      onError={(error, errorInfo) => {
        // Only handle network errors
        if (isAppError(error) && error.code.includes('NETWORK')) {
          props.onError?.(error, errorInfo);
        } else {
          // Re-throw non-network errors to be handled by parent boundary
          throw error;
        }
      }}
    />
  );
};

/**
 * Page Error Boundary - for full page error handling
 */
export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      level="page"
      maxRetries={1}
    />
  );
};

/**
 * Component Error Boundary - for small component error handling
 */
export const ComponentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      level="component"
      maxRetries={2}
    />
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for manually triggering error boundaries
 */
export const useErrorHandler = () => {
  const [, setError] = React.useState();
  
  return React.useCallback((error: Error) => {
    logError(error);
    setError(() => {
      throw error;
    });
  }, []);
};

/**
 * Hook for error reporting
 */
export const useErrorReporting = () => {
  const reportError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    logError(error, context);
    
    // In a real app, send to error reporting service
    // Example: Sentry.captureException(error, { extra: context });
  }, []);
  
  return { reportError };
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ErrorBoundary;