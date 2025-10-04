<template>
  <div class="stats">
    <div class="stats-header">
      <h2 class="title">📊 Statistics Dashboard</h2>
      <div class="summary-cards">
        <div class="stat-card">
          <div class="stat-value">{{ storeNotes.totalNotesCount }}</div>
          <div class="stat-label">Total Pages</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ ytChannels.length }}</div>
          <div class="stat-label">YouTube Channels</div>
        </div>
      </div>
    </div>

    <div class="pages-section">
      <h3 class="section-title">📄 Connected Facebook Pages</h3>
      <div class="pages-grid" v-if="storeNotes.notes.length > 0">
        <div class="page-card" v-for="note in storeNotes.notes" :key="note.id">
          <div class="page-info">
            <div class="page-name">{{ note.name || 'Untitled Page' }}</div>
            <div class="page-id">{{ note.id }}</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No pages connected yet</p>
      </div>
    </div>

    <div class="channels-section">
      <h3 class="section-title">📺 Connected YouTube Channels</h3>
      <div class="channels-grid" v-if="ytChannels.length > 0">
        <div class="channel-card" v-for="channelId in ytChannels" :key="channelId">
          <div class="channel-info">
            <div class="channel-name">{{ ytChannelNames[channelId] || channelId }}</div>
            <div class="channel-id">{{ channelId }}</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No YouTube channels connected yet</p>
      </div>
    </div>

  </div>
</template>

<script setup>
/*
  imports
*/

  import { ref, onMounted } from 'vue'
  import { useStoreNotes } from '@/stores/storeNotes'
  import { db } from '@/js/firebase'
  import { collection, getDocs } from 'firebase/firestore'

/*
  store
*/

  const storeNotes = useStoreNotes()

/*
  reactive data
*/

  const ytChannels = ref([])
  const ytChannelNames = ref({})
  const ytLiveCounts = ref({ channels: {}, totalLiveViewers: 0 })

/*
  load YouTube channels
*/

  const loadYouTubeChannels = async () => {
    try {
      const channelsRef = collection(db, 'youtube_channels')
      const snapshot = await getDocs(channelsRef)
      ytChannels.value = snapshot.docs.map(doc => doc.id)
      
      // Load channel names from Firestore
      const channelNames = {}
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        channelNames[doc.id] = data.name || doc.id
      })
      ytChannelNames.value = channelNames
    } catch (e) {
      console.warn('Failed to load YouTube channels', e)
    }
  }

  onMounted(() => {
    loadYouTubeChannels()
  })

</script>

<style scoped>
.stats {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-header {
  margin-bottom: 40px;
}

.title {
  color: #ffffff;
  font-size: 2.5em;
  font-weight: 700;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #2d2d3f, #3d3d4f);
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  border: 1px solid #4d4d5f;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.stat-value {
  font-size: 3em;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 10px;
}

.stat-label {
  color: #a0a0a0;
  font-size: 1.1em;
  font-weight: 500;
}

.section-title {
  color: #ffffff;
  font-size: 1.8em;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4d4d5f;
}

.pages-section, .channels-section {
  margin-bottom: 40px;
}

.pages-grid, .channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.page-card, .channel-card {
  background: #1e1e2e;
  border: 1px solid #3d3d4f;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.page-card:hover, .channel-card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.page-info, .channel-info {
  width: 100%;
}

.page-name, .channel-name {
  color: #ffffff;
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 5px;
  word-break: break-word;
}

.page-id, .channel-id {
  color: #a0a0a0;
  font-size: 0.85em;
  font-family: monospace;
  word-break: break-all;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.empty-state {
  text-align: center;
  padding: 40px;
  color: #a0a0a0;
  font-size: 1.1em;
  background: #1e1e2e;
  border-radius: 12px;
  border: 1px solid #3d3d4f;
}

@media (max-width: 768px) {
  .pages-grid, .channels-grid {
    grid-template-columns: 1fr;
  }
  
  .page-id, .channel-id {
    max-width: 100%;
  }
}
</style>