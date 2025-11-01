const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");

// ---- CHAT FUNCTIONALITY ----
function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.classList.add("message", type);
  msg.textContent = text;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

sendBtn.addEventListener("click", () => {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, "user");
  userInput.value = "";

  // Placeholder AI response
  setTimeout(() => {
    addMessage("🤖 Nexus says: “This is a placeholder response.”", "system");
  }, 500);
});

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// ---- MODAL FUNCTIONALITY WITH LOCALSTORAGE ----
const modal = document.getElementById("welcomeModal");
const closeBtn = document.getElementById("closeModal");

// Show modal only if not seen before
if (!localStorage.getItem("nexusModalSeen")) {
  modal.style.display = "flex";
}

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  localStorage.setItem("nexusModalSeen", "true");
});
