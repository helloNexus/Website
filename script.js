// DOM
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const menuItems = document.querySelectorAll(".menu-item");
const modal = document.getElementById("welcomeModal");
const closeBtn = document.getElementById("closeModal");

let currentTab = "chat";
let currentSession = { messages: [], topics: [], title: "" };
let pastConversations = JSON.parse(localStorage.getItem("nexusConvos")) || [];

// ---- MODAL ----
if (!localStorage.getItem("nexusModalSeen")) modal.style.display = "flex";
closeBtn.addEventListener("click", () => { modal.style.display="none"; localStorage.setItem("nexusModalSeen","true"); });

// ---- TAB SWITCHING ----
menuItems.forEach(item=>{
  item.addEventListener("click",()=>{
    menuItems.forEach(i=>i.classList.remove("active"));
    item.classList.add("active");
    if(item.dataset.tab){ currentTab=item.dataset.tab; renderTab(); }
  });
});

// ---- RENDER TAB ----
function renderTab(){
  chatArea.innerHTML="";
  if(currentTab==="chat"){
    currentSession.messages.forEach(m=>addMessage(m.text, m.role));
  } else if(currentTab==="history"){
    if(pastConversations.length===0){ chatArea.innerHTML="<p style='color:#888'>No saved conversations yet.</p>"; return; }
    pastConversations.forEach((c,i)=>{
      const btn=document.createElement("button");
      btn.textContent=c.title||`Conversation ${i+1}`;
      btn.style.display="block"; btn.style.margin="10px 0";
      btn.addEventListener("click",()=>loadPastConvo(c));
      chatArea.appendChild(btn);
    });
  }
}

// ---- ADD MESSAGE ----
function addMessage(text, role){
  const msg=document.createElement("div");
  msg.classList.add("message",role==="user"?"user":"system");
  msg.textContent=text;
  chatArea.appendChild(msg);
  chatArea.scrollTop=chatArea.scrollHeight;
}

// ---- SEND MESSAGE ----
sendBtn.addEventListener("click",()=>handleUserInput());
userInput.addEventListener("keypress",e=>{ if(e.key==="Enter") handleUserInput(); });

async function handleUserInput(){
  const text=userInput.value.trim(); if(!text) return;
  userInput.value="";
  addMessage(text,"user");
  currentSession.messages.push({role:"user",text});
  if(!currentSession.title) currentSession.title = generateTitleFromText(text);

  const aiReply = await generateAIReply(text,currentSession);
  addMessage(aiReply.text,"system");
  currentSession.messages.push({role:"ai",text:aiReply.text});
  currentSession.topics = aiReply.topics;

  // Auto-save to localStorage (optional, safe)
  saveSessionAuto();
}

// ---- LOAD PAST CONVO ----
function loadPastConvo(convo){
  chatArea.innerHTML="";
  currentSession = {...convo};
  currentSession.messages.forEach(m=>addMessage(m.text,m.role));
  currentTab="chat";
  menuItems.forEach(i=>i.classList.remove("active"));
  document.querySelector('.menu-item[data-tab="chat"]').classList.add("active");
}

// ---- GENERATE TITLE ----
function generateTitleFromText(text){
  return text.split(" ").slice(0,5).join(" ").replace(/[^a-zA-Z0-9 ]/g,"") + "...";
}

// ---- AI RESPONSE PLACEHOLDER ----
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

  // ===== Replace this with your server endpoint calling Gemini API =====
  return new Promise(resolve=>{
    setTimeout(()=>{
      const newTopics = [...session.topics];
      if(userText.toLowerCase().includes("website") && !newTopics.some(t=>t.name==="website")){
        newTopics.push({name:"website",summary:"User wants a website for business; AI suggests ideas and expansion."});
      }
      resolve({ text:`Here are a few ideas for "${userText.slice(0,30)}"...`, topics:newTopics });
    },800);
  });
}

// ---- AUTO-SAVE SESSION ----
function saveSessionAuto(){
  const index = pastConversations.findIndex(c=>c.id===currentSession.id);
  if(index>-1){
    pastConversations[index] = {...currentSession};
  } else {
    const newConvo = {...currentSession,id:new Date().toISOString()};
    pastConversations.push(newConvo);
  }
  localStorage.setItem("nexusConvos",JSON.stringify(pastConversations));
}

// ---- INITIAL RENDER ----
renderTab();

