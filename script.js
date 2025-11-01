// === ELEMENTS ===
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const modal = document.getElementById("welcomeModal");
const closeBtn = document.getElementById("closeModal");

// === SESSION DATA ===
let currentSession = { messages: [], topics: [], title: "" };
let pastConversations = JSON.parse(localStorage.getItem("nexusConvos")) || [];

// ⚠️ GEMINI API KEY VISIBLE FOR TESTING ONLY
const GEMINI_KEY = "AIzaSyD-rS7ZrGdQcDQ21rHVGnpLS9R6p1FNKWE";

// === MODAL ===
if(!localStorage.getItem("nexusModalSeen")) modal.style.display = "flex";
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  localStorage.setItem("nexusModalSeen","true");
});

// === EVENT LISTENERS ===
sendBtn.addEventListener("click", handleUserInput);
userInput.addEventListener("keypress", e => { if(e.key==="Enter") handleUserInput(); });

// === SEND USER INPUT ===
async function handleUserInput(){
  const text = userInput.value.trim();
  if(!text) return;
  userInput.value = "";
  addMessage(text,"user");
  currentSession.messages.push({role:"user",text});
  
  // Generate conversation title from first message
  if(!currentSession.title) currentSession.title = generateTitleFromText(text);

  const aiReply = await generateAIReply(text,currentSession);
  addMessage(aiReply.text,"system");
  currentSession.messages.push({role:"ai",text:aiReply.text});
  currentSession.topics = aiReply.topics;

  saveSession();
}

// === ADD MESSAGE TO CHAT AREA ===
function addMessage(text,role){
  const div = document.createElement("div");
  div.classList.add("message", role==="user"?"user":"system");
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// === SAVE/LOAD ===
function saveSession(){
  const index = pastConversations.findIndex(c=>c.id===currentSession.id);
  if(index>-1){
    pastConversations[index] = {...currentSession};
  } else {
    pastConversations.push({...currentSession, id: new Date().toISOString()});
  }
  localStorage.setItem("nexusConvos", JSON.stringify(pastConversations));
}

function generateTitleFromText(text){
  return text.split(" ").slice(0,5).join(" ").replace(/[^a-zA-Z0-9 ]/g,"") + "...";
}

// === AI REPLY WITH GEMINI ===
async function generateAIReply(userText, session){
  const context = session.messages.map(m=>`${m.role}: ${m.text}`).join("\n");
  const topicSummary = session.topics.map(t=>`Topic: ${t.name}, Summary: ${t.summary}`).join("\n");

  const prompt = `
You are the user's co-founder/co-writer.
User message: ${userText}
Conversation history:
${context}
Topic summaries:
${topicSummary}
Respond naturally, giving professional advice, and update topics with key info.
`;

  try {
    const res = await fetch("https://api.gemini.com/v1/completions",{ // Replace with actual Gemini endpoint
      method:"POST",
      headers:{
        "Authorization": `Bearer ${GEMINI_KEY}`,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({ prompt, max_tokens:300 })
    });
    const data = await res.json();

    // Update topics example
    let newTopics = [...session.topics];
    if(userText.toLowerCase().includes("website") && !newTopics.some(t=>t.name==="website")){
      newTopics.push({name:"website", summary:"User wants a website; AI suggests ideas and expansion."});
    }

    return { text: data.choices?.[0]?.text || "Here's an idea...", topics: newTopics };
  } catch(err){
    console.error(err);
    return { text:"Error calling Gemini API", topics: session.topics };
  }
}

// === INITIALIZATION ===
console.log("Nexus JS loaded. Ready for chat.");

