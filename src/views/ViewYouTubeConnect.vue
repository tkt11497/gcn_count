<template>
  <div class="youtube-connect">
    <div class="header-section">
      <h2 class="title">Connect YouTube Channel</h2>
      <button @click="$router.push('/notes')" class="back-btn">← Back to Dashboard</button>
    </div>

    <div class="connect-form">
      <div class="form-group">
        <label for="channelId">YouTube Channel ID or Handle:</label>
        <input 
          id="channelId"
          v-model="channelInput" 
          type="text" 
          placeholder="@username or UCxxxxxxxxxxxxxxxxxxxxx"
          class="channel-input"
          @input="validateChannelInput"
        />
        <small class="help-text">
          Enter your YouTube channel ID (starts with UC) or handle (starts with @)
        </small>
        <div v-if="inputError" class="input-error">{{ inputError }}</div>
      </div>

      <div class="form-group">
        <label for="channelName">Display Name (optional):</label>
        <input 
          id="channelName"
          v-model="channelName" 
          type="text" 
          placeholder="My Channel"
          class="channel-input"
        />
      </div>

      <button 
        @click="connectChannel" 
        class="connect-btn"
        :disabled="!channelInput || isConnecting"
      >
        {{ isConnecting ? 'Connecting...' : 'Connect Channel' }}
      </button>
    </div>

    <div v-if="connectedChannels.length" class="connected-channels">
      <h3>Connected Channels</h3>
      <div class="channel-list">
        <div 
          v-for="channel in connectedChannels" 
          :key="channel.id"
          class="channel-item"
        >
          <div class="channel-info">
            <span class="channel-name">{{ channel.name || channel.id }}</span>
            <span class="channel-id">{{ channel.id }}</span>
          </div>
          <button 
            @click="disconnectChannel(channel.id)"
            class="disconnect-btn"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <p>❌ {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStoreAuth } from '@/stores/storeAuth'
import { db } from '@/js/firebase'
import { doc, setDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore'

const storeAuth = useStoreAuth()
const channelInput = ref('')
const channelName = ref('')
const isConnecting = ref(false)
const connectedChannels = ref([])
const error = ref('')
const inputError = ref('')

// Validate channel input
const validateChannelInput = () => {
  const input = channelInput.value.trim()
  inputError.value = ''
  
  if (!input) return
  
  // Check if it's a valid channel ID (starts with UC and is 24 chars)
  if (input.startsWith('UC') && input.length === 24) {
    inputError.value = ''
    return
  }
  
  // Check if it's a valid handle (starts with @)
  if (input.startsWith('@')) {
    const handle = input.substring(1)
    if (handle.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(handle)) {
      inputError.value = ''
      return
    }
    inputError.value = 'Invalid handle format. Use @username'
    return
  }
  
  // If it doesn't start with @, assume it's a handle without @
  if (input.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(input)) {
    inputError.value = ''
    return
  }
  
  // Only show error for clearly invalid inputs
  if (input.length < 3) {
    inputError.value = 'Too short. Use @username or UCxxxxxxxxxxxxxxxxxxxxx'
  } else {
    inputError.value = 'Invalid format. Use @username or UCxxxxxxxxxxxxxxxxxxxxx'
  }
}

// Load connected channels
const loadConnectedChannels = async () => {
  try {
    const channelsRef = collection(db, 'youtube_channels')
    const snapshot = await getDocs(channelsRef)
    connectedChannels.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (e) {
    console.error('Failed to load channels:', e)
  }
}

// Connect a YouTube channel
const connectChannel = async () => {
  if (!channelInput.value || !storeAuth.user.id) return
  
  isConnecting.value = true
  error.value = ''
  
  try {
    let channelId = channelInput.value.trim()
    
    // Normalize the input - if it's a handle without @, add @
    if (!channelId.startsWith('@') && !channelId.startsWith('UC')) {
      channelId = '@' + channelId
    }
    
    // Save to Firestore using the normalized input as the document ID
    const channelRef = doc(db, 'youtube_channels', channelId)
    await setDoc(channelRef, {
      id: channelId,
      name: channelName.value || channelId,
      connectedAt: serverTimestamp()
    }, { merge: true })
    
    // Reload channels
    await loadConnectedChannels()
    
    // Clear form
    channelInput.value = ''
    channelName.value = ''
    inputError.value = ''
    
  } catch (e) {
    error.value = e.message || 'Failed to connect channel'
  } finally {
    isConnecting.value = false
  }
}

// Disconnect a channel
const disconnectChannel = async (channelId) => {
  if (!confirm('Disconnect this channel?')) return
  
  try {
    await deleteDoc(doc(db, 'youtube_channels', channelId))
    await loadConnectedChannels()
  } catch (e) {
    error.value = e.message || 'Failed to disconnect channel'
  }
}

onMounted(() => {
  loadConnectedChannels()
})
</script>

<style lang="css" scoped>
.youtube-connect {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #1e1e2e;
  border-radius: 15px;
  border: 1px solid #2d2d3f;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.title {
  color: #ffffff;
  font-size: 2em;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.back-btn {
  background: #3d3d4f;
  border: 1px solid #4d4d5f;
  color: #a0a0a0;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.connect-form {
  background: #1e1e2e;
  padding: 30px;
  border-radius: 15px;
  border: 1px solid #2d2d3f;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 8px;
}

.channel-input {
  width: 100%;
  padding: 12px;
  background: #2d2d3f;
  border: 1px solid #3d3d4f;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1em;
}

.channel-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

.help-text {
  color: #a0a0a0;
  font-size: 0.9em;
  margin-top: 5px;
}

.connect-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.3s ease;
}

.connect-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.connected-channels {
  background: #1e1e2e;
  padding: 30px;
  border-radius: 15px;
  border: 1px solid #2d2d3f;
}

.connected-channels h3 {
  color: #ffffff;
  margin-bottom: 20px;
}

.channel-list {
  display: grid;
  gap: 15px;
}

.channel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #2d2d3f;
  border: 1px solid #3d3d4f;
  border-radius: 8px;
}

.channel-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.channel-name {
  color: #ffffff;
  font-weight: 600;
}

.channel-id {
  color: #a0a0a0;
  font-size: 0.9em;
}

.disconnect-btn {
  background: #ff4444;
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.disconnect-btn:hover {
  background: #cc3333;
  transform: scale(1.05);
}

.error-message {
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 0, 0, 0.2));
  border: 1px solid rgba(255, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
}

.error-message p {
  margin: 0;
  color: #ff9999;
  font-size: 0.9em;
  font-weight: 500;
}

.input-error {
  color: #ff9999;
  font-size: 0.8em;
  margin-top: 5px;
  font-weight: 500;
}
</style>
