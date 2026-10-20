// ==========================================
// 1. FIREBASE IMPORTS
// ==========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// 2. FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyCQW_iwuC_ZKGgux1gN45WAgLMMgcYy05g",
    authDomain: "meee-fb140.firebaseapp.com",
    projectId: "meee-fb140",
    storageBucket: "meee-fb140.firebasestorage.app",
    messagingSenderId: "64115806656",
    appId: "1:64115806656:web:d8430e3ae31381d169f825",
    measurementId: "G-XVZ5CJT3FC"
};


// ==========================================
// 3. INITIALIZE FIREBASE
// ==========================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ==========================================
// 4. GET HTML ELEMENTS
// ==========================================

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

const authForm = document.getElementById("authForm");
const signupName = document.getElementById("signupName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");

const switchBtn = document.getElementById("switchBtn");
const switchText = document.getElementById("switchText");

const authMessage = document.getElementById("authMessage");
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");


// ==========================================
// 5. CHECK HTML ELEMENTS
// ==========================================

if (
    !authScreen ||
    !appScreen ||
    !authForm ||
    !signupName ||
    !emailInput ||
    !passwordInput ||
    !submitBtn ||
    !formTitle ||
    !switchBtn ||
    !switchText ||
    !authMessage ||
    !userInfo ||
    !logoutBtn
) {
    console.error(
        "HTML element missing. Check the IDs in index.html."
    );
}


// ==========================================
// 6. LOGIN / SIGNUP MODE
// ==========================================

let isLoginMode = false;


// Show message safely
function showMessage(message, isError = false) {
    if (!authMessage) return;

    authMessage.textContent = message;

    authMessage.style.color = isError
        ? "#dc2626"
        : "#15803d";
}


// Change form mode
function setAuthMode(loginMode) {
    isLoginMode = loginMode;

    authForm.reset();
    showMessage("");

    if (isLoginMode) {
        formTitle.textContent = "Login";
        submitBtn.textContent = "Login";

        signupName.hidden = true;
        signupName.required = false;

        passwordInput.autocomplete = "current-password";

        switchText.textContent = "Don't have an account? ";
        switchText.appendChild(switchBtn);

        switchBtn.textContent = "Sign Up";
    } else {
        formTitle.textContent = "Create Account";
        submitBtn.textContent = "Sign Up";

        signupName.hidden = false;
        signupName.required = true;

        passwordInput.autocomplete = "new-password";

        switchText.textContent = "Already have an account? ";
        switchText.appendChild(switchBtn);

        switchBtn.textContent = "Login";
    }
}


// Switch between Login and Sign Up
switchBtn.addEventListener("click", (event) => {
    event.preventDefault();

    setAuthMode(!isLoginMode);
});


// ==========================================
// 7. LOGIN AND SIGNUP
// ==========================================

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userEmail = emailInput.value.trim();
    const userPassword = passwordInput.value;
    const name = signupName.value.trim();

    if (!userEmail || !userPassword) {
        showMessage(
            "Email aur password enter karo.",
            true
        );
        return;
    }

    if (!isLoginMode && !name) {
        showMessage(
            "Apna naam enter karo.",
            true
        );
        return;
    }

    if (userPassword.length < 6) {
        showMessage(
            "Password kam se kam 6 characters ka hona chahiye.",
            true
        );
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait...";

    try {

        // --------------------------
        // LOGIN
        // --------------------------

        if (isLoginMode) {

            await signInWithEmailAndPassword(
                auth,
                userEmail,
                userPassword
            );

            showMessage("Login successful!");

        }

        // --------------------------
        // SIGN UP
        // --------------------------

        else {

            const result =
                await createUserWithEmailAndPassword(
                    auth,
                    userEmail,
                    userPassword
                );

            // Save user profile in Firestore
            await setDoc(
                doc(db, "users", result.user.uid),
                {
                    uid: result.user.uid,
                    name: name,
                    email: userEmail,
                    createdAt: serverTimestamp()
                }
            );

            showMessage(
                "Account successfully created!"
            );
        }

    } catch (error) {

        console.error(
            "Firebase error:",
            error.code,
            error.message
        );

        const errors = {
            "auth/invalid-email":
                "Email address sahi nahi hai.",

            "auth/invalid-credential":
                "Email ya password galat hai. Dobara check karo.",

            "auth/user-not-found":
                "Account nahi mila. Pehle Sign Up karo.",

            "auth/wrong-password":
                "Password galat hai.",

            "auth/email-already-in-use":
                "Ye email pehle se registered hai. Login karo.",

            "auth/weak-password":
                "Password kam se kam 6 characters ka rakho.",

            "auth/operation-not-allowed":
                "Firebase Console mein Email/Password sign-in enable karo.",

            "auth/network-request-failed":
                "Internet connection check karo.",

            "auth/too-many-requests":
                "Bahut baar try kiya hai. Thodi der baad try karo.",

            "permission-denied":
                "Firestore permission error. Security Rules check karo.",

            "unavailable":
                "Firebase service abhi available nahi hai. Dobara try karo."
        };

        showMessage(
            errors[error.code] ||
            `Error: ${error.code || error.message}`,
            true
        );

    } finally {

        submitBtn.disabled = false;

        submitBtn.textContent = isLoginMode
            ? "Login"
            : "Sign Up";
    }
});


// ==========================================
// 8. CHECK LOGIN STATUS
// ==========================================

onAuthStateChanged(auth, (user) => {

    if (user) {

        // User is logged in
        authScreen.hidden = true;
        appScreen.hidden = false;

        userInfo.textContent =
            `Logged in as: ${user.email}`;

    } else {

        // User is logged out
        authScreen.hidden = false;
        appScreen.hidden = true;

    }
});


// ==========================================
// 9. LOGOUT
// ==========================================

logoutBtn.addEventListener("click", async (event) => {

    event.preventDefault();

    logoutBtn.disabled = true;

    try {

        await signOut(auth);

        setAuthMode(true);

        showMessage("Logged out successfully.");

    } catch (error) {

        console.error(
            "Logout error:",
            error.code,
            error.message
        );

        showMessage(
            "Logout nahi hua. Dobara try karo.",
            true
        );

    } finally {

        logoutBtn.disabled = false;

    }
});


// ==========================================
// 10. INITIAL FORM SETUP
// ==========================================

setAuthMode(false);

console.log("Meee Messenger Firebase initialized.");
