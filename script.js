// ========== CONFIG ==========
const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_KEY = "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";
const MODEL = "meta-llama/llama-4-maverick";

// ========== ELEMENTS ==========
const chatContainer = document.getElementById("chat-container");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const historyList = document.getElementById("history-list");

// ========== LOAD ==========
window.onload = () => {
  showWelcomePopup();
  loadChatHistory();
};

// ========== POPUP ==========
function showWelcomePopup() {
  if (localStorage.getItem("nexusPopupSeen")) return;

  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <div class="popup-content">
      <h2>Welcome to Nexus 👋</h2>
      <p>This AI acts as your co-founder, co-writer, and creative partner. 
      It remembers your previous topics, summarizes them, and builds context over time.</p>
      <p class="disclaimer">⚠️ Disclaimer: Nexus is an AI assistant and not a substitute for professional advice.</p>
      <button id="closePopup">Start Chatting</button>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById("closePopup").onclick = () => {
    popup.remove();
    localStorage.setItem("nexusPopupSeen", "true");
  };
}

// ========== CHAT ==========
let currentChat = [];
let chatSummaries = JSON.parse(localStorage.getItem("chatSummaries")) || {};

sendBtn.addEventListener("click", () => handleSend());
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

async function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage("user", text);
  chatInput.value = "";

  currentChat.push({ role: "user", content: text });

  const response = await askLlama(currentChat);
  addMessage("ai", response);

  currentChat.push({ role: "assistant", content: response });

  // Save convo
  saveConversation(text, response);
}

// ========== AI REQUEST ==========
async function askLlama(messages) {
  try {
    const res = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Nexus Web Client"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Error Response:", text);
      return `API Error (${res.status}): ${text}`;
    }

    const data = await res.json();
    console.log("LLaMA raw response:", data);

    const aiMessage =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.delta?.content ||
      "No response from AI.";

    return aiMessage;
  } catch (err) {
    console.error("Fetch error:", err);
    return "Connection error: " + err.message;
  }
}

// ========== UI ==========
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerHTML = `<p>${text}</p>`;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ========== STORAGE ==========
function saveConversation(userMsg, aiMsg) {
  let allChats = JSON.parse(localStorage.getItem("chatHistory")) || [];

  // If new chat
  if (currentChat.length <= 2) {
    const chatName = generateChatName(userMsg);
    allChats.unshift({
      id: Date.now(),
      name: chatName,
      messages: [...currentChat],
    });
    chatSummaries[chatName] = summarizeChat([...currentChat]);
  } else {
    const latestChat = allChats[0];
    if (latestChat) {
      latestChat.messages = [...currentChat];
      chatSummaries[latestChat.name] = summarizeChat([...currentChat]);
    }
  }

  localStorage.setItem("chatHistory", JSON.stringify(allChats));
  localStorage.setItem("chatSummaries", JSON.stringify(chatSummaries));
  loadChatHistory();
}

// ========== SUMMARIZE ==========
function summarizeChat(chat) {
  let summary = "";
  for (const msg of chat) {
    if (msg.role === "user") summary += `${msg.content}. `;
  }
  return summary.slice(0, 300);
}

// ========== LOAD HISTORY ==========
function loadChatHistory() {
  const chats = JSON.parse(localStorage.getItem("chatHistory")) || [];
  historyList.innerHTML = "";

  chats.forEach(chat => {
    const item = document.createElement("li");
    item.textContent = chat.name;
    item.onclick = () => loadChat(chat);
    historyList.appendChild(item);
  });
}

function loadChat(chat) {
  chatContainer.innerHTML = "";
  currentChat = chat.messages;
  chat.messages.forEach(msg => addMessage(msg.role === "user" ? "user" : "ai", msg.content));
}

// ========== UTIL ==========
function generateChatName(message) {
  const words = message.split(" ");
  return words.slice(0, 3).join(" ") + (words.length > 3 ? "..." : "");
}

