// ===== CONFIG =====
const HF_MODEL = "meta-llama/Llama-2-7b-chat-hf"; // free public model
const HF_TOKEN = "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"; // free Hugging Face token (safe for browser testing)

// ===== ELEMENTS =====
const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const modal = document.getElementById("welcomeModal");
const closeModal = document.getElementById("closeModal");

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

  const aiResponse = await askLLaMA(currentChat);
  addMessage("ai", aiResponse);

  currentChat.push({ role: "assistant", content: aiResponse });

  saveChat();
  renderHistory();
}

// ===== HUGGING FACE API CALL =====
async function askLLaMA(messages) {
  const lastMessage = messages[messages.length - 1].content;

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: lastMessage,
        parameters: { max_new_tokens: 300 }
      })
    });

    const data = await res.json();
    console.log("HF response:", data);

    // Some models return an array of generations
    if (data?.generated_text) return data.generated_text;

    if (Array.isArray(data?.[0]?.generated_text)) return data[0].generated_text[0];

    return "No response from AI.";
  } catch (err) {
    console.error("AI error:", err);
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

  let name;
  if (chatHistory.length === 0) {
    name = currentChat[0].content.split(" ").slice(0, 4).join(" ") + "...";
  } else {
    name = chatHistory[0].name; // keep same name for ongoing chat
  }

  // Update first chat in history or add new
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
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join(" ")
    .slice(0, 300);
}

// ===== RENDER HISTORY =====
function renderHistory() {
  const historyDiv = document.querySelector(".sidebar .menu");
  if (!historyDiv) return;

  const existing = historyDiv.querySelectorAll(".history-item");
  existing.forEach(e => e.remove());

  chatHistory.forEach(chat => {
    const item = document.createElement("div");
    item.className = "menu-item history-item";
    item.textContent = chat.name;
    item.onclick = () => loadChat(chat);
    historyDiv.appendChild(item);
  });
}

function loadChat(chat) {
  chatArea.innerHTML = "";
  currentChat = [...chat.messages];
  chat.messages.forEach(msg => addMessage(msg.role === "user" ? "user" : "ai", msg.content));
}
