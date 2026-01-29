import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type UserRole = 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'CUSTOMER'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  restaurantId?: string // Link admin to restaurant
  password: string
}

export interface Restaurant {
  id: string
  name: string
  description: string
  address: string
  phone: string
  package: 'BASIC' | 'PRO' | 'ENTERPRISE' | 'FREE_TRIAL'
  logo?: string
  rating?: number
  adminEmail: string // Email of the admin
  status: 'ACTIVE' | 'PENDING' | 'REJECTED'
  slug: string // URL friendly identifier
  paymentMethods?: PaymentMethod[]
  theme?: 'modern-emerald' | 'classic-orange' | 'minimal-blue'
}

export interface PaymentMethod {
  id: string
  type: string
  isActive: boolean
  merchantId?: string
  qrCode?: string
}

export interface OrderItem {
  menuItemId: string
  menuItemName: string
  price: number
  quantity: number
  categoryName?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone?: string
  items: OrderItem[]
  totalAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  paymentMethod: string
  restaurantId: string
  restaurantName: string
  tableNumber?: string
  createdAt: string
  notes?: string
}

export interface CartItem {
  menuItemId: string
  menuItemName: string
  price: number
  quantity: number
  image?: string
  categoryName?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  displayOrder: number
  isActive: boolean
}

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  isAvailable: boolean
  displayOrder: number
  categoryId: string
  categoryName?: string
  restaurantId: string // Link to restaurant
  isRecommended?: boolean
  isBestSeller?: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  menuLimit: number
  features: string[]
  isActive: boolean
}

export interface Announcement {
  id: string
  message: string
  isActive: boolean
  createdAt: string
}

export interface HelpdeskSettings {
  whatsapp: string
  email: string
}

interface AppState {
  user: User | null
  cart: CartItem[]
  selectedRestaurant: string | null
  users: User[]
  restaurants: Restaurant[]
  orders: Order[]
  menuItems: MenuItem[]
  categories: Category[]
  subscriptionPlans: SubscriptionPlan[]
  helpdeskSettings: HelpdeskSettings

  // Actions
  setUser: (user: User | null) => void
  logout: () => void
  addToCart: (item: CartItem) => void
  removeFromCart: (menuItemId: string) => void
  updateCartItemQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  setSelectedRestaurant: (restaurantId: string | null) => void
  getTotalCartAmount: () => number
  getTotalCartItems: () => number
  getRestaurantBySlug: (slug: string) => Restaurant | undefined

  // Data Actions
  setRestaurants: (restaurants: Restaurant[]) => void
  setUsers: (users: User[]) => void
  addRestaurant: (resto: Restaurant) => void
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => void
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  updateRestaurantStatus: (id: string, status: Restaurant['status']) => void
  validateOrder: (orderId: string) => void
  rejectOrder: (orderId: string) => void
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  resetSystem: () => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void
  deleteMenuItem: (id: string) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  resetPassword: (email: string, newPassword: string) => void
  updateSubscriptionPlan: (id: string, updates: Partial<SubscriptionPlan>) => void
  updateHelpdeskSettings: (settings: HelpdeskSettings) => void
  systemAnnouncements: Announcement[]
  broadcastAnnouncement: (message: string) => void
  clearAnnouncement: () => void
}

// Initial Mock Data
const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Manager Meenuin',
    email: 'manager@meenuin.biz.id',
    role: 'SUPER_ADMIN',
    password: 'manager123'
  },
  {
    id: 'u2',
    name: 'Resto Admin 1',
    email: 'resto@admin.com',
    role: 'RESTAURANT_ADMIN',
    restaurantId: '1',
    password: 'resto123'
  },
  {
    id: 'u2-alt',
    name: 'Resto Admin (Alt)',
    email: 'u@resto.com',
    role: 'RESTAURANT_ADMIN',
    restaurantId: '1',
    password: 'password'
  },
  {
    id: 'guest-user',
    name: 'Guest User',
    email: 'guest@temp.com',
    role: 'CUSTOMER',
    password: ''
  },
  {
    id: 'u3',
    name: 'Customer Demo',
    email: 'customer@demo.com',
    role: 'CUSTOMER',
    password: 'customer123'
  },
  {
    id: 'u4',
    name: 'Sushi Admin',
    email: 'sushi@admin.com',
    role: 'RESTAURANT_ADMIN',
    restaurantId: '2',
    password: 'sushi123'
  },
  {
    id: 'u5',
    name: 'Pizza Admin',
    email: 'pizza@admin.com',
    role: 'RESTAURANT_ADMIN',
    restaurantId: '3',
    password: 'pizza123'
  }
]

