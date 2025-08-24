<template>
  <div class="notes">


    <progress v-if="storeNotes.notesloading" class="progress is-large is-success" max="100"></progress>
    <template v-else>
      <div class="view_list">
        <div
          v-for="(note,index) in storeNotes.notes"
          class="view_item"
        :key="note.id"
        >
        <p>Page Name -- {{ note.name }}</p>
        <p>Page Token -- {{ note.access_token }}</p>
        </div>
    </div>
      
    </template>
    <div 
      v-if="storeNotes.notes.length === 0"
      class=" is-size-4 has-text-centered has-text-grey-light is-family-monospace py-6"
    >
      No notes here yet...
    </div>

  </div>
</template>

<script setup>

/*
  imports
*/

  import { ref } from 'vue'
  import Note from '@/components/Notes/Note.vue'
  import AddEditNote from '@/components/Notes/AddEditNote.vue'
  import { useStoreNotes } from '@/stores/storeNotes'
  import { useWatchCharacters } from '@/use/useWatchCharacters'
  // import { onMounted } from 'vue'

const storeNotes = useStoreNotes()
// onMounted(() => {
//   storeNotes.getNotes_subscribe()
// })

/*
  store
*/


/*
  notes
*/

const newNote = ref({iosLink:'',androidLink:'',iosLink2:'',androidLink2:'',cs_link:''})
  const addEditNoteRef = ref(null)

  const addNote = () => {
    storeNotes.addNote(newNote.value)
    newNote.value = {iosLink:'',androidLink:'',iosLink2:'',androidLink2:'',cs_link:''}
    // addEditNoteRef.value.focusTextarea()
  }

/*
  watch characters
*/

  //useWatchCharacters(()=>newNote.value.iosLink)
  // useWatchCharacters(()=>newNote.value.androidLink)

</script>
<style lang="css" scoped>
.view_item{
  padding: 5px;
  margin-bottom: 5px;
}
.view_item:not(:last-child) {
  border-bottom: 1px solid #fff;
}
.view_list{
  background:#48C78E;
  color:white;
  margin:10px;
  padding:5px;
  width: 100%;
  min-height: 500px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  border-radius: 20px;
}
.view_list p{
  width:100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>