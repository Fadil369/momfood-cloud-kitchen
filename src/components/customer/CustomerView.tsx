import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKV } from '@/hooks/useLocalStorage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Clock, Star, ShoppingCart, MagnifyingGlass, Plus, Minus, Trash, MapPin, User, Phone, CreditCard, Receipt, Truck, CheckCircle, X, ClockCounterClockwise, Package } from '@phosphor-icons/react'
import React from 'react'
import { toast } from 'sonner'
import { mockRestaurants, type Restaurant, type MenuItem } from '@/lib/mockData'
import { STORAGE_KEYS, ORDER_STATUS } from '@/lib/constants'
import { type Order, type OrderItem } from '@/lib/validation'

interface CartItem {
  id: string
  name: string
  nameAr: string
  price: number
  quantity: number
  restaurantId: string
}

interface CustomerOrder extends Omit<Order, 'customerId' | 'customerName' | 'customerPhone' | 'items'> {
  orderId: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  orderDate: Date
  estimatedDeliveryTime: Date
}

interface DeliveryAddress {
  id: string
  title: string
  fullAddress: string
  area: string
  city: string
  building?: string
  floor?: string
  apartment?: string
  isDefault: boolean
}

interface CustomerInfo {
  name: string
  phone: string
  email?: string
  addresses: DeliveryAddress[]
}

interface CheckoutFormData {
  customerName: string
  customerPhone: string
  selectedAddressId: string
  newAddress?: Omit<DeliveryAddress, 'id' | 'isDefault'>
  specialInstructions?: string
  paymentMethod: 'cash' | 'card' | 'wallet'
}

