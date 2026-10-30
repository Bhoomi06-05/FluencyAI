const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/";
}
const authHeaders = { Authorization: "Bearer " + token };

const LANG_META = {
  en: { glyph: "A", native: "English", c1: "#ff8a65", c2: "#ffd180" },
  hi: { glyph: "अ", native: "हिन्दी", c1: "#7e57c2", c2: "#b39ddb" },
  mr: { glyph: "म", native: "मराठी", c1: "#26a69a", c2: "#80cbc4" },
  es: { glyph: "Ñ", native: "Español", c1: "#ef5350", c2: "#ffcc80" },
  fr: { glyph: "É", native: "Français", c1: "#42a5f5", c2: "#90caf9" },
  de: { glyph: "Ü", native: "Deutsch", c1: "#546e7a", c2: "#ffca28" },
  ja: { glyph: "あ", native: "日本語", c1: "#ec407a", c2: "#f8bbd0" },
};
const DEFAULT_META = { glyph: "?", native: "", c1: "#17b3a3", c2: "#80cbc4" };

const LEVEL_INFO = {
  beginner: "Bilkul shuruat",
  elementary: "Thoda-thoda aata hai",
  pre_intermediate: "Basic baat-cheet",
  intermediate: "Roz ki baat-cheet",
  upper_intermediate: "Fluent ke kareeb",
  advanced: "Almost fluent",
  professional: "Professional use",
};

const el = (id) => document.getElementById(id);

let profile = null;
let options = null;
let pendingLang = null;
let pendingLevel = "beginner";
let toastTimer = null;

function pretty(value) {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function metaFor(code) {
  return LANG_META[code] || DEFAULT_META;
}

function codeById(id) {
  const lang = options && options.languages.find((l) => l.id === id);
  return lang ? lang.code : "";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}
el("logout-link").addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

function toast(message) {
  const t = el("toast");
  t.textContent = message;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 3500);
}

function errorText(data) {
  if (!data || !data.detail) return "Something went wrong";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(", ");
  return "Something went wrong";
}

// ---------- Render ----------
function renderHello(name) {
  const first = (name || "").trim().split(" ")[0] || "friend";
  el("hello").textContent = "Namaste, " + first + " 👋";
}

function renderContinue() {
  const meta = metaFor(codeById(profile.target_language_id));
  el("continue-glyph").textContent = meta.glyph;
  el("continue-title").textContent =
    profile.target_language_name + " · " + pretty(profile.level);
  el("continue-sub").textContent =
    "Goal: " + pretty(profile.goal) + " · " + profile.daily_target_minutes + " min/day";
  el("chip-lang").textContent = "🌐 " + profile.target_language_name;
  el("chip-level").textContent = "🎯 " + pretty(profile.level);
}

function renderLanguages() {
  const grid = el("lang-grid");
  grid.innerHTML = "";
  options.languages.forEach((lang) => {
    const meta = metaFor(lang.code);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "lang-card";
    card.style.setProperty("--c1", meta.c1);
    card.style.setProperty("--c2", meta.c2);

    if (lang.id === profile.target_language_id) {
      const tag = document.createElement("span");
      tag.className = "lang-tag";
      tag.textContent = "Current";
      card.appendChild(tag);
    }

    const glyph = document.createElement("div");
    glyph.className = "lang-glyph";
    glyph.textContent = meta.glyph;

    const name = document.createElement("b");
    name.textContent = lang.name;

    const native = document.createElement("span");
    native.className = "lang-native";
    native.textContent = meta.native;

    card.append(glyph, name, native);
    card.addEventListener("click", () => openModal(lang));
    grid.appendChild(card);
  });
}

async function loadStreak() {
  try {
    const res = await fetch("/api/progress/streak", { headers: authHeaders });
    if (!res.ok) return;
    const s = await res.json();
    const chip = el("chip-streak");
    chip.textContent = "🔥 " + s.current + (s.current === 1 ? " day" : " days");
    chip.classList.toggle("off", s.current === 0);
  } catch (e) {
    // streak na dikhe to dashboard par asar nahi padta
  }
}

// ---------- Level popup ----------
const modal = el("level-modal");

function closeModal() {
  modal.classList.add("hidden");
}

function openModal(lang) {
  pendingLang = lang;
  pendingLevel = lang.id === profile.target_language_id ? profile.level : "beginner";
  el("level-title").textContent = lang.name + " seekhna shuru karein?";
  el("level-start").textContent = "Start " + lang.name + " →";

  const list = el("level-list");
  list.innerHTML = "";
  options.levels.forEach((level) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "level-opt" + (level === pendingLevel ? " selected" : "");

    const b = document.createElement("b");
    b.textContent = pretty(level);
    const small = document.createElement("small");
    small.textContent = LEVEL_INFO[level] || "";
    btn.append(b, small);

    btn.addEventListener("click", () => {
      pendingLevel = level;
      list.querySelectorAll(".level-opt").forEach((x) => x.classList.remove("selected"));
      btn.classList.add("selected");
    });
    list.appendChild(btn);
  });

  modal.classList.remove("hidden");
}

el("level-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

el("level-start").addEventListener("click", async () => {
  if (!pendingLang) return;
  const btn = el("level-start");
  btn.disabled = true;
  try {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        native_lang: profile.native_lang,
        target_language_id: pendingLang.id,
        level: pendingLevel,
        goal: profile.goal,
        daily_target_minutes: profile.daily_target_minutes,
        learning_style: profile.learning_style,
        correction_pref: profile.correction_pref,
      }),
    });
    if (res.status === 401) return logout();
    const data = await res.json();
    if (!res.ok) {
      toast(errorText(data));
      return;
    }
    profile = data;
    closeModal();
    renderContinue();
    renderLanguages();
    toast("✅ " + data.target_language_name + " select ho gayi! Chat khul rahi hai...");
    setTimeout(() => (window.location.href = "/chat"), 900);
  } catch (e) {
    toast("Server se connect nahi ho pa raha.");
  } finally {
    btn.disabled = false;
  }
});

// ---------- Start ----------
async function init() {
  try {
    const [meRes, obRes, optRes] = await Promise.all([
      fetch("/api/auth/me", { headers: authHeaders }),
      fetch("/api/onboarding/me", { headers: authHeaders }),
      fetch("/api/onboarding/options"),
    ]);
    if (meRes.status === 401 || obRes.status === 401) return logout();
    if (obRes.status === 404) {
      window.location.href = "/onboarding"; // pehli baar: pehle poora setup
      return;
    }
    const me = meRes.ok ? await meRes.json() : {};
    profile = await obRes.json();
    options = await optRes.json();

    renderHello(me.name);
    renderContinue();
    renderLanguages();
  } catch (e) {
    toast("Server se connect nahi ho pa raha. Server chal raha hai?");
    return;
  }
  loadStreak();
}

init();