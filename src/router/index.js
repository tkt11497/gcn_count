import { createRouter, createWebHashHistory } from 'vue-router'
import ViewNotes from '@/views/ViewNotes.vue'
import ViewEditNote from '@/views/ViewEditNote.vue'
import ViewStats from '@/views/ViewStats.vue'
import ViewAuth from '@/views/ViewAuth.vue'
import gcn_register from '@/views/gcn_register.vue'
import { useStoreAuth } from '@/stores/storeAuth'

//const storeAuth = useStoreAuth()
const routes = [
  {
    path: '/',
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
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
//navigation guards
router.beforeEach(async (to, from) => {
  const storeAuth = useStoreAuth()
  if (
    !storeAuth.user.id &&
    to.name !== 'auth' &&
    to.name !== 'register_gcn_sub_stream'
  ) {
    return { name: 'auth' }
  }
  if(storeAuth.user.id && to.name === 'auth') {
    return false
  }
})
export default router