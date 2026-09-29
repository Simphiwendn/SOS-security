// =========================================
// SAVEME - FIREBASE CONNECTION
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// =========================================
// FIREBASE CONFIGURATION
// =========================================

const firebaseConfig = {

    apiKey: "AIzaSyAe92Bt4gDWVpNF9SOPPamLyVsnTSOAOR0",

    authDomain: "saveme-4b95d.firebaseapp.com",

    projectId: "saveme-4b95d",

    storageBucket: "saveme-4b95d.firebasestorage.app",

    messagingSenderId: "46849551827",

    appId: "1:46849551827:web:ef1049a1d162cd6a489326"

};


// =========================================
// INITIALIZE FIREBASE
// =========================================

const app = initializeApp(firebaseConfig);


// =========================================
// FIREBASE AUTHENTICATION
// =========================================

const auth = getAuth(app);


// =========================================
// FIRESTORE DATABASE
// =========================================

const db = getFirestore(app);


// =========================================
// EXPORT
// =========================================

export {
    app,
    auth,
    db
};