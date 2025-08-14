import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { MapPin, Clock, Star, ShoppingCart, MagnifyingGlass, Funnel, Plus, Minus } from '@phosphor-icons/react'
import { mockRestaurants, type Restaurant, type MenuItem } from '@/lib/mockData'

interface CartItem {
  id: string
  name: string
  nameAr: string
  price: number
  quantity: number
  restaurantId: string
}

export function CustomerView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useKV<CartItem[]>('customer-cart', [])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

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

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.nameAr.includes(searchQuery)
    const matchesCategory = selectedCategory === 'all' || restaurant.cuisine === selectedCategory
    return matchesSearch && matchesCategory && restaurant.isOpen
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const addToCart = (menuItem: MenuItem, restaurantId: string) => {
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
  }

  const removeFromCart = (itemId: string) => {
    setCart(currentCart => {
      return currentCart.map(item =>
        item.id === itemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0)
    })
  }

  const getItemQuantity = (itemId: string): number => {
    const item = cart.find(cartItem => cartItem.id === itemId)
    return item ? item.quantity : 0
  }

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
            <RestaurantCard 
              key={restaurant.id} 
              restaurant={restaurant} 
              onSelect={setSelectedRestaurant}
            />
          ))}
        </div>
      </div>

      {/* All Restaurants */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold arabic-text">جميع المطاعم</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard 
              key={restaurant.id} 
              restaurant={restaurant} 
              onSelect={setSelectedRestaurant}
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
                <Button variant="secondary" size="sm" className="arabic-text">
                  عرض السلة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function RestaurantCard({ restaurant, onSelect }: { 
  restaurant: Restaurant
  onSelect: (restaurant: Restaurant) => void 
}) {
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect(restaurant)}
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
}

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
