<template>
  <nav
    class="navbar dark-navbar"
    aria-label="main navigation"
    role="navigation"
  >
    <div class="container is-max-desktop" style="max-width: unset; padding: 0 10px 0 10px;">
      <div class="navbar-brand">
        <div class="navbar-item brand-item">
          <RouterLink to="/notes" class="brand-link">
            <span class="brand-icon">
              <img src="@/assets/image/gcn_logo.jpg" alt="logo" style="width: 40px; height: 40px;"></img>
            </span>
            <span class="brand-text">Live Dashboard</span>
          </RouterLink>
        </div>

        <a
          @click.prevent="showMobileNav = !showMobileNav"
          class="navbar-burger dark-burger"
          :class="{ 'is-active' : showMobileNav }"
          aria-expanded="false"
          aria-label="menu"
          data-target="navbarBasicExample"
          role="button"
          ref="navbarBurgerRef"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div
        id="navbarBasicExample"
        class="navbar-menu dark-menu"
        :class="{ 'is-active' : showMobileNav }"
        ref="navbarMenuRef"
      >
        <div class="navbar-start">
          <RouterLink
            @click="showMobileNav = false"
            to="/register_gcn_sub_stream"
            class="nav-link"
            active-class="nav-active"
          >
            <span class="nav-icon">📝</span>
            <span class="nav-text">Register</span>
          </RouterLink>
          <RouterLink
            @click="showMobileNav = false"
            to="/youtube-connect"
            class="nav-link"
            active-class="nav-active"
          >
            <span class="nav-icon">🎥</span>
            <span class="nav-text">YouTube Connect</span>
          </RouterLink>
          <RouterLink
            @click="showMobileNav = false"
            to="/stats"
            class="nav-link"
            active-class="nav-active"
          >
            <span class="nav-icon">📈</span>
            <span class="nav-text">Stats</span>
          </RouterLink>
          <RouterLink
            @click="showMobileNav = false"
            to="/privacy_policy"
            class="nav-link"
            active-class="nav-active"
          >
            <span class="nav-icon">📈</span>
            <span class="nav-text">Privacy  & Policy</span>
          </RouterLink>
        </div>
        <div class="navbar-end">
          <button 
            v-if="storeAuth.user.id"
            @click="logout"
            class="auth-btn logout-btn">
            <span class="btn-icon">🚪</span>
            <span class="btn-text">Logout {{ storeAuth.user.email }}</span>
          </button>
          <button 
            v-else
            @click="$router.push('/auth')"
            class="auth-btn login-btn">
            <span class="btn-icon">🔐</span>
            <span class="btn-text">Login</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useStoreAuth } from '@/stores/storeAuth'
const storeAuth = useStoreAuth()
/*
  imports
*/

  import { ref } from 'vue'
  import { onClickOutside } from '@vueuse/core'

/*
  mobile nav
*/

  const showMobileNav = ref(false)

/*
  click outside to close
*/

  const navbarMenuRef = ref(null)
  const navbarBurgerRef = ref(null)

  const logout = () => {
    showMobileNav.value = false
    storeAuth.logout()
  }

  onClickOutside(navbarMenuRef, () => {
    showMobileNav.value = false
  }, {
    ignore: [navbarBurgerRef]
  })

</script>

<style lang="css" scoped>
/* Dark Theme Navbar Styles */
.dark-navbar {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
  border-bottom: 1px solid #2d2d3f !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  padding: 0.5rem 0 !important;
}

.brand-item {
  padding: 0.75rem 1rem !important;
}

.brand-link {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  text-decoration: none !important;
  color: #ffffff !important;
  font-size: 1.4em !important;
  font-weight: 700 !important;
  transition: all 0.3s ease !important;
}

.brand-link:hover {
  color: #667eea !important;
  text-shadow: 0 0 10px rgba(102, 126, 234, 0.5) !important;
}

.brand-icon {
  font-size: 1.2em !important;
  filter: drop-shadow(0 0 5px rgba(102, 126, 234, 0.5)) !important;
}

.brand-text {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

/* Dark Burger Menu */
.dark-burger {
  background: none !important;
  border: none !important;
  color: #ffffff !important;
}

.dark-burger span {
  background-color: #ffffff !important;
  height: 2px !important;
  border-radius: 1px !important;
  transition: all 0.3s ease !important;
}

.dark-burger:hover span {
  background-color: #667eea !important;
}

.dark-burger.is-active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px) !important;
}

.dark-burger.is-active span:nth-child(2) {
  opacity: 0 !important;
}

.dark-burger.is-active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px) !important;
}

/* Dark Menu */


/* Navigation Links */
.nav-link {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 0.75rem 1rem !important;
  color: #a0a0a0 !important;
  text-decoration: none !important;
  border-radius: 8px !important;
  margin: 0.25rem 0.5rem !important;
  transition: all 0.3s ease !important;
  font-weight: 500 !important;
}

.nav-link:hover {
  background: #2d2d3f !important;
  color: #ffffff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2) !important;
}

.nav-active {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
}

.nav-icon {
  font-size: 1.1em !important;
}

.nav-text {
  font-size: 0.95em !important;
}

/* Auth Buttons */
.auth-btn {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 0.5rem 1rem !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 0.9em !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  margin: 0.5rem !important;
  text-decoration: none !important;
}

.login-btn {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
}

.login-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
}

.logout-btn {
  background: linear-gradient(135deg, #dc3545, #c82333) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3) !important;
}

.logout-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4) !important;
}

.btn-icon {
  font-size: 1em !important;
}

.btn-text {
  font-size: 0.85em !important;
}

/* Mobile Responsive */
@media (max-width: 1023px) {
  .dark-menu {
  background: #1e1e2e !important;
  border: 1px solid #2d2d3f !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
}
  .dark-menu {
    position: absolute !important;
    left: 0 !important;
    width: 100% !important;
    top: 100% !important;
    border-top: 1px solid #2d2d3f !important;
    border-radius: 0 0 15px 15px !important;
  }
  
  .nav-link {
    margin: 0.5rem !important;
    padding: 1rem !important;
  }
  
  .auth-btn {
    margin: 0.5rem !important;
    width: calc(100% - 1rem) !important;
    justify-content: center !important;
  }
  
  .brand-text {
    font-size: 1.2em !important;
  }
}

@media (max-width: 480px) {
  .brand-link {
    font-size: 1.2em !important;
  }
  
  .brand-text {
    font-size: 1em !important;
  }
  
  .nav-link {
    padding: 0.75rem !important;
  }
  
  .auth-btn {
    padding: 0.75rem !important;
    font-size: 0.85em !important;
  }
}
</style>