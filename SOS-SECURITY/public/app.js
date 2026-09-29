// ======================================================
// SAVEME APP
// ======================================================


// ======================================================
// FIREBASE IMPORTS
// ======================================================

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    app,
    auth,
    db
} from "./firebase-config.js";


console.log("SaveMe Firebase connected.");


// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;

let currentProfile = null;

let holdTimer = null;

let holdSeconds = 0;

let holdingSOS = false;

let latitude = null;

let longitude = null;

let batteryLevel = null;


// ======================================================
// ELEMENTS
// ======================================================

const authScreen =
    document.getElementById("authScreen");

const appScreen =
    document.getElementById("appScreen");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const authMessage =
    document.getElementById("authMessage");


// ======================================================
// SHOW REGISTER
// ======================================================

document
    .getElementById("showRegisterButton")
    .addEventListener("click", () => {

        loginForm.classList.add("hidden");

        registerForm.classList.remove("hidden");

        authMessage.textContent = "";

    });


// ======================================================
// SHOW LOGIN
// ======================================================

document
    .getElementById("showLoginButton")
    .addEventListener("click", () => {

        registerForm.classList.add("hidden");

        loginForm.classList.remove("hidden");

        authMessage.textContent = "";

    });


// ======================================================
// REGISTER
// ======================================================

document
    .getElementById("registerButton")
    .addEventListener("click", registerUser);


async function registerUser() {

    const name =
        document
            .getElementById("registerName")
            .value
            .trim();


    const phone =
        document
            .getElementById("registerPhone")
            .value
            .trim();


    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("registerPassword")
            .value;


    if (!name || !phone || !email || !password) {

        showAuthMessage(
            "Please complete all fields."
        );

        return;
    }


    if (password.length < 6) {

        showAuthMessage(
            "Password must be at least 6 characters."
        );

        return;
    }


    try {

        showAuthMessage(
            "Creating your SaveMe account..."
        );


        const result =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            result.user;


        // Create user profile

        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            {

                uid: user.uid,

                name: name,

                phone: phone,

                email: email,

                createdAt:
                    serverTimestamp(),

                online: true

            }
        );


        showToast(
            "Account created successfully."
        );


    } catch (error) {

        console.error(error);

        showAuthMessage(
            firebaseError(error.code)
        );

    }

}


// ======================================================
// LOGIN
// ======================================================

document
    .getElementById("loginButton")
    .addEventListener("click", loginUser);


async function loginUser() {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    if (!email || !password) {

        showAuthMessage(
            "Enter your email and password."
        );

        return;
    }


    try {

        showAuthMessage(
            "Logging in..."
        );


        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        showToast(
            "Welcome back."
        );


    } catch (error) {

        console.error(error);

        showAuthMessage(
            firebaseError(error.code)
        );

    }

}


// ======================================================
// LOGOUT
// ======================================================

document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {

        await signOut(auth);

    });


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            currentUser = user;

            await loadUserProfile();

            showApp();

            getLocation();

            getBattery();

            loadTrustedPeople();

            loadIncomingRequests();

            loadEmergencyAlerts();

        } else {

            currentUser = null;

            currentProfile = null;

            showAuth();

        }

    }
);


// ======================================================
// LOAD PROFILE
// ======================================================

async function loadUserProfile() {

    const profileRef =
        doc(
            db,
            "users",
            currentUser.uid
        );


    const snapshot =
        await getDoc(profileRef);


    if (!snapshot.exists()) {

        console.error(
            "User profile does not exist."
        );

        return;

    }


    currentProfile =
        snapshot.data();


    document
        .getElementById("userNameTop")
        .textContent =
        currentProfile.name;


    document
        .getElementById("profileName")
        .textContent =
        currentProfile.name;


    document
        .getElementById("profileEmail")
        .textContent =
        currentProfile.email;


    document
        .getElementById("profilePhone")
        .textContent =
        currentProfile.phone;


    document
        .getElementById("profileId")
        .textContent =
        currentProfile.uid;

}


