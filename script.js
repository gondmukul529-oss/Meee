// ======================================
// MEEE MESSENGER - FIREBASE JAVASCRIPT
// ======================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ======================================
// 1. FIREBASE CONFIGURATION
// ======================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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


// ======================================
// 2. HTML ELEMENTS
// ======================================

const authScreen = document.getElementById("authScreen");
const signupName = document.getElementById("signupName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const authMessage = document.getElementById("authMessage");

const appContainer = document.querySelector(".app");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messagesContainer = document.getElementById("messages");

const chatName = document.getElementById("chatName");
const chatAvatar = document.getElementById("chatAvatar");
const contactsContainer = document.getElementById("contacts");
const searchInput = document.getElementById("search");
const clearChatBtn = document.getElementById("clearChat");


// ======================================
// 3. APP STATE
// ======================================

let currentUser = null;
let selectedUserId = null;
let unsubscribeMessages = null;


// ======================================
// 4. SHOW LOGIN SCREEN
// ======================================

function showLogin() {
    if (authScreen) authScreen.style.display = "flex";
    if (appContainer) appContainer.style.display = "none";
}


// ======================================
// 5. SHOW MESSENGER
// ======================================

function showMessenger() {
    if (authScreen) authScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "flex";
}


// ======================================
// 6. SIGN UP
// ======================================

if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
        const name = signupName.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!name || !email || password.length < 6) {
            authMessage.textContent =
                "Name, valid email aur minimum 6-character password enter karo.";
            return;
        }

        try {
            signupBtn.disabled = true;
            authMessage.textContent = "Account create ho raha hai...";

            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(result.user, {
                displayName: name
            });

            authMessage.textContent = "Account ban gaya!";

        } catch (error) {
            authMessage.textContent = error.message;
        } finally {
            signupBtn.disabled = false;
        }
    });
}


// ======================================
// 7. LOGIN
// ======================================

if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            authMessage.textContent =
                "Email aur password enter karo.";
            return;
        }

        try {
            loginBtn.disabled = true;
            authMessage.textContent = "Login ho raha hai...";

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        } catch (error) {
            authMessage.textContent = error.message;
        } finally {
            loginBtn.disabled = false;
        }
    });
}


// ======================================
// 8. LOGOUT FUNCTION
// ======================================

async function logoutUser() {
    try {
        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }

        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
    }
}


// ======================================
// 9. USER AUTHENTICATION STATE
// ======================================

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
        showLogin();
        return;
    }

    showMessenger();

    if (chatName) {
        chatName.textContent =
            user.displayName || user.email || "Meee User";
    }

    await loadUsers();
});


// ======================================
// 10. LOAD USERS FROM FIRESTORE
// ======================================

async function loadUsers() {
    if (!contactsContainer || !currentUser) return;

    contactsContainer.replaceChildren();

    const heading = document.createElement("p");
    heading.textContent = "Loading users...";
    contactsContainer.appendChild(heading);

    onSnapshot(
        collection(db, "users"),
        (snapshot) => {
            contactsContainer.replaceChildren();

            snapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                const userId = userDoc.id;

                if (userId === currentUser.uid) return;

                const button = document.createElement("button");
                button.className = "contact";
                button.dataset.name = userData.name || "Meee User";

                const avatar = document.createElement("span");
                avatar.className = "avatar";
                avatar.textContent =
                    (userData.name || "M").charAt(0).toUpperCase();

                const details = document.createElement("span");

                const name = document.createElement("b");
                name.textContent = userData.name || "Meee User";

                const subtitle = document.createElement("small");
                subtitle.textContent = "Start a conversation";

                details.append(name, subtitle);
                button.append(avatar, details);

                button.addEventListener("click", () => {
                    document.querySelectorAll(".contact")
                        .forEach(item => item.classList.remove("active"));

                    button.classList.add("active");

                    selectedUserId = userId;
                    chatName.textContent = userData.name || "Meee User";
                    chatAvatar.textContent =
                        (userData.name || "M").charAt(0).toUpperCase();

                    openConversation(userId);
                });

                contactsContainer.appendChild(button);
            });

            if (contactsContainer.children.length === 0) {
                const empty = document.createElement("p");
                empty.textContent =
                    "Abhi koi doosra registered user nahi hai.";
                contactsContainer.appendChild(empty);
            }
        },
        (error) => {
            console.error("Users error:", error);
            contactsContainer.textContent =
                "Users load nahi ho paaye. Firestore rules check karo.";
        }
    );
}


// ======================================
// 11. CREATE CONVERSATION ID
// ======================================

function getConversationId(userA, userB) {
    return [userA, userB].sort().join("_");
}


// ======================================
// 12. OPEN REAL-TIME CONVERSATION
// ======================================

function openConversation(otherUserId) {
    if (!currentUser || !messagesContainer) return;

    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }

    const conversationId = getConversationId(
        currentUser.uid,
        otherUserId
    );

    const messagesRef = collection(
        db,
        "conversations",
        conversationId,
        "messages"
    );

    const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc")
    );

    unsubscribeMessages = onSnapshot(
        messagesQuery,
        (snapshot) => {
            messagesContainer.replaceChildren();

            snapshot.forEach((messageDoc) => {
                const data = messageDoc.data();

                const bubble = document.createElement("div");

                bubble.className =
                    "message " +
                    (data.senderId === currentUser.uid
                        ? "sent"
                        : "received");

                bubble.textContent = data.text || "";

                messagesContainer.appendChild(bubble);
            });

            messagesContainer.scrollTop =
                messagesContainer.scrollHeight;
        },
        (error) => {
            console.error("Message loading error:", error);
            messagesContainer.textContent =
                "Messages load nahi hue. Firestore rules check karo.";
        }
    );
}


// ======================================
// 13. SEND MESSAGE
// ======================================

if (messageForm) {
    messageForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const text = messageInput.value.trim();

        if (!text || !currentUser || !selectedUserId) {
            if (!selectedUserId) {
                alert("Pehle contacts se kisi user ko select karo.");
            }
            return;
        }

        const conversationId = getConversationId(
            currentUser.uid,
            selectedUserId
        );

        try {
            messageInput.disabled = true;

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
                    receiverId: selectedUserId,
                    createdAt: serverTimestamp()
                }
            );

            messageInput.value = "";

        } catch (error) {
            console.error("Send message error:", error);
            alert("Message send nahi hua. Firestore rules check karo.");
        } finally {
            messageInput.disabled = false;
            messageInput.focus();
        }
    });
}


// ======================================
// 14. SEARCH CONTACTS
// ======================================

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const searchText = searchInput.value.toLowerCase();

        document.querySelectorAll(".contact").forEach((contact) => {
            const name = (contact.dataset.name || "").toLowerCase();

            contact.style.display =
                name.includes(searchText) ? "flex" : "none";
        });
    });
}


// ======================================
// 15. CLEAR CURRENT CHAT VIEW
// ======================================

// This clears the displayed conversation view only.
// It does NOT delete messages from Firestore.

if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
        if (!selectedUserId) {
            alert("Pehle ek contact select karo.");
            return;
        }

        messagesContainer.replaceChildren();

        alert(
            "Chat view clear hua. Database ke messages delete nahi hue. " +
            "Naye messages ya refresh par purane messages phir dikh sakte hain."
        );
    });
}


// ======================================
// 16. INITIAL STATE
// ======================================

showLogin();

console.log("Meee Messenger JavaScript loaded.");
