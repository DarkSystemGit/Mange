import { ref, computed, onMounted, reactive } from 'vue';
import { googleTokenLogin } from "vue3-google-login"
import { decrypt } from './comms.js';
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
  currentPage: 'home',
  err: false
});
export async function fetchData(r, c) {
  r.value = await (await fetch("/api/restaurants")).json();
  c.value = await (await fetch("/api/categories")).json();
}
export async function doOrder(session, o) {
  return await (await fetch("/api/order", {
    method: "POST",
    body: JSON.stringify({ order: o, sid: session.user.sess }),
    headers: { "Content-Type": "application/json" }
  })).json();
}
export function loginUserG(session) {
  return new Promise((r) => googleTokenLogin().then(async (response) => {
    //console.log(response.access_token);
    session.admin = false;
    session.err = false;
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

    if (sess.error == true) {
      session.err = true;
      session.isAuthenticated = false;
      return;
    }
    if (sess.admin != undefined) {
      session.user.admin = true;
      session.user.adminSign = sess.admin;
      session.user.iv = sess.iv;
      adminDecode(session, new WebSocket(`ws://${window.location.host}/api/admin`))
    }
    session.isAuthenticated = true;
    session.checkoutInfo.name = userData.name;

    session.user = {
      ...session.user,
      displayName: userData.name,
      photoURL: userData.picture,
      sess: sess.sid
    };
    r()
  }))
}




export async function logoutUser(session) {
  //console.log(session.user.sess);
  const resp = await (await fetch("/api/logout", {
    method: "POST",
    body: JSON.stringify({ sid: session.user.sess }),
    headers: { "Content-Type": "application/json" }
  })).json();
  session.err = false;
  if (resp.error) {
    session.err = true;
    return;
  }
  session.isAuthenticated = false;
}


