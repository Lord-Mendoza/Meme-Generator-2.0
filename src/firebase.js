const firebase = require('firebase/app');
require('firebase/auth');
require("firebase/firestore");

const config = {
    apiKey: "AIzaSyD6IdIb54aMoR4cf4rVD-AecJKnjpIjGGI",
    authDomain: "spicymemesgenerator.firebaseapp.com",
    databaseURL: "https://spicymemesgenerator.firebaseio.com",
    projectId: "spicymemesgenerator",
    storageBucket: "spicymemesgenerator.appspot.com",
    messagingSenderId: "179631759072"
};



firebase.initializeApp(config);
let db = firebase.firestore();
db.settings({timestampsInSnapshots: true})
let auth = firebase.auth();
export default {
    firestore: db,
    auth: auth
};
