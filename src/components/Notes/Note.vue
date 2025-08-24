<template>
  <div
    class="card mb-4"
  >
    <div class="card-content">
      <p v-if="isCurrent==0" class="title">Current Download Links</p>
      <p v-else class="title">Record of Download Links</p>
      <div class="content">
       <p>IOS Link: {{ note.iosLink }}</p>
       <p>Android Link: {{ note.androidLink }}</p>
       <p>IOS Link2: {{ note.iosLink2 }}</p>
       <p>Android Link2: {{ note.androidLink2 }}</p>
       <p>customer service: {{ note.cs_link }}</p>
        <div class="columns is-mobile has-text-grey-light mt-2">
          <small class="column">{{ formattedDate }}</small>
          <small class="column has-text-right">{{ characterLength }}</small>
        </div>
      </div>
    </div>
    <footer class="card-footer">
      <RouterLink
        :to="`/editNote/${ note.id }`"
        class="card-footer-item"
        href="#"
      >
        Edit
      </RouterLink>
      <a
        @click.prevent="modals.deleteNote = true"
        class="card-footer-item"
        href="#"
      >
        Delete
      </a>
    </footer>
    <ModalDeleteNote
      v-if="modals.deleteNote"
      v-model="modals.deleteNote"
      :noteId="note.id"
    />
  </div>
</template>

<script setup>
  import { useDateFormat } from '@vueuse/core'
  import { computed, reactive } from 'vue'
  import ModalDeleteNote from '@/components/Notes/ModalDeleteNote.vue'
  import { useStoreNotes } from '@/stores/storeNotes'

/*
  props
*/

  const props = defineProps({
    note: {
      type: Object,
      required: true
    },
    isCurrent: {
      type: Number,
      required: true
    }
  })
  const formattedDate = computed(() =>{
    let date = new Date(parseInt(props.note.date))
    return useDateFormat(date, 'MM-DD-YYYY HH:mm:ss').value
  })
/*
  store
*/

  const storeNotes = useStoreNotes()

/*
  character length
*/

  const characterLength = computed(() => {
    let length = props.note.iosLink.length
    let description = length > 1 ? 'characters' : 'character'
    return `${ length } ${ description }`
  })

/*
  modals
*/

  const modals = reactive({
    deleteNote: false
  })

</script>
<style scoped>
  .title{
    font-size: 1.2rem;
  }
</style>