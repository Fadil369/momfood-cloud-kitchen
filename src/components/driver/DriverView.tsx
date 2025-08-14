import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useLocalStorage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Motorcycle,
  MapPin,
  Clock,
  CurrencyDollar,
  NavigationArrow,
  Phone,
  CheckCircle,
  Package,
  Star,
  GasPump,
  Path,
  Bell,
  TrendUp
} from '@phosphor-icons/react'
import { mockOrders, mockDrivers, type Order } from '@/lib/mockData'

interface DeliveryOrder extends Order {
  distance: string
  estimatedTime: string
  pickupETA: string
  deliveryETA: string
}

interface DriverStats {
  todayDeliveries: number
  todayEarnings: number
  rating: number
  completionRate: number
  totalDistance: number
  avgDeliveryTime: number
}

interface EarningsData {
  deliveryFees: number
  tips: number
  bonuses: number
  total: number
}

export function DriverView() {
  const [isOnline, setIsOnline] = useKV('driver-online-status', false)
  const [currentOrder, setCurrentOrder] = useKV<DeliveryOrder | null>('driver-current-order', null)
  const [availableOrders, setAvailableOrders] = useKV<DeliveryOrder[]>('available-orders', [])
  const [completedOrders, setCompletedOrders] = useKV<DeliveryOrder[]>('completed-orders', [])
  const [stats, setStats] = useKV<DriverStats>('driver-stats', {
    todayDeliveries: 0,
    todayEarnings: 0,
    rating: 4.7,
    completionRate: 98,
    totalDistance: 0,
    avgDeliveryTime: 18
  })
  const [earnings, setEarnings] = useKV<EarningsData>('driver-earnings', {
    deliveryFees: 0,
    tips: 0,
    bonuses: 0,
    total: 0
  })
  const [showEarningsDetail, setShowEarningsDetail] = useState(false)
  const [deliveryProgress, setDeliveryProgress] = useState(0)

  useEffect(() => {
    // Initialize available orders if empty and driver is online
    if (isOnline && availableOrders.length === 0) {
      const driverOrders: DeliveryOrder[] = mockOrders
        .filter(order => order.status === 'ready')
        .map(order => ({
          ...order,
          distance: '2.5 كم',
          estimatedTime: '15-20 دقيقة',
          pickupETA: '5 دقائق',
          deliveryETA: '15 دقيقة'
        }))
      setAvailableOrders(driverOrders)
    }

    // Update stats based on completed orders
    const todayEarnings = completedOrders.reduce((sum, order) => sum + order.deliveryFee, 0)
    const totalDistance = completedOrders.length * 2.5 // Assuming average 2.5km per delivery
    
    setStats(prev => ({
      ...prev,
      todayDeliveries: completedOrders.length,
      todayEarnings,
      totalDistance
    }))

    setEarnings(prev => ({
      ...prev,
      deliveryFees: todayEarnings,
      total: todayEarnings + prev.tips + prev.bonuses
    }))
  }, [isOnline, availableOrders, completedOrders, setAvailableOrders, setStats, setEarnings])

  useEffect(() => {
    // Simulate delivery progress
    if (currentOrder && (currentOrder.status === 'picked_up')) {
      const interval = setInterval(() => {
        setDeliveryProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 5
        })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [currentOrder])

  const acceptOrder = (order: DeliveryOrder) => {
    setCurrentOrder(order)
    setAvailableOrders(current => current.filter(o => o.id !== order.id))
  }

  const updateOrderStatus = (status: DeliveryOrder['status']) => {
    if (currentOrder) {
      const updatedOrder = { ...currentOrder, status }
      setCurrentOrder(updatedOrder)
      
      if (status === 'picked_up') {
        setDeliveryProgress(0)
      }
    }
  }

  const completeOrder = () => {
    if (currentOrder) {
      const completedOrder = { ...currentOrder, status: 'delivered' as const }
      setCompletedOrders(prev => [...prev, completedOrder])
      setCurrentOrder(null)
      setDeliveryProgress(0)
      
      // Add tip simulation
      const randomTip = Math.floor(Math.random() * 15) + 5 // 5-20 SAR tip
      setEarnings(prev => ({
        ...prev,
        tips: prev.tips + randomTip,
        total: prev.total + randomTip
      }))
    }
  }

  const getStatusText = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'ready': return 'جاهز للاستلام'
      case 'picked_up': return 'تم الاستلام'
      case 'delivered': return 'تم التوصيل'
      default: return status
    }
  }

  const simulateNavigation = () => {
    // In a real app, this would open navigation app
    alert('فتح التنقل في تطبيق الخرائط...')
  }

  const callCustomer = () => {
    // In a real app, this would initiate a call
    if (currentOrder) {
      alert(`الاتصال بـ ${currentOrder.customerName} على ${currentOrder.customerPhone}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Online Status */}
      <div className="flex items-center justify-between">
        <div className="text-right" dir="rtl">
          <h1 className="text-2xl font-bold arabic-text">لوحة تحكم السائق</h1>
          <p className="text-muted-foreground arabic-text">إدارة طلبات التوصيل</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium arabic-text">
            {isOnline ? 'متاح' : 'غير متاح'}
          </span>
          <Switch
            checked={isOnline}
            onCheckedChange={setIsOnline}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowEarningsDetail(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-muted-foreground arabic-text">أرباح اليوم</p>
                <p className="text-2xl font-bold">{earnings.total} ريال</p>
                <p className="text-xs text-muted-foreground arabic-text">انقر للتفاصيل</p>
              </div>
              <CurrencyDollar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-muted-foreground arabic-text">توصيلات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-muted-foreground arabic-text">التقييم</p>
                <p className="text-2xl font-bold">{stats.rating}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-muted-foreground arabic-text">المسافة اليوم</p>
                <p className="text-2xl font-bold">{stats.totalDistance} كم</p>
              </div>
              <Path className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offline Status Alert */}
      {!isOnline && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Motorcycle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="arabic-text text-right" dir="rtl">
            غير متاح حاليا - قم بتشغيل حالة "متاح" لتلقي طلبات التوصيل
          </AlertDescription>
        </Alert>
      )}

      {/* Current Order */}
      {currentOrder && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                طلب حالي #{currentOrder.id.slice(-4)}
              </CardTitle>
              <Badge variant="secondary" className="arabic-text">
                {getStatusText(currentOrder.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Delivery Progress */}
            {currentOrder.status === 'picked_up' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{deliveryProgress}%</span>
                  <span className="arabic-text">تقدم التوصيل</span>
                </div>
                <Progress value={deliveryProgress} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 text-right" dir="rtl">
                <div>
                  <h4 className="font-medium arabic-text">معلومات الطلب</h4>
                  <p className="text-sm text-muted-foreground arabic-text">المطعم: {currentOrder.restaurantName}</p>
                  <p className="text-sm text-muted-foreground arabic-text">العميل: {currentOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground"> {currentOrder.customerPhone}</p>
                </div>

                <div>
                  <h4 className="font-medium arabic-text">عنوان الاستلام</h4>
                  <p className="text-sm text-muted-foreground">{currentOrder.pickupAddress}</p>
                </div>

                <div>
                  <h4 className="font-medium arabic-text">عنوان التوصيل</h4>
                  <p className="text-sm text-muted-foreground">{currentOrder.deliveryAddress}</p>
                </div>
              </div>

              <div className="space-y-3 text-right" dir="rtl">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{currentOrder.total} ريال</span>
                    <span className="text-sm arabic-text">قيمة الطلب:</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{currentOrder.deliveryFee} ريال</span>
                    <span className="text-sm arabic-text">رسوم التوصيل:</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{currentOrder.distance}</span>
                    <span className="text-sm arabic-text">المسافة:</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{currentOrder.estimatedTime}</span>
                    <span className="text-sm arabic-text">الوقت المتوقع:</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={callCustomer}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                <span className="arabic-text">اتصال بالعميل</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={simulateNavigation}
                className="flex items-center gap-2"
              >
                <NavigationArrow className="h-4 w-4" />
                <span className="arabic-text">التنقل</span>
              </Button>

              {currentOrder.status === 'ready' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus('picked_up')}
                  className="flex items-center gap-2 flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="arabic-text">تم الاستلام</span>
                </Button>
              )}

              {currentOrder.status === 'picked_up' && (
                <Button
                  size="sm"
                  onClick={completeOrder}
                  className="flex items-center gap-2 flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="arabic-text">تم التوصيل</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Orders */}
      {isOnline && !currentOrder && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold arabic-text text-right" dir="rtl">الطلبات المتاحة</h2>
            {availableOrders.length > 0 && (
              <Badge variant="outline" className="arabic-text">
                {availableOrders.length} طلب متاح
              </Badge>
            )}
          </div>

          {availableOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Motorcycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 arabic-text">لا توجد طلبات متاحة</h3>
                <p className="text-muted-foreground arabic-text">ستظهر الطلبات الجديدة هنا</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">طلب #{order.id.slice(-4)}</CardTitle>
                      <Badge className="bg-green-100 text-green-800 arabic-text">
                        {order.deliveryFee} ريال
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground arabic-text text-right" dir="rtl">
                      {order.restaurantName}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                        <div className="text-right flex-1" dir="rtl">
                          <p className="text-sm font-medium arabic-text">الاستلام</p>
                          <p className="text-xs text-muted-foreground">{order.pickupAddress}</p>
                          <p className="text-xs text-green-600 arabic-text">ETA: {order.pickupETA}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="text-right flex-1" dir="rtl">
                          <p className="text-sm font-medium arabic-text">التوصيل</p>
                          <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
                          <p className="text-xs text-red-600 arabic-text">ETA: {order.deliveryETA}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm border-t pt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{order.estimatedTime}</span>
                      </div>
                      <span className="font-medium">{order.distance}</span>
                    </div>

                    <Button
                      onClick={() => acceptOrder(order)}
                      className="w-full arabic-text"
                    >
                      قبول الطلب
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Earnings Detail Dialog */}
      <Dialog open={showEarningsDetail} onOpenChange={setShowEarningsDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="arabic-text text-right" dir="rtl">تفاصيل الأرباح اليومية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>{earnings.deliveryFees} ريال</span>
                <span className="arabic-text">رسوم التوصيل</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{earnings.tips} ريال</span>
                <span className="arabic-text">البقشيش</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{earnings.bonuses} ريال</span>
                <span className="arabic-text">المكافآت</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center font-bold">
                  <span>{earnings.total} ريال</span>
                  <span className="arabic-text">المجموع</span>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <div className="text-sm text-muted-foreground arabic-text">
                متوسط الربح لكل توصيلة: {stats.todayDeliveries > 0 ? Math.round(earnings.total / stats.todayDeliveries) : 0} ريال
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DriverView
