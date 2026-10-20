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


// YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCQW_iwuC_ZKGgux1gN45WAgLMMgcYy05g",
    authDomain: "meee-fb140.firebaseapp.com",
    projectId: "meee-fb140",
    storageBucket: "meee-fb140.firebasestorage.app",
    messagingSenderId: "64115806656",
    appId: "1:64115806656:web:d8430e3ae31381d169f825",
    measurementId: "G-XVZ5CJT3FC"
};


// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// HTML ELEMENTS
const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");
const authForm = document.getElementById("authForm");
const signupName = document.getElementById("signupName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");
const switchBtn = document.getElementById("switchBtn");
const switchText = document.getElementById("switchText");
const authMessage = document.getElementById("authMessage");
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");

let isLoginMode = false;


// SHOW MESSAGE
function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.style.color = isError ? "#dc2626" : "#15803d";
}


// SWITCH LOGIN / SIGNUP
switchBtn.addEventListener("click", () => {
    isLoginMode = !isLoginMode;

    authForm.reset();
    showMessage("");

    if (isLoginMode) {
        formTitle.textContent = "Login";
        submitBtn.textContent = "Login";
        signupName.hidden = true;
        signupName.required = false;
        password.autocomplete = "current-password";

        switchText.firstChild.textContent =
            "Don't have an account? ";

        switchBtn.textContent = "Sign Up";
    } else {
        formTitle.textContent = "Create Account";
        submitBtn.textContent = "Sign Up";
        signupName.hidden = false;
        signupName.required = true;
        password.autocomplete = "new-password";

        switchText.firstChild.textContent =
            "Already have an account? ";

        switchBtn.textContent = "Login";
    }
});


// SIGNUP AND LOGIN
authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userEmail = email.value.trim();
    const userPassword = password.value;
    const name = signupName.value.trim();

    if (!userEmail || !userPassword) {
        showMessage("Email aur password enter karo.", true);
        return;
    }

    if (!isLoginMode && !name) {
        showMessage("Apna naam enter karo.", true);
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait...";

    try {
        if (isLoginMode) {

            // LOGIN
            await signInWithEmailAndPassword(
                auth,
                userEmail,
                userPassword
            );

            showMessage("Login successful!");

        } else {

            // SIGNUP
            const result = await createUserWithEmailAndPassword(
                auth,
                userEmail,
                userPassword
            );

            // SAVE USER PROFILE
            try {
                await setDoc(
                    doc(db, "users", result.user.uid),
                    {
                        uid: result.user.uid,
                        name: name,
                        email: userEmail,
                        createdAt: serverTimestamp()
                    }
                );
            } catch (profileError) {
                console.error(
                    "Profile save error:",
                    profileError.code,
                    profileError.message
                );

                showMessage(
                    "Account ban gaya, lekin profile save nahi hui. Firestore Rules check karo.",
                    true
                );
                return;
            }

            showMessage("Account successfully created!");
        }

    } catch (error) {
        console.error("Firebase error:", error.code, error.message);

        const errors = {
            "auth/email-already-in-use":
                "Ye email pehle se registered hai. Login karo.",

            "auth/invalid-email":
                "Email address sahi nahi hai.",

            "auth/weak-password":
                "Password kam se kam 6 characters ka rakho.",

            "auth/invalid-credential":
                "Email ya password galat hai.",

            "auth/user-not-found":
                "Account nahi mila. Pehle Sign Up karo.",

            "auth/wrong-password":
                "Password galat hai.",

            "auth/operation-not-allowed":
                "Firebase mein Email/Password sign-in enable karo.",

            "auth/too-many-requests":
                "Bahut baar try kiya hai. Thodi der baad try karo.",

            "auth/network-request-failed":
                "Internet connection check karo."
        };

        showMessage(
            errors[error.code] ||
            `Error: ${error.code || error.message}`,
            true
        );

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? "Login" : "Sign Up";
    }
});


// CHECK LOGIN STATUS
onAuthStateChanged(auth, (user) => {
    if (user) {
        authScreen.hidden = true;
        appScreen.hidden = false;

        userInfo.textContent =
            `Logged in as: ${user.email}`;
    } else {
        authScreen.hidden = false;
        appScreen.hidden = true;
    }
});


// LOGOUT
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        isLoginMode = true;

        formTitle.textContent = "Login";
        submitBtn.textContent = "Login";
        signupName.hidden = true;
        signupName.required = false;
        switchText.firstChild.textContent =
            "Don't have an account? ";
        switchBtn.textContent = "Sign Up";

        authForm.reset();
        showMessage("Logged out successfully.");

    } catch (error) {
        console.error("Logout error:", error);
        showMessage("Logout nahi hua. Dobara try karo.", true);
    }
});
