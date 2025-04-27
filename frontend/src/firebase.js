import { initializeApp } from "firebase/app";
const firebaseConfig = {
    apiKey: "AIzaSyCqkb9fJtaMz4cdDQUlKswf0IHGUuEb7DE",
    authDomain: "csce331-project3-1e8ff.firebaseapp.com",
    projectId: "csce331-project3-1e8ff",
    storageBucket: "csce331-project3-1e8ff.firebasestorage.app",
    messagingSenderId: "301891046352",
    appId: "1:301891046352:web:0a67c2d52dc9bae34687d5",
    measurementId: "G-DGF38JCH1J"
};
const fb_app = initializeApp(firebaseConfig);

export default fb_app;