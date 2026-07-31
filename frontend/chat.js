// ---------------------------------------------------
// Real contacts (every registered Supabase user) + General
// Room, each with their own message thread. Auth check uses
// the real Supabase session.
// ---------------------------------------------------

// ---------------------------------------------------
// Real contacts (every registered Supabase user), each with
// their own private 1-on-1 message thread. No shared room —
// auth check uses the real Supabase session.
// ---------------------------------------------------

let currentUser = null;
let activeRoom = null;

const contactList = document.getElementById("contactList");
const activeAvatar = document.getElementById("activeAvatar");
const activeName = document.getElementById("activeName");
const activeStatus = document.getElementById("activeStatus");
const messagesBox = document.getElementById("messages");

// ---- STEP 1: Confirm login with Supabase ----
async function loadCurrentUser() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return;
  }
  currentUser = data.session.user.email;
  await loadContacts();
}

// ---- STEP 2: Real contact list from the server ----
async function loadContacts() {
  const res = await fetch("/api/users?exclude=" + encodeURIComponent(currentUser));
  const data = await res.json();

  contactList.innerHTML = "";

  data.users.forEach((email) => {
    const roomKey = [currentUser, email].sort().join("__");
    const item = document.createElement("li");
    item.className = "convo" + (activeRoom === roomKey ? " active" : "");
    item.innerHTML = `
      <div class="avatar">${email.charAt(0).toUpperCase()}</div>
      <div class="convo-info">
        <p class="convo-top"><span class="convo-name">${email}</span></p>
        <p class="convo-bottom"><span class="convo-msg">Direct message</span></p>
      </div>
    `;
    item.addEventListener("click", () =>
      openRoom(roomKey, email, email.charAt(0).toUpperCase(), "Private conversation")
    );
    contactList.appendChild(item);
  });

  if (data.users.length === 0) {
    activeRoom = null;
    activeName.textContent = "No contacts yet";
    activeStatus.textContent = "Register a second account to start chatting";
    activeAvatar.textContent = "👤";
    messagesBox.innerHTML = "";

    const hint = document.createElement("li");
    hint.style.padding = "12px 16px";
    hint.style.fontSize = "12px";
    hint.style.color = "#999";
    hint.textContent = "Register a second account to see it here as a contact.";
    contactList.appendChild(hint);
    return;
  }

  // Auto-open the first contact if nothing is selected yet
  if (activeRoom === null) {
    const first = data.users[0];
    openRoom([currentUser, first].sort().join("__"), first, first.charAt(0).toUpperCase(), "Private conversation");
  }
}

// ---- STEP 3: Switching rooms ----
function openRoom(roomKey, label, avatarChar, statusText) {
  activeRoom = roomKey;
  activeAvatar.textContent = avatarChar;
  activeName.textContent = label;
  activeStatus.textContent = statusText;
  loadContacts();
  renderMessages();
}

// ---- STEP 4: Load + render messages for the active room ----
async function renderMessages() {
  const res = await fetch("/api/messages?room=" + encodeURIComponent(activeRoom));
  const data = await res.json();

  messagesBox.innerHTML = "";
  data.messages.forEach(addBubbleToScreen);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function addBubbleToScreen(msg) {
  const isMe = msg.username === currentUser;

  const row = document.createElement("div");
  row.className = "msg-row " + (isMe ? "sent" : "received");

  row.innerHTML = isMe
    ? `<div class="msg-col">
         <div class="bubble sent">${msg.text}</div>
         <span class="msg-time right">${msg.time}</span>
       </div>`
    : `<div class="avatar small">${msg.username.charAt(0).toUpperCase()}</div>
       <div class="msg-col">
         <span class="msg-sender">${msg.username}</span>
         <div class="bubble received">${msg.text}</div>
         <span class="msg-time">${msg.time}</span>
       </div>`;

  messagesBox.appendChild(row);
}

// ---- STEP 5: Sending a message into the active room ----
const messageText = document.getElementById("messageText");
const sendBtn = document.getElementById("sendBtn");

async function sendMessage() {
  if (!activeRoom) return; // no contact selected yet

  const text = messageText.value.trim();
  if (!text) return;

  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, text, room: activeRoom })
  });
  const data = await res.json();

  if (res.ok) {
    addBubbleToScreen(data.message);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    messageText.value = "";
  }
}

sendBtn.addEventListener("click", sendMessage);
messageText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

loadCurrentUser();