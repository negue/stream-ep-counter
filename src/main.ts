import { createApp } from 'vue'

import App from './App.vue'
import './registerServiceWorker'
import VueFinalModal from 'vue-final-modal'

import 'simplebar/dist/simplebar.min.css';

createApp(App)
  .use(VueFinalModal())
  .mount('#app')
