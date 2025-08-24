/**
 * Real-time features for MomFood application
 * Includes WebSocket connections, notifications, and live updates
 */

export interface OrderUpdate {
  orderId: string;
  status: string;
  timestamp: Date;
  message?: string;
  estimatedTime?: string;
}

export interface NotificationData {
  id: string;
  type: 'order' | 'delivery' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export class RealTimeManager {
  private static instance: RealTimeManager;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private orderUpdateCallbacks: Array<(update: OrderUpdate) => void> = [];
  private notificationCallbacks: Array<(notification: NotificationData) => void> = [];

  static getInstance(): RealTimeManager {
    if (!RealTimeManager.instance) {
      RealTimeManager.instance = new RealTimeManager();
    }
    return RealTimeManager.instance;
  }

  connect(wsUrl: string = 'wss://your-worker.your-subdomain.workers.dev/ws'): void {
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        // Send authentication or user identification
        this.send({ type: 'auth', userId: this.getUserId() });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'orderUpdate':
        this.orderUpdateCallbacks.forEach(callback => {
          callback(data.payload as OrderUpdate);
        });
        break;
      
      case 'notification':
        this.notificationCallbacks.forEach(callback => {
          callback(data.payload as NotificationData);
        });
        break;
      
      case 'ping':
        this.send({ type: 'pong' });
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private getUserId(): string {
    // In a real app, this would come from authentication
    return localStorage.getItem('userId') || 'anonymous';
  }

  // Public methods for subscribing to events
  onOrderUpdate(callback: (update: OrderUpdate) => void): () => void {
    this.orderUpdateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.orderUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.orderUpdateCallbacks.splice(index, 1);
      }
    };
  }

  onNotification(callback: (notification: NotificationData) => void): () => void {
      if (index > -1) {
        this.orderUpdateCallbacks.splice(index, 1);
      }
    };
  }

  onOrderUpdate(callback: (update: OrderUpdate) => void): () => void {
    this.notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  // Send order status updates
  updateOrderStatus(orderId: string, status: string, message?: string): void {
    this.send({
      type: 'updateOrder',
      payload: {
        orderId,
        status,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Send location updates for drivers
  updateDriverLocation(lat: number, lng: number): void {
    this.send({
      type: 'locationUpdate',
      payload: {
        lat,
        lng,
        timestamp: new Date().toISOString()
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.orderUpdateCallbacks = [];
    this.notificationCallbacks = [];
  }
}

// Notification system with browser notifications
export class NotificationManager {
  private static hasPermission = false;

  static async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }
    return false;
  }

  static show(notification: NotificationData): void {
    // Browser notification
    if (this.hasPermission) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: notification.id,
        requireInteraction: notification.type === 'order'
      });
    }

    // In-app notification (could trigger toast, etc.)
    this.showInAppNotification(notification);
  }

  private static showInAppNotification(notification: NotificationData): void {
    // This would integrate with your toast/notification UI component
    const event = new CustomEvent('momfood-notification', {
      detail: notification
    });
    window.dispatchEvent(event);
  }
}

// Enhanced location tracking for drivers
export class LocationTracker {
  private watchId: number | null = null;
  private lastPosition: GeolocationPosition | null = null;
  private updateCallback: ((position: GeolocationPosition) => void) | null = null;

  async startTracking(callback: (position: GeolocationPosition) => void): Promise<boolean> {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return false;
    }

    try {
      // Get initial position
      const position = await this.getCurrentPosition();
      callback(position);
      this.lastPosition = position;
      this.updateCallback = callback;

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Only update if moved significantly (> 50 meters)
          if (this.hasMovedSignificantly(position)) {
            callback(position);
            this.lastPosition = position;
            
            // Send to real-time system
            const rtm = RealTimeManager.getInstance();
            rtm.updateDriverLocation(
              position.coords.latitude,
              position.coords.longitude
            );
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });
    });
  }

  private hasMovedSignificantly(newPosition: GeolocationPosition): boolean {
    if (!this.lastPosition) return true;

    const distance = this.calculateDistance(
      this.lastPosition.coords.latitude,
      this.lastPosition.coords.longitude,
      newPosition.coords.latitude,
      newPosition.coords.longitude
    );

    return distance > 50; // 50 meters threshold
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.updateCallback = null;
    this.lastPosition = null;
  }
}

// Initialize real-time features
export const initializeRealTimeFeatures = (): void => {
  // Request notification permission
  NotificationManager.requestPermission();

  // Connect to real-time system
  const rtm = RealTimeManager.getInstance();
  rtm.connect();

  // Set up global event listeners
  window.addEventListener('beforeunload', () => {
    rtm.disconnect();
  });

  // Set up visibility change handler to manage connections
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, could reduce update frequency
    } else {
      // Page is visible, ensure connection is active
      if (!rtm.isConnected()) {
        rtm.connect();
      }
    }
  });
};