import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Gear,
  Check,
  X,
  Eye,
  Trash,
  PaperPlaneTilt,
  Warning,
  Info,
  CheckCircle,
  Clock,
  User,
  Users,
  Funnel
} from '@phosphor-icons/react';
import { RealTimeManager, NotificationData } from '@/lib/realtime';

interface NotificationGear {
  email: boolean;
  push: boolean;
  inApp: boolean;
  orderUpdates: boolean;
  lowStock: boolean;
  newCustomers: boolean;
  deliveryUpdates: boolean;
  systemAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'payment' | 'system';
  variables: string[];
}

const mockNotifications: NotificationData[] = [
  {
    id: 'notif-001',
    type: 'order',
    title: 'طلب جديد',
    message: 'تم استلام طلب جديد من أحمد محمد بقيمة 125 ريال',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    actionUrl: '/orders/order-123'
  },
  {
    id: 'notif-002',
    type: 'delivery',
    title: 'طلب جاهز للتوصيل',
    message: 'الطلب #456 جاهز للتوصيل إلى منطقة الرياض',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionUrl: '/orders/order-456'
  },
  {
    id: 'notif-003',
    type: 'system',
    title: 'مخزون منخفض',
    message: 'مخزون الطماطم منخفض (3 كيلو متبقية)',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    actionUrl: '/inventory'
  },
  {
    id: 'notif-004',
    type: 'payment',
    title: 'دفعة مستلمة',
    message: 'تم استلام دفعة بقيمة 89 ريال للطلب #789',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: true
  },
  {
    id: 'notif-005',
    type: 'order',
    title: 'طلب ملغي',
    message: 'تم إلغاء الطلب #321 من قبل العميل',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true
  }
];

const defaultGear: NotificationGear = {
  email: true,
  push: true,
  inApp: true,
  orderUpdates: true,
  lowStock: true,
  newCustomers: false,
  deliveryUpdates: true,
  systemAlerts: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
};

