<template>
  <div class="reaction-test-container">
    <div class="game-wrapper" :class="{ 'game-active': isActive, 'game-stopped': isStopped }">
      <!-- Game Title -->
      <div class="game-header" v-if="!isActive && !isStopped">
        <h1 class="game-title">⚔️ Reaction Test ⚔️</h1>
        <p class="game-subtitle">Stop the countdown between 95-100!</p>
        <p class="game-instruction">The lower the number, the faster it goes!</p>
      </div>

      <!-- Countdown Display -->
      <div class="countdown-display" v-if="isActive || isStopped">
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
                <div class="progress-bar-glow"></div>
              </div>
              <!-- Current Position Marker -->
              <div 
                class="progress-marker" 
                v-if="isActive"
                :style="{ right: progressPercentage + '%' }"
              ></div>
            </div>
            <!-- Progress Labels -->
            <div class="progress-labels">
                <span class="progress-label-end">0</span>
                <span class="progress-label-target">Target: {{ TARGET_MIN }}-{{ TARGET_MAX }}</span>
                <span class="progress-label-start">{{ START_NUMBER }}</span>
              
            </div>
          </div>
        </div>
        
        <div class="countdown-number" :class="getCountdownClass()">
          {{ currentNumber }}
        </div>
        <div class="target-zone" v-if="isActive">
          <!-- <span class="target-label">Target: 95-100</span> -->
        </div>
      </div>

      <!-- Result Display -->
      <div class="result-display" v-if="isStopped">
        <div class="result-content" :class="getResultClass()">
          <h2 class="result-title">{{ resultTitle }}</h2>
          <p class="result-message">{{ resultMessage }}</p>
          <div class="final-number">{{ stoppedAt }}</div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="game-controls">
        <button 
          v-if="!isActive && !isStopped" 
          @click="startGame" 
          class="btn-start"
        >
          🎮 START GAME
        </button>
        
        <button 
          v-if="isActive" 
          @click="stopGame" 
          class="btn-stop"
          :class="{ 'btn-pulse': isInTargetZone }"
        >
          ⚡ STOP NOW! ⚡
        </button>
        
        <button 
          v-if="isStopped" 
          @click="resetGame" 
          style="margin-top: 60px;"
          class="btn-reset"
        >
          🔄 PLAY AGAIN
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
const MIN_INTERVAL = 2// Fastest interval in ms
const MAX_INTERVAL = 20 // Slowest interval in ms

// Speed control parameters
const SPEED_MULTIPLIER = 1.0 // Overall speed: >1.0 = faster (e.g., 2.0 = 2x faster), <1.0 = slower (e.g., 0.5 = 2x slower)
const SPEED_CURVE = 3.0 // Acceleration curve: 1.0 = linear, >1.0 = faster acceleration (more dramatic), <1.0 = slower acceleration (more gradual)
const MAX_SPEED_AT_PERCENT = 0.3 // Reach maximum speed at this percentage (0.45 = 45%)

const currentNumber = ref(START_NUMBER)
const isActive = ref(false)
const isStopped = ref(false)
const stoppedAt = ref(null)
const attempts = ref(0)
const bestScore = ref(null)
let countdownInterval = null

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
  if (!stoppedAt.value) return 'You Did Not Click!'
  
  if (stoppedAt.value >= TARGET_MIN && stoppedAt.value <= TARGET_MAX) {
    return '🎉 Perfect! 🎉'
  } else if (stoppedAt.value < TARGET_MIN) {
    return '❌ TOO Late!'
  } else {
    return '❌ TOO Early!'
  }
})

