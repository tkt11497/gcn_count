<template>
  <main class="sheet-sync">
    <section class="sync-header">
      <div>
        <p class="eyebrow">Social metrics automation</p>
        <h1>Google Sheet Sync</h1>
        <p class="subtitle">
          Auto-discover recent Facebook, Instagram, TikTok, and YouTube content, then append or update the reporting sheet.
        </p>
      </div>
      <div class="status-panel">
        <span class="status-label">Last run</span>
        <strong>{{ latestRunLabel }}</strong>
        <small>{{ latestRunDetails }}</small>
      </div>
    </section>

    <section class="sync-grid">
      <form class="sync-panel" @submit.prevent="saveConfig">
        <div class="panel-title">
          <h2>Sheet Setup</h2>
          <span>Required</span>
        </div>

        <label>
          Google Sheet ID
          <input v-model.trim="form.sheetId" type="text" placeholder="1abcDEF..." autocomplete="off" />
        </label>

        <div class="two-col">
          <label>
            Content tab
            <input v-model.trim="form.sheetTab" type="text" placeholder="Sheet1" />
          </label>
          <label>
            Follower tab
            <input v-model.trim="form.followerSheetTab" type="text" placeholder="Follower Growth" />
          </label>
        </div>

        <div class="two-col">
          <label>
            Header row
            <input v-model.number="form.headerRow" type="number" min="1" />
          </label>
          <div class="date-summary">
            <span>Follower sheet</span>
            <strong>Before, total, and growth</strong>
          </div>
        </div>

        <div class="two-col">
          <label>
            Timezone
            <input v-model.trim="form.timezone" type="text" placeholder="Asia/Rangoon" />
          </label>
          <label>
            Schedule time
            <input v-model="form.scheduleTime" type="time" />
          </label>
        </div>

        <div class="two-col">
          <label>
            Start date
            <input v-model="form.startDate" type="date" />
          </label>
          <label>
            End date
            <input v-model="form.endDate" type="date" />
          </label>
        </div>

        <div class="two-col">
          <div class="date-summary">
            <span>Sync window</span>
            <strong>{{ syncWindowLabel }}</strong>
          </div>
          <label class="switch-row">
            <input v-model="form.scheduleEnabled" type="checkbox" />
            <span>Enable scheduled sync</span>
          </label>
        </div>

        <div class="two-col">
          <label class="switch-row">
            <input v-model="form.enabledPlatforms.facebook" type="checkbox" />
            <span>Facebook</span>
          </label>
          <label class="switch-row">
            <input v-model="form.enabledPlatforms.instagram" type="checkbox" />
            <span>Instagram</span>
          </label>
        </div>

        <div class="two-col">
          <label class="switch-row">
            <input v-model="form.enabledPlatforms.youtube" type="checkbox" />
            <span>YouTube</span>
          </label>
          <label class="switch-row">
            <input v-model="form.enabledPlatforms.tiktok" type="checkbox" />
            <span>TikTok</span>
          </label>
        </div>

        <div class="actions">
          <button type="submit" :disabled="busy">Save Config</button>
          <button type="button" class="secondary" :disabled="busy" @click="testSheet">Test Sheet</button>
        </div>
      </form>

      <section class="sync-panel">
        <div class="panel-title">
          <h2>Backend Secrets</h2>
          <span>Optional update</span>
        </div>

        <label>
          Service account JSON
          <textarea
            v-model="secrets.googleServiceAccountJson"
            rows="6"
            placeholder='Paste the full downloaded Google service account JSON here'
          ></textarea>
        </label>

        <div class="two-col">
          <label>
            Google OAuth client ID
            <input v-model.trim="secrets.googleOAuthClientId" type="password" autocomplete="new-password" />
          </label>
          <label>
            Google OAuth client secret
            <input v-model.trim="secrets.googleOAuthClientSecret" type="password" autocomplete="new-password" />
          </label>
        </div>

        <label>
          YouTube redirect URI
          <input v-model.trim="secrets.youtubeRedirectUri" type="text" :placeholder="YOUTUBE_REDIRECT_URI" />
        </label>

        <div class="two-col">
          <label>
            Instagram client ID
            <input v-model.trim="secrets.instagramClientId" type="password" autocomplete="new-password" />
          </label>
          <label>
            Instagram client secret
            <input v-model.trim="secrets.instagramClientSecret" type="password" autocomplete="new-password" />
          </label>
        </div>

        <label>
          Instagram redirect URI
          <input v-model.trim="secrets.instagramRedirectUri" type="text" :placeholder="INSTAGRAM_REDIRECT_URI" />
        </label>

        <div class="two-col">
          <label>
            TikTok client key
            <input v-model.trim="secrets.tiktokClientKey" type="password" autocomplete="new-password" />
          </label>
          <label>
            TikTok client secret
            <input v-model.trim="secrets.tiktokClientSecret" type="password" autocomplete="new-password" />
          </label>
        </div>

        <label>
          TikTok redirect URI
          <input v-model.trim="secrets.tiktokRedirectUri" type="text" :placeholder="TIKTOK_REDIRECT_URI" />
        </label>

        <p class="hint">
          Create a Google Cloud service account, download its JSON key, share the target Sheet with its client_email, then paste the full JSON here and click Save Config.
        </p>
      </section>
    </section>

    <section class="sync-panel accounts-panel">
      <div class="panel-title">
        <h2>Accounts for This Sheet</h2>
        <span>{{ accountSummary }}</span>
      </div>

      <div class="accounts-grid">
        <div class="account-column">
          <div class="account-heading">
            <strong>Facebook Pages</strong>
            <button type="button" class="mini-btn" @click="toggleAllAccounts('facebook')">
              {{ allFacebookSelected ? 'Clear' : 'All' }}
            </button>
          </div>
          <label v-for="page in facebookPages" :key="page.id" class="account-option">
            <input v-model="form.selectedAccounts.facebook" type="checkbox" :value="page.id" />
            <span>
              {{ page.name || page.id }}
              <small>{{ page.id }}</small>
            </span>
          </label>
          <p v-if="!facebookPages.length" class="empty-note">No Facebook pages connected.</p>
        </div>

        <div class="account-column">
          <div class="account-heading">
            <strong>Instagram Accounts</strong>
            <button type="button" class="mini-btn" @click="toggleAllAccounts('instagram')">
              {{ allInstagramSelected ? 'Clear' : 'All' }}
            </button>
          </div>
          <label v-for="account in instagramAccounts" :key="account.id" class="account-option">
            <input v-model="form.selectedAccounts.instagram" type="checkbox" :value="account.id" />
            <span>
              {{ account.displayName || account.username || account.accountId || account.id }}
              <small>{{ account.accountId || account.id }}{{ account.pageName ? ` - ${account.pageName}` : '' }}</small>
            </span>
          </label>
          <p v-if="!instagramAccounts.length" class="empty-note">Connect Instagram or run a preview to discover accounts linked to Facebook pages.</p>
        </div>

        <div class="account-column">
          <div class="account-heading">
            <strong>YouTube Channels</strong>
            <button type="button" class="mini-btn" @click="toggleAllAccounts('youtube')">
              {{ allYouTubeSelected ? 'Clear' : 'All' }}
            </button>
          </div>
          <label v-for="channel in youtubeChannels" :key="channel.id" class="account-option">
            <input v-model="form.selectedAccounts.youtube" type="checkbox" :value="channel.id" />
            <span>
              {{ channel.name || channel.id }}
              <small>{{ channel.id }}{{ channel.connectedAs ? ` - ${channel.connectedAs}` : '' }}</small>
            </span>
          </label>
          <p v-if="!youtubeChannels.length" class="empty-note">No YouTube channels connected.</p>
        </div>

        <div class="account-column">
          <div class="account-heading">
            <strong>TikTok Accounts</strong>
            <button type="button" class="mini-btn" @click="toggleAllAccounts('tiktok')">
              {{ allTikTokSelected ? 'Clear' : 'All' }}
            </button>
          </div>
          <label v-for="account in tiktokAccounts" :key="account.id" class="account-option">
            <input v-model="form.selectedAccounts.tiktok" type="checkbox" :value="account.id" />
            <span>
              {{ account.displayName || account.accountId || account.id }}
              <small>{{ account.accountId || account.id }}</small>
            </span>
          </label>
          <p v-if="!tiktokAccounts.length" class="empty-note">No TikTok accounts connected.</p>
        </div>
      </div>

      <p class="hint">If no account is selected for a platform, that platform syncs all connected accounts. Select one or more to limit this sheet.</p>
    </section>

    <section class="sync-panel controls-panel">
      <div class="panel-title">
        <h2>Run Controls</h2>
        <span>{{ runningLabel }}</span>
      </div>
      <div class="actions">
        <button :disabled="busy" @click="previewSync">Preview Sync</button>
        <button :disabled="busy" @click="runSync">Run Now</button>
        <button class="secondary" :disabled="busy" @click="connectInstagram">Connect Instagram</button>
        <button class="secondary" :disabled="busy" @click="connectYouTube">Connect YouTube</button>
        <button class="secondary" :disabled="busy" @click="connectTikTok">Connect TikTok</button>
      </div>
      <p v-if="message" class="message" :class="{ error: messageType === 'error' }">{{ message }}</p>
    </section>

    <section v-if="instagramDebugRows.length" class="sync-panel debug-panel">
      <div class="panel-title">
        <h2>Instagram Debug</h2>
        <span>{{ instagramDebugRows.length }} events</span>
      </div>
      <pre>{{ instagramDebugText }}</pre>
    </section>

    <section v-if="previewRows.length" class="sync-panel">
      <div class="panel-title">
        <h2>Preview Rows</h2>
        <span>{{ previewRows.length }} shown</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Date</th>
              <th>Content</th>
              <th>Platform</th>
              <th>Type</th>
              <th>Reach</th>
              <th>Views / Impression</th>
              <th>Interactions</th>
              <th>Video View</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in previewRows" :key="item.key">
              <td>{{ item.action }}</td>
              <td>{{ item.row[0] }}</td>
              <td class="content-cell">{{ item.row[1] }}</td>
              <td>{{ item.row[2] }}</td>
              <td>{{ item.row[3] }}</td>
              <td>{{ item.row[5] }}</td>
              <td>{{ item.row[6] }}</td>
              <td>{{ item.row[7] }}</td>
              <td>{{ item.row[8] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="followerPreviewRows.length" class="sync-panel">
      <div class="panel-title">
        <h2>Follower Preview</h2>
        <span>{{ followerPreviewRows.length }} accounts</span>
      </div>
      <div class="table-wrap">
        <table class="follower-table">
          <thead>
            <tr>
              <th>Date Range</th>
              <th>Platform</th>
              <th>Account</th>
              <th>Account ID</th>
              <th>Start Followers</th>
              <th>End Followers</th>
              <th>Growth</th>
              <th>Current Followers</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in followerPreviewRows" :key="`${row[1]}-${row[3]}-${rowIndex}`">
              <td v-for="(value, index) in row" :key="index">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="sync-panel">
      <div class="panel-title">
        <h2>Recent Runs</h2>
        <span>{{ runs.length }} loaded</span>
      </div>
      <div class="run-list">
        <article v-for="run in runs" :key="run.id" class="run-card">
          <div>
            <strong>{{ run.status || 'unknown' }}</strong>
            <small>{{ formatTimestamp(run.startedAt) }} - {{ run.source || 'manual' }}</small>
          </div>
          <div class="run-metrics">
            <span>{{ run.discovered || 0 }} found</span>
            <span>{{ run.rowsAppended || 0 }} appended</span>
            <span>{{ run.rowsUpdated || 0 }} updated</span>
            <span>{{ run.followerRowsUpdated || run.followerRowsAppended || 0 }} follower rows</span>
          </div>
          <p v-if="run.errors && run.errors.length" class="run-errors">
            {{ run.errors.map((err) => err.message).join(' | ') }}
          </p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { auth, db } from '@/js/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore'

const CONFIG_ID = 'default'
const CLOUD_FUNCTION_BASE_URL = 'https://us-central1-gcc-live-count.cloudfunctions.net'
const TIKTOK_REDIRECT_URI = `${CLOUD_FUNCTION_BASE_URL}/oauthCallbackTikTok`
const YOUTUBE_REDIRECT_URI = `${CLOUD_FUNCTION_BASE_URL}/oauthCallbackYouTube`
const INSTAGRAM_REDIRECT_URI = `${CLOUD_FUNCTION_BASE_URL}/oauthCallbackInstagram`
const FUNCTION_ENDPOINTS = {
  saveConfig: `${CLOUD_FUNCTION_BASE_URL}/saveSyncConfig`,
  testSheet: `${CLOUD_FUNCTION_BASE_URL}/testSheetConnection`,
  runSync: `${CLOUD_FUNCTION_BASE_URL}/runSheetSync`,
  startInstagram: `${CLOUD_FUNCTION_BASE_URL}/startInstagramOAuth`,
  startYouTube: `${CLOUD_FUNCTION_BASE_URL}/startYouTubeOAuth`,
  startTikTok: `${CLOUD_FUNCTION_BASE_URL}/startTikTokOAuth`
}

const busy = ref(false)
const message = ref('')
const messageType = ref('info')
const previewRows = ref([])
const followerPreviewRows = ref([])
const instagramDebugRows = ref([])
const runs = ref([])
const facebookPages = ref([])
const instagramAccounts = ref([])
const youtubeChannels = ref([])
const tiktokAccounts = ref([])

function dateInputValue(date) {
  return date.toISOString().slice(0, 10)
}

function defaultStartDate() {
  return dateInputValue(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
}

function defaultEndDate() {
  return dateInputValue(new Date())
}

const form = reactive({
  sheetId: '',
  sheetTab: 'Sheet1',
  followerSheetTab: 'Follower Growth',
  headerRow: 1,
  timezone: 'Asia/Rangoon',
  scheduleTime: '09:00',
  scheduleEnabled: false,
  startDate: defaultStartDate(),
  endDate: defaultEndDate(),
  enabledPlatforms: {
    facebook: true,
    instagram: true,
    youtube: true,
    tiktok: true
  },
  selectedAccounts: {
    facebook: [],
    instagram: [],
    youtube: [],
    tiktok: []
  }
})

const secrets = reactive({
  googleServiceAccountJson: '',
  googleOAuthClientId: '',
  googleOAuthClientSecret: '',
  youtubeRedirectUri: YOUTUBE_REDIRECT_URI,
  instagramClientId: '',
  instagramClientSecret: '',
  instagramRedirectUri: INSTAGRAM_REDIRECT_URI,
  tiktokClientKey: '',
  tiktokClientSecret: '',
  tiktokRedirectUri: TIKTOK_REDIRECT_URI
})

const latestRun = computed(() => runs.value[0] || null)
const latestRunLabel = computed(() => latestRun.value?.status || 'No runs yet')
const latestRunDetails = computed(() => {
  if (!latestRun.value) return 'Save config, then run a preview.'
  return `${latestRun.value.rowsAppended || 0} appended, ${latestRun.value.rowsUpdated || 0} updated`
})
const runningLabel = computed(() => busy.value ? 'Working' : 'Ready')
const allFacebookSelected = computed(() => allSelected('facebook'))
const allInstagramSelected = computed(() => allSelected('instagram'))
const allYouTubeSelected = computed(() => allSelected('youtube'))
const allTikTokSelected = computed(() => allSelected('tiktok'))
const instagramDebugText = computed(() => JSON.stringify(instagramDebugRows.value, null, 2))
const accountSummary = computed(() => {
  const total = form.selectedAccounts.facebook.length
    + form.selectedAccounts.instagram.length
    + form.selectedAccounts.youtube.length
    + form.selectedAccounts.tiktok.length
  return total ? `${total} selected` : 'All connected accounts'
})
const syncWindowLabel = computed(() => {
  if (!form.startDate || !form.endDate) return 'Choose start and end date'
  return `${form.startDate} to ${form.endDate}`
})

async function authHeaders() {
  const user = auth.currentUser
  if (!user) throw new Error('Please log in first.')
  const token = await user.getIdToken()
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

function setMessage(text, type = 'info') {
  message.value = text
  messageType.value = type
}

function syncErrorText(errors = []) {
  if (!Array.isArray(errors) || !errors.length) return ''
  return errors
    .slice(0, 3)
    .map((error) => `${error.platform || 'sync'}: ${error.message || error}`)
    .join(' | ')
}

function cleanSecretsPayload() {
  return Object.fromEntries(
    Object.entries(secrets).filter(([, value]) => String(value || '').trim())
  )
}

async function postJson(url, body = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`)
  }
  return data
}

async function loadConfig() {
  const snap = await getDoc(doc(db, 'sync_configs', CONFIG_ID))
  if (!snap.exists()) return
  const data = snap.data()
  Object.assign(form, {
    sheetId: data.sheetId || '',
    sheetTab: data.sheetTab || 'Sheet1',
    followerSheetTab: data.followerSheetTab || 'Follower Growth',
    headerRow: Number(data.headerRow || 1),
    timezone: data.timezone || 'Asia/Rangoon',
    scheduleTime: data.scheduleTime || '09:00',
    scheduleEnabled: Boolean(data.scheduleEnabled),
    startDate: data.startDate || fallbackStartDate(data.lookbackDays),
    endDate: data.endDate || defaultEndDate(),
    enabledPlatforms: {
      facebook: data.enabledPlatforms?.facebook !== false,
      instagram: data.enabledPlatforms?.instagram !== false,
      youtube: data.enabledPlatforms?.youtube !== false,
      tiktok: data.enabledPlatforms?.tiktok !== false
    },
    selectedAccounts: {
      facebook: Array.isArray(data.selectedAccounts?.facebook) ? data.selectedAccounts.facebook : [],
      instagram: Array.isArray(data.selectedAccounts?.instagram) ? data.selectedAccounts.instagram : [],
      youtube: Array.isArray(data.selectedAccounts?.youtube) ? data.selectedAccounts.youtube : [],
      tiktok: Array.isArray(data.selectedAccounts?.tiktok) ? data.selectedAccounts.tiktok : []
    }
  })
}

function fallbackStartDate(lookbackDays = 14) {
  const days = Math.max(1, Math.min(90, Number(lookbackDays || 14)))
  return dateInputValue(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
}

async function loadAccounts() {
  const [pagesSnap, instagramSnap, channelsSnap, tiktokSnap] = await Promise.all([
    getDocs(collection(db, 'pages')),
    getDocs(query(collection(db, 'social_accounts'), where('platform', '==', 'instagram'))),
    getDocs(collection(db, 'youtube_channels')),
    getDocs(query(collection(db, 'social_accounts'), where('platform', '==', 'tiktok')))
  ])

  facebookPages.value = pagesSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))

  instagramAccounts.value = instagramSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => String(a.displayName || a.username || a.accountId || a.id).localeCompare(String(b.displayName || b.username || b.accountId || b.id)))

  youtubeChannels.value = channelsSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))

  tiktokAccounts.value = tiktokSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => String(a.displayName || a.accountId || a.id).localeCompare(String(b.displayName || b.accountId || b.id)))
}

function accountIds(platform) {
  if (platform === 'facebook') return facebookPages.value.map((item) => item.id)
  if (platform === 'instagram') return instagramAccounts.value.map((item) => item.id)
  if (platform === 'youtube') return youtubeChannels.value.map((item) => item.id)
  return tiktokAccounts.value.map((item) => item.id)
}

function allSelected(platform) {
  const ids = accountIds(platform)
  const selected = form.selectedAccounts[platform] || []
  return ids.length > 0 && ids.every((id) => selected.includes(id))
}

function toggleAllAccounts(platform) {
  const ids = accountIds(platform)
  form.selectedAccounts[platform] = allSelected(platform) ? [] : ids
}

async function loadRuns() {
  const runsQuery = query(
    collection(db, 'sync_runs'),
    orderBy('startedAt', 'desc'),
    limit(10)
  )
  const snap = await getDocs(runsQuery)
  runs.value = snap.docs.map((runDoc) => ({ id: runDoc.id, ...runDoc.data() }))
}

async function saveConfig() {
  busy.value = true
  setMessage('')
  try {
    const secretsPayload = cleanSecretsPayload()
    await postJson(FUNCTION_ENDPOINTS.saveConfig, {
      configId: CONFIG_ID,
      config: form,
      secrets: secretsPayload
    })
    Object.keys(secrets).forEach((key) => { secrets[key] = '' })
    setMessage(Object.keys(secretsPayload).length
      ? 'Sync config and backend secrets saved.'
      : 'Sync config saved. Secret fields were empty, so no secrets were changed.')
    await loadConfig()
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function testSheet() {
  busy.value = true
  setMessage('')
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.testSheet, { configId: CONFIG_ID })
    setMessage(result.message || 'Sheet connection works.')
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function previewSync() {
  busy.value = true
  setMessage('')
  previewRows.value = []
  followerPreviewRows.value = []
  instagramDebugRows.value = []
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.runSync, {
      configId: CONFIG_ID,
      preview: true,
      config: form
    })
    previewRows.value = result.previewRows || []
    followerPreviewRows.value = result.followerPreviewRows || []
    instagramDebugRows.value = result.instagramDebug || []
    const errors = syncErrorText(result.errors)
    setMessage(`Preview complete: ${result.discovered || 0} content rows discovered, ${followerPreviewRows.value.length} follower rows ready.${errors ? ` Errors: ${errors}` : ''}`, errors ? 'error' : 'info')
    await Promise.all([loadRuns(), loadAccounts()])
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function runSync() {
  busy.value = true
  setMessage('')
  instagramDebugRows.value = []
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.runSync, {
      configId: CONFIG_ID,
      config: form
    })
    const followerRows = (result.followerRowsAppended || 0) + (result.followerRowsUpdated || 0)
    instagramDebugRows.value = result.instagramDebug || []
    const errors = syncErrorText(result.errors)
    setMessage(`Sync complete: ${result.rowsAppended || 0} appended, ${result.rowsUpdated || 0} updated, ${followerRows} follower rows saved.${errors ? ` Errors: ${errors}` : ''}`, errors ? 'error' : 'info')
    previewRows.value = []
    followerPreviewRows.value = []
    await Promise.all([loadRuns(), loadAccounts()])
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function connectTikTok() {
  busy.value = true
  setMessage('')
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.startTikTok, { configId: CONFIG_ID })
    window.open(result.authUrl, '_blank', 'noopener,noreferrer')
    setMessage(`TikTok authorization opened. Redirect URI: ${result.redirectUri || TIKTOK_REDIRECT_URI}`)
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function connectInstagram() {
  busy.value = true
  setMessage('')
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.startInstagram, { configId: CONFIG_ID })
    window.open(result.authUrl, '_blank', 'noopener,noreferrer')
    setMessage(`Instagram authorization opened. Redirect URI: ${result.redirectUri || INSTAGRAM_REDIRECT_URI}`)
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function connectYouTube() {
  busy.value = true
  setMessage('')
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.startYouTube, { configId: CONFIG_ID })
    window.open(result.authUrl, '_blank', 'noopener,noreferrer')
    setMessage(`YouTube authorization opened. Redirect URI: ${result.redirectUri || YOUTUBE_REDIRECT_URI}`)
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

function formatTimestamp(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString()
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadRuns(), loadAccounts()])
})
</script>

<style scoped>
.sheet-sync {
  min-height: 100vh;
  background:
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(24, 36, 61, 0.96)),
    linear-gradient(90deg, #132319, #273444);
  color: #f8fafc;
  padding: 28px;
}

.sync-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
  align-items: stretch;
  margin: 0 auto 22px;
  max-width: 1280px;
}

.eyebrow {
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 8px;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 2.1rem;
  line-height: 1.1;
}

h2 {
  font-size: 1.05rem;
}

.subtitle {
  color: #b6c2d2;
  margin-top: 10px;
  max-width: 780px;
}

.status-panel,
.sync-panel {
  background: #172033;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
}

.status-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
}

.status-label,
.panel-title span,
.hint,
.run-card small {
  color: #99a8bc;
  font-size: 0.82rem;
}

.status-panel strong {
  font-size: 1.3rem;
  margin: 6px 0;
  text-transform: capitalize;
}

.sync-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.9fr);
  gap: 18px;
  margin: 0 auto 18px;
  max-width: 1280px;
}

.sync-panel {
  margin: 0 auto 18px;
  max-width: 1280px;
  padding: 20px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #2b3a55;
  margin-bottom: 18px;
  padding-bottom: 12px;
}

label {
  color: #dbe7f5;
  display: grid;
  font-size: 0.9rem;
  font-weight: 700;
  gap: 7px;
  margin-bottom: 14px;
}

input,
textarea {
  background: #0f1727;
  border: 1px solid #34445f;
  border-radius: 8px;
  color: #f8fafc;
  font: inherit;
  min-height: 42px;
  outline: none;
  padding: 10px 12px;
  width: 100%;
}

textarea {
  min-height: 140px;
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

.two-col {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
}

.switch-row {
  align-items: center;
  display: flex;
  gap: 10px;
  min-height: 66px;
}

.date-summary {
  background: #0f1727;
  border: 1px solid #34445f;
  border-radius: 8px;
  display: grid;
  gap: 5px;
  min-height: 66px;
  padding: 11px 12px;
}

.date-summary span {
  color: #99a8bc;
  font-size: 0.82rem;
}

.date-summary strong {
  color: #dbe7f5;
  font-size: 0.95rem;
}

.switch-row input {
  accent-color: #38bdf8;
  height: 18px;
  min-height: unset;
  width: 18px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  background: #22c55e;
  border: 0;
  border-radius: 8px;
  color: #07130b;
  cursor: pointer;
  font-weight: 800;
  min-height: 42px;
  padding: 10px 16px;
}

button.secondary {
  background: #38bdf8;
  color: #06121b;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.controls-panel {
  display: block;
}

.accounts-panel {
  display: block;
}

.accounts-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.account-column {
  background: #0f1727;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  min-height: 140px;
  padding: 14px;
}

.account-heading {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.mini-btn {
  background: #22314a;
  color: #dbe7f5;
  font-size: 0.78rem;
  min-height: 30px;
  padding: 6px 10px;
}

.account-option {
  align-items: flex-start;
  background: #172033;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  display: flex;
  gap: 9px;
  margin: 0 0 8px;
  padding: 10px;
}

.account-option input {
  accent-color: #38bdf8;
  height: 18px;
  margin-top: 2px;
  min-height: unset;
  width: 18px;
}

.account-option span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.account-option small {
  color: #99a8bc;
  font-family: monospace;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-note {
  color: #99a8bc;
  font-size: 0.86rem;
}

.message {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 8px;
  color: #bbf7d0;
  margin-top: 14px;
  padding: 12px;
}

.message.error {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.38);
  color: #fecaca;
}

.table-wrap {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  min-width: 980px;
  width: 100%;
}

.follower-table {
  min-width: 900px;
}

th,
td {
  border-bottom: 1px solid #2b3a55;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

th {
  color: #93c5fd;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.content-cell {
  max-width: 300px;
}

.run-list {
  display: grid;
  gap: 12px;
}

.run-card {
  background: #0f1727;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  display: grid;
  gap: 10px;
  padding: 14px;
}

.run-card strong {
  display: block;
  margin-bottom: 3px;
  text-transform: capitalize;
}

.run-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.run-metrics span {
  background: #172033;
  border-radius: 999px;
  color: #cbd5e1;
  font-size: 0.82rem;
  padding: 6px 10px;
}

.run-errors {
  color: #fecaca;
  font-size: 0.86rem;
}

.debug-panel pre {
  background: #050914;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 0.78rem;
  line-height: 1.45;
  max-height: 520px;
  overflow: auto;
  padding: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 900px) {
  .sheet-sync {
    padding: 18px;
  }

  .sync-header,
  .sync-grid,
  .accounts-grid,
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
