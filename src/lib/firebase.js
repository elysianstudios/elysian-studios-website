import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase web config. These values are SAFE to commit — they only identify
// your project, they are not secrets. Security is enforced by Firestore rules
// (public read, admin-only write) + Firebase Auth, not by hiding these.
//
// Paste the object from: Firebase console → Project settings (gear) →
// "Your apps" → Web app → SDK setup and configuration → "Config".
const firebaseConfig = {
  apiKey: 'AIzaSyB7HHOwV3Ou-pgjIwG5WoljrgSMxujxTNc',
  authDomain: 'elysian-studios.firebaseapp.com',
  projectId: 'elysian-studios',
  storageBucket: 'elysian-studios.firebasestorage.app',
  messagingSenderId: '94390901936',
  appId: '1:94390901936:web:b112d460867e5325876f75',
  measurementId: 'G-XNC67Q5YL7',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const POSTS_COLLECTION = 'posts'
