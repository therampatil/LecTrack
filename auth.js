/* ══════════════════════════════════════════════════
   LECTRACK – AUTH.JS  (Supabase login & signup)
   ══════════════════════════════════════════════════ */

"use strict";

import { supabase } from "./supabase.js";

// ─────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────
function showToast(msg, type = "default") {
  const toast = document.getElementById("auth-toast");
  if (!toast) return;
  toast.textContent = "";
  const icon = document.createElement("span");
  icon.textContent = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
  toast.appendChild(icon);
  toast.appendChild(document.createTextNode(" " + msg));
  toast.className = "auth-toast";
  if (type === "error") toast.classList.add("toast-error");
  if (type === "success") toast.classList.add("toast-success");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => toast.classList.add("show")),
  );
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3500);
}

// ─────────────────────────────────────────
// PASSWORD VISIBILITY TOGGLE
// ─────────────────────────────────────────
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  btn.classList.toggle("active", isHidden);
  const svg = btn.querySelector("svg");
  if (isHidden) {
    svg.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    svg.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>`;
  }
}
window.togglePw = togglePw;

// ─────────────────────────────────────────
// PASSWORD STRENGTH (signup)
// ─────────────────────────────────────────
function checkStrength(value) {
  const bar = document.getElementById("pw-strength-fill");
  const label = document.getElementById("pw-strength-label");
  if (!bar || !label) return;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const levels = [
    { pct: "0%", color: "transparent", text: "" },
    { pct: "25%", color: "#FF3B3B", text: "Weak" },
    { pct: "50%", color: "#FF7A2F", text: "Fair" },
    { pct: "75%", color: "#FFE234", text: "Good" },
    { pct: "100%", color: "#00C27A", text: "Strong 🔥" },
  ];
  const lvl = levels[score];
  bar.style.width = lvl.pct;
  bar.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.color === "#FFE234" ? "#444" : lvl.color;
}
window.checkStrength = checkStrength;

// ─────────────────────────────────────────
// FIELD VALIDATION HELPERS
// ─────────────────────────────────────────
function markInvalid(input, msg) {
  input.classList.add("is-invalid");
  input.classList.remove("is-valid");
  const group = input.closest(".form-group");
  if (group) {
    group.classList.add("has-error");
    let err = group.querySelector(".field-error");
    if (!err) {
      err = document.createElement("span");
      err.className = "field-error";
      input.parentElement.insertAdjacentElement("afterend", err);
    }
    err.textContent = msg;
    err.style.display = "block";
  }
}

function markValid(input) {
  input.classList.remove("is-invalid");
  input.classList.add("is-valid");
  const group = input.closest(".form-group");
  if (group) {
    group.classList.remove("has-error");
    const err = group.querySelector(".field-error");
    if (err) err.style.display = "none";
  }
}

function clearValidation(form) {
  form
    .querySelectorAll(".form-input")
    .forEach((el) => el.classList.remove("is-invalid", "is-valid"));
  form
    .querySelectorAll(".field-error")
    .forEach((el) => (el.style.display = "none"));
  form
    .querySelectorAll(".form-group")
    .forEach((el) => el.classList.remove("has-error"));
}

// ─────────────────────────────────────────
// GOOGLE OAuth
// ─────────────────────────────────────────
async function handleGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/index.html" },
  });
  if (error) showToast(error.message, "error");
}
window.handleGoogle = handleGoogle;

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────
async function showForgot(e) {
  e.preventDefault();
  const emailEl = document.getElementById("login-email");
  const email = emailEl ? emailEl.value.trim() : "";
  if (!email) {
    showToast(
      "Enter your email above first, then click Forgot password.",
      "error",
    );
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/login.html",
  });
  if (error) {
    showToast(error.message, "error");
  } else {
    showToast("Password reset email sent! Check your inbox. 📧", "success");
  }
}
window.showForgot = showForgot;

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const form = document.getElementById("login-form");
  const emailEl = document.getElementById("login-email");
  const pwEl = document.getElementById("login-password");
  const btn = form.querySelector(".btn-auth-submit");

  clearValidation(form);
  let valid = true;

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailEl.value.trim() || !emailRx.test(emailEl.value.trim())) {
    markInvalid(emailEl, "Please enter a valid email address.");
    valid = false;
  } else markValid(emailEl);

  if (pwEl.value.length < 6) {
    markInvalid(pwEl, "Password must be at least 6 characters.");
    valid = false;
  } else markValid(pwEl);

  if (!valid) {
    showToast("Please fix the errors below.", "error");
    return;
  }

  btn.textContent = "Logging in…";
  btn.disabled = true;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailEl.value.trim(),
    password: pwEl.value,
  });

  btn.disabled = false;
  btn.innerHTML = `Log In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

  if (error) {
    showToast(error.message, "error");
    return;
  }

  sessionStorage.setItem("lt_logged_in", "1");
  sessionStorage.setItem("lt_user_id", data.user.id);

  showToast("Login successful! Redirecting…", "success");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 900);
}
window.handleLogin = handleLogin;