// ======================================================
// SHOW APP
// ======================================================

function showApp() {

    authScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");

}


// ======================================================
// SHOW AUTH
// ======================================================

function showAuth() {

    appScreen.classList.add("hidden");

    authScreen.classList.remove("hidden");

}


// ======================================================
// CONNECTION REQUEST
// ======================================================

document
    .getElementById("sendRequestButton")
    .addEventListener(
        "click",
        sendConnectionRequest
    );


async function sendConnectionRequest() {

    const email =
        document
            .getElementById("friendEmail")
            .value
            .trim()
            .toLowerCase();


    const message =
        document
            .getElementById("connectionMessage");


    if (!email) {

        message.textContent =
            "Enter your friend's SaveMe email.";

        return;
    }


    if (
        email ===
        currentUser.email.toLowerCase()
    ) {

        message.textContent =
            "You cannot add yourself.";

        return;
    }


    try {

        // Find user

        const usersQuery =
            query(
                collection(db, "users"),
                where(
                    "email",
                    "==",
                    email
                )
            );


        const result =
            await getDocs(usersQuery);


        if (result.empty) {

            message.textContent =
                "No SaveMe user was found with that email.";

            return;
        }


        const friendDoc =
            result.docs[0];


        const friend =
            friendDoc.data();


        // Check existing request

        const existingQuery =
            query(
                collection(
                    db,
                    "connection_requests"
                ),
                where(
                    "fromUid",
                    "==",
                    currentUser.uid
                ),
                where(
                    "toUid",
                    "==",
                    friend.uid
                ),
                where(
                    "status",
                    "==",
                    "pending"
                )
            );


        const existing =
            await getDocs(existingQuery);


        if (!existing.empty) {

            message.textContent =
                "A request has already been sent.";

            return;
        }


        // Create request

        await addDoc(
            collection(
                db,
                "connection_requests"
            ),
            {

                fromUid:
                    currentUser.uid,

                fromName:
                    currentProfile.name,

                fromEmail:
                    currentProfile.email,

                toUid:
                    friend.uid,

                toName:
                    friend.name,

                toEmail:
                    friend.email,

                status:
                    "pending",

                createdAt:
                    serverTimestamp()

            }
        );


        message.textContent =
            `Connection request sent to ${friend.name}.`;


        document
            .getElementById("friendEmail")
            .value = "";


    } catch (error) {

        console.error(error);

        message.textContent =
            "Could not send connection request.";

    }

}


// ======================================================
// LOAD INCOMING REQUESTS
// ======================================================

function loadIncomingRequests() {

    const requestsQuery =
        query(
            collection(
                db,
                "connection_requests"
            ),
            where(
                "toUid",
                "==",
                currentUser.uid
            ),
            where(
                "status",
                "==",
                "pending"
            )
        );


    onSnapshot(
        requestsQuery,
        (snapshot) => {

            const container =
                document.getElementById(
                    "requestsList"
                );


            container.innerHTML = "";


            if (snapshot.empty) {

                container.innerHTML =
                    `<p class="empty">
                        No pending requests.
                    </p>`;

                return;
            }


            snapshot.forEach(
                (docSnapshot) => {

                    const request =
                        docSnapshot.data();


                    const element =
                        document.createElement(
                            "div"
                        );


                    element.className =
                        "person";


                    element.innerHTML = `

                        <div>

                            <div class="person-name">
                                ${escapeHtml(request.fromName)}
                            </div>

                            <span class="person-email">
                                ${escapeHtml(request.fromEmail)}
                            </span>

                        </div>

                        <div class="request-actions">

                            <button
                                class="accept-button"
                                data-id="${docSnapshot.id}"
                            >
                                Accept
                            </button>

                            <button
                                class="reject-button"
                                data-id="${docSnapshot.id}"
                            >
                                Reject
                            </button>

                        </div>
                    `;


                    container.appendChild(
                        element
                    );

                }
            );


            document
                .querySelectorAll(".accept-button")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => acceptRequest(
                            button.dataset.id
                        )
                    );

                });


            document
                .querySelectorAll(".reject-button")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => rejectRequest(
                            button.dataset.id
                        )
                    );

                });

        }
    );

}


