// firebase-config.js
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB80AIffsuK9ztEB0wwUoV-hihpJcLMNwo",
    authDomain: "groupproject-dc735.firebaseapp.com",
    projectId: "groupproject-dc735",
    storageBucket: "groupproject-dc735.firebasestorage.app",
    messagingSenderId: "50301471484",
    appId: "1:50301471484:web:5101bdffd88cb4c34d6579"
  };

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

// Constants
const EVENT_ID = "event0"; // Constant for our single event ID

// Export the Firebase services 
window.firebaseServices = {
  firebaseApp,
  db,
  auth,
  EVENT_ID
};