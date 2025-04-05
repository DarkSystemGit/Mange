import { createApp } from "vue"
import { createPinia } from "pinia"
import vue3GoogleLogin from 'vue3-google-login'
import App from "./App.vue"
import "./assets/main.css"
import './data.js'
const app = createApp(App)
const pinia = createPinia()
app.use(vue3GoogleLogin, {
    clientId: '650067493727-pkmovrkurd0nfbmi0dcensmm7s5hgchi.apps.googleusercontent.com'
  })
app.use(pinia)
app.mount("#app")