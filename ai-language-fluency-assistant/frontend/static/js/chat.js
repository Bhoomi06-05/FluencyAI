const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/";
}

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const modeSelect = document.getElementById("mode-select");
const newChatBtn = document.getElementById("new-chat");
const infoEl = document.getElementById("chat-info");

let conversationId = null;
let sending = false;

const GREETINGS = {
  friendly: "Hi! 👋 Main tumhara AI dost hoon. Kuch bhi likho aur baat shuru karte hain.",
  teacher: "Hello! 👩‍🏫 Main tumhara teacher hoon. Ek sentence likho, main galtiyan samjhaunga.",
  practice: "Chalo practice karte hain! 🎯 Likho 'start' aur main pehla exercise dunga.",
  interview: "Interview mode 💼 Likho 'start' aur main pehla sawal puchunga.",
  roleplay: "Roleplay mode 🎭 Likho kaunsi situation chahiye (hotel, restaurant, airport...).",
  free_chat: "Free chat 💬 Jo mann kare us topic pe baat karo.",
};

function pretty(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}
document.getElementById("logout-link").addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

function scrollDown() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.textContent = text; // textContent: HTML inject nahi hota
  messagesEl.appendChild(div);
  scrollDown();
  return div;
}

function addTyping() {
  const div = document.createElement("div");
  div.className = "msg ai typing";
  div.innerHTML = "<span></span><span></span><span></span>";
  messagesEl.appendChild(div);
  scrollDown();
  return div;
}

function errorText(data) {
  if (!data || !data.detail) return "Something went wrong";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(", ");
  return "Something went wrong";
}

function startNewChat() {
  conversationId = null;
  messagesEl.innerHTML = "";
  addMessage("ai", GREETINGS[modeSelect.value] || GREETINGS.friendly);
  input.focus();
}

modeSelect.addEventListener("change", startNewChat); // mode sirf nayi chat mein lagta hai
newChatBtn.addEventListener("click", startNewChat);

async function loadInfo() {
  try {
    const res = await fetch("/api/onboarding/me", {
      headers: { Authorization: "Bearer " + token },
    });
    if (res.status === 401) return logout();
    if (res.status === 404) {
      window.location.href = "/onboarding";
      return;
    }
    const me = await res.json();
    infoEl.textContent = me.target_language_name + " · " + pretty(me.level);
  } catch (e) {
    infoEl.textContent = "Offline?";
  }
}

async function sendMessage(text) {
  sending = true;
  sendBtn.disabled = true;
  addMessage("user", text);
  const typing = addTyping();

  try {
    const res = await fetch("/api/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        message: text,
        conversation_id: conversationId,
        mode: modeSelect.value,
      }),
    });
    if (res.status === 401) return logout();
    const data = await res.json();
    typing.remove();

    if (!res.ok) {
      if (res.status === 400 && typeof data.detail === "string" && data.detail.includes("onboarding")) {
        window.location.href = "/onboarding";
        return;
      }
      addMessage("error", errorText(data));
      return;
    }
    conversationId = data.conversation_id;
    addMessage("ai", data.reply);
  } catch (e) {
    typing.remove();
    addMessage("error", "Server se connect nahi ho pa raha. Server chal raha hai?");
  } finally {
    sending = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || sending) return;
  input.value = "";
  input.style.height = "auto";
  sendMessage(text);
});

// Enter = send, Shift+Enter = nayi line
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// Textarea text ke saath badhe
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 120) + "px";
});

loadInfo();
startNewChat();