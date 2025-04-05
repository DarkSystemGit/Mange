import { ref, computed, onMounted,reactive } from 'vue';
import { googleTokenLogin } from "vue3-google-login"
// Page navigation state
export const currentPage = ref('home'); // 'home', 'restaurant', 'checkout', 'confirmation'


export const session= reactive({
  checkoutInfo:{
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    instructions: '',
    paymentMethod: 'cash',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  },
  user:{
    displayName: 'John Doe',
    photoURL: '/placeholder.svg?height=32&width=32'
  },
  isAuthenticated : false,
  cart: [],
  currentPage: 'home'
});
export async function fetchData(r,c){
  r.value=await (await fetch("/api/restaurants")).json();
  c.value=await (await fetch("/api/categories")).json();
}
export async function doOrder(o){
  console.log(o);
}
export async function loginUser(session){
  // In a real app, this would use the Google OAuth API
  // For demo purposes, we'll just set the authenticated state
  googleTokenLogin().then(async (response) => {
    var userData=await (await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json`,{
      headers:{
        'Authorization': `Bearer ${response.access_token}`
      }
    })).json();
    console.log(userData);
    session.isAuthenticated = true;
    // Fetch user data from API
    // In a real app, this would come from your backend after Google authentication
    session.user = {
      displayName: userData.name,
      photoURL: userData.picture,
      sessionId: 0
    };
  })
}
// Mock data - In a real app, this would come from your REST API


