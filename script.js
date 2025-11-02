// Elements
const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const modal = document.getElementById("welcomeModal");
const closeModal = document.getElementById("closeModal");
const historyList = document.getElementById("historyList");

let currentChat = [];
let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");

// Modal
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

// Event listeners
sendBtn?.addEventListener("click", handleSend);
userInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

// Send message
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

// Call server endpoint
async function askAI(prompt) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      const txt = await res.text();
      console.error("HF returned non-JSON:", txt);
      return "HF returned invalid response";
    }
    return data.text || "No response from AI.";
  } catch (err) {
    console.error(err);
    return "Error connecting to AI.";
  }
}

// Add message to chat
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerHTML = `<p>${text}</p>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Save chat & summarize
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

// Simple summary: join first 300 chars of user messages
function summarizeChat(messages) {
  return messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ")
    .slice(0, 300);
}

// Render sidebar history
function renderHistory() {
  if (!historyList) return;
  historyList.innerHTML = "";
  chatHistory.forEach((chat, idx) => {
    const item = document.createElement("div");
    item.className = "menu-item history-item";
    item.textContent = chat.name;
    item.onclick = () => loadChat(idx);
    historyList.appendChild(item);
  });
}

// Load a previous chat
function loadChat(index) {
  const chat = chatHistory[index];
  chatArea.innerHTML = "";
  currentChat = [...chat.messages];
  chat.messages.forEach((msg) =>
    addMessage(msg.role === "user" ? "user" : "ai", msg.content)
  );
}
