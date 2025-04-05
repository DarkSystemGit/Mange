// This file serves as a central export point for API services
// In a real app, you would create separate API service files

// Simulate API calls with delays for realistic loading
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock data - In a real app, this would come from your REST API
const categories = [
  { id: 1, name: "All" },
  { id: 2, name: "Fast Food" },
  { id: 3, name: "Pizza" },
  { id: 4, name: "Sushi" },
  { id: 5, name: "Italian" },
  { id: 6, name: "Chinese" },
  { id: 7, name: "Mexican" },
  { id: 8, name: "Vegetarian" },
]

const restaurants = [
  {
    id: 1,
    name: "Burger Palace",
    imageUrl: "/placeholder.svg?height=192&width=384",
    rating: 4.5,
    reviewCount: 243,
    cuisineType: "Fast Food",
    deliveryTime: 25,
    address: "123 Main St, Anytown",
    categoryId: 2,
    menuCategories: [
      { id: 1, name: "Popular" },
      { id: 2, name: "Burgers" },
      { id: 3, name: "Sides" },
      { id: 4, name: "Drinks" },
    ],
    menuItems: [
      {
        id: 1,
        categoryId: 1,
        name: "Classic Burger",
        description: "Beef patty with lettuce, tomato, onion, and special sauce",
        price: 8.99,
        imageUrl: "/placeholder.svg?height=96&width=96",
      },
      {
        id: 2,
        categoryId: 2,
        name: "Cheese Burger",
        description: "Beef patty with cheddar cheese, lettuce, tomato, onion, and special sauce",
        price: 9.99,
        imageUrl: "/placeholder.svg?height=96&width=96",
      },
      {
        id: 3,
        categoryId: 3,
        name: "French Fries",
        description: "Crispy golden fries with sea salt",
        price: 3.99,
        imageUrl: "/placeholder.svg?height=96&width=96",
      },
      {
        id: 4,
        categoryId: 4,
        name: "Soda",
        description: "Your choice of soft drink",
        price: 1.99,
        imageUrl: "/placeholder.svg?height=96&width=96",
      },
    ],
  },
  // Other restaurants...
]

// API Services
export const api = {
  // Categories
  getCategories: async () => {
    await delay(300) // Simulate network delay
    return [...categories]
  },

  // Restaurants
  getRestaurants: async (params = {}) => {
    await delay(800) // Simulate network delay

    let result = [...restaurants]

    // Filter by category
    if (params.categoryId && params.categoryId !== 1) {
      result = result.filter((r) => r.categoryId === params.categoryId)
    }

    // Filter by search query
    if (params.query) {
      const query = params.query.toLowerCase()
      result = result.filter((r) => r.name.toLowerCase().includes(query) || r.cuisineType.toLowerCase().includes(query))
    }

    // Apply pagination
    if (params.page && params.limit) {
      const startIndex = (params.page - 1) * params.limit
      const endIndex = startIndex + params.limit
      result = result.slice(startIndex, endIndex)
    }

    return result
  },

  // Restaurant details
  getRestaurantById: async (id) => {
    await delay(500) // Simulate network delay
    const restaurant = restaurants.find((r) => r.id === Number.parseInt(id))
    if (!restaurant) {
      throw new Error(`Restaurant with ID ${id} not found`)
    }
    return { ...restaurant }
  },

  // Menu items
  getMenuItems: async (restaurantId, categoryId = null) => {
    await delay(700) // Simulate network delay

    const restaurant = restaurants.find((r) => r.id === Number.parseInt(restaurantId))
    if (!restaurant) {
      throw new Error(`Restaurant with ID ${restaurantId} not found`)
    }

    let items = [...restaurant.menuItems]

    // Filter by category
    if (categoryId) {
      items = items.filter((item) => item.categoryId === categoryId)
    }

    return items
  },

  // Orders
  placeOrder: async (orderData) => {
    await delay(1500) // Simulate network delay

    // Generate a random order number
    const orderNumber = "ORD-" + Math.floor(Math.random() * 10000)

    // Calculate estimated delivery time
    const now = new Date()
    const deliveryMinutes = Math.floor(Math.random() * 20) + 30 // 30-50 minutes
    now.setMinutes(now.getMinutes() + deliveryMinutes)
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const estimatedDeliveryTime = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`

    // Return the created order
    return {
      id: Date.now(),
      orderNumber,
      estimatedDeliveryTime,
      items: orderData.items,
      deliveryInfo: orderData.deliveryInfo,
      payment: orderData.payment,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      tax: orderData.tax,
      total: orderData.total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    }
  },
}

