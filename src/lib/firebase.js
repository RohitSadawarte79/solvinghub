// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBU48KNiPzNBlztiEENN7zL8wzD3-3awQQ",
  authDomain: "solvinghub-eba06.firebaseapp.com",
  projectId: "solvinghub-eba06",
  storageBucket: "solvinghub-eba06.firebasestorage.app",
  messagingSenderId: "423918766967",
  appId: "1:423918766967:web:460657c65462b5f7a02f72",
  measurementId: "G-61SVNKHMTG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Optional: Initialize analytics only on the client
if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics }) => {
    getAnalytics(app);
  });
}

export { auth };
