<template>
  <div class="reaction-test-container" @click="handleContainerClick">
    <div class="hero-logo" :class="{ 'logo-active': isActive || isStopped }">
      <img src="@/assets/image/msl_logo.png" alt="MSL Logo" class="msl-logo" />
      <div class="logo-text-section" v-if="isActive || isStopped">
        <div class="league-name">MLBB SUPER LEAGUE MYANMAR <span class="season-text">SEASON 2</span></div>
        <div class="challenge-title">
          <span class="title-white">RETRIBUTION</span>
          <span class="title-red">CHALLENAGE</span>
        </div>
        <!-- <div class="title-divider" v-if="isActive || isStopped">
          <div class="divider-line"></div>
          <div class="divider-diamond"></div>
        </div> -->
      </div>
    </div>

    <div class="game-wrapper" :class="{ 'game-active': isActive, 'game-stopped': isStopped }">
      <!-- Game Title -->
      <div class="game-header" v-if="!isActive && !isStopped">
        <div class="header-logos">
          <div class="logo-text">MLBB Super League</div>
          <div class="logo-text">SEASON 2</div>
        </div>
        <div class="header-supertitle">♦ ♦ Retri Challenge ♦ ♦</div>
        <h1 class="game-title"> သင် Retri<br />ဘယ်လောက်ကျွမ်းလဲ?</h1>
        <p class="game-subtitle">သတ်မှတ်ထားသော HP အရောက်တွင်<br />Retri အရပေါက်ပြီး</p>
        <p class="game-instruction">Diamonds လက်ဆောင်များ ရယူလိုက်ပါ</p>
      </div>

      <!-- Lord Video -->
      <div class="lord-video-container" v-if="isActive || isStopped">
        <div class="lord-video-frame">
          <video 
            src="@/assets/image/lord_video.mp4" 
            autoplay 
            loop 
            muted 
            playsinline
            class="lord-video"
          ></video>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-container" v-if="isActive || isStopped">
        <div class="progress-bar-wrapper">
          <div class="progress-bar-bg">
            <!-- Target Zone Indicator -->
            <div 
              class="target-zone-indicator" 
              :style="{ right: targetZoneStart-3.6 + '%', width: targetZoneWidth + '%' }"
            ></div>
            <!-- Progress Fill -->
            <div 
              class="progress-bar-fill" 
              :class="getProgressBarClass()"
              :style="{ width: progressPercentage + '%' }"
            >
            </div>
          </div>
          <!-- Progress Labels -->
          <!-- <div class="progress-labels">
              <span class="progress-label-end">0</span>
              <span class="progress-label-target">Target: {{ TARGET_MIN }}-{{ TARGET_MAX }}</span>
              <span class="progress-label-start">{{ START_NUMBER }}</span>
            
          </div> -->
        </div>
      </div>

      <!-- Result Display -->
      <div class="result-display" v-if="isStopped">
        <div class="result-content">
          <div class="result-title-section">
            <div class="result-title-en" v-if="resultTitle === 'Enemy Steal the Lord'">
              <div class="title-line-1">Enemy Steal</div>
              <div class="title-line-2">The Lord</div>
            </div>
            <div class="result-title-en" v-else>
              <div class="title-line-1">{{ resultTitle }}</div>
            </div>
          </div>
          <div class="result-divider">
            <div class="result-divider-line"></div>
            <div class="result-divider-diamond"></div>
          </div>
          <div class="result-message-section">
            <div class="result-message-text">{{ resultMessage }}</div>
          </div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="game-controls">
        <button 
          v-if="!isActive && !isStopped" 
          @click="startGame" 
          class="btn-start"
        >
        စတင်မည်
        </button>
        
        <button 
          v-if="isActive" 
          @click="stopGame" 
          class="btn-stop"
          :class="{ 'btn-pulse': true }"
        >
          <img src="@/assets/image/retri_skill.png" alt="Stop Now" />
        </button>
        
        <button 
          v-if="isStopped" 
          @click="resetGame" 
          class="btn-reset"
        >
          PLAY AGAIN
        </button>
      </div>

      <!-- Stats -->
      <!-- <div class="game-stats" v-if="isStopped">
        <div class="stat-item">
          <span class="stat-label">Best Score:</span>
          <span class="stat-value">{{ bestScore || 'N/A' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Attempts:</span>
          <span class="stat-value">{{ attempts }}</span>
        </div>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const START_NUMBER = 400
const TARGET_MIN = 25
const TARGET_MAX = 55

// Speed control parameters
const MIN_SPEED = 0.31 // Minimum speed multiplier (slowest)
const MAX_SPEED = 2.18 // Maximum speed multiplier (fastest)
const SPEED_CURVE = 1.0 // Acceleration curve: 1.0 = linear, >1.0 = faster acceleration (more dramatic), <1.0 = slower acceleration (more gradual)
const MAX_SPEED_AT_PERCENT = 0.99 // Reach maximum speed at this percentage (0.3 = 30%)
const SPEED_DIVISOR = 10 // Divisor for speed calculation (lower = faster overall)

const currentNumber = ref(START_NUMBER) // Can be decimal for smooth countdown
const isActive = ref(false)
const isStopped = ref(false)
const stoppedAt = ref(null)
const attempts = ref(0)
const bestScore = ref(null)
let animationFrameId = null
let lastUpdateTime = null

const isInTargetZone = computed(() => {
  return isActive.value && currentNumber.value >= TARGET_MIN && currentNumber.value <= TARGET_MAX
})

const progressPercentage = computed(() => {
  // Calculate progress from 3000 to 0 (0% to 100%)
  return ((START_NUMBER - currentNumber.value) / START_NUMBER) * 100
})

const targetZoneStart = computed(() => {
  // Calculate where the target zone starts (95-100) on the progress bar
  return ((START_NUMBER - TARGET_MAX) / START_NUMBER) * 100
})

const targetZoneWidth = computed(() => {
  // Calculate the width of the target zone on the progress bar
  return ((TARGET_MAX - TARGET_MIN) / START_NUMBER) * 100
})

const getProgressBarClass = () => {
  if (!isActive.value && !isStopped.value) return ''
  
  if (currentNumber.value >= TARGET_MIN && currentNumber.value <= TARGET_MAX) {
    return 'progress-in-target'
  } else if (currentNumber.value < TARGET_MIN) {
    return 'progress-past-target'
  } else if (currentNumber.value <= 200) {
    return 'progress-fast'
  } else if (currentNumber.value <= 500) {
    return 'progress-medium'
  }
  return 'progress-slow'
}

const resultTitle = computed(() => {
  if (!stoppedAt.value) return 'Enemy Steal the Lord'
  
  if (stoppedAt.value >= TARGET_MIN && stoppedAt.value <= TARGET_MAX) {
    return 'You\'ve slained the Lord'
  } else if (stoppedAt.value < TARGET_MIN) {
    return 'Enemy Steal the Lord'
  } else {
    return 'Enemy Steal the Lord'
  }
})

const resultMessage = computed(() => {
  if (!stoppedAt.value) return ''
  
  if (stoppedAt.value >= TARGET_MIN && stoppedAt.value <= TARGET_MAX) {
    return 'Retri ပေါက်ရာတွင် ဆရာကျ၍ Lord ရသွားပါပြီ'
  } else if (stoppedAt.value < TARGET_MIN) {
    return `Retri နောက်ကျ၍ Enemy မှ Lord ရသွားပါပြီ`
  } else {
    return `Retri စောပြီးပေါက်မိ၍ Enemy မှ Lord ရသွားပါပြီ`
  }
})

const getCountdownClass = () => {
  if (!isActive.value && !isStopped.value) return ''
  
  if (currentNumber.value <= 100) return 'countdown-fast'
  if (currentNumber.value <= 200) return 'countdown-medium'
  return 'countdown-slow'
}

const getResultClass = () => {
  if (!stoppedAt.value) return ''
  
  if (stoppedAt.value >= TARGET_MIN && stoppedAt.value <= TARGET_MAX) {
    return 'result-success'
  }
  return 'result-fail'
}

const calculateSpeed = (number) => {
  // Calculate progress from 0 to 1 (0% to 100%)
  const progress = (START_NUMBER - number) / START_NUMBER
  
  let speed
  
  // If we've reached the max speed point, use MAX_SPEED
  if (progress >= MAX_SPEED_AT_PERCENT) {
    console.log('max speed')
    speed = MAX_SPEED
  } else {
    // Scale progress to 0-1 within the acceleration phase (0% to MAX_SPEED_AT_PERCENT%)
    const scaledProgress = progress / MAX_SPEED_AT_PERCENT
    
    // Apply exponential curve for more dramatic speed changes
    const curvedProgress = Math.pow(scaledProgress, SPEED_CURVE)
    
    // Calculate speed with curve (from MIN_SPEED to MAX_SPEED)
    speed = MIN_SPEED + (curvedProgress * (MAX_SPEED - MIN_SPEED))
  }
  //console.log('speed', speed)
  return speed
}

const startGame = () => {
  isActive.value = true
  isStopped.value = false
  currentNumber.value = START_NUMBER
  stoppedAt.value = null
  lastUpdateTime = performance.now()
  
  const tick = (currentTime) => {
    if (!isActive.value) return
    
    if (!lastUpdateTime) lastUpdateTime = currentTime
    const delta = currentTime - lastUpdateTime
    
    // Calculate current speed based on number position
    const speed = calculateSpeed(currentNumber.value)
    
    // Decrease number continuously based on elapsed time and speed
    currentNumber.value -= (delta * speed) / SPEED_DIVISOR
    
    if (currentNumber.value <= 0) {
      currentNumber.value = 0
      stopGame()
      return
    }
    
    lastUpdateTime = currentTime
    
    // Continue animation loop
    if (isActive.value) {
      animationFrameId = requestAnimationFrame(tick)
    }
  }
  
  animationFrameId = requestAnimationFrame(tick)
}

const stopGame = () => {
  if (!isActive.value) return
  
  isActive.value = false
  isStopped.value = true
  stoppedAt.value = currentNumber.value
  attempts.value++
  
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  lastUpdateTime = null
  
  // Update best score if in target zone
  if (stoppedAt.value >= TARGET_MIN && stoppedAt.value <= TARGET_MAX) {
    const score = stoppedAt.value
    if (!bestScore.value || score > bestScore.value) {
      bestScore.value = Math.round(score)
    }
  }
}

const resetGame = () => {
  isActive.value = false
  isStopped.value = false
  currentNumber.value = START_NUMBER
  stoppedAt.value = null
  
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  lastUpdateTime = null
}

// Fullscreen handler
const requestFullscreen = () => {
  const element = document.documentElement
  
  if (element.requestFullscreen) {
    element.requestFullscreen().catch(err => {
      console.log('Fullscreen request failed:', err)
    })
  } else if (element.webkitRequestFullscreen) { // Safari
    element.webkitRequestFullscreen()
  } else if (element.webkitRequestFullScreen) { // Older Safari
    element.webkitRequestFullScreen()
  } else if (element.mozRequestFullScreen) { // Firefox
    element.mozRequestFullScreen()
  } else if (element.msRequestFullscreen) { // IE/Edge
    element.msRequestFullscreen()
  }
}

const handleContainerClick = () => {
  // Check if already in fullscreen
  const isFullscreen = document.fullscreenElement || 
                       document.webkitFullscreenElement || 
                       document.mozFullScreenElement || 
                       document.msFullscreenElement
  
  if (!isFullscreen) {
    requestFullscreen()
  }
}

// Keyboard support
const handleKeyPress = (e) => {
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault()
    if (isActive.value) {
      stopGame()
    } else if (!isStopped.value) {
      startGame()
    } else {
      resetGame()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  
  // Request fullscreen on mount
  // Try immediately first, then fallback to delayed request
  // (some browsers require user interaction)
  try {
    requestFullscreen()
  } catch (err) {
    // If immediate request fails, try after delay
    setTimeout(() => {
      requestFullscreen()
    }, 500)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  
  // Exit fullscreen when component unmounts
  if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
})
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&family=Orbitron:wght@700;900&display=swap');

.reaction-test-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: url('@/assets/image/retri_background.png') no-repeat center center / cover;
  font-family: 'Montserrat', sans-serif;
  padding: 3px 18px 20px 18px;
  color: #fff;
  background-size: cover;
  background-position: top center;
}

.hero-logo {
  margin-bottom: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &.logo-active {
    margin-bottom: 20px;

    .msl-logo {
      width: min(180px, 40vw);
      margin-bottom: 0px;
    }
  }
}

.msl-logo {
  width: min(280px, 60vw);
  height: auto;
  filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.6));
  transition: width 0.3s ease;
}

