const {
    onDocumentCreated
} = require("firebase-functions/v2/firestore");


const {
    initializeApp
} = require("firebase-admin/app");


const {
    getFirestore
} = require("firebase-admin/firestore");


const {
    getMessaging
} = require("firebase-admin/messaging");


initializeApp();


const db =
    getFirestore();


const messaging =
    getMessaging();


// ======================================================
// SOS TRIGGER
// ======================================================

exports.sendSaveMeEmergencyNotification =

    onDocumentCreated(
        "sos_alerts/{alertId}",

        async (event) => {

            const snapshot =
                event.data;


            if (!snapshot) {

                console.log(
                    "No SOS data."
                );

                return;

            }


            const alert =
                snapshot.data();


            const userId =
                alert.userId;


            console.log(
                "SOS received from:",
                userId
            );


            // =========================================
            // FIND TRUSTED PEOPLE
            // =========================================

            const trustedSnapshot =
                await db
                    .collection(
                        "trusted_people"
                    )
                    .where(
                        "ownerUid",
                        "==",
                        userId
                    )
                    .get();


            if (
                trustedSnapshot.empty
            ) {

                console.log(
                    "No trusted people."
                );

                return;

            }


            // =========================================
            // FIND DEVICE TOKENS
            // =========================================

            const tokens = [];


            for (
                const trustedDoc
                of trustedSnapshot.docs
            ) {

                const trusted =
                    trustedDoc.data();


                const deviceSnapshot =
                    await db
                        .collection(
                            "devices"
                        )
                        .where(
                            "userId",
                            "==",
                            trusted.trustedUid
                        )
                        .get();


                deviceSnapshot.forEach(
                    deviceDoc => {

                        const device =
                            deviceDoc.data();


                        if (
                            device.token
                        ) {

                            tokens.push(
                                device.token
                            );

                        }

                    }
                );

            }


            if (
                tokens.length === 0
            ) {

                console.log(
                    "No registered devices found."
                );

                return;

            }


            // =========================================
            // SEND PUSH NOTIFICATION
            // =========================================

            const message = {

                notification: {

                    title:
                        "🚨 SAVEME EMERGENCY",

                    body:
                        `${alert.userName} has activated SaveMe.`

                },

                data: {

                    alertId:
                        event.params.alertId,

                    userId:
                        alert.userId,

                    latitude:
                        String(
                            alert.latitude ?? ""
                        ),

                    longitude:
                        String(
                            alert.longitude ?? ""
                        ),

                    battery:
                        String(
                            alert.battery ?? ""
                        )

                },

                tokens:
                    tokens

            };


            try {

                const response =
                    await messaging
                        .sendEachForMulticast(
                            message
                        );


                console.log(
                    "Notifications sent:",
                    response.successCount
                );


                console.log(
                    "Notifications failed:",
                    response.failureCount
                );


            } catch (error) {

                console.error(
                    "FCM error:",
                    error
                );

            }

        }
    );