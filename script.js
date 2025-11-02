
// === CONFIG ===
const GEMINI_API_KEY = "YOUR_API_KEY_HERE"; // 🔒 replace with your key
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// === GLOBALS ===
let currentChatId = null;
let chatHistory = JSON.parse(localStorage.getItem("nexus_chats") || "{}");
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const historyList = document.getElementById("history-list");

// === HELPERS ===
function createMessageElement(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerHTML = `<p>${text}</p>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function saveChat() {
  localStorage.setItem("nexus_chats", JSON.stringify(chatHistory));
}

function summarizeChat(messages) {
  // Basic summary: take the first user msg as topic summary
  if (!messages.length) return "Untitled Conversation";
  const firstMsg = messages.find(m => m.role === "user");
  return firstMsg ? firstMsg.content.slice(0, 40) + "..." : "Untitled Conversation";
}

function renderHistory() {
  historyList.innerHTML = "";
  Object.entries(chatHistory).forEach(([id, chat]) => {
    const item = document.createElement("div");
    item.classList.add("history-item");
    item.textContent = chat.title;
    item.onclick = () => loadChat(id);
    historyList.appendChild(item);
  });
}

function loadChat(id) {
  currentChatId = id;
  chatBox.innerHTML = "";
  chatHistory[id].messages.forEach(msg => {
    createMessageElement(msg.role, msg.content);
  });
}

// === AI FETCH ===
async function sendToGemini(messages) {
  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }))
    }),
  });

  const data = await response.json();
  try {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: no response";
  } catch (e) {
    return "Error parsing response.";
  }
}

// === CHAT FLOW ===
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = "";

  if (!currentChatId) {
    // Create new chat
    currentChatId = Date.now().toString();
    chatHistory[currentChatId] = {
      title: "",
      messages: []
    };
  }

  const chat = chatHistory[currentChatId];
  chat.messages.push({ role: "user", content: text });
  createMessageElement("user", text);

  const contextSummary = chat.messages.map(m => `${m.role}: ${m.content}`).join("\n");
  const aiPrompt = `You are Nexus, an adaptive AI co-founder and collaborator. Be professional but conversational. 
Use past context to recall ideas naturally. Never use emojis. 
Current chat so far:\n${contextSummary}`;

  const aiResponse = await sendToGemini([
    { role: "user", content: aiPrompt }
  ]);

  chat.messages.push({ role: "assistant", content: aiResponse });
  createMessageElement("assistant", aiResponse);

  if (!chat.title) {
    chat.title = summarizeChat(chat.messages);
  }

  saveChat();
  renderHistory();
}

// === INIT ===
sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

window.onload = renderHistory;