const resultMessage = computed(() => {
  if (!stoppedAt.value) return ''
  
  if (stoppedAt.value >= TARGET_MIN && stoppedAt.value <= TARGET_MAX) {
    return 'You got it! Lord Slain with Retribution!'
  } else if (stoppedAt.value < TARGET_MIN) {
    return `You stopped at ${stoppedAt.value}. Need to wait until 95!`
  } else {
    return `You stopped at ${stoppedAt.value}. You missed the window!`
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

const calculateInterval = (number) => {
  // Calculate progress from 0 to 1 (0% to 100%)
  const progress = (START_NUMBER - number) / START_NUMBER
  
  let interval
  
  // If we've reached the max speed point, use MIN_INTERVAL
  if (progress >= MAX_SPEED_AT_PERCENT) {
    console.log('max speed')
    interval = MIN_INTERVAL
  } else {
    // Scale progress to 0-1 within the acceleration phase (0% to MAX_SPEED_AT_PERCENT%)
    const scaledProgress = progress / MAX_SPEED_AT_PERCENT
    
    // Apply exponential curve for more dramatic speed changes
    const curvedProgress = Math.pow(scaledProgress, SPEED_CURVE)
    
    // Calculate interval with curve (from MAX_INTERVAL to MIN_INTERVAL)
    interval = MAX_INTERVAL - (curvedProgress * (MAX_INTERVAL - MIN_INTERVAL))
  }
  
  // Apply speed multiplier: divide interval to make it faster (smaller interval = faster countdown)
  // Math.max ensures minimum of 1ms (browsers clamp setTimeout to ~4ms anyway)
  console.log(Math.max(1, interval / SPEED_MULTIPLIER))
  return Math.max(1, interval / SPEED_MULTIPLIER)
}

const startGame = () => {
  isActive.value = true
  isStopped.value = false
  currentNumber.value = START_NUMBER
  stoppedAt.value = null
  
  const tick = () => {
    if (!isActive.value) return
    
    currentNumber.value--
    
    if (currentNumber.value <= 0) {
      stopGame()
      return
    }
    
    const interval = calculateInterval(currentNumber.value)
    countdownInterval = setTimeout(tick, interval)
  }
  
  tick()
}

const stopGame = () => {
  if (!isActive.value) return
  
  isActive.value = false
  isStopped.value = true
  stoppedAt.value = currentNumber.value
  attempts.value++
  
  if (countdownInterval) {
    clearTimeout(countdownInterval)
    countdownInterval = null
  }
  
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
  
  if (countdownInterval) {
    clearTimeout(countdownInterval)
    countdownInterval = null
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
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  if (countdownInterval) {
    clearTimeout(countdownInterval)
  }
})
</script>

<style lang="scss" scoped>
.reaction-test-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(255, 69, 0, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
}

.game-wrapper {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 600px;
  width: 100%;
  padding: 40px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 30px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 0 60px rgba(255, 215, 0, 0.1);

  &.game-active {
    border-color: rgba(255, 69, 0, 0.6);
    box-shadow: 
      0 20px 60px rgba(255, 69, 0, 0.3),
      inset 0 0 60px rgba(255, 69, 0, 0.2);
    animation: pulse-border 1s ease-in-out infinite;
  }

  &.game-stopped {
    animation: result-appear 0.5s ease-out;
  }
}

@keyframes pulse-border {
  0%, 100% {
    border-color: rgba(255, 69, 0, 0.6);
    box-shadow: 
      0 20px 60px rgba(255, 69, 0, 0.3),
      inset 0 0 60px rgba(255, 69, 0, 0.2);
  }
  50% {
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: 
      0 20px 60px rgba(255, 215, 0, 0.4),
      inset 0 0 60px rgba(255, 215, 0, 0.3);
  }
}

@keyframes result-appear {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.game-header {
  margin-bottom: 40px;
}

.game-title {
  font-size: 3rem;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 
    0 0 20px rgba(255, 215, 0, 0.8),
    0 0 40px rgba(255, 215, 0, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.5);
  margin-bottom: 10px;
  letter-spacing: 2px;
  animation: title-glow 2s ease-in-out infinite;
}

@keyframes title-glow {
  0%, 100% {
    text-shadow: 
      0 0 20px rgba(255, 215, 0, 0.8),
      0 0 40px rgba(255, 215, 0, 0.4),
      0 4px 8px rgba(0, 0, 0, 0.5);
  }
  50% {
    text-shadow: 
      0 0 30px rgba(255, 215, 0, 1),
      0 0 60px rgba(255, 215, 0, 0.6),
      0 4px 8px rgba(0, 0, 0, 0.5);
  }
}

.game-subtitle {
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.game-instruction {
  font-size: 1rem;
  color: #ccc;
  margin-bottom: 20px;
}

.countdown-display {
  margin: 40px 0;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.progress-bar-container {
  width: 100%;
  max-width: 500px;
  margin-bottom: 20px;
}

.progress-bar-wrapper {
  position: relative;
}

.progress-bar-bg {
  position: relative;
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.6);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    0 0 10px rgba(0, 0, 0, 0.3);
}

.target-zone-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(255, 215, 0, 0.2);
  border-left: 2px solid rgba(255, 215, 0, 0.6);
  border-right: 2px solid rgba(255, 215, 0, 0.6);
  pointer-events: none;
  z-index: 1;
  animation: target-zone-pulse 1.5s ease-in-out infinite;
}

@keyframes target-zone-pulse {
  0%, 100% {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.6);
  }
  50% {
    background: rgba(255, 215, 0, 0.4);
    border-color: rgba(255, 215, 0, 0.9);
  }
}

.progress-bar-fill {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(270deg, #4a9eff 0%, #5cb3ff 50%, #6dc5ff 100%);
  border-radius: 12px;
  transition: width 0.1s linear, background 0.3s ease;
  box-shadow: 
    inset 0 -2px 4px rgba(255, 255, 255, 0.3),
    0 0 10px rgba(74, 158, 255, 0.5);
  z-index: 2;
  overflow: hidden;

  &.progress-slow {
    background: linear-gradient(270deg, #4a9eff 0%, #5cb3ff 50%, #6dc5ff 100%);
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.3),
      0 0 10px rgba(74, 158, 255, 0.5);
  }

  &.progress-medium {
    background: linear-gradient(270deg, #ffa500 0%, #ffb733 50%, #ffc966 100%);
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.3),
      0 0 15px rgba(255, 165, 0, 0.6);
  }

  &.progress-fast {
    background: linear-gradient(270deg, #ff4500 0%, #ff6347 50%, #ff7f6e 100%);
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.3),
      0 0 20px rgba(255, 69, 0, 0.7);
    animation: progress-fast-pulse 0.3s ease-in-out infinite;
  }

  &.progress-in-target {
    background: linear-gradient(270deg, #00ff00 0%, #32ff32 50%, #66ff66 100%);
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.4),
      0 0 25px rgba(0, 255, 0, 0.8);
    animation: progress-target-glow 0.5s ease-in-out infinite;
  }

  &.progress-past-target {
    background: linear-gradient(270deg, #ff0000 0%, #ff3333 50%, #ff6666 100%);
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.3),
      0 0 20px rgba(255, 0, 0, 0.7);
  }
}

@keyframes progress-fast-pulse {
  0%, 100% {
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.3),
      0 0 20px rgba(255, 69, 0, 0.7);
  }
  50% {
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.4),
      0 0 30px rgba(255, 69, 0, 0.9);
  }
}

@keyframes progress-target-glow {
  0%, 100% {
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.4),
      0 0 25px rgba(0, 255, 0, 0.8);
  }
  50% {
    box-shadow: 
      inset 0 -2px 4px rgba(255, 255, 255, 0.5),
      0 0 35px rgba(0, 255, 0, 1);
  }
}

.progress-bar-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
  pointer-events: none;
}

