<template>
  <NavBar />

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
import { onMounted } from 'vue'
const storeAuth = useStoreAuth()
onMounted(() => {
  storeAuth.init()
})
</script>

<style>
@import 'bulma/css/bulma.min.css';
</style>