// ======================================================
// ACCEPT REQUEST
// ======================================================

async function acceptRequest(requestId) {

    const requestRef =
        doc(
            db,
            "connection_requests",
            requestId
        );


    const requestSnapshot =
        await getDoc(requestRef);


    if (!requestSnapshot.exists()) {
        return;
    }


    const request =
        requestSnapshot.data();


    // Create relationship for receiver

    await setDoc(
        doc(
            db,
            "trusted_people",
            `${currentUser.uid}_${request.fromUid}`
        ),
        {

            ownerUid:
                currentUser.uid,

            trustedUid:
                request.fromUid,

            trustedName:
                request.fromName,

            trustedEmail:
                request.fromEmail,

            createdAt:
                serverTimestamp()

        }
    );


    // Create relationship for sender

    await setDoc(
        doc(
            db,
            "trusted_people",
            `${request.fromUid}_${currentUser.uid}`
        ),
        {

            ownerUid:
                request.fromUid,

            trustedUid:
                currentUser.uid,

            trustedName:
                currentProfile.name,

            trustedEmail:
                currentProfile.email,

            createdAt:
                serverTimestamp()

        }
    );


    await updateDoc(
        requestRef,
        {
            status: "accepted"
        }
    );


    showToast(
        "Trusted person added."
    );


    loadTrustedPeople();

}


// ======================================================
// REJECT REQUEST
// ======================================================

async function rejectRequest(requestId) {

    await updateDoc(
        doc(
            db,
            "connection_requests",
            requestId
        ),
        {
            status: "rejected"
        }
    );


    showToast(
        "Request rejected."
    );

}


// ======================================================
// LOAD TRUSTED PEOPLE
// ======================================================

function loadTrustedPeople() {

    const peopleQuery =
        query(
            collection(
                db,
                "trusted_people"
            ),
            where(
                "ownerUid",
                "==",
                currentUser.uid
            )
        );


    onSnapshot(
        peopleQuery,
        (snapshot) => {

            const container =
                document.getElementById(
                    "trustedPeopleList"
                );


            container.innerHTML = "";


            if (snapshot.empty) {

                container.innerHTML =
                    `<p class="empty">
                        You have no trusted people yet.
                    </p>`;

                return;
            }


            snapshot.forEach(
                (docSnapshot) => {

                    const person =
                        docSnapshot.data();


                    const element =
                        document.createElement(
                            "div"
                        );


                    element.className =
                        "person";


                    element.innerHTML = `

                        <div>

                            <div class="person-name">
                                ${escapeHtml(person.trustedName)}
                            </div>

                            <span class="person-email">
                                ${escapeHtml(person.trustedEmail)}
                            </span>

                        </div>

                        <div>
                            🟢
                        </div>

                    `;


                    container.appendChild(
                        element
                    );

                }
            );

        }
    );

}


// ======================================================
// SOS
// ======================================================

const sosButton =
    document.getElementById(
        "sosButton"
    );


sosButton.addEventListener(
    "pointerdown",
    startSOS
);


sosButton.addEventListener(
    "pointerup",
    stopSOS
);


sosButton.addEventListener(
    "pointercancel",
    stopSOS
);


sosButton.addEventListener(
    "pointerleave",
    stopSOS
);


// ======================================================
// START SOS
// ======================================================

function startSOS() {

    if (holdingSOS) {
        return;
    }


    holdingSOS = true;

    holdSeconds = 0;


    sosButton.classList.add(
        "holding"
    );


    document
        .getElementById("sosCountdown")
        .textContent =
        "Keep holding... 10 seconds";


    holdTimer =
        setInterval(() => {

            holdSeconds++;


            const remaining =
                10 - holdSeconds;


            if (remaining > 0) {

                document
                    .getElementById(
                        "sosCountdown"
                    )
                    .textContent =
                    `Keep holding... ${remaining} seconds`;

            }


            if (holdSeconds >= 10) {

                clearInterval(
                    holdTimer
                );


                holdTimer = null;

                holdingSOS = false;


                sosButton.classList.remove(
                    "holding"
                );


                activateSOS();

            }

        }, 1000);

}


