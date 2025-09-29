import { ref, onMounted, onUnmounted } from 'vue'

const useIntersectionObserver = (elementRef, options = {}) => {
    const isInView = ref(false)

        const observer = new IntersectionObserver(([entry]) => {
        isInView.value = entry.isIntersecting
        }, options)
    
        onMounted(() => {
        if (elementRef.value) {
            observer.observe(elementRef.value)
        }
        })
    
        onUnmounted(() => {
        observer.disconnect()
        })

  
    return isInView
  }

export default useIntersectionObserver