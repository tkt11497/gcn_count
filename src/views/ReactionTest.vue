<template>
  <div class="reaction-test-container">
    <div class="game-wrapper" :class="{ 'game-active': isActive, 'game-stopped': isStopped }">
      <!-- Game Title -->
      <div class="game-header" v-if="!isActive && !isStopped">
        <div class="header-logos">
          <div class="logo-text">MOBILE LEGENDS</div>
          <div class="logo-text">MSL-MM SEASON 2</div>
        </div>
        <div class="header-supertitle">❖ ❖ OFFICIAL ❖ ❖</div>
        <h1 class="game-title">Reaction Partner</h1>
        <p class="game-subtitle">Stop the countdown between {{ TARGET_MIN }}-{{ TARGET_MAX }}!</p>
        <p class="game-instruction">The lower the number, the faster it goes!</p>
      </div>

      <!-- Countdown Display -->
      <div class="countdown-display-wrapper" v-if="isActive || isStopped">
        <div class="countdown-display">
          <div class="countdown-number" :class="getCountdownClass()">
            {{ Math.max(0, currentNumber).toFixed(1) }}
          </div>
        </div>
      </div>


      <!-- Progress Bar -->
      <div class="progress-bar-container" v-if="isActive || isStopped">
        <div class="progress-bar-wrapper">
          <div class="progress-bar-bg">
            <!-- Target Zone Indicator -->
            <div 
              class="target-zone-indicator" 
              :style="{ right: targetZoneStart + '%', width: targetZoneWidth + '%' }"
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
          <div class="progress-labels">
              <span class="progress-label-end">0</span>
              <span class="progress-label-target">Target: {{ TARGET_MIN }}-{{ TARGET_MAX }}</span>
              <span class="progress-label-start">{{ START_NUMBER }}</span>
            
          </div>
        </div>
      </div>

      <!-- Result Display -->
      <div class="result-display" v-if="isStopped">
        <div class="result-content" :class="getResultClass()">
          <h2 class="result-title">{{ resultTitle }}</h2>
          <p class="result-message">{{ resultMessage }}</p>
          <div class="final-number">{{ stoppedAt !== null ? stoppedAt.toFixed(1) : '0.0' }}</div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="game-controls">
        <button 
          v-if="!isActive && !isStopped" 
          @click="startGame" 
          class="btn-start"
        >
          START GAME
        </button>
        
        <button 
          v-if="isActive" 
          @click="stopGame" 
          class="btn-stop"
          :class="{ 'btn-pulse': isInTargetZone }"
        >
          STOP NOW!
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
      <div class="game-stats" v-if="isStopped">
        <div class="stat-item">
          <span class="stat-label">Best Score:</span>
          <span class="stat-value">{{ bestScore || 'N/A' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Attempts:</span>
          <span class="stat-value">{{ attempts }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const START_NUMBER = 300
const TARGET_MIN = 19
const TARGET_MAX = 29

// Speed control parameters
const MIN_SPEED = 0.1 // Minimum speed multiplier (slowest)
const MAX_SPEED = 3.0 // Maximum speed multiplier (fastest)
const SPEED_CURVE = 2.0 // Acceleration curve: 1.0 = linear, >1.0 = faster acceleration (more dramatic), <1.0 = slower acceleration (more gradual)
const MAX_SPEED_AT_PERCENT = 0.95 // Reach maximum speed at this percentage (0.3 = 30%)
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
  if (!stoppedAt.value) return 'MISSION FAILED'
  
  if (stoppedAt.value >= TARGET_MIN && stoppedAt.value <= TARGET_MAX) {
    return 'TARGET NEUTRALIZED'
  } else if (stoppedAt.value < TARGET_MIN) {
    return 'TOO LATE'
  } else {
    return 'TOO EARLY'
  }
})

const resultMessage = computed(() => {
  if (!stoppedAt.value) return ''
  
  if (stoppedAt.value >= TARGET_MIN && stoppedAt.value <= TARGET_MAX) {
    return 'Mission accomplished. Perfect timing!'
  } else if (stoppedAt.value < TARGET_MIN) {
    return `Target escaped. The window was ${TARGET_MIN}-${TARGET_MAX}.`
  } else {
    return `Trigger pulled too soon. The window was ${TARGET_MIN}-${TARGET_MAX}.`
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
      bestScore.value = score
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
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&family=Orbitron:wght@700;900&display=swap');

.reaction-test-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: 
    linear-gradient(to bottom, rgba(0,0,0,0.7), #0a0a0a),
    url('https://www.transparenttextures.com/patterns/clean-textile.png'),
    #d12229;
  font-family: 'Montserrat', sans-serif;
  padding: 20px;
  color: #fff;
}

.game-wrapper {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 600px;
  width: 100%;
  padding: 40px;
  background: #111;
  border-radius: 10px;
  box-shadow: 0 0 40px rgba(0,0,0,0.9);
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
  margin-bottom: 30px;
}

.logo-text {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: #999;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.header-supertitle {
  display: block;
  font-size: 1rem;
  color: #ff4141;
  letter-spacing: 3px;
  margin-bottom: 15px;
  font-weight: 600;
  text-transform: uppercase;
}

.game-title {
  font-family: 'Arial Black', 'Impact', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0;
  letter-spacing: 4px;
  text-transform: uppercase;
  transform: scaleY(0.9);
}

.game-subtitle {
  font-size: 1.2rem;
  color: #ccc;
  margin-top: 10px;
  margin-bottom: 5px;
  font-weight: 500;
}

.game-instruction {
  font-size: 1rem;
  color: #888;
  margin-bottom: 20px;
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
  height: 10px;
  background: #222;
  border-radius: 5px;
  overflow: hidden;
}

.target-zone-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(255, 65, 65, 0.4);
  pointer-events: none;
  z-index: 1;
}

.progress-bar-fill {
  position: absolute;
  right: 0; top: 0;
  height: 100%;
  border-radius: 5px;
  transition: width 0.1s linear, background 0.3s ease;
  z-index: 2;

  &.progress-slow { background: #d12229; }
  &.progress-medium { background: #e63946; }
  &.progress-fast { background: #f75c5c; }
  &.progress-in-target { background: #fff; box-shadow: 0 0 10px #fff; }
  &.progress-past-target { background: #8d0801; }
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
}

.result-content {
  padding: 30px;
  border-radius: 8px;
  background: rgba(0,0,0,0.3);
  border: 2px solid;

  &.result-success {
    border-color: #ff4141;
    background: rgba(209, 34, 41, 0.1);
  }
  &.result-fail {
    border-color: #888;
    background: rgba(136, 136, 136, 0.1);
  }
}

.result-title {
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.result-content.result-success .result-title {
  color: #ff4141;
  text-shadow: 0 0 10px rgba(255, 65, 65, 0.5);
}

.result-content.result-fail .result-title {
  color: #aaa;
}

.result-message {
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 20px;
}

.final-number {
  font-size: 5rem;
  font-weight: 900;
  color: #fff;
  font-family: 'Orbitron', 'Arial Black', sans-serif;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.game-controls {
  margin: 40px 0 0;
}

.btn-start,
.btn-stop,
.btn-reset {
  padding: 18px 40px;
  font-size: 1.3rem;
  font-weight: 700;
  border-width: 2px;
  border-style: solid;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #fff;
  background: transparent;
  min-width: 220px;

  &:hover {
    background: #d12229;
    border-color: #d12229;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(209, 34, 41, 0.3);
  }
  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.btn-start {
  border-color: #d12229;
}

.btn-stop {
  border-color: #ff4141;
  background: #d12229;
  font-size: 1.6rem;
  padding: 22px 50px;

  &.btn-pulse {
    animation: pulse 1s infinite;
  }
}

.btn-reset {
  border-color: #555;
  margin-top: 40px;
  &:hover {
    background: #555;
    border-color: #555;
    box-shadow: 0 5px 15px rgba(100, 100, 100, 0.2);
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
  .game-title {
    font-size: 2rem;
  }
  .countdown-number {
    font-size: 5rem;
  }
  .countdown-display {
    min-width: auto;
    padding: 20px;
  }
  .result-title {
    font-size: 2rem;
  }
  .final-number {
    font-size: 3.5rem;
  }
}

@media (max-width: 480px) {
  .game-wrapper {
    padding: 15px;
  }
  .game-title {
    font-size: 1.5rem;
  }
  .game-subtitle {
    font-size: 1rem;
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
}
</style>

