// ===== ELEMENTS =====
const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const modal = document.getElementById("welcomeModal");
const closeModal = document.getElementById("closeModal");
const sidebarMenu = document.querySelector(".sidebar .menu");

// ===== GLOBALS =====
let currentChat = [];
let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");

// ===== MODAL =====
window.onload = () => {
  if (!localStorage.getItem("nexusModalSeen")) {
    modal.style.display = "flex";
  }
  renderHistory();
};

closeModal?.addEventListener("click", () => {
  modal.style.display = "none";
  localStorage.setItem("nexusModalSeen", "true");
});

// ===== EVENT LISTENERS =====
sendBtn?.addEventListener("click", handleSend);
userInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

// ===== SEND MESSAGE =====
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  userInput.value = "";

  currentChat.push({ role: "user", content: text });

  const aiResponse = await askAI(text);
  addMessage("ai", aiResponse);

  currentChat.push({ role: "assistant", content: aiResponse });

  saveChat();
  renderHistory();
}

// ===== CALL SERVER ENDPOINT =====
async function askAI(prompt) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.text || "No response from AI.";
  } catch (err) {
    console.error(err);
    return "Error connecting to AI.";
  }
}

// ===== ADD MESSAGE =====
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerHTML = `<p>${text}</p>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ===== CHAT HISTORY =====
function saveChat() {
  if (!currentChat.length) return;

  let name =
    chatHistory.length === 0
      ? currentChat[0].content.split(" ").slice(0, 4).join(" ") + "..."
      : chatHistory[0].name;

  if (chatHistory.length === 0) {
    chatHistory.unshift({ name, messages: [...currentChat], summary: summarizeChat(currentChat) });
  } else {
    chatHistory[0].messages = [...currentChat];
    chatHistory[0].summary = summarizeChat(currentChat);
  }

  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

// ===== SUMMARIZE CHAT =====
function summarizeChat(messages) {
  return messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ")
    .slice(0, 300);
}

// ===== RENDER HISTORY =====
function renderHistory() {
  if (!sidebarMenu) return;

  sidebarMenu.querySelectorAll(".history-item").forEach((e) => e.remove());

  chatHistory.forEach((chat, idx) => {
    const item = document.createElement("div");
    item.className = "menu-item history-item";
    item.textContent = chat.name;
    item.onclick = () => loadChat(idx);
    sidebarMenu.appendChild(item);
  });
}

// ===== LOAD CHAT =====
function loadChat(index) {
  const chat = chatHistory[index];
  chatArea.innerHTML = "";
  currentChat = [...chat.messages];
  chat.messages.forEach((msg) =>
    addMessage(msg.role === "user" ? "user" : "ai", msg.content)
  );
}