const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Warung Rasa Nusantara',
    description: 'Authentic Indonesian cuisine',
    address: 'Jl. Merdeka No. 1, Jakarta',
    phone: '08123456781',
    package: 'PRO',
    logo: '/restaurant-logo-indo.png',
    rating: 4.8,
    adminEmail: 'indo@admin.com',
    status: 'ACTIVE',
    slug: 'warung-rasa-nusantara'
  },
  {
    id: '2',
    name: 'Sushi Master',
    description: 'Fresh Japanese Sushi',
    address: 'Jl. Sudirman No. 55, Jakarta',
    phone: '08123456782',
    package: 'ENTERPRISE',
    logo: '/restaurant-logo-japanese.png',
    rating: 4.6,
    adminEmail: 'sushi@admin.com',
    status: 'ACTIVE',
    slug: 'sushi-master'
  },
  {
    id: '3',
    name: 'Pizza Paradise',
    description: 'Best Italian Pizza',
    address: 'Jl. Thamrin No. 99, Jakarta',
    phone: '08123456783',
    package: 'BASIC',
    logo: '/restaurant-logo-pizza.png',
    rating: 4.7,
    adminEmail: 'pizza@admin.com',
    status: 'ACTIVE',
    slug: 'pizza-paradise'
  }
]

// Initial Mock Data
const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Restaurant 1: Warung Rasa Nusantara
  { id: '1', restaurantId: '1', name: 'Nasi Goreng Spesial', description: 'Fried rice with special spices', price: 35000, isAvailable: true, displayOrder: 1, categoryId: '1', categoryName: 'Main Course' },
  { id: '2', restaurantId: '1', name: 'Sate Ayam', description: 'Grilled chicken skewers', price: 25000, isAvailable: true, displayOrder: 2, categoryId: '2', categoryName: 'Appetizer' },
  { id: '3', restaurantId: '1', name: 'Rendang', description: 'Slow-cooked beef', price: 45000, isAvailable: true, displayOrder: 3, categoryId: '1', categoryName: 'Main Course' },
  { id: '4', restaurantId: '1', name: 'Es Teh Manis', description: 'Sweet iced tea', price: 8000, isAvailable: true, displayOrder: 4, categoryId: '3', categoryName: 'Beverage' },

  // Restaurant 2: Sushi Master
  { id: '5', restaurantId: '2', name: 'Salmon Sashimi', description: 'Fresh Norwegian salmon', price: 85000, isAvailable: true, displayOrder: 1, categoryId: '1', categoryName: 'Main Course' },
  { id: '6', restaurantId: '2', name: 'California Roll', description: 'Crab, avocado, cucumber', price: 45000, isAvailable: true, displayOrder: 2, categoryId: '2', categoryName: 'Appetizer' },
  { id: '7', restaurantId: '2', name: 'Tuna Nigiri', description: 'Premium tuna sushi', price: 65000, isAvailable: true, displayOrder: 3, categoryId: '1', categoryName: 'Main Course' },
  { id: '8', restaurantId: '2', name: 'Green Tea', description: 'Traditional Japanese tea', price: 15000, isAvailable: true, displayOrder: 4, categoryId: '3', categoryName: 'Beverage' },

  // Restaurant 3: Pizza Paradise
  { id: '9', restaurantId: '3', name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', price: 75000, isAvailable: true, displayOrder: 1, categoryId: '1', categoryName: 'Main Course' },
  { id: '10', restaurantId: '3', name: 'Pepperoni Pizza', description: 'Spicy pepperoni slices', price: 85000, isAvailable: true, displayOrder: 2, categoryId: '1', categoryName: 'Main Course' },
  { id: '11', restaurantId: '3', name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 25000, isAvailable: true, displayOrder: 3, categoryId: '2', categoryName: 'Appetizer' },
  { id: '12', restaurantId: '3', name: 'Coca Cola', description: 'Chilled soft drink', price: 12000, isAvailable: true, displayOrder: 4, categoryId: '3', categoryName: 'Beverage' }
]

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Main Course', description: 'Main dishes', displayOrder: 1, isActive: true },
  { id: '2', name: 'Appetizer', description: 'Starters and snacks', displayOrder: 2, isActive: true },
  { id: '3', name: 'Beverage', description: 'Drinks', displayOrder: 3, isActive: true }
]

const INITIAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'FREE_TRIAL',
    name: 'Free Trial',
    description: 'Try all features for free',
    price: 0,
    menuLimit: 30,
    features: ['30 Menu Items', 'Basic Features', '14 Days Access'],
    isActive: true
  },
  {
    id: 'BASIC',
    name: 'Basic',
    description: 'Perfect for small restaurants',
    price: 99000,
    menuLimit: 50,
    features: ['50 Menu Items', 'Basic Analytics', 'Email Support', 'QR Code Generation'],
    isActive: true
  },
  {
    id: 'PRO',
    name: 'Pro',
    description: 'For growing businesses',
    price: 199000,
    menuLimit: 100,
    features: ['100 Menu Items', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
    isActive: true
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large chains',
    price: 499000,
    menuLimit: 1000,
    features: ['Unlimited Menu Items', 'Full Analytics Suite', '24/7 Support', 'API Access', 'Multi-branch Support'],
    isActive: true
  }
]

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      selectedRestaurant: null,
      users: INITIAL_USERS,
      restaurants: INITIAL_RESTAURANTS,
      orders: [],
      menuItems: INITIAL_MENU_ITEMS,
      categories: INITIAL_CATEGORIES,
      subscriptionPlans: INITIAL_SUBSCRIPTION_PLANS,
      helpdeskSettings: {
        whatsapp: '6281234567890',
        email: 'support@meenuin.biz.id'
      },
      systemAnnouncements: [],

      // Actions
      setUser: (user) => set({ user }),

      logout: () => {
        set({ user: null, cart: [], selectedRestaurant: null })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user') // Clear legacy key
        }
      },

      addToCart: (item) => {
        const cart = get().cart
        const existingItem = cart.find(i => i.menuItemId === item.menuItemId)

        if (existingItem) {
          set({
            cart: cart.map(i =>
              i.menuItemId === item.menuItemId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          })
        } else {
          set({ cart: [...cart, item] })
        }
      },

      removeFromCart: (menuItemId) => {
        set({ cart: get().cart.filter(i => i.menuItemId !== menuItemId) })
      },

      updateCartItemQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(menuItemId)
        } else {
          set({
            cart: get().cart.map(i =>
              i.menuItemId === menuItemId ? { ...i, quantity } : i
            )
          })
        }
      },

      clearCart: () => set({ cart: [] }),

      setSelectedRestaurant: (restaurantId) => set({ selectedRestaurant: restaurantId, cart: [] }),

      getTotalCartAmount: () => get().cart.reduce((total, item) => total + (item.price * item.quantity), 0),

      getTotalCartItems: () => get().cart.reduce((total, item) => total + item.quantity, 0),

      getRestaurantBySlug: (slug) => get().restaurants.find(r => r.slug === slug),

      setRestaurants: (restaurants) => set({ restaurants }),
      setUsers: (users) => set({ users }),

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),

      resetPassword: (email: string, newPassword: string) => set((state) => ({
        users: state.users.map(u =>
          u.email === email ? { ...u, password: newPassword } : u
        )
      })),

      addRestaurant: (resto) => set((state) => ({
        restaurants: [...state.restaurants, {
          ...resto,
          slug: resto.slug || resto.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
        }]
      })),

      updateUser: (id, updates) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
      })),

      deleteUser: (id) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
      })),

      resetSystem: () => {
        set({
          users: INITIAL_USERS,
          restaurants: INITIAL_RESTAURANTS,
          menuItems: INITIAL_MENU_ITEMS,
          categories: INITIAL_CATEGORIES,
          orders: [],
          cart: [],
          selectedRestaurant: null,
          user: null
        })
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      },

      updateRestaurant: (id, updates) => set((state) => ({
        restaurants: state.restaurants.map(r => r.id === id ? { ...r, ...updates } : r)
      })),

      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
      })),

      updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
      })),

      updateRestaurantStatus: (id, status) => set((state) => ({
        restaurants: state.restaurants.map(r => r.id === id ? { ...r, status } : r)
      })),

      validateOrder: (orderId) => get().updateOrderStatus(orderId, 'CONFIRMED'),
      rejectOrder: (orderId) => get().updateOrderStatus(orderId, 'CANCELLED'),

      // Menu Actions Implementation
      addMenuItem: (item) => set((state) => ({ menuItems: [...state.menuItems, item] })),
      updateMenuItem: (id, updates) => set((state) => ({
        menuItems: state.menuItems.map(i => i.id === id ? { ...i, ...updates } : i)
      })),
      deleteMenuItem: (id) => set((state) => ({
        menuItems: state.menuItems.filter(i => i.id !== id)
      })),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),

      updateSubscriptionPlan: (id, updates) => set((state) => ({
        subscriptionPlans: state.subscriptionPlans.map((p) => (p.id === id ? { ...p, ...updates } : p))
      })),

      updateHelpdeskSettings: (settings) => set({ helpdeskSettings: settings }),

      broadcastAnnouncement: (message) => set((state) => ({
        systemAnnouncements: [
          {
            id: crypto.randomUUID(),
            message,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          ...state.systemAnnouncements
        ]
      })),

      clearAnnouncement: () => set((state) => ({
        systemAnnouncements: state.systemAnnouncements.map(a => ({ ...a, isActive: false }))
      })),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        users: state.users,
        restaurants: state.restaurants,
        orders: state.orders,
        menuItems: state.menuItems,
        categories: state.categories,
        subscriptionPlans: state.subscriptionPlans, // Persist plans
        helpdeskSettings: state.helpdeskSettings, // Persist helpdesk
        systemAnnouncements: state.systemAnnouncements // Persist announcements
      }),
    }
  )
)
