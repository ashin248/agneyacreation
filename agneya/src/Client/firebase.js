import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAniGTnwroVblf5tPovmP0p8dIwXDvAfpQ",
  authDomain: "agneya.firebaseapp.com",
  projectId: "agneya",
  storageBucket: "agneya.firebasestorage.app",
  messagingSenderId: "708182578269",
  appId: "1:708182578269:web:e6a2cce3394af0118fa9b4",
  measurementId: "G-0BT5HT0L1E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
