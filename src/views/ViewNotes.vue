<template>
  <div class="notes">
    <div class="header-section">
      <h2 class="title">Live Concurrent Views Dashboard</h2>
      <h2 class="title2">Total View  - {{ totalLiveViewers }}</h2>
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
              <span class="status-indicator url_class" :class="{ 'live': note.liveData.isLive }">
                Stream Url {{ note.liveData.isLive ? note.liveData.stream_url : '--' }}
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStoreNotes } from '@/stores/storeNotes'
import { getLiveVideoData, getPageInsights } from '@/js/facebookAuth'
import { db } from '@/js/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const storeNotes = useStoreNotes()
const isRefreshing = ref(false)

// Returns total live viewers across all pages (sums numeric viewerCount of live items)
const computeTotalLiveViewers = () => {
  try {
    return storeNotes.notes.reduce((sum, note) => {
      const isLive = note && note.liveData && note.liveData.isLive
      const raw = isLive ? Number(note.liveData.viewerCount) : 0
      const add = Number.isFinite(raw) ? raw : 0
      return sum + add
    }, 0)
  } catch (_) {
    return 0
  }
}

// Reactive total
const totalLiveViewers = computed(computeTotalLiveViewers)

// Persist total to Firestore whenever it changes
const saveTotalToFirestore = async (total) => {
  try {
    const ref = doc(db, 'metrics', 'live_totals')
    await setDoc(ref, {
      totalLiveViewers: Number(total) || 0,
      updatedAt: serverTimestamp()
    }, { merge: true })
  } catch (e) {
    console.error('Failed saving total to Firestore', e)
  }
}

watch(totalLiveViewers, (val) => {
  saveTotalToFirestore(val)
})

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
        stream_url: liveData.stream_url,
        lastUpdated: new Date().toLocaleTimeString()
      }
    } else {
      note.liveData = {
        isLive: false,
        viewerCount: 0,
        duration: 'N/A',
        title: 'N/A',
        videoId: null,
        stream_url:null,
        lastUpdated: new Date().toLocaleTimeString()
      }
    }

    // Get page insights for additional data
    // try {
    //   const pageInsights = await getPageInsights(note.id, note.access_token)
    //   const pageViews = pageInsights.find(insight => insight.name === 'page_views_total')
    //   const pageFans = pageInsights.find(insight => insight.name === 'page_fans')
      
    //   if (pageViews) {
    //     note.liveData.pageViews = pageViews.values?.[0]?.value || 0
    //   }
    //   if (pageFans) {
    //     note.liveData.pageFans = pageFans.values?.[0]?.value || 0
    //   }
    // } catch (error) {
    //   console.error('Error getting page insights:', error)
    // }

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

// Set up auto-refresh every 90 seconds
let refreshInterval = null

onMounted(() => {
  // Initial refresh after 2 seconds
  setTimeout(autoRefreshAllPages, 2000)
  
  // Set up interval for auto-refresh
  refreshInterval = setInterval(autoRefreshAllPages, 90000) // 90 seconds
})

// Clean up interval on unmount
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
<style lang="css" scoped>
/* Dark Theme Styles for Live Dashboard */
.notes {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.url_class{
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis
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
  text-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}
.title2{
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.refresh-all-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.refresh-all-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.refresh-all-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.view_list {
  background: #1e1e2e;
  color: white;
  margin: 0;
  padding: 25px;
  width: 100%;
  min-height: 500px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid #2d2d3f;
}

.view_item {
  padding: 20px;
  margin-bottom: 20px;
  background: #2d2d3f;
  border-radius: 15px;
  border: 1px solid #3d3d4f;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.view_item:hover {
  background: #3d3d4f;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.view_item:not(:last-child) {
  border-bottom: 1px solid #3d3d4f;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3d3d4f;
}

.page-name {
  font-size: 1.4em;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.refresh-btn {
  background: #3d3d4f;
  border: 1px solid #4d4d5f;
  color: #a0a0a0;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2em;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.page-info p {
  margin: 0;
  font-size: 0.9em;
  color: #b0b0b0;
  padding: 8px 12px;
  background: #1e1e2e;
  border-radius: 6px;
  border: 1px solid #3d3d4f;
}

.live-data {
  margin-top: 20px;
}

.live-status {
  margin-bottom: 20px;
  text-align: center;
}

.status-indicator {
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1em;
  background: #3d3d4f;
  color: #a0a0a0;
  border: 1px solid #4d4d5f;
  transition: all 0.3s ease;
}

.status-indicator.live {
  background: linear-gradient(135deg, #ff4444, #cc3333);
  color: white;
  border-color: #ff4444;
  animation: pulse 2s infinite;
  box-shadow: 0 0 20px rgba(255, 68, 68, 0.3);
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

.live-stats, .offline-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  background: #1e1e2e;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid #3d3d4f;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.stat-item:hover {
  background: #2d2d3f;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.stat-item.highlight {
  background: linear-gradient(135deg, #2d2d3f, #3d3d4f);
  border: 2px solid #667eea;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
}

.stat-label {
  display: block;
  font-size: 0.9em;
  color: #a0a0a0;
  margin-bottom: 10px;
  font-weight: 500;
}

.stat-value {
  display: block;
  font-size: 1.6em;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

.error-message {
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 0, 0, 0.2));
  border: 1px solid rgba(255, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  box-shadow: 0 4px 15px rgba(255, 0, 0, 0.1);
}

.error-message p {
  margin: 0;
  color: #ff9999;
  font-size: 0.9em;
  font-weight: 500;
}

/* Progress bar styling */
.progress {
  background: #2d2d3f !important;
  border-radius: 10px !important;
  height: 8px !important;
  margin: 20px 0 !important;
}

.progress::-webkit-progress-bar {
  background: #2d2d3f !important;
  border-radius: 10px !important;
}

.progress::-webkit-progress-value {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  border-radius: 10px !important;
}

.progress::-moz-progress-bar {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  border-radius: 10px !important;
}

/* Test button styling */
button[onclick*="test"] {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

button[onclick*="test"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* Empty state styling */
.is-size-4.has-text-centered.has-text-grey-light.is-family-monospace.py-6 {
  color: #a0a0a0 !important;
  font-size: 1.2em !important;
  padding: 40px 20px !important;
  background: #1e1e2e;
  border-radius: 15px;
  border: 1px solid #2d2d3f;
  margin: 20px 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .notes {
    padding: 15px;
  }
  
  .header-section {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .title {
    font-size: 1.6em;
  }
  
  .page-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .page-info {
    grid-template-columns: 1fr;
  }
  
  .live-stats, .offline-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .view_list {
    padding: 15px;
  }
  
  .view_item {
    padding: 15px;
  }
  
  .title {
    font-size: 1.4em;
  }
}
</style>