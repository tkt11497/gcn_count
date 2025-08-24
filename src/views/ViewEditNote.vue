<template>
  <div class="edit-note">
    <AddEditNote
      v-model:iosLink="noteContent.iosLink"
      v-model:androidLink="noteContent.androidLink"
      v-model:iosLink2="noteContent.iosLink2"
      v-model:androidLink2="noteContent.androidLink2"
       v-model:cs_link="noteContent.cs_link"
      bgColor="link"
      placeholder="Edit note"
      label="Edit Note"
      ref="addEditNoteRef"
    >
      <template #buttons>
        <button
          @click="$router.back()"
          class="button is-link is-light mr-2"
        >
          Cancel
        </button>
        <button
          @click="handleSaveClicked"
          class="button is-link has-background-link"
          :disabled="!noteContent.cs_link||!noteContent.iosLink || !noteContent.androidLink||!noteContent.iosLink2 || !noteContent.androidLink2"
        >
          Save Note
        </button>
      </template>
    </AddEditNote>
  </div>
</template>

<script setup>

/*
  imports
*/

  import { ref, onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRoute, useRouter } from 'vue-router'
  import AddEditNote from '@/components/Notes/AddEditNote.vue'
  import { useStoreNotes } from '@/stores/storeNotes'

/*
  router
*/

  const route = useRoute()
  const router = useRouter()

/*
  store
*/

  const storeNotes = useStoreNotes()

/*
  note
*/

  const noteContent = ref({iosLink:'',androidLink:'',iosLink2:'',androidLink2:'',cs_link:''})
  const {notes}= storeToRefs(storeNotes)
  const getNote_reload = async ()=>{
    if(notes.value.length === 0){
      storeNotes.getNotes_reload().then(()=>{
        noteContent.value = storeNotes.getNoteContent(route.params.id)
        console.log(notes.value,'22')
      })
    }else{
      noteContent.value = storeNotes.getNoteContent(route.params.id)
      console.log(notes.value,'23')
    }
  }
  onMounted(()=>{
    getNote_reload()
  })
    

/*
  save clicked
*/

  const handleSaveClicked = () => {
    storeNotes.updateNote(route.params.id, noteContent.value)
    //router.push('/')
  }

</script>