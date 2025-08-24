<template>
  <div class="notes">

    <AddEditNote
      v-model:iosLink="newNote.iosLink"
      v-model:androidLink="newNote.androidLink"
      v-model:iosLink2="newNote.iosLink2"
      v-model:androidLink2="newNote.androidLink2"
       v-model:cs_link="newNote.cs_link"

      placeholder="Add a new note"
      ref="addEditNoteRef"
    >
      <template #buttons>
        <button
          @click="addNote"
          :disabled="!newNote.iosLink || !newNote.androidLink||!newNote.iosLink2 || !newNote.androidLink2||!newNote.cs_link"
          class="button is-link has-background-success"
        >
          Add New Link
        </button>
      </template>
    </AddEditNote>
    <progress v-if="storeNotes.notesloading" class="progress is-large is-success" max="100"></progress>
    <template v-else>
      <Note
        v-for="(note,index) in storeNotes.notes"
      :key="note.id"
        :note="note"
        :isCurrent="index"
      />
    </template>
    <div 
      v-if="storeNotes.notes.length === 0"
      class="is-size-4 has-text-centered has-text-grey-light is-family-monospace py-6"
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

  useWatchCharacters(()=>newNote.value.iosLink)
  // useWatchCharacters(()=>newNote.value.androidLink)

</script>