.progress-marker {
  position: absolute;
  top: -5px;
  width: 4px;
  height: 40px;
  background: #fff;
  border-radius: 2px;
  box-shadow: 
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(255, 255, 255, 0.5);
  transform: translateX(50%);
  z-index: 3;
  animation: marker-pulse 0.5s ease-in-out infinite;
}

@keyframes marker-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.8),
      0 0 20px rgba(255, 255, 255, 0.5);
  }
  50% {
    opacity: 0.7;
    box-shadow: 
      0 0 15px rgba(255, 255, 255, 1),
      0 0 30px rgba(255, 255, 255, 0.7);
  }
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.progress-label-start,
.progress-label-end {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.progress-label-target {
  color: #ffd700;
  font-weight: bold;
  text-shadow: 
    0 0 10px rgba(255, 215, 0, 0.8),
    0 1px 2px rgba(0, 0, 0, 0.5);
  animation: target-label-glow 2s ease-in-out infinite;
}

@keyframes target-label-glow {
  0%, 100% {
    text-shadow: 
      0 0 10px rgba(255, 215, 0, 0.8),
      0 1px 2px rgba(0, 0, 0, 0.5);
  }
  50% {
    text-shadow: 
      0 0 15px rgba(255, 215, 0, 1),
      0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

.countdown-number {
  font-size: 8rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 
    0 0 30px rgba(255, 255, 255, 0.8),
    0 0 60px rgba(255, 255, 255, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.5);
  line-height: 1;
  margin-bottom: 20px;
  transition: all 0.1s ease-out;
  font-family: 'Arial Black', sans-serif;
  letter-spacing: 4px;

  &.countdown-slow {
    color: #4a9eff;
    text-shadow: 
      0 0 30px rgba(74, 158, 255, 0.8),
      0 0 60px rgba(74, 158, 255, 0.4);
  }

  &.countdown-medium {
    color: #ffa500;
    text-shadow: 
      0 0 30px rgba(255, 165, 0, 0.8),
      0 0 60px rgba(255, 165, 0, 0.4);
    animation: shake-medium 0.3s ease-in-out infinite;
  }

  &.countdown-fast {
    color: #ff4500;
    text-shadow: 
      0 0 30px rgba(255, 69, 0, 0.8),
      0 0 60px rgba(255, 69, 0, 0.4);
    animation: shake-fast 0.15s ease-in-out infinite;
  }
}

@keyframes shake-medium {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes shake-fast {
  0%, 100% { transform: translateX(0) scale(1); }
  25% { transform: translateX(-3px) scale(1.02); }
  75% { transform: translateX(3px) scale(1.02); }
}

.target-zone {
  margin-top: 20px;
}

.target-label {
  display: inline-block;
  padding: 10px 20px;
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.5);
  border-radius: 20px;
  color: #ffd700;
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.result-display {
  margin: 40px 0;
  animation: result-appear 0.5s ease-out;
}

.result-content {
  padding: 30px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid;

  &.result-success {
    border-color: #00ff00;
    background: rgba(0, 255, 0, 0.1);
    box-shadow: 
      0 0 30px rgba(0, 255, 0, 0.5),
      inset 0 0 30px rgba(0, 255, 0, 0.1);
  }

  &.result-fail {
    border-color: #ff4500;
    background: rgba(255, 69, 0, 0.1);
    box-shadow: 
      0 0 30px rgba(255, 69, 0, 0.5),
      inset 0 0 30px rgba(255, 69, 0, 0.1);
  }
}

.result-title {
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 15px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.result-content.result-success .result-title {
  color: #00ff00;
  animation: success-pulse 1s ease-in-out infinite;
}

.result-content.result-fail .result-title {
  color: #ff4500;
}

@keyframes success-pulse {
  0%, 100% {
    transform: scale(1);
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  }
  50% {
    transform: scale(1.05);
    text-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.5),
      0 0 20px rgba(0, 255, 0, 0.8);
  }
}

.result-message {
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.final-number {
  font-size: 5rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 
    0 0 30px rgba(255, 255, 255, 0.8),
    0 4px 8px rgba(0, 0, 0, 0.5);
  font-family: 'Arial Black', sans-serif;
}

.game-controls {
  margin: 40px 0;
}

.btn-start,
.btn-stop,
.btn-reset {
  padding: 20px 50px;
  font-size: 1.5rem;
  font-weight: 900;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &:active {
    transform: scale(0.95);
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:active::before {
    width: 300px;
    height: 300px;
  }
}

.btn-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 15px 40px rgba(102, 126, 234, 0.4),
      inset 0 0 20px rgba(255, 255, 255, 0.2);
  }
}

.btn-stop {
  background: linear-gradient(135deg, #ff4500 0%, #ff6347 100%);
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-size: 2rem;
  padding: 25px 60px;
  animation: stop-button-pulse 1s ease-in-out infinite;

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 
      0 20px 50px rgba(255, 69, 0, 0.6),
      inset 0 0 30px rgba(255, 255, 255, 0.3);
  }

  &.btn-pulse {
    animation: stop-button-pulse-fast 0.5s ease-in-out infinite;
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    box-shadow: 
      0 20px 50px rgba(255, 215, 0, 0.6),
      inset 0 0 30px rgba(255, 255, 255, 0.3);
  }
}

@keyframes stop-button-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes stop-button-pulse-fast {
  0%, 100% {
    transform: scale(1);
    box-shadow: 
      0 20px 50px rgba(255, 215, 0, 0.6),
      inset 0 0 30px rgba(255, 255, 255, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 
      0 25px 60px rgba(255, 215, 0, 0.8),
      inset 0 0 40px rgba(255, 255, 255, 0.4);
  }
}

.btn-reset {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 15px 40px rgba(17, 153, 142, 0.4),
      inset 0 0 20px rgba(255, 255, 255, 0.2);
  }
}

.game-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

// Mobile responsiveness
@media (max-width: 768px) {
  .game-wrapper {
    padding: 20px;
    border-radius: 20px;
  }

  .game-title {
    font-size: 2rem;
  }

  .countdown-number {
    font-size: 5rem;
    letter-spacing: 2px;
  }

  .progress-bar-container {
    max-width: 100%;
  }

  .progress-bar-bg {
    height: 25px;
  }

  .progress-marker {
    height: 35px;
  }

  .progress-labels {
    font-size: 0.75rem;
  }

  .btn-start,
  .btn-stop,
  .btn-reset {
    padding: 15px 30px;
    font-size: 1.2rem;
  }

  .btn-stop {
    font-size: 1.5rem;
    padding: 20px 40px;
  }

  .result-title {
    font-size: 2rem;
  }

  .final-number {
    font-size: 3.5rem;
  }
}

@media (max-width: 480px) {
  .countdown-number {
    font-size: 4rem;
  }

  .progress-bar-bg {
    height: 20px;
  }

  .progress-marker {
    height: 30px;
  }

  .progress-labels {
    font-size: 0.7rem;
  }

  .game-title {
    font-size: 1.5rem;
  }

  .game-subtitle {
    font-size: 1.2rem;
  }
}
</style>