export function CustomerView() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useKV<CartItem[]>(STORAGE_KEYS.CUSTOMER_CART, [])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  
  // Checkout related state
  const [showCheckout, setShowCheckout] = useState(false)
  const [showCartDetails, setShowCartDetails] = useState(false)
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState<CustomerOrder | null>(null)
  
  // Customer and order data
  const [customerInfo, setCustomerInfo] = useKV<CustomerInfo>('customer-info', {
    name: '',
    phone: '',
    addresses: []
  })
  const [orders, setOrders] = useKV<CustomerOrder[]>('customer-orders', [])
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormData>({
    customerName: '',
    customerPhone: '',
    selectedAddressId: '',
    paymentMethod: 'cash'
  })

  useEffect(() => {
    setRestaurants(mockRestaurants)
  }, [])

  const categories = [
    { id: 'all', name: 'الكل', nameEn: 'All' },
    { id: 'arabic', name: 'عربي', nameEn: 'Arabic' },
    { id: 'fastfood', name: 'وجبات سريعة', nameEn: 'Fast Food' },
    { id: 'healthy', name: 'صحي', nameEn: 'Healthy' },
    { id: 'desserts', name: 'حلويات', nameEn: 'Desserts' },
  ]

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           restaurant.nameAr.includes(searchQuery)
      const matchesCategory = selectedCategory === 'all' || restaurant.cuisine === selectedCategory
      return matchesSearch && matchesCategory && restaurant.isOpen
    })
  }, [restaurants, searchQuery, selectedCategory])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }, [cart])

  const addToCart = useCallback((menuItem: MenuItem, restaurantId: string) => {
    // Check if cart has items from different restaurant
    if (cart.length > 0 && cart[0].restaurantId !== restaurantId) {
      const restaurantName = restaurants.find(r => r.id === restaurantId)?.nameAr || 'المطعم'
      toast.error('لا يمكن الطلب من مطاعم مختلفة في نفس الطلب', {
        description: `يرجى إفراغ السلة أولاً للطلب من ${restaurantName}`
      })
      return
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === menuItem.id)
      if (existingItem) {
        return currentCart.map(item =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...currentCart, {
          id: menuItem.id,
          name: menuItem.name,
          nameAr: menuItem.nameAr,
          price: menuItem.price,
          quantity: 1,
          restaurantId
        }]
      }
    })
    
    toast.success('تم إضافة العنصر للسلة', {
      description: menuItem.nameAr,
      duration: 2000
    })
  }, [cart, restaurants])

  const removeFromCart = useCallback((itemId: string) => {
    setCart(currentCart => {
      return currentCart.map(item =>
        item.id === itemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0)
    })
  }, [])

  const removeItemCompletely = useCallback((itemId: string) => {
    const item = cart.find(c => c.id === itemId)
    setCart(currentCart => currentCart.filter(item => item.id !== itemId))
    if (item) {
      toast.success('تم حذف العنصر من السلة', {
        description: item.nameAr
      })
    }
  }, [cart])

  const clearCart = useCallback(() => {
    setCart([])
    toast.success('تم إفراغ السلة')
  }, [])

  const generateOrderId = (): string => {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 7)
    return `MF${timestamp}${randomStr}`.toUpperCase()
  }

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة')
      return
    }

    if (!checkoutForm.customerName || !checkoutForm.customerPhone) {
      toast.error('يرجى ملء جميع البيانات المطلوبة')
      return
    }

    let deliveryAddress = ''
    if (checkoutForm.selectedAddressId) {
      const selectedAddr = customerInfo.addresses.find(addr => addr.id === checkoutForm.selectedAddressId)
      if (selectedAddr) {
        deliveryAddress = `${selectedAddr.fullAddress}, ${selectedAddr.area}, ${selectedAddr.city}`
        if (selectedAddr.building) deliveryAddress += `, مبنى ${selectedAddr.building}`
        if (selectedAddr.floor) deliveryAddress += `, الطابق ${selectedAddr.floor}`
        if (selectedAddr.apartment) deliveryAddress += `, شقة ${selectedAddr.apartment}`
      }
    } else if (checkoutForm.newAddress) {
      const addr = checkoutForm.newAddress
      deliveryAddress = `${addr.fullAddress}, ${addr.area}, ${addr.city}`
      if (addr.building) deliveryAddress += `, مبنى ${addr.building}`
      if (addr.floor) deliveryAddress += `, الطابق ${addr.floor}`
      if (addr.apartment) deliveryAddress += `, شقة ${addr.apartment}`
    }

    if (!deliveryAddress) {
      toast.error('يرجى تحديد عنوان التوصيل')
      return
    }

    setIsPlacingOrder(true)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const restaurant = restaurants.find(r => r.id === cart[0].restaurantId)
      if (!restaurant) {
        throw new Error('Restaurant not found')
      }

      const orderItems: OrderItem[] = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        nameAr: item.nameAr,
        quantity: item.quantity,
        price: item.price
      }))

      const newOrder: CustomerOrder = {
        orderId: generateOrderId(),
        customerName: checkoutForm.customerName,
        customerPhone: checkoutForm.customerPhone,
        restaurantId: restaurant.id,
        restaurantName: restaurant.nameAr,
        items: orderItems,
        status: ORDER_STATUS.PENDING,
        total: cartTotal,
        deliveryFee: restaurant.deliveryFee,
        deliveryAddress,
        specialInstructions: checkoutForm.specialInstructions,
        orderDate: new Date(),
        timestamp: new Date(),
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
      }

      // Save order
      setOrders(prevOrders => [newOrder, ...prevOrders])

      // Update customer info if new address was provided
      if (checkoutForm.newAddress) {
        const newAddress: DeliveryAddress = {
          ...checkoutForm.newAddress,
          id: `addr_${Date.now()}`,
          isDefault: customerInfo.addresses.length === 0
        }
        setCustomerInfo(prev => ({
          ...prev,
          name: checkoutForm.customerName,
          phone: checkoutForm.customerPhone,
          addresses: [...prev.addresses, newAddress]
        }))
      } else {
        setCustomerInfo(prev => ({
          ...prev,
          name: checkoutForm.customerName,
          phone: checkoutForm.customerPhone
        }))
      }

      // Clear cart and close checkout
      setCart([])
      setShowCheckout(false)
      setOrderConfirmation(newOrder)

      toast.success('تم إرسال الطلب بنجاح!', {
        description: `رقم الطلب: ${newOrder.orderId}`
      })

    } catch (error) {
      console.error('Order placement failed:', error)
      toast.error('فشل في إرسال الطلب', {
        description: 'يرجى المحاولة مرة أخرى'
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }, [cart, cartTotal, checkoutForm, customerInfo, restaurants])

  const getOrderStatus = (status: string): { text: string; color: string } => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return { text: 'في الانتظار', color: 'bg-yellow-500' }
      case ORDER_STATUS.CONFIRMED:
        return { text: 'تم التأكيد', color: 'bg-blue-500' }
      case ORDER_STATUS.PREPARING:
        return { text: 'قيد التحضير', color: 'bg-orange-500' }
      case ORDER_STATUS.READY:
        return { text: 'جاهز للاستلام', color: 'bg-purple-500' }
      case ORDER_STATUS.PICKED_UP:
        return { text: 'في الطريق', color: 'bg-indigo-500' }
      case ORDER_STATUS.DELIVERED:
        return { text: 'تم التوصيل', color: 'bg-green-500' }
      case ORDER_STATUS.CANCELLED:
        return { text: 'ملغي', color: 'bg-red-500' }
      default:
        return { text: status, color: 'bg-gray-500' }
    }
  }

  // Initialize checkout form with customer info
  useEffect(() => {
    setCheckoutForm(prev => ({
      ...prev,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      selectedAddressId: customerInfo.addresses.find(addr => addr.isDefault)?.id || ''
    }))
  }, [customerInfo])

  const getItemQuantity = useCallback((itemId: string): number => {
    const item = cart.find(cartItem => cartItem.id === itemId)
    return item ? item.quantity : 0
  }, [cart])

  const handleRestaurantSelect = useCallback((restaurant: Restaurant) => {
    navigate(`/restaurant/${restaurant.id}`)
  }, [navigate])

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن المطاعم أو الأطباق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 arabic-text"
            dir="rtl"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap arabic-text"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-primary to-accent text-white">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold arabic-text">أهلا وسهلا بكم في لقمه يمه</h2>
            <p className="text-white/90 arabic-text">اطلب وجبتك المفضلة الآن!</p>
          </div>
        </CardContent>
      </Card>

      {/* Featured Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold arabic-text">المطاعم المميزة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.filter(r => r.featured).map((restaurant) => (
            <MemoizedRestaurantCard 
              key={restaurant.id} 
              restaurant={restaurant} 
              onSelect={handleRestaurantSelect}
            />
          ))}
        </div>
      </div>

      {/* All Restaurants */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold arabic-text">جميع المطاعم</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.map((restaurant) => (
            <MemoizedRestaurantCard 
              key={restaurant.id} 
              restaurant={restaurant} 
              onSelect={handleRestaurantSelect}
            />
          ))}
        </div>
      </div>

      {/* Restaurant Menu Modal */}
      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedRestaurant && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-right arabic-text" dir="rtl">
                  {selectedRestaurant.nameAr}
                </DialogTitle>
                <p className="text-muted-foreground text-right arabic-text" dir="rtl">
                  {selectedRestaurant.descriptionAr}
                </p>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedRestaurant.menu.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="text-right" dir="rtl">
                          <h3 className="font-semibold arabic-text">{item.nameAr}</h3>
                          <p className="text-sm text-muted-foreground arabic-text">{item.descriptionAr}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getItemQuantity(item.id) > 0 ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-medium w-8 text-center">
                                  {getItemQuantity(item.id)}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item, selectedRestaurant.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addToCart(item, selectedRestaurant.id)}
                                className="flex items-center gap-1"
                              >
                                <Plus className="h-4 w-4" />
                                <span className="arabic-text">إضافة</span>
                              </Button>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{item.price} ريال</p>
                            <p className="text-xs text-muted-foreground arabic-text">
                              {item.preparationTime} دقيقة
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Summary (when items exist) */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 z-50">
          <Card className="bg-primary text-primary-foreground shadow-lg animate-slide-up">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5" />
                  <div className="text-right" dir="rtl">
                    <p className="font-medium arabic-text">{cart.length} عنصر</p>
                    <p className="text-sm opacity-90">{cartTotal} ريال</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="arabic-text"
                    onClick={() => setShowCartDetails(true)}
                  >
                    عرض السلة
                  </Button>
                  {cart.length > 0 && (
                    <Button 
                      size="sm" 
                      className="arabic-text bg-green-600 hover:bg-green-700"
                      onClick={() => setShowCheckout(true)}
                    >
                      اطلب الآن
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cart Details Dialog */}
      <Dialog open={showCartDetails} onOpenChange={setShowCartDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right arabic-text" dir="rtl">تفاصيل السلة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4" dir="rtl">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="arabic-text">السلة فارغة</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-muted">
                        <div className="flex-1">
                          <h4 className="font-medium arabic-text">{item.nameAr}</h4>
                          <p className="text-sm text-muted-foreground">{item.price} ريال</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            onClick={() => addToCart({ 
                              id: item.id, 
                              name: item.name, 
                              nameAr: item.nameAr, 
                              price: item.price,
                              description: '',
                              descriptionAr: '',
                              category: '',
                              image: '',
                              available: true,
                              preparationTime: 15
                            }, item.restaurantId)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItemCompletely(item.id)}
                            className="h-8 w-8 p-0 ml-2"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="arabic-text">المجموع:</span>
                    <span>{cartTotal} ريال</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={clearCart}
                      className="flex-1 arabic-text"
                    >
                      <Trash className="h-4 w-4 ml-2" />
                      إفراغ السلة
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowCartDetails(false)
                        setShowCheckout(true)
                      }}
                      className="flex-1 arabic-text"
                      disabled={cart.length === 0}
                    >
                      <CreditCard className="h-4 w-4 ml-2" />
                      اطلب الآن
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right arabic-text" dir="rtl">تأكيد الطلب</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6" dir="rtl">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text text-base">ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="arabic-text">{item.nameAr} × {item.quantity}</span>
                    <span>{item.price * item.quantity} ريال</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span className="arabic-text">المجموع:</span>
                  <span>{cartTotal} ريال</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text text-base">معلومات العميل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="arabic-text">الاسم *</Label>
                  <Input
                    id="customerName"
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="ادخل اسمك"
                    className="arabic-text"
                    dir="rtl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="arabic-text">رقم الهاتف *</Label>
                  <Input
                    id="customerPhone"
                    value={checkoutForm.customerPhone}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text text-base">عنوان التوصيل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customerInfo.addresses.length > 0 && (
                  <div className="space-y-3">
                    <Label className="arabic-text">اختر من العناوين المحفوظة:</Label>
                    {customerInfo.addresses.map((address) => (
                      <div key={address.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={checkoutForm.selectedAddressId === address.id}
                          onChange={(e) => setCheckoutForm(prev => ({ 
                            ...prev, 
                            selectedAddressId: e.target.value,
                            newAddress: undefined
                          }))}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium arabic-text">{address.title}</div>
                          <div className="text-sm text-muted-foreground arabic-text">
                            {address.fullAddress}, {address.area}, {address.city}
                            {address.building && `, مبنى ${address.building}`}
                            {address.floor && `, الطابق ${address.floor}`}
                            {address.apartment && `, شقة ${address.apartment}`}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Separator className="my-4" />
                  </div>
                )}
                
                {/* New Address Form */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="address"
                      value="new"
                      checked={!checkoutForm.selectedAddressId}
                      onChange={() => setCheckoutForm(prev => ({ ...prev, selectedAddressId: '' }))}
                    />
                    <Label className="arabic-text">إضافة عنوان جديد</Label>
                  </div>
                  
                  {!checkoutForm.selectedAddressId && (
                    <div className="space-y-4 ml-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="arabic-text">عنوان العنوان *</Label>
                          <Input
                            value={checkoutForm.newAddress?.title || ''}
                            onChange={(e) => setCheckoutForm(prev => ({
                              ...prev,
                              newAddress: { 
                                ...prev.newAddress,
                                title: e.target.value,
                                fullAddress: prev.newAddress?.fullAddress || '',
                                area: prev.newAddress?.area || '',
                                city: prev.newAddress?.city || ''
                              }
                            }))}
                            placeholder="مثل: المنزل، العمل"
                            className="arabic-text"
                            dir="rtl"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="arabic-text">المدينة *</Label>
                          <Input
                            value={checkoutForm.newAddress?.city || ''}
                            onChange={(e) => setCheckoutForm(prev => ({
                              ...prev,
                              newAddress: { ...prev.newAddress!, city: e.target.value }
                            }))}
                            placeholder="الرياض"
                            className="arabic-text"
                            dir="rtl"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="arabic-text">المنطقة *</Label>
                          <Input
                            value={checkoutForm.newAddress?.area || ''}
                            onChange={(e) => setCheckoutForm(prev => ({
                              ...prev,
                              newAddress: { ...prev.newAddress!, area: e.target.value }
                            }))}
                            placeholder="حي الملز"
                            className="arabic-text"
                            dir="rtl"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="arabic-text">رقم المبنى</Label>
                          <Input
                            value={checkoutForm.newAddress?.building || ''}
                            onChange={(e) => setCheckoutForm(prev => ({
                              ...prev,
                              newAddress: { ...prev.newAddress!, building: e.target.value }
                            }))}
                            placeholder="1234"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="arabic-text">العنوان كاملاً *</Label>
                        <Textarea
                          value={checkoutForm.newAddress?.fullAddress || ''}
                          onChange={(e) => setCheckoutForm(prev => ({
                            ...prev,
                            newAddress: { ...prev.newAddress!, fullAddress: e.target.value }
                          }))}
                          placeholder="شارع الملك فهد، حي الملز"
                          className="arabic-text"
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="arabic-text">الطابق</Label>
                          <Input
                            value={checkoutForm.newAddress?.floor || ''}
                            onChange={(e) => setCheckoutForm(prev => ({
                              ...prev,
                              newAddress: { ...prev.newAddress!, floor: e.target.value }
                            }))}
                            placeholder="الثالث"
                            className="arabic-text"
                            dir="rtl"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="arabic-text">رقم الشقة</Label>
                          <Input
                            value={checkoutForm.newAddress?.apartment || ''}
                            onChange={(e) => setCheckoutForm(prev => ({
                              ...prev,
                              newAddress: { ...prev.newAddress!, apartment: e.target.value }
                            }))}
                            placeholder="12"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text text-base">تعليمات خاصة</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={checkoutForm.specialInstructions || ''}
                  onChange={(e) => setCheckoutForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="أي تعليمات خاصة للطبخ أو التوصيل (اختياري)"
                  className="arabic-text"
                  dir="rtl"
                />
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text text-base">طريقة الدفع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={checkoutForm.paymentMethod === 'cash'}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' }))}
                  />
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    <span className="arabic-text">دفع نقدي عند الاستلام</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={checkoutForm.paymentMethod === 'card'}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value as 'card' }))}
                  />
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="arabic-text">بطاقة ائتمانية/مدى</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCheckout(false)}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button 
              onClick={placeOrder}
              disabled={isPlacingOrder || cart.length === 0}
              className="arabic-text"
            >
              {isPlacingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  تأكيد الطلب ({cartTotal} ريال)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <Dialog open={!!orderConfirmation} onOpenChange={() => setOrderConfirmation(null)}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4" dir="rtl">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <DialogTitle className="arabic-text text-xl">تم إرسال الطلب بنجاح!</DialogTitle>
              <p className="text-muted-foreground arabic-text mt-2">
                رقم الطلب: {orderConfirmation?.orderId}
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="arabic-text">المطعم:</span>
                <span className="arabic-text">{orderConfirmation?.restaurantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="arabic-text">المبلغ الإجمالي:</span>
                <span>{orderConfirmation?.total} ريال</span>
              </div>
              <div className="flex justify-between">
                <span className="arabic-text">وقت التوصيل المتوقع:</span>
                <span>{orderConfirmation?.estimatedDeliveryTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setOrderConfirmation(null)}
                className="flex-1 arabic-text"
              >
                إغلاق
              </Button>
              <Button 
                onClick={() => {
                  setOrderConfirmation(null)
                  setShowOrderHistory(true)
                }}
                className="flex-1 arabic-text"
              >
                <Truck className="h-4 w-4 mr-2" />
                تتبع الطلب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order History Dialog */}
      <Dialog open={showOrderHistory} onOpenChange={setShowOrderHistory}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-right arabic-text" dir="rtl">
              <ClockCounterClockwise className="inline h-5 w-5 ml-2" />
              سجل الطلبات
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-96">
            <div className="space-y-4" dir="rtl">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="arabic-text">لا توجد طلبات سابقة</p>
                </div>
              ) : (
                orders.map((order) => {
                  const statusInfo = getOrderStatus(order.status)
                  return (
                    <Card key={order.orderId}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold arabic-text">{order.restaurantName}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.orderDate.toLocaleDateString('ar-SA')} - {order.orderDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <Badge className={`${statusInfo.color} text-white arabic-text`}>
                              {statusInfo.text}
                            </Badge>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="arabic-text">رقم الطلب:</span>
                              <span className="font-mono">{order.orderId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="arabic-text">المبلغ:</span>
                              <span>{order.total} ريال</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="arabic-text">عدد الأصناف:</span>
                              <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="arabic-text">{item.nameAr}</span>
                                <span>×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          
                          {order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.CANCELLED && (
                            <div className="pt-2">
                              <div className="text-xs text-muted-foreground arabic-text">
                                وقت التوصيل المتوقع: {order.estimatedDeliveryTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const RestaurantCard = React.memo(function RestaurantCard({ restaurant, onSelect }: { 
  restaurant: Restaurant
  onSelect: (restaurant: Restaurant) => void 
}) {
  const handleClick = useCallback(() => onSelect(restaurant), [restaurant, onSelect])
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="aspect-video bg-muted relative">
        {restaurant.featured && (
          <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
            مميز
          </Badge>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-2 left-2">
          <Badge variant={restaurant.isOpen ? "default" : "destructive"} className="arabic-text">
            {restaurant.isOpen ? 'مفتوح' : 'مغلق'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="text-right" dir="rtl">
            <h3 className="font-semibold arabic-text group-hover:text-primary transition-colors">
              {restaurant.nameAr}
            </h3>
            <p className="text-sm text-muted-foreground">{restaurant.name}</p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{restaurant.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="arabic-text">{restaurant.deliveryTime}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="arabic-text">
              {getCuisineNameAr(restaurant.cuisine)}
            </Badge>
            <p className="text-sm text-muted-foreground arabic-text">
              رسوم التوصيل: {restaurant.deliveryFee} ريال
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

const MemoizedRestaurantCard = React.memo(RestaurantCard)

function getCuisineNameAr(cuisine: string): string {
  const cuisineMap: Record<string, string> = {
    'arabic': 'عربي',
    'fastfood': 'وجبات سريعة',
    'healthy': 'صحي',
    'desserts': 'حلويات'
  }
  return cuisineMap[cuisine] || cuisine
}

export default CustomerView
