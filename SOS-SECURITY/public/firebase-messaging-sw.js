importScripts(
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js"
);


const firebaseConfig = {

    apiKey: "AIzaSyAe92Bt4gDWVpNF9SOPPamLyVsnTSOAOR0",

    authDomain: "saveme-4b95d.firebaseapp.com",

    projectId: "saveme-4b95d",

    storageBucket: "saveme-4b95d.firebasestorage.app",

    messagingSenderId: "46849551827",

    appId: "1:46849551827:web:ef1049a1d162cd6a489326"

};


firebase.initializeApp(firebaseConfig);


const messaging =
    firebase.messaging();


messaging.onBackgroundMessage(
    function(payload) {

        console.log(
            "Background notification:",
            payload
        );


        const notificationTitle =
            payload.notification?.title
            || "SaveMe Emergency";


        const notificationOptions = {

            body:
                payload.notification?.body
                || "Your trusted person has activated SaveMe.",

            icon: "/icon.png"

        };


        self.registration.showNotification(
            notificationTitle,
            notificationOptions
        );

    }
);