import { createRouter, createWebHistory } from 'vue-router'
import ViewNotes from '@/views/ViewNotes.vue'
import ViewEditNote from '@/views/ViewEditNote.vue'
import ViewStats from '@/views/ViewStats.vue'
import ViewAuth from '@/views/ViewAuth.vue'
import gcn_register from '@/views/gcn_register.vue'
import privacy_policy from '@/views/privacy_policy.vue'
import home from '@/views/home.vue'
import ViewYouTubeConnect from '@/views/ViewYouTubeConnect.vue'
import ReactionTest from '@/views/ReactionTest.vue'
import { useStoreAuth } from '@/stores/storeAuth'

//const storeAuth = useStoreAuth()
const routes = [
  {
    path: '/',
    name: 'base',
    component: privacy_policy
  },
  {
    path: '/notes',
    name: 'notes',
    component: ViewNotes
  },
  {
    path: '/editNote/:id',
    name: 'edit-note',
    component: ViewEditNote
  },
  {
    path: '/stats',
    name: 'stats',
    component: ViewStats
  },
  {
    path: '/auth',
    name: 'auth',
    component: ViewAuth
  },
  {
    path: '/register_gcn_sub_stream',
    name: 'register_gcn_sub_stream',
    component: gcn_register
  },
  {
    path: '/privacy_policy',
    name: 'privacy_policy',
    component: privacy_policy
  },
  {
    path: '/home',
    name: 'home',
    component: home
  },
  {
    path: '/youtube-connect',
    name: 'youtube-connect',
    component: ViewYouTubeConnect
  },
  {
    path: '/reaction-test',
    name: 'reaction-test',
    component: ReactionTest
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
//navigation guards
router.beforeEach(async (to, from) => {
  const storeAuth = useStoreAuth()
  const publicPages = ['auth', 'register_gcn_sub_stream', 'base', 'privacy_policy','home','base', 'reaction-test']
  if (!storeAuth.user.id && !publicPages.includes(to.name)) {
    return { name: 'auth' }
  }
  if (storeAuth.user.id && to.name === 'auth') {
    return { name: 'stats' }
  }
})
export default router