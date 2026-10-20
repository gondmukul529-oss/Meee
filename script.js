const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const contacts = document.querySelectorAll(".contact");
const chatName = document.getElementById("chatName");
const chatAvatar = document.getElementById("chatAvatar");
const search = document.getElementById("search");
const clearChat = document.getElementById("clearChat");

let currentContact = "Aarav";

const savedMessages = JSON.parse(
    localStorage.getItem("meeeMessages") || "{}"
);

function getCurrentMessages() {
    if (!savedMessages[currentContact]) {
        savedMessages[currentContact] = [];
    }

    return savedMessages[currentContact];
}

function saveMessages() {
    localStorage.setItem(
        "meeeMessages",
        JSON.stringify(savedMessages)
    );
}

function renderMessages() {
    messages.innerHTML = "";

    const dateLabel = document.createElement("div");
    dateLabel.className = "date-label";
    dateLabel.textContent = "Your conversation";

    messages.appendChild(dateLabel);

    getCurrentMessages().forEach(function (item) {
        const bubble = document.createElement("div");

        bubble.className =
            "message " + (item.sender === "you" ? "sent" : "received");

        // textContent prevents message text from being treated as HTML.
        bubble.textContent = item.text;

        messages.appendChild(bubble);
    });

    messages.scrollTop = messages.scrollHeight;
}

messageForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (text === "") {
        return;
    }

    getCurrentMessages().push({
        text: text,
        sender: "you",
        time: Date.now()
    });

    saveMessages();
    renderMessages();

    messageInput.value = "";
    messageInput.focus();
});

contacts.forEach(function (contact) {
    contact.addEventListener("click", function () {
        contacts.forEach(function (item) {
            item.classList.remove("active");
        });

        contact.classList.add("active");

        currentContact = contact.dataset.name;

        chatName.textContent = currentContact;
        chatAvatar.textContent = currentContact.charAt(0);

        renderMessages();
    });
});

search.addEventListener("input", function () {
    const query = search.value.toLowerCase();

    contacts.forEach(function (contact) {
        const name = contact.dataset.name.toLowerCase();

        contact.style.display = name.includes(query) ? "flex" : "none";
    });
});

clearChat.addEventListener("click", function () {
    const confirmed = confirm(
        "Is conversation ke saved messages clear karein?"
    );

    if (!confirmed) {
        return;
    }

    savedMessages[currentContact] = [];
    saveMessages();
    renderMessages();
});

renderMessages();
