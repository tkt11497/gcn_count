import { defineStore } from 'pinia'
import { auth } from '@/js/firebase'
import {  createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged } from "firebase/auth";
import { useStoreNotes } from '@/stores/storeNotes'

export const useStoreAuth = defineStore('storeAuth', {
  state: () => {
    return { 
      user:{}
    }
  },
  actions: {
    init() {
      const storeNotes = useStoreNotes()
        onAuthStateChanged(auth, (user) => {
        if (user) {
          this.user.id = user.uid
          this.user.email = user.email
          console.log('user logged in init')
          if(this.router.currentRoute.value.path === '/auth') {
            this.router.push('/notes')
          }
          storeNotes.getNotes_subscribe()
          // this.router.push('/')
        } else {
          this.user = {}
          //this.router.replace('/home')
          storeNotes.clearNotes()
          console.log('user logged out')
          // ...
        }
      });
    },
    async register(email, password) {
      await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('register success')
        //this.router.push('/')
        // Signed in 
      }).catch((error) => {
        console.log('register error',error)
      });
    },
    async login(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log('login success')
            //this.router.push('/')
          })
          .catch((error) => {
            const message = error?.message || 'Unknown error'
            const code = error?.code ? ` (${error.code})` : ''
            alert(`Login failed: ${message}${code}`)
            console.log('login error', error)
          });
    
    },
    async logout() {
      signOut(auth).then(() => {
        // Sign-out successful.
        console.log('logout success')
      }).catch((error) => {
        // An error happened.
        console.log('logout error',error)
      });
    }
  },
})