// === CONFIG ===
const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_KEY = "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"; // replace with your key for testing

// === ELEMENTS ===
const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const historyArea = document.getElementById("history");

// === GLOBALS ===
let currentChatId = null;
let chats = JSON.parse(localStorage.getItem("nexusChats") || "{}");

// === HELPERS ===
function addMessage(role, text) {
  const div = document.createElement("div");
  div.classList.add("message", role);
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function saveChats() {
  localStorage.setItem("nexusChats", JSON.stringify(chats));
}

function renderHistory() {
  if (!historyArea) return;
  historyArea.innerHTML = "";
  Object.entries(chats).forEach(([id, chat]) => {
    const item = document.createElement("div");
    item.classList.add("history-item");
    item.textContent = chat.title || "Untitled Chat";
    item.onclick = () => loadChat(id);
    historyArea.appendChild(item);
  });
}

function loadChat(id) {
  currentChatId = id;
  chatArea.innerHTML = "";
  chats[id].messages.forEach(msg => addMessage(msg.role, msg.text));
}

// === AI CALL ===
async function askLlama(messages) {
  try {
    const res = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": window.location.origin
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-maverick",
        messages: messages
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response.";
  } catch (err) {
    console.error(err);
    return "Error connecting to LLaMA API.";
  }
}

// === CHAT FLOW ===
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = "";

  // Start new chat if needed
  if (!currentChatId) {
    currentChatId = Date.now().toString();
    chats[currentChatId] = { title: "", messages: [], topics: [] };
  }

  const chat = chats[currentChatId];
  chat.messages.push({ role: "user", text });
  addMessage("user", text);

  if (!chat.title) {
    chat.title = text.split(" ").slice(0, 5).join(" ") + "...";
  }

  // Build context
  const contextMessages = chat.messages.map(m => ({
    role: m.role === "ai" ? "assistant" : m.role,
    content: m.text
  }));

  // Add AI system prompt
  const systemPrompt = {
    role: "system",
    content: "You are Nexus, an adaptive AI co-founder and collaborator. Be conversational but professional. Recall context naturally."
  };

  const aiResponse = await askLlama([systemPrompt, ...contextMessages]);
  chat.messages.push({ role: "ai", text: aiResponse });
  addMessage("ai", aiResponse);

  saveChats();
  renderHistory();
}

// === INIT ===
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
window.addEventListener("load", renderHistory);

