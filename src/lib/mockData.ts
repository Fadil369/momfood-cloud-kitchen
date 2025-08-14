// Mock data for MomFood application
export interface Restaurant {
  id: string
  name: string
  nameAr: string
  cuisine: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  image: string
  featured: boolean
  description: string
  descriptionAr: string
  isOpen: boolean
  menu: MenuItem[]
}

export interface MenuItem {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  price: number
  category: string
  image: string
  available: boolean
  preparationTime: number
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  restaurantId: string
  restaurantName: string
  items: Array<{ 
    menuItemId: string
    name: string
    nameAr: string
    quantity: number
    price: number
    customizations?: string[]
  }>
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  total: number
  deliveryFee: number
  timestamp: Date
  deliveryAddress: string
  pickupAddress: string
  estimatedDeliveryTime: string
  driverId?: string
  notes?: string
}

export interface Driver {
  id: string
  name: string
  nameAr: string
  phone: string
  rating: number
  totalDeliveries: number
  isOnline: boolean
  currentLocation: { lat: number; lng: number }
  vehicle: 'motorcycle' | 'car' | 'bicycle'
}

export interface Customer {
  id: string
  name: string
  nameAr: string
  phone: string
  email: string
  addresses: Array<{
    id: string
    type: 'home' | 'work' | 'other'
    address: string
    coordinates: { lat: number; lng: number }
    isDefault: boolean
  }>
  orderHistory: string[]
}

// Mock restaurants data
export const mockRestaurants: Restaurant[] = [
  {
    id: 'rest-001',
    name: 'Mama Layla Kitchen',
    nameAr: 'مطبخ ماما ليلى',
    cuisine: 'arabic',
    rating: 4.8,
    deliveryTime: '25-35 دقيقة',
    deliveryFee: 15,
    image: '/images/restaurants/mama-layla.jpg',
    featured: true,
    description: 'Authentic homemade Arabic dishes prepared with love',
    descriptionAr: 'أطباق عربية أصيلة محضرة بحب في المنزل',
    isOpen: true,
    menu: [
      {
        id: 'item-001',
        name: 'Kabsa with Chicken',
        nameAr: 'كبسة دجاج',
        description: 'Traditional Saudi rice dish with tender chicken and aromatic spices',
        descriptionAr: 'طبق الأرز السعودي التقليدي مع الدجاج الطري والبهارات العطرة',
        price: 45,
        category: 'main',
        image: '/images/food/kabsa-chicken.jpg',
        available: true,
        preparationTime: 30
      },
      {
        id: 'item-002',
        name: 'Mutabbal',
        nameAr: 'متبل',
        description: 'Smoky grilled eggplant dip with tahini and garlic',
        descriptionAr: 'دقة الباذنجان المشوي مع الطحينة والثوم',
        price: 18,
        category: 'appetizer',
        image: '/images/food/mutabbal.jpg',
        available: true,
        preparationTime: 10
      }
    ]
  },
  {
    id: 'rest-002',
    name: 'Burger Haven',
    nameAr: 'ملاذ البرجر',
    cuisine: 'fastfood',
    rating: 4.5,
    deliveryTime: '15-25 دقيقة',
    deliveryFee: 12,
    image: '/images/restaurants/burger-haven.jpg',
    featured: true,
    description: 'Gourmet burgers made with fresh ingredients',
    descriptionAr: 'برجر فاخر مصنوع من مكونات طازجة',
    isOpen: true,
    menu: [
      {
        id: 'item-003',
        name: 'Classic Cheeseburger',
        nameAr: 'تشيز برجر كلاسيكي',
        description: 'Juicy beef patty with cheese, lettuce, tomato, and special sauce',
        descriptionAr: 'قطعة لحم عصيرة مع الجبن والخس والطماطم والصوص الخاص',
        price: 28,
        category: 'main',
        image: '/images/food/cheeseburger.jpg',
        available: true,
        preparationTime: 15
      }
    ]
  },
  {
    id: 'rest-003',
    name: 'Green Garden',
    nameAr: 'الحديقة الخضراء',
    cuisine: 'healthy',
    rating: 4.6,
    deliveryTime: '20-30 دقيقة',
    deliveryFee: 10,
    image: '/images/restaurants/green-garden.jpg',
    featured: false,
    description: 'Fresh and healthy meals for a balanced lifestyle',
    descriptionAr: 'وجبات طازجة وصحية لحياة متوازنة',
    isOpen: true,
    menu: [
      {
        id: 'item-004',
        name: 'Quinoa Buddha Bowl',
        nameAr: 'وعاء الكينوا',
        description: 'Nutritious quinoa bowl with roasted vegetables and tahini dressing',
        descriptionAr: 'وعاء الكينوا المغذي مع الخضار المحمصة وصوص الطحينة',
        price: 35,
        category: 'main',
        image: '/images/food/quinoa-bowl.jpg',
        available: true,
        preparationTime: 20
      }
    ]
  },
  {
    id: 'rest-004',
    name: 'Sweet Dreams',
    nameAr: 'أحلام حلوة',
    cuisine: 'desserts',
    rating: 4.9,
    deliveryTime: '10-20 دقيقة',
    deliveryFee: 8,
    image: '/images/restaurants/sweet-dreams.jpg',
    featured: true,
    description: 'Delightful desserts and sweets for every occasion',
    descriptionAr: 'حلويات رائعة لكل مناسبة',
    isOpen: true,
    menu: [
      {
        id: 'item-005',
        name: 'Umm Ali',
        nameAr: 'أم علي',
        description: 'Traditional Egyptian bread pudding with nuts and raisins',
        descriptionAr: 'حلوى مصرية تقليدية بالمكسرات والزبيب',
        price: 22,
        category: 'dessert',
        image: '/images/food/umm-ali.jpg',
        available: true,
        preparationTime: 15
      }
    ]
  }
]

