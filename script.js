// ======== DOM Elements ========
const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const welcomeModal = document.getElementById("welcomeModal");
const closeModalBtn = document.getElementById("closeModal");
const menuItems = document.querySelectorAll(".menu-item");

// ======== LocalStorage Keys ========
const STORAGE_KEY = "nexusChats";

// ======== State ========
let currentTab = "chat";
let chats = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentChat = null;

// ======== Modal ========
window.onload = () => {
  if (!localStorage.getItem("welcomeShown")) {
    welcomeModal.style.display = "flex";
  }
  loadChatHistory();
};

closeModalBtn.addEventListener("click", () => {
  welcomeModal.style.display = "none";
  localStorage.setItem("welcomeShown", true);
});

// ======== Menu Tab Switching ========
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    currentTab = item.dataset.tab || "chat";
    if (currentTab === "chat") {
      chatArea.style.display = "block";
      loadChatHistory();
    } else if (currentTab === "history") {
      chatArea.style.display = "block";
      loadHistoryTab();
    }
  });
});

// ======== Load Chat Area ========
function loadChatHistory() {
  chatArea.innerHTML = "";
  if (!currentChat) return;
  currentChat.messages.forEach(msg => {
    appendMessage(msg.role, msg.content);
  });
  scrollToBottom();
}

function loadHistoryTab() {
  chatArea.innerHTML = "<h3>Past Conversations</h3>";
  chats.forEach((chat, idx) => {
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.textContent = chat.title || `Chat ${idx + 1}`;
    div.addEventListener("click", () => {
      currentChat = chat;
      currentTab = "chat";
      menuItems.forEach(i => i.classList.remove("active"));
      menuItems[0].classList.add("active");
      loadChatHistory();
    });
    chatArea.appendChild(div);
  });
}

// ======== Append Messages ========
function appendMessage(role, text) {
  const div = document.createElement("div");
  div.classList.add(role === "user" ? "user-msg" : "ai-msg");
  div.textContent = text;
  chatArea.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ======== Send Message ========
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const input = userInput.value.trim();
  if (!input) return;

  // Start new chat if needed
  if (!currentChat) {
    currentChat = { title: input.split(" ").slice(0, 5).join(" "), messages: [] };
    chats.push(currentChat);
  }

  appendMessage("user", input);
  currentChat.messages.push({ role: "user", content: input });
  saveChats();

  userInput.value = "";
  appendMessage("ai", "Typing...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: buildPrompt(input) }),
    });
    const data = await response.json();
    chatArea.querySelector(".ai-msg:last-child").textContent = data.text || "No response from AI.";
    currentChat.messages.push({ role: "ai", content: data.text || "" });
    saveChats();
  } catch (err) {
    console.error(err);
    chatArea.querySelector(".ai-msg:last-child").textContent = "Error connecting to AI.";
  }
}

// ======== Build Prompt for AI (include summaries) ========
function buildPrompt(newMsg) {
  let summary = currentChat.summary || "";
  return summary + "\nUser: " + newMsg + "\nAI:";
}

// ======== Save Chats to LocalStorage ========
function saveChats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}
