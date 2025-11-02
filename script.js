// ===== CONFIG =====
const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_KEY = "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"; // replace later — don’t expose in production
const MODEL = "meta-llama/llama-3.1-70b-instruct";

// ===== ELEMENTS =====
const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const modal = document.getElementById("welcomeModal");
const closeModal = document.getElementById("closeModal");

// ===== MODAL =====
window.onload = () => {
  if (!localStorage.getItem("nexusModalSeen")) {
    modal.style.display = "flex";
  }
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

  const response = await askAI(text);
  addMessage("ai", response);
}

// ===== AI CALL =====
async function askAI(prompt) {
  try {
    const res = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    console.log("AI raw response:", data);

    return data?.choices?.[0]?.message?.content || "No response from AI.";
  } catch (err) {
    console.error("Error:", err);
    return "Error connecting to AI.";
  }
}

// ===== ADD MESSAGE =====
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerHTML = `<p>${text}</p>`;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

