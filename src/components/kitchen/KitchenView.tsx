import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  ChartLine, 
  Receipt, 
  Settings, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  Star
} from '@phosphor-icons/react'

interface Order {
  id: string
  customerName: string
  items: Array<{ name: string; quantity: number; price: number }>
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
  total: number
  timestamp: Date
}

interface KitchenStats {
  todayOrders: number
  todayRevenue: number
  avgRating: number
  completionRate: number
}

export function KitchenView() {
  const [orders, setOrders] = useKV<Order[]>('kitchen-orders', [])
  const [stats] = useKV<KitchenStats>('kitchen-stats', {
    todayOrders: 0,
    todayRevenue: 0,
    avgRating: 0,
    completionRate: 0
  })

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(currentOrders => 
      currentOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'preparing': return 'bg-blue-500'
      case 'ready': return 'bg-green-500'
      case 'delivered': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'في الانتظار'
      case 'preparing': return 'قيد التحضير'
      case 'ready': return 'جاهز'
      case 'delivered': return 'تم التوصيل'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم المطعم</h1>
          <p className="text-muted-foreground">إدارة طلباتك وعملياتك</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة طبق جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">طلبات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayOrders}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إيرادات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayRevenue} ريال</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط التقييم</p>
                <p className="text-2xl font-bold">{stats.avgRating}</p>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">الطلبات</TabsTrigger>
          <TabsTrigger value="menu">القائمة</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">الطلبات الحالية</h2>
            <div className="flex gap-2">
              <Badge variant="outline">
                {orders.filter(o => o.status === 'pending').length} في الانتظار
              </Badge>
              <Badge variant="outline">
                {orders.filter(o => o.status === 'preparing').length} قيد التحضير
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.filter(order => order.status !== 'delivered').map((order) => (
              <Card key={order.id} className="border-l-4" style={{ borderLeftColor: `var(--color-${getStatusColor(order.status).split('-')[1]}-500)` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">طلب #{order.id.slice(-4)}</CardTitle>
                    <Badge variant="secondary">{getStatusText(order.status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customerName}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{item.price * item.quantity} ريال</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>المجموع</span>
                      <span>{order.total} ريال</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {order.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="flex-1"
                      >
                        بدء التحضير
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="flex-1"
                      >
                        جاهز للتوصيل
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="flex-1"
                      >
                        تم التوصيل
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.filter(order => order.status !== 'delivered').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد طلبات حالية</h3>
                <p className="text-muted-foreground">ستظهر الطلبات الجديدة هنا</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="menu">
          <Card>
            <CardContent className="p-8 text-center">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">إدارة القائمة</h3>
              <p className="text-muted-foreground mb-4">أضف وعدل أطباقك هنا</p>
              <Button>إضافة طبق جديد</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-8 text-center">
              <ChartLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">التحليلات والتقارير</h3>
              <p className="text-muted-foreground">قريباً - تحليلات مفصلة لأداء مطعمك</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">إعدادات المطعم</h3>
              <p className="text-muted-foreground">إدارة معلومات المطعم والإعدادات</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}