// ─────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  const form = document.getElementById("signup-form");
  clearValidation(form);

  const get = (id) => document.getElementById(id);
  const nameEl = get("su-name");
  const emailEl = get("su-email");
  const branchEl = get("su-branch");
  const classEl = get("su-class");
  const divEl = get("su-division");
  const rollEl = get("su-roll");
  const prnEl = get("su-prn");
  const pwEl = get("su-password");
  const confEl = get("su-confirm");
  const termsEl = get("su-terms");
  const btn = form.querySelector(".btn-auth-submit");

  let valid = true;

  if (!nameEl.value.trim() || nameEl.value.trim().length < 2) {
    markInvalid(nameEl, "Enter your full name.");
    valid = false;
  } else markValid(nameEl);

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailEl.value.trim() || !emailRx.test(emailEl.value.trim())) {
    markInvalid(emailEl, "Enter a valid email address.");
    valid = false;
  } else markValid(emailEl);

  if (!branchEl.value) {
    markInvalid(branchEl, "Select your branch.");
    valid = false;
  } else markValid(branchEl);

  if (!classEl.value) {
    markInvalid(classEl, "Select your year/class.");
    valid = false;
  } else markValid(classEl);

  if (!divEl.value.trim()) {
    markInvalid(divEl, "Enter your division.");
    valid = false;
  } else markValid(divEl);

  if (!rollEl.value.trim()) {
    markInvalid(rollEl, "Enter your roll number.");
    valid = false;
  } else markValid(rollEl);

  if (!prnEl.value.trim() || prnEl.value.trim().length < 8) {
    markInvalid(prnEl, "Enter a valid PRN number.");
    valid = false;
  } else markValid(prnEl);

  if (pwEl.value.length < 8) {
    markInvalid(pwEl, "Password must be at least 8 characters.");
    valid = false;
  } else markValid(pwEl);

  if (confEl.value !== pwEl.value) {
    markInvalid(confEl, "Passwords do not match.");
    valid = false;
  } else if (confEl.value.length >= 8) markValid(confEl);

  if (!termsEl.checked) {
    showToast("Please accept the Terms of Service to continue.", "error");
    valid = false;
  }

  if (!valid) {
    if (termsEl.checked)
      showToast("Please fix the highlighted fields.", "error");
    return;
  }

  btn.textContent = "Creating account…";
  btn.disabled = true;

  // 1. Create auth user
  const { data, error } = await supabase.auth.signUp({
    email: emailEl.value.trim(),
    password: pwEl.value,
    options: { data: { full_name: nameEl.value.trim() } },
  });

  btn.disabled = false;
  btn.innerHTML = `Create Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

  if (error) {
    showToast(error.message, "error");
    return;
  }

  // 2. Insert profile row into `profiles` table
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    full_name: nameEl.value.trim(),
    email: emailEl.value.trim(),
    branch: branchEl.value,
    year: classEl.value,
    division: divEl.value.trim(),
    roll_number: rollEl.value.trim(),
    prn: prnEl.value.trim(),
    college: "",
    academic_year: "",
    phone: "",
  });

  if (profileError) console.warn("Profile insert error:", profileError.message);

  showToast(
    "Account created! Check your email to verify, then log in. 🎉",
    "success",
  );
  setTimeout(() => {
    window.location.href = "login.html";
  }, 2200);
}
window.handleSignup = handleSignup;

// ─────────────────────────────────────────
// BOOT – redirect if already logged in
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    // Already logged in → save to sessionStorage and go to dashboard
    sessionStorage.setItem("lt_logged_in", "1");
    sessionStorage.setItem("lt_user_id", session.user.id);

    // Compute initials from metadata
    const name =
      session.user.user_metadata?.full_name || session.user.email || "";
    const initials =
      name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";
    sessionStorage.setItem("lt_initials", initials);

    window.location.replace("index.html");
  }
});
