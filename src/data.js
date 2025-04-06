import { ref, computed, onMounted, reactive } from 'vue';
import { googleTokenLogin } from "vue3-google-login"
// Page navigation state
export const currentPage = ref('home'); // 'home', 'restaurant', 'checkout', 'confirmation'


export const session = reactive({
  checkoutInfo: {
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
  user: {
    displayName: 'John Doe',
    photoURL: '/placeholder.svg?height=32&width=32'
  },
  isAuthenticated: false,
  cart: [],
  currentPage: 'home'
});
export async function fetchData(r, c) {
  r.value = await (await fetch("/api/restaurants")).json();
  c.value = await (await fetch("/api/categories")).json();
}
export async function doOrder(o) {
  console.log(o);
}
export async function loginUser(session) {
  googleTokenLogin().then(async (response) => {
    var userData = await (await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json`, {
      headers: {
        'Authorization': `Bearer ${response.access_token}`,
      }
    })).json();
    const sess = await (await fetch("/api/login", {
      method: "POST", 
      body: JSON.stringify({ access_token: response.access_token, sub: userData.sub }),
      headers: { "Content-Type": "application/json" }
    })).json();
    session.isAuthenticated = true;
    session.user = {
      displayName: userData.name,
      photoURL: userData.picture,
      sess: sess.sid
    };
  })
}



