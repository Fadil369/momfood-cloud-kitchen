import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Star, ShoppingCart, Search, Filter } from '@phosphor-icons/react'

interface Restaurant {
  id: string
  name: string
  nameAr: string
  cuisine: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  image: string
  featured: boolean
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  restaurantId: string
}

export function CustomerView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useKV<CartItem[]>('customer-cart', [])
  const [restaurants] = useKV<Restaurant[]>('restaurants', [])

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
    return matchesSearch && matchesCategory
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن المطاعم أو الأطباق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
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
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">المطاعم المميزة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.filter(r => r.featured).map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </div>

      {/* All Restaurants */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">جميع المطاعم</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </div>

      {/* Cart Summary (when items exist) */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 z-50">
          <Card className="bg-primary text-primary-foreground shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{cart.length} عنصر</p>
                    <p className="text-sm opacity-90">{cartTotal} ريال</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm">
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

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="aspect-video bg-muted relative">
        {restaurant.featured && (
          <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
            مميز
          </Badge>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold">{restaurant.nameAr}</h3>
            <p className="text-sm text-muted-foreground">{restaurant.name}</p>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{restaurant.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{restaurant.deliveryTime}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              رسوم التوصيل: {restaurant.deliveryFee} ريال
            </p>
            <Badge variant="secondary">{restaurant.cuisine}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}