// Mock orders data
export const mockOrders: Order[] = [
  {
    id: 'order-001',
    customerId: 'cust-001',
    customerName: 'أحمد محمد',
    customerPhone: '+966501234567',
    restaurantId: 'rest-001',
    restaurantName: 'مطبخ ماما ليلى',
    items: [
      {
        menuItemId: 'item-001',
        name: 'Kabsa with Chicken',
        nameAr: 'كبسة دجاج',
        quantity: 2,
        price: 45
      },
      {
        menuItemId: 'item-002',
        name: 'Mutabbal',
        nameAr: 'متبل',
        quantity: 1,
        price: 18
      }
    ],
    status: 'preparing',
    total: 108,
    deliveryFee: 15,
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    deliveryAddress: 'شارع الملك فهد الرياض 12345',
    pickupAddress: 'حي العليا الرياض',
    estimatedDeliveryTime: '25 دقيقة',
    notes: 'بدون بصل في الكبسة'
  },
  {
    id: 'order-002',
    customerId: 'cust-002',
    customerName: 'فاطمة أحمد',
    customerPhone: '+966507654321',
    restaurantId: 'rest-002',
    restaurantName: 'ملاذ البرجر',
    items: [
      {
        menuItemId: 'item-003',
        name: 'Classic Cheeseburger',
        nameAr: 'تشيز برجر كلاسيكي',
        quantity: 1,
        price: 28
      }
    ],
    status: 'pending',
    total: 40,
    deliveryFee: 12,
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    deliveryAddress: 'شارع العروبة الرياض 11564',
    pickupAddress: 'حي النخيل الرياض',
    estimatedDeliveryTime: '20 دقيقة'
  }
]

// Mock drivers data
export const mockDrivers: Driver[] = [
  {
    id: 'driver-001',
    name: 'Mohammed Ali',
    nameAr: 'محمد علي',
    phone: '+966501111111',
    rating: 4.8,
    totalDeliveries: 245,
    isOnline: true,
    currentLocation: { lat: 24.7136, lng: 46.6753 },
    vehicle: 'motorcycle'
  },
  {
    id: 'driver-002',
    name: 'Salem Abdullah',
    nameAr: 'سالم عبدالله',
    phone: '+966502222222',
    rating: 4.6,
    totalDeliveries: 189,
    isOnline: true,
    currentLocation: { lat: 24.7242, lng: 46.6847 },
    vehicle: 'car'
  }
]

// Mock customers data
export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Ahmed Mohammed',
    nameAr: 'أحمد محمد',
    phone: '+966501234567',
    email: 'ahmed@example.com',
    addresses: [
      {
        id: 'addr-001',
        type: 'home',
        address: 'شارع الملك فهد الرياض 12345',
        coordinates: { lat: 24.7136, lng: 46.6753 },
        isDefault: true
      }
    ],
    orderHistory: ['order-001']
  },
  {
    id: 'cust-002',
    name: 'Fatima Ahmed',
    nameAr: 'فاطمة أحمد',
    phone: '+966507654321',
    email: 'fatima@example.com',
    addresses: [
      {
        id: 'addr-002',
        type: 'home',
        address: 'شارع العروبة الرياض 11564',
        coordinates: { lat: 24.7242, lng: 46.6847 },
        isDefault: true
      }
    ],
    orderHistory: ['order-002']
  }
]

// Helper functions for data management
export const findRestaurantById = (id: string): Restaurant | undefined => {
  return mockRestaurants.find(restaurant => restaurant.id === id)
}

export const findOrderById = (id: string): Order | undefined => {
  return mockOrders.find(order => order.id === id)
}

export const findDriverById = (id: string): Driver | undefined => {
  return mockDrivers.find(driver => driver.id === id)
}

export const getAvailableDrivers = (): Driver[] => {
  return mockDrivers.filter(driver => driver.isOnline)
}

export const getOrdersByStatus = (status: Order['status']): Order[] => {
  return mockOrders.filter(order => order.status === status)
}

export const getRestaurantsByCategory = (cuisine: string): Restaurant[] => {
  if (cuisine === 'all') return mockRestaurants
  return mockRestaurants.filter(restaurant => restaurant.cuisine === cuisine)
}

export const getFeaturedRestaurants = (): Restaurant[] => {
  return mockRestaurants.filter(restaurant => restaurant.featured)
}
