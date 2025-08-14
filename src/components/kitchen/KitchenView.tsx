import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useLocalStorage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ChartLine,
  Receipt,
  Gear,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  TrendUp,
  Users,
  Star,
  Bell,
  Package,
  CurrencyDollar
} from '@phosphor-icons/react'
import { mockOrders, type Order } from '@/lib/mockData'

interface KitchenStats {
  todayOrders: number
  todayRevenue: number
  avgRating: number
  completionRate: number
  avgPreparationTime: number
  activeOrders: number
}

interface NewMenuItem {
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  price: number
  category: string
  preparationTime: number
}

export function KitchenView() {
  const [orders, setOrders] = useKV<Order[]>('kitchen-orders', [])
  const [stats, setStats] = useKV<KitchenStats>('kitchen-stats', {
    todayOrders: 0,
    todayRevenue: 0,
    avgRating: 4.6,
    completionRate: 94,
    avgPreparationTime: 22,
    activeOrders: 0
  })
  const [newMenuItem, setNewMenuItem] = useState<NewMenuItem>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: 0,
    category: 'main',
    preparationTime: 15
  })
  const [showAddMenuItem, setShowAddMenuItem] = useState(false)

  useEffect(() => {
    // Initialize with mock orders if empty
    if (orders.length === 0) {
      const kitchenOrders = mockOrders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
      )
      setOrders(kitchenOrders)
    }
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    // Update stats when orders change
    const activeOrders = orders.filter(order => 
      ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
    ).length
    
    const todayRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.total, 0)

    setStats(prev => ({
      ...prev,
      activeOrders,
      todayOrders: orders.length,
      todayRevenue
    }))
  }, [orders.length]) // Only depend on orders.length to avoid infinite loop

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
      case 'confirmed': return 'bg-blue-500'
      case 'preparing': return 'bg-orange-500'
      case 'ready': return 'bg-green-500'
      case 'picked_up': return 'bg-purple-500'
      case 'delivered': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'في الانتظار'
      case 'confirmed': return 'مؤكد'
      case 'preparing': return 'قيد التحضير'
      case 'ready': return 'جاهز'
      case 'picked_up': return 'تم الاستلام'
      case 'delivered': return 'تم التوصيل'
      case 'cancelled': return 'ملغي'
      default: return status
    }
  }

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'pending': return 'confirmed'
      case 'confirmed': return 'preparing'
      case 'preparing': return 'ready'
      case 'ready': return 'picked_up'
      default: return null
    }
  }

  const getNextStatusText = (currentStatus: Order['status']): string => {
    const nextStatus = getNextStatus(currentStatus)
    return nextStatus ? getStatusText(nextStatus) : ''
  }

  const addMenuItem = () => {
    // In a real app, this would add to the restaurant's menu
    console.log('Adding menu item:', newMenuItem)
    setNewMenuItem({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: 0,
      category: 'main',
      preparationTime: 15
    })
    setShowAddMenuItem(false)
  }

  const pendingOrders = orders.filter(order => order.status === 'pending')
  const activeOrdersFiltered = orders.filter(order => 
    ['confirmed', 'preparing', 'ready'].includes(order.status)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right" dir="rtl">
          <h1 className="text-2xl font-bold arabic-text">لوحة تحكم المطعم</h1>
          <p className="text-muted-foreground arabic-text">إدارة طلباتك وعملياتك</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingOrders.length > 0 && (
            <Alert className="w-auto">
              <Bell className="h-4 w-4" />
              <AlertDescription className="arabic-text">
                {pendingOrders.length} طلب جديد في الانتظار
              </AlertDescription>
            </Alert>
          )}
          <Button className="flex items-center gap-2" onClick={() => setShowAddMenuItem(true)}>
            <Plus className="h-4 w-4" />
            <span className="arabic-text">إضافة طبق جديد</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-muted-foreground arabic-text">طلبات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayOrders}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-muted-foreground arabic-text">إيرادات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayRevenue} ريال</p>
              </div>
              <CurrencyDollar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-muted-foreground arabic-text">متوسط التقييم</p>
                <p className="text-2xl font-bold">{stats.avgRating}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-muted-foreground arabic-text">طلبات نشطة</p>
                <p className="text-2xl font-bold">{stats.activeOrders}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders" className="arabic-text">الطلبات</TabsTrigger>
          <TabsTrigger value="menu" className="arabic-text">القائمة</TabsTrigger>
          <TabsTrigger value="analytics" className="arabic-text">التحليلات</TabsTrigger>
          <TabsTrigger value="settings" className="arabic-text">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold arabic-text text-right" dir="rtl">الطلبات الحالية</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="arabic-text">
                {pendingOrders.length} في الانتظار
              </Badge>
              <Badge variant="outline" className="arabic-text">
                {activeOrdersFiltered.length} نشط
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.filter(order => order.status !== 'delivered' && order.status !== 'cancelled').map((order) => (
              <Card key={order.id} className="border-l-4" style={{ 
                borderLeftColor: `var(--color-${getStatusColor(order.status).split('-')[1]}-500)` 
              }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">طلب #{order.id.slice(-4)}</CardTitle>
                    <Badge variant="secondary" className="arabic-text">
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="text-right" dir="rtl">
                    <p className="text-sm text-muted-foreground arabic-text">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.timestamp).toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x</span>
                        <span className="arabic-text text-right flex-1 px-2">{item.nameAr}</span>
                        <span>{item.price * item.quantity} ريال</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="border-t pt-2">
                      <p className="text-sm text-muted-foreground arabic-text text-right" dir="rtl">
                        ملاحظات: {order.notes}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>{order.total} ريال</span>
                      <span className="arabic-text">المجموع</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {getNextStatus(order.status) && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                        className="flex-1 arabic-text"
                      >
                        {getNextStatusText(order.status)}
                      </Button>
                    )}
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="arabic-text"
                      >
                        إلغاء
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.filter(order => order.status !== 'delivered' && order.status !== 'cancelled').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 arabic-text">لا توجد طلبات حالية</h3>
                <p className="text-muted-foreground arabic-text">ستظهر الطلبات الجديدة هنا</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="menu">
          <Card>
            <CardContent className="p-8 text-center">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 arabic-text">إدارة القائمة</h3>
              <p className="text-muted-foreground mb-4 arabic-text">أضف وعدل أطباقك هنا</p>
              <Button onClick={() => setShowAddMenuItem(true)} className="arabic-text">
                إضافة طبق جديد
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text text-right" dir="rtl">إحصائيات الأداء</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>{stats.completionRate}%</span>
                  <span className="arabic-text">معدل الإنجاز</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{stats.avgPreparationTime} دقيقة</span>
                  <span className="arabic-text">متوسط وقت التحضير</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{stats.avgRating}/5</span>
                  <span className="arabic-text">متوسط التقييم</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <ChartLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 arabic-text">التحليلات والتقارير</h3>
                <p className="text-muted-foreground arabic-text">قريبا - تحليلات مفصلة لأداء مطعمك</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-8 text-center">
              <Gear className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 arabic-text">إعدادات المطعم</h3>
              <p className="text-muted-foreground arabic-text">إدارة معلومات المطعم والإعدادات</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Menu Item Dialog */}
      <Dialog open={showAddMenuItem} onOpenChange={setShowAddMenuItem}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="arabic-text text-right" dir="rtl">إضافة طبق جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">English Name</Label>
                <Input
                  id="name"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Dish name in English"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr" className="arabic-text">الاسم بالعربي</Label>
                <Input
                  id="nameAr"
                  value={newMenuItem.nameAr}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="اسم الطبق بالعربي"
                  className="arabic-text"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Dish description in English"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr" className="arabic-text">الوصف بالعربي</Label>
                <Textarea
                  id="descriptionAr"
                  value={newMenuItem.descriptionAr}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, descriptionAr: e.target.value }))}
                  placeholder="وصف الطبق بالعربي"
                  className="arabic-text"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="arabic-text">السعر (ريال)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newMenuItem.price}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preparationTime" className="arabic-text">وقت التحضير (دقيقة)</Label>
                <Input
                  id="preparationTime"
                  type="number"
                  value={newMenuItem.preparationTime}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, preparationTime: Number(e.target.value) }))}
                  placeholder="15"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addMenuItem} className="flex-1 arabic-text">
                إضافة الطبق
              </Button>
              <Button variant="outline" onClick={() => setShowAddMenuItem(false)} className="arabic-text">
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default KitchenView
