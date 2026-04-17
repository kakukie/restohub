
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  detailAddress?: string
  latitude?: number
  longitude?: number
  googleMapsUrl?: string
  phone: string
  package: 'BASIC' | 'PRO' | 'ENTERPRISE' | 'FREE_TRIAL'
  logo?: string
  banner?: string
  rating?: number
  adminEmail: string // Email of the admin
  status: 'ACTIVE' | 'PENDING' | 'REJECTED'
  slug: string // URL friendly identifier
  paymentMethods?: PaymentMethod[]
  theme?: 'modern-emerald' | 'classic-orange' | 'minimal-blue'
  // Limits
  maxMenuItems?: number
  maxAdmins?: number
  maxStaff?: number
  allowBranches?: boolean
  parentId?: string
  subscriptionPlan?: SubscriptionPlan
  maxCategories?: number
  allowMaps?: boolean
  enableAnalytics?: boolean
  printerSettings?: any
  slugChangeCount?: number
  maxSlugChanges?: number
  maxBranches?: number
}

export interface PaymentMethod {
  id: string
  type: string
  isActive: boolean
  merchantId?: string
  qrCode?: string
  accountNumber?: string
  accountName?: string
}

export interface OrderItem {
  menuItemId: string
  menuItemName: string
  price: number
  quantity: number
  categoryName?: string
  notes?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerId?: string
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
  taxRate?: number
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
  imageUrl?: string // Alias for compatibility
  isAvailable: boolean
  displayOrder: number
  categoryId: string
  categoryName?: string
  restaurantId: string // Link to restaurant
  isRecommended?: boolean
  isBestSeller?: boolean
  stock?: number // Optional stock quantity
  taxRate?: number
  maxSlugChanges?: number
  maxBranches?: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  menuLimit: number
  features: string[] // Array of strings
  maxCategories?: number
  allowMaps?: boolean
  enableAnalytics?: boolean
  isActive: boolean
}

export interface Announcement {
  id: string
  message: string
  isActive: boolean
  createdAt: string
}

export interface LandingPageData {
  heroTitle: string
  heroSubtitle: string
  heroDescription: string
  statsMerchants: string
  statsOrders: string
  statsUptime: string
  feature1Title: string
  feature1Desc: string
  feature2Title: string
  feature2Desc: string
  feature3Title: string
  feature3Desc: string
  pricingTitle: string
  pricingDescription: string
  contactTitle?: string
  contactWhatsappText?: string
  contactWhatsappDesc?: string
  contactEmailText?: string
  contactEmailDesc?: string
}

export interface HelpdeskSettings {
  whatsapp: string
  email: string
  maintenanceMode?: boolean
  platformName?: string
  landingPageData?: LandingPageData
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
  isInitialized: boolean // Track if session check completed
  language: 'en' | 'id'
  checkSession: (role?: string) => Promise<void>

  // Actions
  setLanguage: (lang: 'en' | 'id') => void
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
  setOrders: (orders: Order[]) => void
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
  setSubscriptionPlans: (plans: SubscriptionPlan[]) => void
  initSubscriptionPlans: () => void
  updateHelpdeskSettings: (settings: HelpdeskSettings) => void
  systemAnnouncements: Announcement[]
  broadcastAnnouncement: (message: string) => void
  clearAnnouncement: () => void
}

