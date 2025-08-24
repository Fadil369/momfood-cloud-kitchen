import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Star, Clock, Plus, Minus } from '@phosphor-icons/react'
import { PageErrorBoundary } from '@/components/common/ErrorBoundary'
import { mockRestaurants, type Restaurant, type MenuItem } from '@/lib/mockData'
import { useKV } from '@/hooks/useLocalStorage'

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [cart, setCart] = useKV<Array<{ id: string; name: string; price: number; quantity: number }>>('cart', [])

  useEffect(() => {
    const foundRestaurant = mockRestaurants.find(r => r.id === id)
    setRestaurant(foundRestaurant || null)
  }, [id])

  const addToCart = (item: MenuItem) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        return currentCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...currentCart, { 
          id: item.id, 
          name: item.name, 
          price: item.price, 
          quantity: 1 
        }]
      }
    })
  }

  const updateQuantity = (itemId: string, change: number) => {
    setCart(currentCart => {
      return currentCart.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change)
          return newQuantity === 0 
            ? null 
            : { ...item, quantity: newQuantity }
        }
        return item
      }).filter(Boolean) as typeof currentCart
    })
  }

  const getItemQuantity = (itemId: string) => {
    const item = cart.find(cartItem => cartItem.id === itemId)
    return item ? item.quantity : 0
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">المطعم غير موجود</h1>
        <Button onClick={() => navigate('/customer')}>
          العودة للقائمة الرئيسية
        </Button>
      </div>
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <PageErrorBoundary language="ar">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-primary to-primary/80 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customer')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة
              </Button>
            </div>
          </div>
          
          <div className="container mx-auto px-4 -mt-20 relative z-20">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                      <Badge variant={restaurant.isOpen ? 'default' : 'secondary'}>
                        {restaurant.isOpen ? 'مفتوح' : 'مغلق'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground arabic-text" dir="rtl">{restaurant.nameAr}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{restaurant.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                      <Badge variant="outline">{restaurant.cuisine}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Menu */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-bold mb-6 arabic-text" dir="rtl">القائمة</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {restaurant.menu.map((item) => {
              const quantity = getItemQuantity(item.id)
              
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-muted-foreground arabic-text text-sm" dir="rtl">
                          {item.nameAr}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-primary">
                            {item.price} ر.س
                          </span>
                          
                          {quantity === 0 ? (
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                              disabled={!restaurant.isOpen}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              إضافة
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-semibold px-3">{quantity}</span>
                              <Button
                                size="sm"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Cart Summary */}
        {cartItemsCount > 0 && (
          <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-40">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{cartItemsCount} عنصر في السلة</p>
                    <p className="text-sm text-muted-foreground">
                      المجموع: {cartTotal.toFixed(2)} ر.س
                    </p>
                  </div>
                  <Button onClick={() => navigate('/customer')}>
                    عرض السلة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="pb-32 md:pb-20"></div>
      </div>
    </PageErrorBoundary>
  )
}