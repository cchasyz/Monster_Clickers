import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { ThirdwebStorage } from "https://esm.sh/@thirdweb-dev/storage@latest?alias=js-sha3:js-sha3";

const firebaseConfig = {
    apiKey: "AIzaSyAPvVIuiI8n4LTZ32hj0ViB26_qw57Vkno",
    authDomain: "monsterclicker-d9f0c.firebaseapp.com",
    projectId: "monsterclicker-d9f0c",
    storageBucket: "monsterclicker-d9f0c.firebasestorage.app",
    messagingSenderId: "898010994479",
    appId: "1:898010994479:web:1869e18be7121f21d033da"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = new ThirdwebStorage();

export { collection, addDoc, getDocs };