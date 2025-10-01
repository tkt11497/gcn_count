<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="header-section">
        <div class="logo-section">
          <div class="logo">🔐</div>
          <h1 class="main-title">Authentication</h1>
        </div>
        <p class="subtitle">Welcome back! Please sign in to continue</p>
      </div>

      <div class="tabs-section">
        <div class="tabs">
          <div class="tab" :class="{ 'active': !register }" @click="register = false">
            <span class="tab-icon">👤</span>
            Login
          </div>
          <!-- <div class="tab" :class="{ 'active': register }" @click="register = true">
            <span class="tab-icon">📝</span>
            Register
          </div> -->
        </div>
      </div>

      <div class="form-section">
        <div class="form-title">
          {{ register ? 'Create Account' : 'Sign In' }}
        </div>
        
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-field">
            <label class="field-label">Email Address</label>
            <div class="input-wrapper">
              <span class="input-icon">📧</span>
              <input 
                class="form-input" 
                type="email" 
                v-model="form.email" 
                placeholder="Enter your email address"
                required
              >
            </div>
          </div>
          
          <div class="form-field">
            <label class="field-label">Password</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input 
                class="form-input" 
                type="password" 
                v-model="form.password" 
                minlength="6" 
                placeholder="Enter your password"
                required
              >
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              class="submit-btn" 
              :disabled="!form.email || !form.password || loading"
              :class="{ 'loading': loading }"
            >
              <span v-if="loading" class="loading-spinner"></span>
              <span v-else>{{ register ? 'Create Account' : 'Sign In' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- <div class="footer-section">
        <div class="auth-info">
          <p>{{ register ? 'Already have an account?' : "Don't have an account?" }}</p>
          <button class="switch-btn" @click="register = !register">
            {{ register ? 'Sign In' : 'Create Account' }}
          </button>
        </div>
      </div> -->
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useStoreAuth } from '@/stores/storeAuth'
const storeAuth = useStoreAuth()
const register = ref(false)
const form = reactive({
    email: '',
    password: ''
})
const loading = ref(false)
const handleSubmit = () => {
    loading.value = true
    if(!form.email || !form.password) {
        alert('Please enter email and password')
        return
    }else {
        if(register.value) {
            // storeAuth.register(form.email, form.password).then(() => {
            //     loading.value = false
            // })
        }else {
            storeAuth.login(form.email, form.password).then(() => {
                loading.value = false
            })
        }
    }
}
</script>
<style lang="css" scoped>
/* Dark Theme Styles for Auth Page */
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.auth-card {
  background: #1e1e2e;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  padding: 40px;
  max-width: 450px;
  width: 100%;
  animation: slideIn 0.6s ease-out;
  border: 1px solid #2d2d3f;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #2d2d3f;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.logo {
  font-size: 2.5em;
  margin-right: 15px;
  animation: pulse 2s infinite;
  filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.5));
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.main-title {
  color: #ffffff;
  font-size: 2em;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.subtitle {
  color: #a0a0a0;
  font-size: 1em;
  margin: 10px 0 0 0;
  font-weight: 400;
}

.tabs-section {
  margin-bottom: 30px;
}

.tabs {
  display: flex;
  background: #2d2d3f;
  border-radius: 12px;
  padding: 4px;
  border: 1px solid #3d3d4f;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #a0a0a0;
  font-weight: 500;
  font-size: 14px;
}

.tab:hover {
  color: #ffffff;
  background: #3d3d4f;
}

.tab.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.3);
}

.tab-icon {
  font-size: 16px;
}

.form-section {
  margin-bottom: 30px;
}

.form-title {
  color: #ffffff;
  font-size: 1.5em;
  font-weight: 600;
  text-align: center;
  margin-bottom: 25px;
}

.form-field {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  font-size: 16px;
  color: #a0a0a0;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: #2d2d3f;
  border: 1px solid #3d3d4f;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  transition: all 0.3s ease;
  outline: none;
}

.form-input::placeholder {
  color: #666;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: #3d3d4f;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 30px;
}

.submit-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.footer-section {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #2d2d3f;
}

.auth-info p {
  color: #a0a0a0;
  font-size: 14px;
  margin-bottom: 15px;
}

.switch-btn {
  background: none;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.switch-btn:hover {
  background: #667eea;
  color: white;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

/* Responsive Design */
@media (max-width: 480px) {
  .auth-container {
    padding: 10px;
  }
  
  .auth-card {
    padding: 25px;
  }
  
  .main-title {
    font-size: 1.8em;
  }
  
  .logo {
    font-size: 2em;
  }
  
  .tabs {
    flex-direction: column;
    gap: 4px;
  }
  
  .tab {
    padding: 10px 12px;
  }
}
</style>
