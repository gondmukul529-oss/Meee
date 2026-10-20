import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// 1. Tumhara Firebase API Config
const firebaseConfig = {
  apiKey: "AIzaSyCQW_iwuC_ZKGgux1gN45WAgLMMgcYy05g",
  authDomain: "meee-fb140.firebaseapp.com",
  projectId: "meee-fb140",
  storageBucket: "meee-fb140.firebasestorage.app",
  messagingSenderId: "64115806656",
  appId: "1:64115806656:web:d8430e3ae31381d169f825",
  measurementId: "G-XVZ5CJT3FC"
};


// 2. Firebase Start
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// 3. HTML Elements
const signupName = document.getElementById("signupName");
const email = document.getElementById("email");
const password = document.getElementById("password");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authMessage = document.getElementById("authMessage");
const authScreen = document.getElementById("authScreen");
const appScreen = document.querySelector(".app");

const contacts = document.getElementById("contacts");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const chatName = document.getElementById("chatName");
const search = document.getElementById("search");


// 4. Current User
let currentUser = null;
let selectedUser = null;
let unsubscribeMessages = null;


// 5. Message Display
function showMessage(text) {
  if (authMessage) {
    authMessage.textContent = text;
  } else {
    alert(text);
  }
}


// 6. Sign Up
signupBtn?.addEventListener("click", async (event) => {
  event.preventDefault();

  const name = signupName?.value.trim();
  const userEmail = email?.value.trim();
  const userPassword = password?.value;

  if (!name || !userEmail || !userPassword) {
    showMessage("Please fill in all fields.");
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      userEmail,
      userPassword
    );

    await setDoc(doc(db, "users", result.user.uid), {
      uid: result.user.uid,
      name: name,
      email: userEmail,
      createdAt: serverTimestamp()
    });

    showMessage("Account created successfully!");
  } catch (error) {
    showMessage(error.message);
  }
});


// 7. Login
loginBtn?.addEventListener("click", async (event) => {
  event.preventDefault();

  const userEmail = email?.value.trim();
  const userPassword = password?.value;

  if (!userEmail || !userPassword) {
    showMessage("Enter your email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, userEmail, userPassword);
    showMessage("Login successful!");
  } catch (error) {
    showMessage(error.message);
  }
});


// 8. Authentication State
onAuthStateChanged(auth, async (user) => {
  currentUser = user
