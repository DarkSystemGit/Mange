<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with authentication -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center">
          <h1 @click="goToHome" class="text-2xl font-bold text-rose-600 cursor-pointer">Mange</h1>
        </div>
        <div v-if="session.isAuthenticated" class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <img :src="session.user.photoURL" alt="User profile" class="w-8 h-8 rounded-full" />
            <span class="text-sm font-medium">{{ session.user.displayName }}</span>
          </div>
          <button @click="session.currentPage='admin'" class="text-sm text-gray-600 hover:text-gray-900">Dashboard</button>
          <button @click="logout" class="text-sm text-gray-600 hover:text-gray-900">Logout</button>
        </div>

      </div>
    </header>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Login screen if not authenticated -->
      <div v-if="!session.isAuthenticated" class="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 mt-16">
        <h2 class="text-2xl font-bold text-center mb-6">Welcome to Mange</h2>
        <p class="text-gray-600 text-center mb-8">Please sign in to continue</p>
        <button @click="loginG"
          class="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <img class="w-5 h-5" src="@/assets/google.svg" alt="Google logo" />
          Sign in with Google
        </button>
        <!--button @click="loginA"
          class="mt-2 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <img class="w-5 h-5" src="@/assets/apple.svg" alt="Apple logo" />
          Sign in with Apple
        </button-->
      </div>

      <!-- App content if authenticated -->
      <div v-else>
        <div v-if="session.err" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span class="block sm:inline"><strong class="font-bold">Mein Gott! </strong>Something seriously bad
            happened.</span>
          <span @click="logout" class="absolute top-0 bottom-0 right-0 px-4 py-3">Logout?</span>
        </div>
        <!-- Home Page -->
        <div v-if="session.currentPage === 'home'">
          <!-- Search bar -->
          <div class="max-w-2xl mx-auto mb-8">
            <div class="relative">
              <input v-model="searchQuery" type="text" placeholder="Search for restaurants ..."
                class="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                @input="handleSearch" />
              <img src="@/assets/search.svg" alt="Search icon" class="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />

            </div>
          </div>

          <!-- Categories -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Categories</h2>
            <div class="flex overflow-x-auto gap-4 pb-2">
              <button v-for="category in categories" :key="category.id" @click="filterByCategory(category.id)" :class="[
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium',
                selectedCategory === category.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              ]">
                {{ category.name }}
              </button>
            </div>
          </div>

          <!-- Featured Restaurants -->
          <div class="mb-12">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">Restaurants</h2>
              <button @click="viewAllRestaurants" class="text-sm text-rose-600 hover:text-rose-700"
                v-if="selectedCategory != 1">View All</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="restaurant in filteredRestaurants" :key="restaurant.id"
                class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                @click="viewRestaurant(restaurant.id)">
                <div class="relative h-48">
                  <img :src="restaurant.imageUrl" :alt="restaurant.name" class="w-full h-full object-cover" />
                  <div v-if="dCtime(restaurant)"
                    class="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs font-medium">
                    {{ dCtime(restaurant) }} min
                  </div>
                </div>
                <div class="p-4">
                  <h3 class="font-bold text-lg mb-1">{{ restaurant.name }}</h3>
                  <div class="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="text-sm ml-1">{{ restaurant.rating }} ({{ restaurant.reviewCount }})</span>
                  </div>
                  <div class="text-sm text-gray-600">{{ restaurant.cuisineType }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Restaurant Detail Page -->
        <div v-if="session.currentPage === 'restaurant'">
          <div class="mb-4">
            <button @click="goToHome" class="flex items-center text-rose-600 hover:text-rose-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clip-rule="evenodd" />
              </svg>
              Back to Restaurants
            </button>
          </div>

          <div class="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div class="relative h-64">
              <img :src="selectedRestaurant.imageUrl" :alt="selectedRestaurant.name"
                class="w-full h-full object-cover" />
            </div>

            <div class="p-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h2 class="text-2xl font-bold mb-2">{{ selectedRestaurant.name }}</h2>
                  <div class="flex items-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="text-sm ml-1">{{ selectedRestaurant.rating }} ({{ selectedRestaurant.reviewCount }}
                      reviews)</span>
                  </div>
                  <div class="text-sm text-gray-600 mb-2">{{ selectedRestaurant.cuisineType }}</div>
                  <div class="flex items-center text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ selectedRestaurant.address }}
                  </div>
                </div>
                <div v-if="dCtime(selectedRestaurant)"
                  class="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-sm font-medium">
                  {{ dCtime(selectedRestaurant) }} min
                </div>
              </div>

              <!-- Menu Categories -->
              <div class="mb-6">
                <h3 class="text-lg font-semibold mb-3">Menu</h3>
                <div class="flex overflow-x-auto gap-3 pb-2">
                  <button v-for="category in selectedRestaurant.menuCategories" :key="category.id"
                    @click="selectMenuCategory(category.id)" :class="[
                      'flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium',
                      selectedMenuCategory === category.id
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    ]">
                    {{ category.name }}
                  </button>
                </div>
              </div>

              <!-- Menu Items -->
              <div class="space-y-4">
                <div v-for="item in filteredMenuItems" :key="item.id"
                  class="flex border-b border-gray-100 pb-4 last:border-0">
                  <div class="flex-1 pr-4">
                    <h4 class="font-medium mb-1">{{ item.name }}</h4>
                    <p class="text-sm text-gray-600 mb-2 line-clamp-2">{{ item.description }}</p>
                    <div class="font-medium">${{ item.price.toFixed(2) }}</div>
                  </div>
                  <div class="w-24 h-24 flex-shrink-0 relative">
                    <img :src="item.imageUrl" :alt="item.name" class="w-full h-full object-cover rounded-md" />
                    <button @click.stop="addToCart(item)"
                      class="absolute -bottom-2 -right-2 bg-rose-500 text-white p-2 rounded-full shadow-md hover:bg-rose-600">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Checkout Page -->
        <div v-if="session.currentPage === 'checkout'">
          <div class="mb-4">
            <button @click="goToHome" class="flex items-center text-rose-600 hover:text-rose-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clip-rule="evenodd" />
              </svg>
              Back to Restaurants
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2">
              <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div class="p-6">
                  <h2 class="text-xl font-bold mb-4">Delivery Information</h2>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input v-model="session.checkoutInfo.name" type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Your full name" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input v-model="session.checkoutInfo.phone" type="tel"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Your phone number" />
                    </div>
                  </div>

                  <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                    <select v-model="session.checkoutInfo.address" class="w-full px-3 py-4 bg-white border border-gray-300 rounded-lg
                         text-sm text-gray-900 
                         focus:ring-2 focus:ring-rose-500 focus:border-rose-500" placeholder="Pickup Location">
                      <option value="" disabled>Select pickup location</option>
                      <option value="Foyer">Foyer</option>
                      <option value="Courtyard">Courtyard</option>
                      <option value="Cafeteria">Cafeteria</option>
                    </select>




                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions (optional)</label>
                    <textarea v-model="session.checkoutInfo.instructions"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                      rows="3" placeholder="Any special instructions for delivery"></textarea>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-lg shadow-md overflow-hidden" style="display: none;">
                <div class="p-6">
                  <h2 class="text-xl font-bold mb-4">Payment Method</h2>

                  <div class="space-y-4">
                    <div class="flex items-center">
                      <input id="payment-card" type="radio" name="payment-method" value="card"
                        v-model="session.checkoutInfo.paymentMethod"
                        class="h-4 w-4 text-rose-600 focus:ring-rose-500" />
                      <label for="payment-card" class="ml-3 block text-sm font-medium text-gray-700">
                        Credit / Debit Card
                      </label>
                    </div>

                    <div v-if="session.checkoutInfo.paymentMethod === 'card'" class="ml-7 space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input v-model="session.checkoutInfo.cardNumber" type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="Card number" />
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                          <input v-model="session.checkoutInfo.cardExpiry" type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="MM/YY" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                          <input v-model="session.checkoutInfo.cardCvv" type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="CVV" />
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center">
                      <input id="payment-cash" type="radio" name="payment-method" value="cash"
                        v-model="session.checkoutInfo.paymentMethod"
                        class="h-4 w-4 text-rose-600 focus:ring-rose-500" />
                      <label for="payment-cash" class="ml-3 block text-sm font-medium text-gray-700">
                        Cash on Delivery
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="md:col-span-1">
              <div class="bg-white rounded-lg shadow-md overflow-hidden sticky top-4">
                <div class="p-6">
                  <h2 class="text-xl font-bold mb-4">Order Summary</h2>

                  <div class="max-h-80 overflow-y-auto mb-4">
                    <div v-for="(item, index) in cart" :key="index"
                      class="flex py-3 border-b border-gray-100 last:border-0">
                      <div class="w-16 h-16 flex-shrink-0">
                        <img :src="item.imageUrl" :alt="item.name" class="w-full h-full object-cover rounded-md" />
                      </div>
                      <div class="flex-1 ml-4">
                        <div class="flex justify-between">
                          <h4 class="font-medium">{{ item.name }}</h4>
                          <span class="text-sm">x{{ item.quantity }}</span>
                        </div>
                        <div class="text-sm text-gray-600">{{ item.restaurantName }}</div>
                        <div class="font-medium">${{ (item.price * item.quantity).toFixed(2) }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-2 py-4 border-t border-b border-gray-100">
                    <div class="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${{ cartSubtotal.toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>${{ deliveryFee.toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${{ tax.toFixed(2) }}</span>
                    </div>
                  </div>

                  <div class="flex justify-between font-bold text-lg mt-4">
                    <span>Total</span>
                    <span>${{ orderTotal.toFixed(2) }}</span>
                  </div>

                  <button @click="placeOrder" :disabled="!isCheckoutFormValid" :class="[
                    'w-full mt-6 py-3 rounded-lg font-medium text-white',
                    isCheckoutFormValid
                      ? 'bg-rose-500 hover:bg-rose-600'
                      : 'bg-gray-300 cursor-not-allowed'
                  ]">
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="session.currentPage === 'admin'"></div>
        <!-- Order Confirmation Page -->
        <div v-if="session.currentPage === 'confirmation'" class="max-w-2xl mx-auto">
          <div class="bg-white rounded-lg shadow-md overflow-hidden p-6 text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 class="text-2xl font-bold mb-2">Order Confirmed!</h2>
            <p class="text-gray-600 mb-6">Your order has been placed successfully.</p>

            <div class="bg-gray-50 rounded-lg p-4 mb-6">
              <div class="text-left mb-4">
                <h3 class="font-semibold mb-2">Order #{{ orderNumber }}</h3>
                <p class="text-sm text-gray-600">Estimated delivery time: {{ estimatedDeliveryTime }}</p>
              </div>

              <div class="border-t border-gray-200 pt-4">
                <h4 class="font-medium mb-2 text-left">Order Details</h4>
                <div class="space-y-3">
                  <div v-for="(item, index) in orderItems" :key="index" class="flex text-left">
                    <div class="w-12 h-12 flex-shrink-0">
                      <img :src="item.imageUrl" :alt="item.name" class="w-full h-full object-cover rounded-md" />
                    </div>
                    <div class="flex-1 ml-3">
                      <div class="flex justify-between">
                        <h5 class="font-medium">{{ item.name }}</h5>
                        <span class="text-sm">x{{ item.quantity }}</span>
                      </div>
                      <div class="text-sm text-gray-600">${{ (item.price * item.quantity).toFixed(2) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="border-t border-gray-200 pt-4 mt-4">
                <div class="flex justify-between text-sm mb-1">
                  <span>Subtotal</span>
                  <span>${{ cartSubtotal.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Delivery Fee</span>
                  <span>${{ deliveryFee.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Tax</span>
                  <span>${{ tax.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between font-bold mt-2">
                  <span>Total</span>
                  <span>${{ orderTotal.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 class="font-semibold mb-2">Delivery Information</h3>
              <p class="text-sm">{{ session.checkoutInfo.name }}</p>
              <p class="text-sm">{{ session.checkoutInfo.phone }}</p>
              <p class="text-sm">Deliver to {{ session.checkoutInfo.address }}</p>
            </div>

            <button @click="endOrder" class="bg-rose-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-rose-600">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Cart button (fixed at bottom) -->
    <div
      v-if="session.isAuthenticated && session.cart.length > 0 && session.currentPage !== 'checkout' && session.currentPage !== 'confirmation'"
      class="fixed bottom-6 right-6">
      <button @click="viewCart"
        class="bg-rose-500 text-white p-4 rounded-full shadow-lg hover:bg-rose-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span
          class="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">{{
            cartItemCount }}</span>
      </button>
    </div>

    <!-- Cart modal -->
    <div v-if="showCart" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold">Your Cart</h3>
          <button @click="showCart = false" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="overflow-y-auto flex-1 p-4">
          <div v-if="session.cart.length === 0" class="text-center py-8 text-gray-500">
            Your cart is empty
          </div>
          <div v-else class="space-y-4">
            <div v-for="(item, index) in session.cart" :key="index"
              class="flex border-b border-gray-100 pb-4 last:border-0">
              <div class="w-16 h-16 flex-shrink-0">
                <img :src="item.imageUrl" :alt="item.name" class="w-full h-full object-cover rounded-md" />
              </div>
              <div class="flex-1 ml-4">
                <h4 class="font-medium">{{ item.name }}</h4>
                <div class="text-sm text-gray-600">{{ item.restaurantName }}</div>
                <div class="flex justify-between items-center mt-2">
                  <div class="font-medium">${{ item.price.toFixed(2) }}</div>
                  <div class="flex items-center">
                    <button @click="decrementCartItem(index)"
                      class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                      </svg>
                    </button>
                    <span class="mx-2 w-6 text-center">{{ item.quantity }}</span>
                    <button @click="incrementCartItem(index)"
                      class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="session.cart.length > 0" class="p-4 border-t">
          <div class="flex justify-between mb-4">
            <span class="font-medium">Subtotal</span>
            <span class="font-medium">${{ cartSubtotal.toFixed(2) }}</span>
          </div>
          <button @click="goToCheckout"
            class="w-full bg-rose-500 text-white py-3 rounded-lg font-medium hover:bg-rose-600">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
<script setup>
import { session, loginUserG, fetchData, doOrder, logoutUser } from './data.js'
import { ref, computed, onMounted, watch } from 'vue';

let restaurants = ref([]);
let categories = ref([]);

// App state
const searchQuery = ref('');
const selectedCategory = ref(null);
const selectedRestaurant = ref(null);
const selectedMenuCategory = ref(null);
const showCart = ref(false);
if (sessionStorage.getItem('user') != null) {
  session.user = JSON.parse(sessionStorage.getItem('user'))
  session.isAuthenticated = true
  session.cart = JSON.parse(sessionStorage.getItem('cart'))
}
watch(session, async (newu) => {
  if (newu.isAuthenticated && sessionStorage.getItem('user') != newu.user) {
    sessionStorage.setItem('user', JSON.stringify(newu.user))
    sessionStorage.setItem('cart', JSON.stringify(newu.cart))
  } else if (!newu.isAuthenticated) {
    sessionStorage.clear()
  }
})

// Order confirmation state
const orderNumber = ref('');
const estimatedDeliveryTime = ref('');
const orderItems = ref([]);
// Computed properties

const filteredRestaurants = computed(() => {
  let result = restaurants.value;

  // Filter by category
  if (selectedCategory.value && selectedCategory.value !== 1) {
    result = result.filter(r => r.categoryId === selectedCategory.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.cuisineType.toLowerCase().includes(query)
    );
  }

  return result;
});

const filteredMenuItems = computed(() => {
  if (!selectedRestaurant.value) return [];

  let items = selectedRestaurant.value.menuItems;

  // Filter by menu category
  if (selectedMenuCategory.value) {
    items = items.filter(item => item.categoryId === selectedMenuCategory.value);
  }

  return items;
});

const cartItemCount = computed(() => {
  return session.cart.reduce((total, item) => total + item.quantity, 0);
});

const cartSubtotal = computed(() => {
  return session.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
});

const deliveryFee = computed(() => {
  return cartSubtotal.value > 0 ? 3.99 : 0;
});

const tax = computed(() => {
  return cartSubtotal.value * 0.08; // 8% tax
});

const orderTotal = computed(() => {
  //console.log(cartSubtotal.value, deliveryFee.value, tax.value,session.cart);
  return cartSubtotal.value + deliveryFee.value + tax.value;
});

const isCheckoutFormValid = computed(() => {
  // Basic validation
  if (!session.checkoutInfo.name || !session.checkoutInfo.phone ||
    !session.checkoutInfo.address) {
    return false;
  }
  const pregex = /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/gm
  if (session.checkoutInfo.phone.match(pregex) == null) {
    return false
  }
  // Card validation if payment method is card
  if (session.checkoutInfo.paymentMethod === 'card') {
    if (!session.checkoutInfo.cardNumber || !session.checkoutInfo.cardExpiry || !session.checkoutInfo.cardCvv) {
      return false;
    }
  }

  return true;
});

// Methods
const loginG = async () => {
  await loginUserG(session)
  const t=await (await fetch('/api/timeout',{method:'POST',body: JSON.stringify({sid: session.user.sess}),headers: { "Content-Type": "application/json" }})).json();
  setTimeout(logout,t.timeout-50)
};
const loginA=async () => {
  //await loginUserA(session);
};
const logout = async () => {
  await logoutUser(session)
  session.isAuthenticated = false;
  session.user = null;
  session.cart = [];
  session.currentPage = 'home';
  sessionStorage.clear();
};

const handleSearch = () => {
  // In a real app, this might debounce and call an API
  // For demo purposes, we're using the computed property
};

const filterByCategory = (categoryId) => {
  selectedCategory.value = categoryId;
};

const viewAllRestaurants = () => {
  selectedRestaurant.value = null;
  selectedCategory.value = 1; // All category
  session.currentPage = 'home';
};

const viewRestaurant = (restaurantId) => {
  const restaurant = restaurants.value.find(r => r.id === restaurantId);
  selectedRestaurant.value = restaurant;
  session.currentPage = 'restaurant';

  // Set default menu category to first one
  if (restaurant.menuCategories.length > 0) {
    selectedMenuCategory.value = restaurant.menuCategories[0].id;
  }
};
const endOrder = () => { session.cart = []; goToHome() }
const goToHome = () => {
  session.currentPage = 'home';
  searchQuery.value = '';
  selectedCategory.value = null;
  selectedRestaurant.value = null;
  selectedMenuCategory.value = null;
};

const selectMenuCategory = (categoryId) => {
  selectedMenuCategory.value = categoryId;
};

const addToCart = (item) => {
  // Check if item already exists in cart
  const existingItemIndex = session.cart.findIndex(cartItem =>
    cartItem.id === item.id && cartItem.restaurantId === selectedRestaurant.value.id
  );

  if (existingItemIndex >= 0) {
    // Increment quantity if item already in cart
    session.cart[existingItemIndex].quantity += 1;
  } else {
    // Add new item to cart
    session.cart.push({
      ...item,
      restaurantId: selectedRestaurant.value.id,
      restaurantName: selectedRestaurant.value.name,
      quantity: 1
    });
  }
};

const viewCart = () => {
  showCart.value = true;
};

const incrementCartItem = (index) => {
  session.cart[index].quantity += 1;
};

const decrementCartItem = (index) => {
  if (session.cart[index].quantity > 1) {
    session.cart[index].quantity -= 1;
  } else {
    // Remove item if quantity would be 0
    session.cart.splice(index, 1);
  }
};

const goToCheckout = () => {
  session.currentPage = 'checkout';
  showCart.value = false;
};
const calcTime = (cart) => {
  let m = 0;
  cart.forEach(i => {
    try { if (m < ((restaurants[i.restaurantId].distance - .25) + 1) * 20) m = ((restaurants[i.restaurantId].distance - .25) + 1) * 20 } catch { if (m < 20) m = 20 }
  })
  return m;
}
const dCtime = (r) => {
  return ((r.distance - .25) + 1) * 20
}
const placeOrder = async () => {
  // In a real app, this would send the order to your backend
  // Generate a random order number
  orderNumber.value = 'ORD-' + (await (await fetch('/api/noc')).json()).noc;

  // Calculate estimated delivery time
  const now = new Date();
  const deliveryMinutes = calcTime(session.cart); // 30-50 minutes
  now.setMinutes(now.getMinutes() + deliveryMinutes);
  const hours = now.getHours();
  const minutes = now.getMinutes();
  estimatedDeliveryTime.value = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;

  // Copy cart items to order items
  orderItems.value = [...session.cart];
  const order = {
    id: orderNumber.value, time: estimatedDeliveryTime.value,
    items: orderItems.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      restaurantName: item.restaurantName,
      restaurantId: item.restaurantId,
    })),
    time: now.toTimeString(), place: session.checkoutInfo.address, phone: session.checkoutInfo.phone, name: session.checkoutInfo.name, instructions: session.checkoutInfo.instructions
  }
  doOrder(session,order);
  // Clear cart
  //session.cart = [];

  // Navigate to confirmation page
  session.currentPage = 'confirmation';
};

// Lifecycle hooks
onMounted(() => {
  // In a real app, this would check if user is all
  fetchData(restaurants, categories)
  //console.log(restaurants.value);
});
</script>

<style>
/* Additional styles can be added here if needed */
/* The app is primarily styled with Tailwind CSS classes */
</style>
