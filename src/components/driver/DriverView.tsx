import { useState } from 'react'
// Driver view component for MomFood app
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Motorcycle, 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation,
  Phone,
  CheckCircle,
  Package,
  Star
} from '@phosphor-icons/react'

interface DeliveryOrder {
  id: string
  restaurantName: string
  customerName: string
  customerPhone: string
  pickupAddress: string
  deliveryAddress: string
  status: 'assigned' | 'picked_up' | 'delivered'
  total: number
  deliveryFee: number
  distance: string
  estimatedTime: string
}

interface DriverStats {
  todayDeliveries: number
  todayEarnings: number
  rating: number
  completionRate: number
}

export function DriverView() {
  const [isOnline, setIsOnline] = useKV('driver-online-status', false)
  const [currentOrder, setCurrentOrder] = useKV<DeliveryOrder | null>('driver-current-order', null)
  const [availableOrders, setAvailableOrders] = useKV<DeliveryOrder[]>('available-orders', [])
  const [stats] = useKV<DriverStats>('driver-stats', {
    todayDeliveries: 0,
    todayEarnings: 0,
    rating: 0,
    completionRate: 0
  })

  const acceptOrder = (order: DeliveryOrder) => {
    setCurrentOrder(order)
    setAvailableOrders(current => current.filter(o => o.id !== order.id))
  }

  const updateOrderStatus = (status: DeliveryOrder['status']) => {
    if (currentOrder) {
      setCurrentOrder({ ...currentOrder, status })
    }
  }

  const completeOrder = () => {
    setCurrentOrder(null)
  }

  const getStatusText = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'assigned': return 'مُحدد'
      case 'picked_up': return 'تم الاستلام'
      case 'delivered': return 'تم التوصيل'
      default: return status
    }
  }

  const getStatusColor = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500'
      case 'picked_up': return 'bg-yellow-500'
      case 'delivered': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Online Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم السائق</h1>
          <p className="text-muted-foreground">إدارة طلبات التوصيل</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">توصيلات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">أرباح اليوم</p>
                <p className="text-2xl font-bold">{stats.todayEarnings} ريال</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">التقييم</p>
                <p className="text-2xl font-bold">{stats.rating}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">معدل الإنجاز</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isOnline && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-500 p-2">
                <Motorcycle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium">غير متاح حالياً</h3>
                <p className="text-sm text-muted-foreground">قم بتشغيل حالة "متاح" لتلقي طلبات التوصيل</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Order */}
      {currentOrder && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                طلب حالي #{currentOrder.id.slice(-4)}
              </CardTitle>
              <Badge variant="secondary">{getStatusText(currentOrder.status)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">معلومات الطلب</h4>
                  <p className="text-sm text-muted-foreground">المطعم: {currentOrder.restaurantName}</p>
                  <p className="text-sm text-muted-foreground">العميل: {currentOrder.customerName}</p>
                </div>
                
                <div>
                  <h4 className="font-medium">عنوان الاستلام</h4>
                  <p className="text-sm text-muted-foreground">{currentOrder.pickupAddress}</p>
                </div>
                
                <div>
                  <h4 className="font-medium">عنوان التوصيل</h4>
                  <p className="text-sm text-muted-foreground">{currentOrder.deliveryAddress}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">قيمة الطلب:</span>
                  <span className="text-sm font-medium">{currentOrder.total} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">رسوم التوصيل:</span>
                  <span className="text-sm font-medium">{currentOrder.deliveryFee} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">المسافة:</span>
                  <span className="text-sm font-medium">{currentOrder.distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">الوقت المتوقع:</span>
                  <span className="text-sm font-medium">{currentOrder.estimatedTime}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                اتصال بالعميل
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                التنقل
              </Button>
              
              {currentOrder.status === 'assigned' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus('picked_up')}
                  className="flex items-center gap-2 flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  تم الاستلام
                </Button>
              )}
              
              {currentOrder.status === 'picked_up' && (
                <Button
                  size="sm"
                  onClick={() => {
                    updateOrderStatus('delivered')
                    completeOrder()
                  }}
                  className="flex items-center gap-2 flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  تم التوصيل
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Orders */}
      {isOnline && !currentOrder && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">الطلبات المتاحة</h2>
          
          {availableOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Motorcycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد طلبات متاحة</h3>
                <p className="text-muted-foreground">ستظهر الطلبات الجديدة هنا</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">طلب #{order.id.slice(-4)}</CardTitle>
                      <Badge variant="outline">{order.deliveryFee} ريال</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.restaurantName}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">الاستلام</p>
                          <p className="text-xs text-muted-foreground">{order.pickupAddress}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">التوصيل</p>
                          <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{order.estimatedTime}</span>
                      </div>
                      <span>{order.distance}</span>
                    </div>

                    <Button 
                      onClick={() => acceptOrder(order)}
                      className="w-full"
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
    </div>
  )
}

// Also export as default
export default DriverView;