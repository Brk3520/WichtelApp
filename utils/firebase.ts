import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBCMjPu9QGr16jUadJGfAuu8GxR5DSFDUA',
  authDomain: 'wichtel-app-8b1d2.firebaseapp.com',
  projectId: 'wichtel-app-8b1d2',
  storageBucket: 'wichtel-app-8b1d2.firebasestorage.app',
  messagingSenderId: '904276436872',
  appId: '1:904276436872:web:5370749b5317e0cf18fc3d',
  measurementId: 'G-60TVEF4B7P',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
