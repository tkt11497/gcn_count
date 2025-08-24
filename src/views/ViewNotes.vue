<template>
  <div class="notes">
    <div class="header-section">
      <h2 class="title">Live Concurrent Views Dashboard</h2>
      <button @click="refreshAllPages" class="refresh-all-btn" :disabled="isRefreshing">
        {{ isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh All' }}
      </button>
    </div>

    <progress v-if="storeNotes.notesloading" class="progress is-large is-success" max="100"></progress>
    <template v-else>
      <button @click="test(storeNotes.notes[0].id,storeNotes.notes[0].access_token)">test</button>
      <div class="view_list">
        <div
          v-for="(note,index) in storeNotes.notes"
          class="view_item"
          :key="note.id"
        >
          <div class="page-header">
            <h3 class="page-name">{{ note.name }}</h3>
            <button 
              @click="refreshPageData(note)" 
              class="refresh-btn"
              :disabled="note.loading"
            >
              {{ note.loading ? '⏳' : '🔄' }}
            </button>
          </div>
          
          <div class="page-info">
            <p class="page-id">Page ID: {{ note.id || 'N/A' }}</p>
            <p class="token-status">Token: {{ note.access_token ? '✅ Valid' : '❌ Invalid' }}</p>
          </div>

          <div v-if="note.liveData" class="live-data">
            <div class="live-status">
              <span class="status-indicator" :class="{ 'live': note.liveData.isLive }">
                {{ note.liveData.isLive ? '🔴 LIVE' : '⚫ Offline' }}
              </span>
            </div>
            
            <div v-if="note.liveData.isLive" class="live-stats">
              <div class="stat-item highlight">
                <span class="stat-label">Current Viewers:</span>
                <span class="stat-value">{{ note.liveData.viewerCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Live Duration:</span>
                <span class="stat-value">{{ note.liveData.duration }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Video Title:</span>
                <span class="stat-value">{{ note.liveData.title }}</span>
              </div>
            </div>
            <div v-else class="offline-stats">
              <div class="stat-item">
                <span class="stat-label">Status:</span>
                <span class="stat-value">Offline</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Last Updated:</span>
                <span class="stat-value">{{ note.liveData.lastUpdated }}</span>
              </div>
            </div>
          </div>

          <div v-if="note.error" class="error-message">
            <p>❌ {{ note.error }}</p>
          </div>
        </div>
      </div>
    </template>
    
    <div 
      v-if="storeNotes.notes.length === 0"
      class="is-size-4 has-text-centered has-text-grey-light is-family-monospace py-6"
    >
      No pages found...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStoreNotes } from '@/stores/storeNotes'
import { getLiveVideoData, getPageInsights } from '@/js/facebookAuth'

const storeNotes = useStoreNotes()
const isRefreshing = ref(false)

const test= async(page_id,page_token)=>{
  const res=await fetch(`https://graph.facebook.com/v20.0/${page_id}/live_videos?fields=id,status,stream_url&access_token=${page_token}`)
  console.log(res)
}


// Refresh live data for a specific page
const refreshPageData = async (note) => {
  if (!note.access_token) {
    note.error = 'No access token available'
    return
  }

  note.loading = true
  note.error = null

  try {
    // Get live video data
    const liveData = await getLiveVideoData(note.id, note.access_token)
    
    if (liveData.isLive) {
      const duration = formatDuration(Date.now() - new Date(liveData.startTime).getTime())
      note.liveData = {
        isLive: true,
        viewerCount: liveData.viewerCount,
        duration: duration,
        title: liveData.title,
        videoId: liveData.videoId,
        lastUpdated: new Date().toLocaleTimeString()
      }
    } else {
      note.liveData = {
        isLive: false,
        viewerCount: 0,
        duration: 'N/A',
        title: 'N/A',
        videoId: null,
        lastUpdated: new Date().toLocaleTimeString()
      }
    }

    // Get page insights for additional data
    try {
      const pageInsights = await getPageInsights(note.id, note.access_token)
      const pageViews = pageInsights.find(insight => insight.name === 'page_views_total')
      const pageFans = pageInsights.find(insight => insight.name === 'page_fans')
      
      if (pageViews) {
        note.liveData.pageViews = pageViews.values?.[0]?.value || 0
      }
      if (pageFans) {
        note.liveData.pageFans = pageFans.values?.[0]?.value || 0
      }
    } catch (error) {
      console.error('Error getting page insights:', error)
    }

  } catch (error) {
    console.error('Error refreshing page data:', error)
    note.error = error.message || 'Failed to fetch live data'
  } finally {
    note.loading = false
  }
}

// Format duration in human readable format
const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Refresh all pages data
const refreshAllPages = async () => {
  isRefreshing.value = true
  try {
    for (const note of storeNotes.notes) {
      await refreshPageData(note)
    }
  } finally {
    isRefreshing.value = false
  }
}

// Auto-refresh all pages data
const autoRefreshAllPages = async () => {
  for (const note of storeNotes.notes) {
    await refreshPageData(note)
  }
}

// Set up auto-refresh every 30 seconds
let refreshInterval = null

onMounted(() => {
  // Initial refresh after 2 seconds
  setTimeout(autoRefreshAllPages, 2000)
  
  // // Set up interval for auto-refresh
  refreshInterval = setInterval(autoRefreshAllPages, 30000) // 30 seconds
})

// Clean up interval on unmount
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
<style lang="css" scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.title {
  color: #48C78E;
  font-size: 1.8em;
  font-weight: bold;
  margin: 0;
}

.refresh-all-btn {
  background: #48C78E;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
}

.refresh-all-btn:hover {
  background: #3da066;
}

.refresh-all-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.view_item {
  padding: 15px;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.view_item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.view_item:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.view_list {
  background: #48C78E;
  color: white;
  margin: 10px;
  padding: 20px;
  width: 100%;
  min-height: 500px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.page-name {
  font-size: 1.3em;
  font-weight: bold;
  margin: 0;
  color: #fff;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  margin-bottom: 15px;
}

.page-info p {
  margin: 8px 0;
  font-size: 0.9em;
  opacity: 0.8;
}

.live-data {
  margin-top: 15px;
}

.live-status {
  margin-bottom: 15px;
}

.status-indicator {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.2);
}

.status-indicator.live {
  background: #ff4444;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.live-stats, .offline-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.stat-item.highlight {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.stat-label {
  display: block;
  font-size: 0.85em;
  opacity: 0.8;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  display: block;
  font-size: 1.4em;
  font-weight: bold;
  color: #fff;
}

.error-message {
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.5);
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
}

.error-message p {
  margin: 0;
  color: #ffcccc;
  font-size: 0.9em;
}
</style>