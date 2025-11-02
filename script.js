// === CONFIG ===
const GEMINI_API_KEY = "AIzaSyD-rS7ZrGdQcDQ21rHVGnpLS9R6p1FNKWE"; // visible for testing
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + GEMINI_API_KEY;

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
async function askAI(prompt) {
    try {
        const res = await fetch(GEMINI_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
    } catch (err) {
        console.error(err);
        return "Error calling Gemini API.";
    }
}

// === SEND MESSAGE ===
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

    // Build prompt with context & topic summaries
    const topicSummary = chat.topics.map(t => `${t.name}: ${t.summary}`).join("\n");
    const context = chat.messages.map(m => `${m.role}: ${m.text}`).join("\n");

    const prompt = `You are a co-founder AI for the user. Respond casually but professionally. 
Use past context when relevant. Topics: ${topicSummary}\nConversation:\n${context}\nUser just said: ${text}`;

    const aiText = await askAI(prompt);
    chat.messages.push({ role: "ai", text: aiText });
    addMessage("ai", aiText);

    // Update topics example
    if (text.toLowerCase().includes("website") && !chat.topics.some(t => t.name === "website")) {
        chat.topics.push({ name: "website", summary: "User wants a website; AI suggests ideas." });
    }

    saveChats();
    renderHistory();
}

// === INIT ===
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
window.addEventListener("load", renderHistory);
