<template>
  <NavBar v-if="showNavBar" />

  <div class="">
    <RouterView />
  </div>
</template>

<script setup>
/*
  imports
*/
// import { useStoreNotes } from '@/stores/storeNotes'
import { useStoreAuth } from '@/stores/storeAuth'
import NavBar from '@/components/Layout/NavBar.vue'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const storeAuth = useStoreAuth()
const route = useRoute()

const showNavBar = computed(() => {
  return route.name !== 'reaction-test'
})

onMounted(() => {
  storeAuth.init()
})
</script>

<style>
@import 'bulma/css/bulma.min.css';
</style>