const modal = document.getElementById("auth-modal");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const messageEl = document.getElementById("auth-message");
const tabs = document.querySelectorAll(".tab");

function showMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = "auth-message " + type;
}

// ---------- Tabs ----------
function selectTab(name) {
  const isLogin = name === "login";
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  showMessage("");
}
tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab.dataset.tab)));

// ---------- Modal ----------
function openAuth(tabName = "login") {
  selectTab(tabName);
  modal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}
function closeAuth() {
  modal.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

document.querySelectorAll("[data-open-auth]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openAuth(el.dataset.openAuth || "login");
  });
});
document.getElementById("modal-close").addEventListener("click", closeAuth);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeAuth(); // bahar click karne par band
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAuth();
});

// ---------- API calls ----------
// FastAPI ke errors alag shape mein aate hain, unko padhne layak text banao
function errorText(data) {
  if (!data || !data.detail) return "Something went wrong";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(", ");
  return "Something went wrong";
}

// Login ke baad: onboarding ho chuka hai to /chat, nahi to /onboarding
async function goAfterAuth(token) {
  try {
    const res = await fetch("/api/onboarding/me", {
      headers: { Authorization: "Bearer " + token },
    });
      window.location.href = res.ok ? "/dashboard" : "/onboarding";
  } catch (e) {
    window.location.href = "/onboarding";
  }
}

async function submitAuth(url, payload, button) {
  button.disabled = true;
  showMessage("Please wait...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(errorText(data), "error");
      return;
    }
    localStorage.setItem("token", data.access_token);
    showMessage("Success! Redirecting...", "success");
    await goAfterAuth(data.access_token);
  } catch (err) {
    showMessage("Server se connect nahi ho pa raha. Server chal raha hai?", "error");
  } finally {
    button.disabled = false;
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(loginForm);
  submitAuth(
    "/api/auth/login",
    { email: form.get("email"), password: form.get("password") },
    loginForm.querySelector("button[type=submit]")
  );
});

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(registerForm);
  submitAuth(
    "/api/auth/register",
    {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    },
    registerForm.querySelector("button[type=submit]")
  );
});

// ---------- Cookie banner ----------
const cookieBanner = document.getElementById("cookie-banner");
let cookieChoice = null;
try {
  cookieChoice = localStorage.getItem("cookieChoice");
} catch (e) {}

if (!cookieChoice) cookieBanner.classList.remove("hidden");

function saveCookieChoice(value) {
  try {
    localStorage.setItem("cookieChoice", value);
  } catch (e) {}
  cookieBanner.classList.add("hidden");
}
document.getElementById("cookie-accept").addEventListener("click", () => saveCookieChoice("accepted"));
document.getElementById("cookie-decline").addEventListener("click", () => saveCookieChoice("declined"));