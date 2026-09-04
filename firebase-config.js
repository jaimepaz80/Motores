// firebase-config.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeIJD59LEW_FBIdX9l8XVyBYuNEeE8cqw",
  authDomain: "mototes.firebaseapp.com",
  databaseURL: "https://mototes-default-rtdb.firebaseio.com",
  projectId: "mototes",
  storageBucket: "mototes.firebasestorage.app",
  messagingSenderId: "766598617544",
  appId: "1:766598617544:web:5648e788dc4b2dd4f708fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db };
