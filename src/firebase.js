import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCijusB_M0ldmfT5hiZKbtog5YVKdNdvKQ",
  authDomain: "calendar-share-71ebe.firebaseapp.com",
  projectId: "calendar-share-71ebe",
  storageBucket: "calendar-share-71ebe.firebasestorage.app",
  messagingSenderId: "142536026603",
  appId: "1:142536026603:web:6ef7c8b45158505ac911ae",
  measurementId: "G-G78L00HBZ1" 
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