const notificationTemplates: NotificationTemplate[] = [
  {
    id: 'tpl-001',
    name: 'طلب جديد',
    title: 'طلب جديد من {{customerName}}',
    message: 'تم استلام طلب جديد من {{customerName}} بقيمة {{orderValue}} ريال',
    type: 'order',
    variables: ['customerName', 'orderValue', 'orderId']
  },
  {
    id: 'tpl-002',
    name: 'مخزون منخفض',
    title: 'تنبيه مخزون منخفض',
    message: 'مخزون {{itemName}} منخفض ({{currentStock}} {{unit}} متبقية)',
    type: 'system',
    variables: ['itemName', 'currentStock', 'unit']
  },
  {
    id: 'tpl-003',
    name: 'طلب جاهز',
    title: 'طلب جاهز للتوصيل',
    message: 'الطلب #{{orderId}} جاهز للتوصيل إلى {{address}}',
    type: 'delivery',
    variables: ['orderId', 'address', 'customerName']
  }
];

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>(mockNotifications);
  const [settings, setGear] = useState<NotificationGear>(defaultGear);
  const [showGear, setShowGear] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as NotificationData['type'],
    recipients: 'all' // all, kitchen, drivers, customers
  });

  useEffect(() => {
    // Initialize real-time notifications
    const rtManager = RealTimeManager.getInstance();
    
    const unsubscribe = rtManager.onNotification((notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if enabled
      if (settings.push && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png',
          tag: notification.id
        });
      }
    });

    return unsubscribe;
  }, [settings.push]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const sendNotification = () => {
    const notification: NotificationData = {
      id: `notif-${Date.now()}`,
      type: newNotification.type,
      title: newNotification.title,
      message: newNotification.message,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev]);
    
    // PaperPlaneTilt via real-time system
    const rtManager = RealTimeManager.getInstance();
    // rtManager.sendNotification(notification, newNotification.recipients);

    setNewNotification({
      title: '',
      message: '',
      type: 'system',
      recipients: 'all'
    });
    setShowCompose(false);
  };

  const filteredNotifications = notifications.filter(notif => {
    const typeMatch = selectedType === 'all' || notif.type === selectedType;
    const readMatch = !showUnreadOnly || !notif.read;
    return typeMatch && readMatch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <CheckCircle size={20} className="text-blue-600" />;
      case 'delivery': return <Clock size={20} className="text-orange-600" />;
      case 'payment': return <CheckCircle size={20} className="text-green-600" />;
      case 'system': return <Warning size={20} className="text-red-600" />;
      default: return <Info size={20} className="text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order': return 'طلب';
      case 'delivery': return 'توصيل';
      case 'payment': return 'دفع';
      case 'system': return 'نظام';
      default: return 'عام';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${minutes} دقيقة`;
    if (hours < 24) return `${hours} ساعة`;
    return `${days} يوم`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={24} />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">مركز الإشعارات</h2>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompose(true)}
            className="gap-2"
          >
            <PaperPlaneTilt size={16} />
            إرسال إشعار
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGear(true)}
            className="gap-2"
          >
            <Gear size={16} />
            الإعدادات
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="gap-2"
        >
          <Check size={16} />
          تحديد الكل كمقروء
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllNotifications}
          disabled={notifications.length === 0}
          className="gap-2"
        >
          <Trash size={16} />
          مسح جميع الإشعارات
        </Button>
      </div>

      {/* Funnels */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="نوع الإشعار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="order">طلبات</SelectItem>
            <SelectItem value="delivery">توصيل</SelectItem>
            <SelectItem value="payment">مدفوعات</SelectItem>
            <SelectItem value="system">نظام</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="unread-only"
            checked={showUnreadOnly}
            onCheckedChange={setShowUnreadOnly}
          />
          <Label htmlFor="unread-only">غير مقروء فقط</Label>
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium ${!notification.read ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 px-2 gap-1"
                              >
                                <Eye size={14} />
                                تحديد كمقروء
                              </Button>
                            )}
                            
                            {notification.actionUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
                              >
                                عرض التفاصيل
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 px-2 gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash size={14} />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {index < filteredNotifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Gear Dialog */}
      <Dialog open={showGear} onOpenChange={setShowGear}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعدادات الإشعارات</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">طرق الإشعار</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">بريد إلكتروني</Label>
                  <Switch
                    id="email"
                    checked={settings.email}
                    onCheckedChange={(checked) =>
                      setGear(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="push">إشعارات المتصفح</Label>
                  <Switch
                    id="push"
                    checked={settings.push}
                    onCheckedChange={(checked) =>
                      setGear(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="inApp">داخل التطبيق</Label>
                  <Switch
                    id="inApp"
                    checked={settings.inApp}
                    onCheckedChange={(checked) =>
                      setGear(prev => ({ ...prev, inApp: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">أنواع الإشعارات</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="orderUpdates">تحديثات الطلبات</Label>
                  <Switch
                    id="orderUpdates"
                    checked={settings.orderUpdates}
                    onCheckedChange={(checked) =>
                      setGear(prev => ({ ...prev, orderUpdates: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="lowStock">مخزون منخفض</Label>
                  <Switch
                    id="lowStock"
                    checked={settings.lowStock}
                    onCheckedChange={(checked) =>
                      setGear(prev => ({ ...prev, lowStock: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="deliveryUpdates">تحديثات التوصيل</Label>
                  <Switch
                    id="deliveryUpdates"
                    checked={settings.deliveryUpdates}
                    onCheckedChange={(checked) =>
                      setGear(prev => ({ ...prev, deliveryUpdates: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemAlerts">تنبيهات النظام</Label>
                  <Switch
                    id="systemAlerts"
                    checked={settings.systemAlerts}
                    onCheckedChange={(checked) =>
                      setGear(prev => ({ ...prev, systemAlerts: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">الساعات الهادئة</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quietHours">تفعيل الساعات الهادئة</Label>
                  <Switch
                    id="quietHours"
                    checked={settings.quietHours.enabled}
                    onCheckedChange={(checked) =>
                      setGear(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, enabled: checked }
                      }))
                    }
                  />
                </div>
                
                {settings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="startTime">من</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={settings.quietHours.start}
                        onChange={(e) =>
                          setGear(prev => ({
                            ...prev,
                            quietHours: { ...prev.quietHours, start: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">إلى</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={settings.quietHours.end}
                        onChange={(e) =>
                          setGear(prev => ({
                            ...prev,
                            quietHours: { ...prev.quietHours, end: e.target.value }
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowGear(false)} className="flex-1">
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compose Notification Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال إشعار جديد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={newNotification.title}
                onChange={(e) =>
                  setNewNotification(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="عنوان الإشعار..."
              />
            </div>
            
            <div>
              <Label htmlFor="message">الرسالة</Label>
              <Textarea
                id="message"
                value={newNotification.message}
                onChange={(e) =>
                  setNewNotification(prev => ({ ...prev, message: e.target.value }))
                }
                placeholder="نص الإشعار..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">النوع</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value) =>
                    setNewNotification(prev => ({ ...prev, type: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">طلب</SelectItem>
                    <SelectItem value="delivery">توصيل</SelectItem>
                    <SelectItem value="payment">دفع</SelectItem>
                    <SelectItem value="system">نظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="recipients">المستقبلين</Label>
                <Select
                  value={newNotification.recipients}
                  onValueChange={(value) =>
                    setNewNotification(prev => ({ ...prev, recipients: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الجميع</SelectItem>
                    <SelectItem value="kitchen">المطبخ</SelectItem>
                    <SelectItem value="drivers">السائقين</SelectItem>
                    <SelectItem value="customers">العملاء</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={sendNotification}
                disabled={!newNotification.title || !newNotification.message}
                className="flex-1"
              >
                إرسال الإشعار
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCompose(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};