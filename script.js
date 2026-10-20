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
    addDoc,
    where,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Realtime Database imports
import {
    getDatabase,
    ref,
    onValue,
    onDisconnect,
    set,
    serverTimestamp as rtdbServerTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
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
const rtdb = getDatabase(app);


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
// CHAT WINDOW
const chatSection = document.createElement("section");
chatSection.id = "chatSection";

chatSection.innerHTML = `
    <h2 id="chatTitle">💬 Meee Chat</h2>
    <div id="chatMessages"></div>

    <form id="chatForm">
        <input
            id="chatInput"
            type="text"
            placeholder="Type your message..."
            maxlength="2000"
            required
        >
        <button id="chatSend" type="submit">Send</button>
    </form>

    <p id="chatStatus"></p>
`;

chatSection.hidden = true;
appScreen.appendChild(chatSection);

const chatTitle = document.getElementById("chatTitle");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatStatus = document.getElementById("chatStatus");

let selectedChatUser = null;
let unsubscribeMessages = null;


// 4. STATE

let isLoginMode = false;
let unsubscribeUsers = null;
let allUsers = [];
// Store online status for users
const userStatuses = {};
const statusListeners = {};

function listenToUserStatus(user) {
    if (statusListeners[user.uid]) return;

    const statusRef = ref(rtdb, "status/" + user.uid);

    statusListeners[user.uid] = onValue(
        statusRef,
        snapshot => {
            userStatuses[user.uid] = snapshot.val();
            renderUsers();
        },
        error => {
            console.error("Status error:", error);
        }
    );
}


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
        const statusElement = document.createElement("p");
const status = userStatuses[user.uid];

if (status && status.state === "online") {
    statusElement.textContent = "🟢 Online";
} else {
    statusElement.textContent = "⚫ Offline";
}
    emailElement.textContent = user.email || "";

    const chatButton = document.createElement("button");
    chatButton.textContent = "💬 Chat";
    chatButton.type = "button";

    chatButton.addEventListener("click", () => {
        openChat(user);
    });

    card.append(nameElement, emailElement, statusElement);
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
                const user = documentSnapshot.data()
                listenToUserStatus(user);

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


// =====================================
// MEEE MESSENGER - ONLINE / OFFLINE
// =====================================

function startPresence(user) {
    const connectedRef = ref(rtdb, ".info/connected");
    const statusRef = ref(rtdb, "status/" + user.uid);

    onValue(connectedRef, async snapshot => {
        if (snapshot.val() !== true) {
            return;
        }

        try {
            // Set offline when this connection disconnects.
            await onDisconnect(statusRef).set({
                state: "offline",
                lastChanged: rtdbServerTimestamp()
            });

            // Set online now.
            await set(statusRef, {
                state: "online",
                lastChanged: rtdbServerTimestamp()
            });
        } catch (error) {
            console.error("Presence error:", error);
        }
    });
}
// 11. AUTHENTICATION STATE

onAuthStateChanged(auth, async user => {
    if (user) {
        startPresence(user);
        
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
// OPEN A CHAT
async function openChat(otherUser) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return;
    }

    if (otherUser.uid === currentUser.uid) {
        return;
    }

    if (!otherUser.uid) {
        chatStatus.textContent = "User ID nahi mila.";
        return;
    }

    selectedChatUser = otherUser;

    chatSection.hidden = false;
    chatTitle.textContent =
        "💬 Chat with " + (otherUser.name || "User");

    chatMessages.replaceChildren();
    chatStatus.textContent = "Loading messages...";

    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }

    // Same conversation ID for both users.
    const conversationId = [
        currentUser.uid,
        otherUser.uid
    ].sort().join("_");

    const messagesRef = collection(
        db,
        "conversations",
        conversationId,
        "messages"
    );
    // Mark received messages as seen
async function markMessagesAsSeen(snapshot) {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const updates = [];

    snapshot.forEach(messageDoc => {
        const message = messageDoc.data();

        if (
            message.receiverId === currentUser.uid &&
            message.seen !== true
        ) {
            updates.push(
                setDoc(
                    messageDoc.ref,
                    {
                        seen: true,
                        seenAt: serverTimestamp()
                    },
                    { merge: true }
                )
            );
        }
    });

    await Promise.all(updates);
}

    const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc"),
        limit(100)
    );

    unsubscribeMessages = onSnapshot(
        messagesQuery,
        snapshot => {
    markMessagesAsSeen(snapshot).catch(error => {
        console.error("Seen update error:", error);
    });

    chatMessages.replaceChildren();

            snapshot.forEach(messageDoc => {
                const message = messageDoc.data();

                const bubble = document.createElement("div");
                bubble.className =
                    "chat-message " +
                    (message.senderId === currentUser.uid
                        ? "my-message"
                        : "other-message");

                const text = document.createElement("p");
                text.textContent = message.text || "";

                const sender = document.createElement("small");
                sender.textContent =
                    message.senderId === currentUser.uid
                        ? "You"
                        : (otherUser.name || "User");

                const receipt = document.createElement("small");

if (message.senderId === currentUser.uid) {
    receipt.textContent = message.seen ? "✓✓ Seen" : "✓ Sent";
} else {
    receipt.textContent = message.seen ? "✓✓ Seen" : "";
}

bubble.append(sender, text, receipt);
                chatMessages.appendChild(bubble);
            });

            chatMessages.scrollTop = chatMessages.scrollHeight;
            chatStatus.textContent = "Connected";
        },
        error => {
            console.error("Message listener error:", error);
            chatStatus.textContent =
                "Messages load nahi hue: " + error.message;
        }
    );
}


// SEND A MESSAGE
chatForm.addEventListener("submit", async event => {
    event.preventDefault();

    const currentUser = auth.currentUser;
    const otherUser = selectedChatUser;
    const text = chatInput.value.trim();

    if (!currentUser || !otherUser || !text) {
        return;
    }

    const sendButton = document.getElementById("chatSend");
    sendButton.disabled = true;

    const conversationId = [
        currentUser.uid,
        otherUser.uid
    ].sort().join("_");

    try {
        await addDoc(
            collection(
                db,
                "conversations",
                conversationId,
                "messages"
            ),
            {
                text: text,
                senderId: currentUser.uid,
                receiverId: otherUser.uid,
                createdAt: serverTimestamp(),
                seen: false,
                seenAt: null
            }
        );

        chatInput.value = "";
        chatStatus.textContent = "Message sent!";
    } catch (error) {
        console.error("Send message error:", error);
        chatStatus.textContent =
            "Message send nahi hua: " + error.message;
    } finally {
        sendButton.disabled = false;
    }
});