.logo-text-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.league-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  line-height: 1.4;

  .season-text {
    color: #ff4c4c;
    font-weight: 700;
    margin-left: 8px;
  }
}

.challenge-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Montserrat', 'Arial Black', sans-serif;
  font-size: 1.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  line-height: 1.2;

  .title-white {
    color: #ffffff;
  }

  .title-red {
    color: #ff4c4c;
  }
}

.title-divider {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  margin-bottom: 10px;
}

.divider-line {
  width: 100%;
  max-width: 400px;
  height: 1px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  position: relative;
}

.divider-diamond {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #ffffff;
  transform: rotate(45deg);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  z-index: 2;
}

.game-wrapper {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 500px;
  width: 100%;
  padding: 45px 35px;
  background: rgba(8, 8, 8, 0.85);
  border-radius: 18px;
  border: 3px solid #e53935;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.8);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.015),
      rgba(255, 255, 255, 0.015) 2px,
      transparent 2px,
      transparent 12px
    );
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  &.game-stopped {
    animation: result-appear 0.5s ease-out;
  }
}
.game-active, .game-stopped {
  background: none;
  border: none;
  box-shadow: none;
  overflow: hidden;
  &::before {
    display: none;
  }
}
@keyframes result-appear {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.game-header {
  margin-bottom: 40px;
}

.header-logos {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.logo-text {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  color: #d0d0d0;
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.header-supertitle {
  display: block;
  font-size: 1rem;
  color: #ff4c4c;
  letter-spacing: 4px;
  margin-bottom: 25px;
  font-weight: 600;
  text-transform: uppercase;
}

.game-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0;
  letter-spacing: 3px;
  text-transform: uppercase;
  line-height: 1.75;
}

.game-subtitle {
  font-size: 1rem;
  color: #ccc;
  margin-top: 10px;
  margin-bottom: 5px;
  font-weight: 500;
}

.game-instruction {
  font-size: 0.98rem;
  color: #ccc;
  margin-bottom: 20px;
}

.lord-video-container {
  width: 100%;
  max-width: 500px;
  margin: 25px auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lord-video-frame {
  width: 100%;
  max-width: 450px;
  border: 2px solid #ffffff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  background: #000;
}

.lord-video {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.countdown-display-wrapper {
  margin: 40px 0;
  display: flex;
  justify-content: center;
}

.countdown-display {
  border: 2px solid #555;
  border-radius: 8px;
  padding: 30px 40px;
  background: rgba(0,0,0,0.3);
  position: relative;
  min-width: 350px;

  &::before, &::after {
    content: '';
    position: absolute;
    width: 25px;
    height: 25px;
    border-color: #ff4141;
    border-style: solid;
  }
  &::before { top: -2px; left: -2px; border-width: 4px 0 0 4px; }
  &::after { bottom: -2px; right: -2px; border-width: 0 4px 4px 0; }
}


.countdown-number {
  font-size: 7rem;
  font-weight: 900;
  color: #fff;
  line-height: 1;
  transition: all 0.1s ease-out;
  font-family: 'Orbitron', 'Arial Black', sans-serif;
  letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(255, 65, 65, 0.5);

  &.countdown-slow { color: #ff4141; }
  &.countdown-medium { color: #ff6363; }
  &.countdown-fast { color: #ff8181; }
}

.progress-bar-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto 40px;
}

.progress-bar-bg {
  position: relative;
  width: 100%;
  height: 40px;
  background: green;
  border-radius: 0px;
  overflow: hidden;
}

.target-zone-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  background: #ffdcdc;
  pointer-events: none;
  z-index: 1;
}

.progress-bar-fill {
  position: absolute;
  right: 0; top: 0;
  height: 100%;
  border-radius: 0px;
  transition: width 0.1s linear, background 0.3s ease;
  z-index: 2;

  &.progress-slow { background: #808080; }
  &.progress-medium { background: #808080; }
  &.progress-fast { background: #808080; }
  &.progress-in-target { background: #fff; box-shadow: 0 0 10px #fff; }
  &.progress-past-target { background: #808080; }
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.85rem;
  color: #aaa;
  font-weight: 600;
}

.progress-label-target {
  color: #ff4141;
  font-weight: bold;
}

.result-display {
  margin: 40px 0;
  animation: result-appear 0.5s ease-out;
  width: 100%;
  display: flex;
  justify-content: center;
}

.result-content {
  padding: 0;
  background: transparent;
  border: none;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.result-title-section {
  width: 100%;
  text-align: center;
}

.result-title-en {
  font-family: 'Montserrat', 'Arial Black', sans-serif;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 3px;
  line-height: 1.2;
  color: #ff4c4c;
  text-shadow: 
    2px 2px 0px rgba(0, 0, 0, 0.8),
    0px 0px 20px rgba(255, 76, 76, 0.6),
    0px 0px 40px rgba(255, 76, 76, 0.4);
  font-size: 2.5rem;
}

.title-line-1 {
  margin-bottom: 5px;
}

.title-line-2 {
  font-size: 2.5rem;
}

.result-divider {
  position: relative;
  width: 100%;
  max-width: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
}

.result-divider-line {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  position: relative;
}

.result-divider-diamond {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #ffffff;
  transform: rotate(45deg);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  z-index: 2;
}

.result-message-section {
  width: 100%;
  text-align: center;
}

.result-message-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.6;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
}

.game-controls {
  margin: 40px 0 0;
}

.btn-start,
.btn-reset {
  padding: 18px 40px;
  font-size: 1.3rem;
  font-weight: 800;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #fff;
  background: transparent;
  min-width: 220px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  }
  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.btn-start {
  background: linear-gradient(180deg, #ff6b5f 0%, #e53935 100%);
  box-shadow: 0 12px 25px rgba(229, 57, 53, 0.4);
  font-size: 1.6rem;

  &:hover {
    background: linear-gradient(180deg, #ff7c70 0%, #f04844 100%);
  }
}

.btn-stop {
  width: auto;
  height: auto;
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 0;
  display: inline-block;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: none;
  cursor: pointer;

  img {
    width: auto;
    height: auto;
    max-width: 140px;
    max-height: 140px;
    display: block;
    object-fit: contain;
    border-radius: 0;
    box-shadow: none;
  }

  &:hover {
    transform: translateY(-6px) scale(1.05);
    box-shadow: 0 20px 35px rgba(0, 0, 0, 0.55);
  }

  &:active {
    transform: translateY(-2px) scale(0.98);
  }

  &.btn-pulse {
    animation: pulse 1.2s infinite;
  }
}

.btn-reset {
  border: 2px solid #555;
  background: transparent;
  margin-top: 40px;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #777;
    box-shadow: 0 5px 15px rgba(100, 100, 100, 0.3);
  }
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 65, 65, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 10px 20px rgba(255, 65, 65, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 65, 65, 0); }
}

.game-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 40px;
  padding: 20px;
  background: transparent;
  border-radius: 8px;
  border: 1px solid #444;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
}

// Mobile responsiveness
@media (max-width: 768px) {
  .game-wrapper {
    padding: 20px;
    border-radius: 10px;
  }
  .reaction-test-container {
    background-size: 100% 90%;
    background-position: top center;
  }
  .game-title {
    font-size: 1.45rem;
  }
  .countdown-number {
    font-size: 5rem;
  }
  .countdown-display {
    min-width: auto;
    padding: 20px;
  }
  .result-title-en {
    font-size: 1.8rem;
  }
  .title-line-2 {
    font-size: 1.8rem;
  }
  .result-message-text {
    font-size: 1.1rem;
  }
  .result-divider {
    max-width: 300px;
  }
  .result-divider-diamond {
    width: 8px;
    height: 8px;
  }
  .league-name {
    font-size: 0.75rem;
  }
  .challenge-title {
    font-size: 1.4rem;
  }
  .hero-logo.logo-active .msl-logo {
    width: min(140px, 35vw);
  }
  .divider-line {
    max-width: 300px;
  }
  .divider-diamond {
    width: 8px;
    height: 8px;
  }
  .lord-video-container {
    margin: 20px auto;
  }
  .lord-video-frame {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .game-wrapper {
    padding: 15px;
  }
  .reaction-test-container {
    background-size: 100% 100%;
    background-position: center center;
  }
  .game-title {
    font-size: 1.45rem;
  }
  .game-subtitle {
    font-size: 0.98rem;
  }
  .countdown-number {
    font-size: 4rem;
  }
  .btn-start, .btn-stop, .btn-reset {
    padding: 15px 20px;
    font-size: 1rem;
    min-width: 180px;
  }
  .btn-stop {
    font-size: 1.2rem;
    padding: 18px 30px;
  }
  .league-name {
    font-size: 0.65rem;
    letter-spacing: 1px;
  }
  .challenge-title {
    font-size: 1.2rem;
    letter-spacing: 1.5px;
  }
  .hero-logo.logo-active .msl-logo {
    width: min(140px, 35vw);
  }
  .divider-line {
    max-width: 250px;
  }
  .divider-diamond {
    width: 7px;
    height: 7px;
  }
  .lord-video-container {
    margin: 15px auto;
  }
  .lord-video-frame {
    max-width: 100%;
    border-width: 1.5px;
  }
  .result-title-en {
    font-size: 1.5rem;
    letter-spacing: 2px;
  }
  .title-line-2 {
    font-size: 1.5rem;
  }
  .result-message-text {
    font-size: 1rem;
    letter-spacing: 0.5px;
  }
  .result-divider {
    max-width: 250px;
  }
  .result-divider-diamond {
    width: 7px;
    height: 7px;
  }
}
</style>