// ======================================================
// STOP SOS
// ======================================================

function stopSOS() {

    if (!holdingSOS) {
        return;
    }


    holdingSOS = false;


    clearInterval(
        holdTimer
    );


    holdTimer = null;


    sosButton.classList.remove(
        "holding"
    );


    document
        .getElementById(
            "sosCountdown"
        )
        .textContent =
        "SOS cancelled.";

}


// ======================================================
// ACTIVATE SOS
// ======================================================

async function activateSOS() {

    showToast(
        "🚨 SOS ACTIVATED"
    );


    const location =
        await getCurrentLocation();


    const emergencyData = {

        userId:
            currentUser.uid,

        userName:
            currentProfile.name,

        userEmail:
            currentProfile.email,

        latitude:
            location.latitude,

        longitude:
            location.longitude,

        battery:
            batteryLevel,

        status:
            "ACTIVE",

        createdAt:
            serverTimestamp()

    };


    // Save emergency

    const emergencyRef =
        await addDoc(
            collection(
                db,
                "sos_alerts"
            ),
            emergencyData
        );


    console.log(
        "Emergency created:",
        emergencyRef.id
    );


    document
        .getElementById(
            "emergencyLocation"
        )
        .textContent =
        `${location.latitude},
         ${location.longitude}`;


    document
        .getElementById(
            "emergencyBattery"
        )
        .textContent =
        batteryLevel
        ? `${batteryLevel}%`
        : "Unavailable";


    document
        .getElementById(
            "emergencyTime"
        )
        .textContent =
        new Date().toLocaleString();


    document
        .getElementById(
            "emergencyOverlay"
        )
        .classList.remove(
            "hidden"
        );

}


// ======================================================
// CANCEL SOS
// ======================================================

document
    .getElementById(
        "cancelEmergencyButton"
    )
    .addEventListener(
        "click",
        cancelSOS
    );


async function cancelSOS() {

    document
        .getElementById(
            "emergencyOverlay"
        )
        .classList.add(
            "hidden"
        );


    showToast(
        "Emergency alert cancelled."
    );

}


// ======================================================
// LOCATION
// ======================================================

function getLocation() {

    if (!navigator.geolocation) {

        document
            .getElementById(
                "locationText"
            )
            .textContent =
            "Location unavailable.";

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            latitude =
                position.coords.latitude;


            longitude =
                position.coords.longitude;


            document
                .getElementById(
                    "locationText"
                )
                .textContent =
                `${latitude.toFixed(6)},
                 ${longitude.toFixed(6)}`;

        },

        error => {

            console.error(
                error
            );


            document
                .getElementById(
                    "locationText"
                )
                .textContent =
                "Location permission denied.";

        }

    );

}


// ======================================================
// LOCATION PROMISE
// ======================================================

function getCurrentLocation() {

    return new Promise(
        resolve => {

            if (!navigator.geolocation) {

                resolve({

                    latitude: null,

                    longitude: null

                });

                return;
            }


            navigator.geolocation.getCurrentPosition(

                position => {

                    latitude =
                        position.coords.latitude;


                    longitude =
                        position.coords.longitude;


                    resolve({

                        latitude,

                        longitude

                    });

                },

                () => {

                    resolve({

                        latitude: null,

                        longitude: null

                    });

                }

            );

        }
    );

}


// ======================================================
// BATTERY
// ======================================================

