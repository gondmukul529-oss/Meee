// =====================================
// MEEE MESSENGER - PHASE 1
// Authentication + User Profiles + Search
// =====================================

import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// 1. FIREBASE CONFIG

const firebaseConfig = {
    apiKey: "AIzaSyCQW_iwuC_ZKGgux1gN45WAgLMMgcYy05g",
    authDomain: "meee-fb140.firebaseapp.com",
    projectId: "meee-fb140",
    storageBucket: "meee-fb140.firebasestorage.app",
    messagingSenderId: "64115806656",
    appId: "1:64115806656:web:d8430e3ae31381d169f825",
    measurementId: "G-XVZ5CJT3FC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// 2. HTML ELEMENTS

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


// 3. CREATE USER LIST ELEMENTS

// These elements are created dynamically.
// Existing style.css does not need to be replaced.

const usersSection = document.createElement("section");
usersSection.id = "usersSection";

const usersHeading = document.createElement("h2");
usersHeading.textContent = "Meee Users";

const searchInput = document.createElement("input");
searchInput.id = "searchUsers";
searchInput.type = "search";
searchInput.placeholder = "Search users by name or email...";

searchInput.setAttribute(
    "aria-label",
    "Search registered users"
);

const usersMessage = document.createElement("p");
usersMessage.id = "usersMessage";
usersMessage.textContent = "Loading users...";

const usersList = document.createElement("div");
usersList.id = "usersList";

usersSection.append(
    usersHeading,
    searchInput,
    usersMessage,
    usersList
);

appScreen.appendChild(usersSection);


// 4. STATE

let isLoginMode = false;
let unsubscribeUsers = null;
let allUsers = [];


// 5. DISPLAY MESSAGE

function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.style.color = isError
        ? "#dc2626"
        : "#15803d";
}


// 6. LOGIN / SIGNUP SWITCH

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

switchBtn.addEventListener("click", event => {
    event.preventDefault();
    setAuthMode(!isLoginMode);
});


// 7. CREATE PROFILE

async function saveUserProfile(user, name) {
    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
        await setDoc(profileRef, {
            uid: user.uid,
            name: name,
            email: user.email,
            createdAt: serverTimestamp()
        });
    }
}


// 8. LOGIN / SIGNUP

authForm.addEventListener("submit", async event => {
    event.preventDefault();

    const userEmail = emailInput.value.trim();
    const userPassword = passwordInput.value;
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
            await signInWithEmailAndPassword(
                auth,
                userEmail,
                userPassword
            );

            showMessage("Login successful!");
        } else {
            const result = await createUserWithEmailAndPassword(
                auth,
                userEmail,
                userPassword
            );

            await saveUserProfile(result.user, name);

            showMessage("Account successfully created!");
        }
    } catch (error) {
        console.error("Authentication error:", error);

        const messages = {
            "auth/invalid-email": "Email address sahi nahi hai.",
            "auth/invalid-credential": "Email ya password galat hai.",
            "auth/email-already-in-use": "Email pehle se registered hai.",
            "auth/weak-password": "Password kam se kam 6 characters ka rakho.",
            "auth/operation-not-allowed": "Firebase Email/Password sign-in enable karo.",
            "auth/network-request-failed": "Internet connection check karo.",
            "permission-denied": "Firestore permission error. Rules check karo."
        };

        showMessage(
            messages[error.code] || "Error: " + error.message,
            true
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? "Login" : "Sign Up";
    }
});


// 9. DISPLAY REGISTERED USERS

function renderUsers() {
    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const filteredUsers = allUsers.filter(user => {
        const name = (user.name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();

        return (
            name.includes(searchTerm) ||
            email.includes(searchTerm)
        );
    });

    usersList.replaceChildren();

    if (filteredUsers.length === 0) {
        usersMessage.textContent = searchTerm
            ? "No matching users found."
            : "No other registered users found.";

        return;
    }

    usersMessage.textContent =
        `${filteredUsers.length} user(s) found`;

    filteredUsers.forEach(user => {
        const card = document.createElement("div");
        card.className = "user-card";

        const nameElement = document.createElement("h3");
        nameElement.textContent = user.name || "Meee User";

        const emailElement = document.createElement("p");
        emailElement.textContent = user.email || "";

        card.append(nameElement, emailElement);
        usersList.appendChild(card);
    });
}

searchInput.addEventListener("input", renderUsers);


// 10. LISTEN FOR USER PROFILES

function startUsersListener(currentUser) {
    stopUsersListener();

    usersMessage.textContent = "Loading users...";

    const usersQuery = query(
        collection(db, "users"),
        orderBy("name"),
        limit(100)
    );

    unsubscribeUsers = onSnapshot(
        usersQuery,
        snapshot => {
            allUsers = [];

            snapshot.forEach(documentSnapshot => {
                const user = documentSnapshot.data();

                // Hide the currently logged-in user.
                if (documentSnapshot.id !== currentUser.uid) {
                    allUsers.push(user);
                }
            });

            renderUsers();
        },
        error => {
            console.error("Users list error:", error);

            usersMessage.textContent =
                "Users load nahi hue. Firestore Rules check karo.";
        }
    );
}

function stopUsersListener() {
    if (unsubscribeUsers) {
        unsubscribeUsers();
        unsubscribeUsers = null;
    }

    allUsers = [];
    usersList.replaceChildren();
}


// 11. AUTHENTICATION STATE

onAuthStateChanged(auth, async user => {
    if (user) {
        authScreen.hidden = true;
        appScreen.hidden = false;

        userInfo.textContent = "Logged in as: " + user.email;

        try {
            // Create a fallback profile if a previous signup
            // created the Auth account but failed to save its profile.
            const profileRef = doc(db, "users", user.uid);
            const profileSnapshot = await getDoc(profileRef);

            if (!profileSnapshot.exists()) {
                await setDoc(profileRef, {
                    uid: user.uid,
                    name: user.displayName || user.email.split("@")[0],
                    email: user.email,
                    createdAt: serverTimestamp()
                });
            }

            startUsersListener(user);
        } catch (error) {
            console.error("Profile/list error:", error);

            usersMessage.textContent =
                "User profile access nahi ho raha. Firestore Rules check karo.";
        }
    } else {
        authScreen.hidden = false;
        appScreen.hidden = true;

        stopUsersListener();
    }
});


// 12. LOGOUT

logoutBtn.addEventListener("click", async event => {
    event.preventDefault();

    logoutBtn.disabled = true;

    try {
        await signOut(auth);
        setAuthMode(true);
        showMessage("Logged out successfully!");
    } catch (error) {
        console.error("Logout error:", error);
        showMessage("Logout nahi hua. Dobara try karo.", true);
    } finally {
        logoutBtn.disabled = false;
    }
});


// 13. INITIAL SETUP

setAuthMode(false);

console.log("Meee Messenger Phase 1 initialized.");
