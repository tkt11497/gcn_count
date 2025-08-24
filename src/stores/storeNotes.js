import { defineStore } from 'pinia'
import { collection, getDocs,onSnapshot,
          addDoc, deleteDoc, doc, updateDoc,
          query, orderBy, limit } from "firebase/firestore";
import { db } from '@/js/firebase'
const notesCollection = collection(db, "pages")
// const notesQuery = query(notesCollection, orderBy("date"), limit(3));
const notesQuery = query(notesCollection, orderBy("date","desc"));
let unsubscribe=null
export const useStoreNotes = defineStore('storeNotes', {
  state: () => {
    return { 
      notes: [

      ],
      notesloading: false
    }
  },
  actions: {
    async getNotes_reload() {
      let notes1 = []
      const querySnapshot = await getDocs(notesCollection);
      querySnapshot.forEach((doc) => {
        let note={
          id: doc.id,
          ...doc.data()
          }
        //console.log(doc.id, " => ", doc.data());
        notes1.push(note)
      });
      this.notes = notes1
    },
    async getNotes_subscribe() {  
      this.notesloading = true
      if(unsubscribe) {
        unsubscribe()
      }
      unsubscribe = onSnapshot(notesQuery, (querySnapshot) => {
        let notes = []
        querySnapshot.forEach((doc) => {
            let note={
              id: doc.id,
              ...doc.data()
            }
            notes.push(note)
        });
        this.notes = notes
        this.notesloading = false
      },(error)=>{
        console.log(error.message)
        this.notesloading = false
      });
      //return unsubscribe
    },
    async addNote(newNoteContent) {
      let currentDate = new Date().getTime()

      const docRef = await addDoc(notesCollection, {
        // content: newNoteContent.content,
        ...newNoteContent,
        date: currentDate
      });

      // this.notes.unshift(note)
    },
    async addPages(final) {
      let currentDate = new Date().getTime()

      const docRef = await addDoc(notesCollection, {
        // content: newNoteContent.content,
        ...final,
        date: currentDate
      });

      // this.notes.unshift(note)
    },
    async deleteNote(idToDelete) {
      await deleteDoc(doc(notesCollection, idToDelete));
    },
    async updateNote(id_param, content) {
      // Set the "capital" field of the city 'DC'
      const { id, ...noteWithoutId } = content;
        await updateDoc(doc(notesCollection, id_param), {
          // content: content.content,
          // username: content.username only specified field will be updated in fire store
          ...noteWithoutId
        }).then(() => {
          console.log('update success')
          this.router.push('/')
        }).catch((error) => {
          console.log(error.message)
        });
    },
     clearNotes() {
      if(unsubscribe) {
        unsubscribe()
      }
      this.notes = []
    }
  },
  getters: {
    getNoteContent: (state) => {
      return (id) => {
        return state.notes.filter(note => note.id === id)[0]
      }
    },
    totalNotesCount: (state) => {
      return state.notes.length
    },
    totalCharactersCount: (state) => {
      let count = 0
      state.notes.forEach(note => {
        count += note.iosLink.length + note.androidLink.length
      })
      return count
    }
  }
})