// Initial Data
const INITIAL_USERS: User[] = []
const INITIAL_RESTAURANTS: Restaurant[] = []
const INITIAL_MENU_ITEMS: MenuItem[] = []
const INITIAL_CATEGORIES: Category[] = []
const INITIAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'FREE_TRIAL',
    name: 'Free Trial',
    description: 'Perfect for testing Meenuin',
    price: 0,
    menuLimit: 10,
    features: ['10 Menu Items', 'Basic QR Code', 'Email Support'],
    isActive: true
  },
  {
    id: 'BASIC',
    name: 'Basic',
    description: 'For small cafes and stalls',
    price: 199000,
    menuLimit: 50,
    features: ['50 Menu Items', 'Standard QR Code', 'Email Support', 'Basic Analytics'],
    isActive: true
  },
  {
    id: 'PRO',
    name: 'Pro',
    description: 'For growing restaurants',
    price: 499000,
    menuLimit: 1000, // Unlimited effectively
    features: ['Unlimited Menu Items', 'Custom QR Code', 'Priority Support', 'Advanced Analytics', 'Staff Management'],
    isActive: true
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large chains and franchises',
    price: 999000,
    menuLimit: 10000,
    features: ['Unlimited Everything', 'White Label Option', 'Dedicated Manager', 'API Access', 'Multi-Branch Support'],
    isActive: true
  }
]

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isInitialized: false,
      language: 'en',
      cart: [],
      selectedRestaurant: null,
      users: INITIAL_USERS,
      restaurants: INITIAL_RESTAURANTS,
      orders: [],
      menuItems: INITIAL_MENU_ITEMS,
      categories: INITIAL_CATEGORIES,
      subscriptionPlans: INITIAL_SUBSCRIPTION_PLANS,
      helpdeskSettings: {
        whatsapp: '088294945050',
        email: 'support@meenuin.biz.id',
        platformName: 'Meenuin',
        landingPageData: {
          heroTitle: 'Modern Menu Ecosystem',
          heroSubtitle: 'Update v3.2: Mobile Experience Optimized',
          heroDescription: 'Berikan pengalaman bersantap yang tak terlupakan dengan menu digital interaktif. Kelola pesanan dengan mulus di berbagai perangkat.',
          statsMerchants: '500+',
          statsOrders: '120k+',
          statsUptime: '99.9%',
          feature1Title: 'QR Menu',
          feature1Desc: 'Pelanggan bisa langsung scan dan pesan dari meja tanpa perlu menunggu pelayan datang membawa menu fisik.',
          feature2Title: 'QRIS Pay',
          feature2Desc: 'Pembayaran otomatis terintegrasi. Pelanggan bisa bayar langsung setelah pesan menggunakan QRIS favorit mereka.',
          feature3Title: 'Kitchen Display',
          feature3Desc: 'Monitor pesanan di dapur secara real-time. Tidak ada lagi pesanan yang terlewat atau salah catat.',
          pricingTitle: 'Simple, Transparent Pricing',
          pricingDescription: 'Pilih paket yang paling sesuai untuk restoran Anda. Tanpa biaya tersembunyi, batalkan kapan saja.'
        }
      },
      systemAnnouncements: [],

      // Actions
      setLanguage: (lang) => set({ language: lang }),
      setUser: (user) => set({ user }),
      setRestaurants: (restaurants) => set({ restaurants }),
      setOrders: (orders) => set({ orders }),
      setUsers: (users) => set({ users }),

      checkSession: async (role) => {
        try {
          const res = await fetch(`/api/auth/me${role ? `?role=${role}` : ''}`, {
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache' }
          })
          const data = await res.json()
          if (data.success) {
            set({ user: data.user })
          } else {
            // Explicitly clear stale user state if validation fails
            set({ user: null })
          }
        } catch (error) {
          console.error('Session check failed', error)
          set({ user: null })
        } finally {
          set({ isInitialized: true })
        }
      },

      logout: async () => {
        const { user } = get()
        const role = user?.role
        set({ user: null, cart: [], selectedRestaurant: null })
        if (typeof window !== 'undefined') {
          try {
            await fetch(`/api/auth/logout${role ? `?role=${role}` : ''}`, { method: 'POST' })
            window.location.href = '/'
          } catch (e) {
            console.error('Logout failed', e)
          }
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

      getTotalCartAmount: () => get().cart.reduce((total, item) => {
        const itemTotal = item.price * item.quantity
        const itemTax = (itemTotal * (item.taxRate || 0)) / 100
        return total + itemTotal + itemTax
      }, 0),

      getTotalCartItems: () => get().cart.reduce((total, item) => total + item.quantity, 0),

      getRestaurantBySlug: (slug) => get().restaurants.find(r => r.slug === slug),

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
        subscriptionPlans: state.subscriptionPlans.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      setSubscriptionPlans: (plans) => set({ subscriptionPlans: plans }),

      initSubscriptionPlans: () => set((state) => {
        if (state.subscriptionPlans.length === 0) {
          return { subscriptionPlans: INITIAL_SUBSCRIPTION_PLANS }
        }
        return {}
      }),

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
      name: 'meenuin-storage',
      partialize: (state) => ({
        language: state.language,
        cart: state.cart,
        selectedRestaurant: state.selectedRestaurant,
        helpdeskSettings: state.helpdeskSettings
      }),
    }
  )
)