async function getBattery() {

    if (!navigator.getBattery) {

        document
            .getElementById(
                "batteryText"
            )
            .textContent =
            "Unavailable";

        return;

    }


    try {

        const battery =
            await navigator.getBattery();


        function updateBattery() {

            batteryLevel =
                Math.round(
                    battery.level * 100
                );


            document
                .getElementById(
                    "batteryText"
                )
                .textContent =
                `${batteryLevel}%`;

        }


        updateBattery();


        battery.addEventListener(
            "levelchange",
            updateBattery
        );


    } catch (error) {

        console.error(
            error
        );

    }

}


// ======================================================
// EMERGENCY ALERTS RECEIVED
// ======================================================

function loadEmergencyAlerts() {

    const alertsQuery =
        query(
            collection(
                db,
                "sos_alerts"
            ),
            where(
                "userId",
                "==",
                currentUser.uid
            )
        );


    onSnapshot(
        alertsQuery,
        snapshot => {

            const container =
                document.getElementById(
                    "alertsList"
                );


            container.innerHTML = "";


            if (snapshot.empty) {

                container.innerHTML =
                    `<p class="empty">
                        No emergency alerts.
                    </p>`;

                return;

            }


            snapshot.forEach(
                docSnapshot => {

                    const alert =
                        docSnapshot.data();


                    const element =
                        document.createElement(
                            "div"
                        );


                    element.className =
                        "alert-item";


                    element.innerHTML = `

                        <strong>
                            🚨 Emergency Alert
                        </strong>

                        <span>
                            Status: ${escapeHtml(alert.status || "ACTIVE")}
                        </span>

                        <span>
                            Location:
                            ${alert.latitude ?? "Unavailable"},
                            ${alert.longitude ?? "Unavailable"}
                        </span>

                        <span>
                            Battery:
                            ${alert.battery ?? "Unavailable"}%
                        </span>

                    `;


                    container.appendChild(
                        element
                    );

                }
            );

        }
    );

}


// ======================================================
// NAVIGATION
// ======================================================

function showSection(sectionId) {

    document
        .querySelectorAll(".app-section")
        .forEach(section => {

            section.classList.add(
                "hidden"
            );

        });


    document
        .getElementById(sectionId)
        .classList.remove(
            "hidden"
        );


    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });

}


// HOME

document
    .getElementById("homeNav")
    .addEventListener(
        "click",
        () => {

            showSection(
                "homeSection"
            );

            document
                .getElementById(
                    "homeNav"
                )
                .classList.add(
                    "active"
                );

        }
    );


// PEOPLE

document
    .getElementById("peopleNav")
    .addEventListener(
        "click",
        () => {

            showSection(
                "peopleSection"
            );

            document
                .getElementById(
                    "peopleNav"
                )
                .classList.add(
                    "active"
                );

        }
    );


// ALERTS

document
    .getElementById("alertsNav")
    .addEventListener(
        "click",
        () => {

            showSection(
                "alertsSection"
            );

            document
                .getElementById(
                    "alertsNav"
                )
                .classList.add(
                    "active"
                );

        }
    );


// PROFILE

document
    .getElementById("profileNav")
    .addEventListener(
        "click",
        () => {

            showSection(
                "profileSection"
            );

            document
                .getElementById(
                    "profileNav"
                )
                .classList.add(
                    "active"
                );

        }
    );


// ======================================================
// AUTH MESSAGE
// ======================================================

function showAuthMessage(message) {

    authMessage.textContent =
        message;

}


// ======================================================
// TOAST
// ======================================================

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}


// ======================================================
// FIREBASE ERROR MESSAGES
// ======================================================

function firebaseError(code) {

    switch (code) {

        case "auth/email-already-in-use":

            return "That email is already registered.";

        case "auth/invalid-email":

            return "Please enter a valid email.";

        case "auth/weak-password":

            return "Password is too weak.";

        case "auth/invalid-credential":

            return "Incorrect email or password.";

        case "auth/user-not-found":

            return "No account was found.";

        default:

            return "Something went wrong. Please try again.";

    }

}


// ======================================================
// HTML SECURITY
// ======================================================

function escapeHtml(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}