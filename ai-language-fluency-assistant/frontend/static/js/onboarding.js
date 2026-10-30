const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/";
}

const form = document.getElementById("onb-form");
const submitBtn = document.getElementById("onb-submit");
const messageEl = document.getElementById("onb-message");

function showMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = "auth-message " + type;
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}
document.getElementById("logout-link").addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

function pretty(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fillSelect(id, items, getValue, getLabel, selected) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  items.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = getValue(item);
    opt.textContent = getLabel(item);
    if (String(opt.value) === String(selected)) opt.selected = true;
    select.appendChild(opt);
  });
}

function errorText(data) {
  if (!data || !data.detail) return "Something went wrong";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(", ");
  return "Something went wrong";
}

async function init() {
  try {
    const res = await fetch("/api/onboarding/options");
    const opts = await res.json();

    fillSelect("native_lang", opts.languages, (l) => l.code, (l) => l.name, "hi");
    fillSelect("target_language_id", opts.languages, (l) => l.id, (l) => l.name, 1);
    fillSelect("level", opts.levels, (v) => v, pretty, "beginner");
    fillSelect("goal", opts.goals, (v) => v, pretty, "general_conversation");
    fillSelect("learning_style", opts.learning_styles, (v) => v, pretty, "mixed");
  } catch (err) {
    showMessage("Options load nahi hue. Server chal raha hai?", "error");
    return;
  }

  // Agar user pehle onboarding kar chuka hai, to purani choices bhar do
  try {
    const res = await fetch("/api/onboarding/me", {
      headers: { Authorization: "Bearer " + token },
    });
    if (res.status === 401) return logout();
    if (res.ok) {
      const me = await res.json();
      document.getElementById("native_lang").value = me.native_lang;
      document.getElementById("target_language_id").value = me.target_language_id;
      document.getElementById("level").value = me.level;
      document.getElementById("goal").value = me.goal;
      document.getElementById("daily_target_minutes").value = me.daily_target_minutes;
      document.getElementById("learning_style").value = me.learning_style;
      document.getElementById("correction_pref").value = me.correction_pref;
    }
  } catch (err) {
    // prefill na ho to koi baat nahi
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  showMessage("Saving...");

  const payload = {
    native_lang: document.getElementById("native_lang").value,
    target_language_id: Number(document.getElementById("target_language_id").value),
    level: document.getElementById("level").value,
    goal: document.getElementById("goal").value,
    daily_target_minutes: Number(document.getElementById("daily_target_minutes").value),
    learning_style: document.getElementById("learning_style").value,
    correction_pref: document.getElementById("correction_pref").value,
    age_range: document.getElementById("age_range").value,
  };

  try {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) return logout();
    const data = await res.json();
    if (!res.ok) {
      showMessage(errorText(data), "error");
      return;
    }
    showMessage("Saved! Chat page par ja rahe hain... 🎉", "success");
    setTimeout(() => (window.location.href = "/chat"), 700);
  } catch (err) {
    showMessage("Server se connect nahi ho pa raha. Server chal raha hai?", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

init();