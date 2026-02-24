/* ══════════════════════════════════════════════════
   LECTRACK – AUTH.JS  (Login & Signup logic — frontend only)
   ══════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────
function showToast(msg, type = "default") {
  const toast = document.getElementById("auth-toast");
  if (!toast) return;
  toast.textContent = "";

  // Icon prefix
  const icon = document.createElement("span");
  icon.textContent = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
  toast.appendChild(icon);

  const text = document.createTextNode(" " + msg);
  toast.appendChild(text);

  toast.className = "auth-toast";
  if (type === "error") toast.classList.add("toast-error");
  if (type === "success") toast.classList.add("toast-success");

  // Force reflow then show
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

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

  // Swap eye icon
  const svg = btn.querySelector("svg");
  if (isHidden) {
    // "eye off" icon
    svg.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    `;
  } else {
    svg.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    `;
  }
}

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
  form.querySelectorAll(".form-input").forEach((el) => {
    el.classList.remove("is-invalid", "is-valid");
  });
  form.querySelectorAll(".field-error").forEach((el) => {
    el.style.display = "none";
  });
  form.querySelectorAll(".form-group").forEach((el) => {
    el.classList.remove("has-error");
  });
}

// ─────────────────────────────────────────
// GOOGLE (frontend stub)
// ─────────────────────────────────────────
function handleGoogle() {
  showToast("Google Sign-In would open here (backend required)", "default");
}

// ─────────────────────────────────────────
// FORGOT PASSWORD (frontend stub)
// ─────────────────────────────────────────
function showForgot(e) {
  e.preventDefault();
  showToast("Password reset link would be sent (backend required)", "default");
}

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const form = document.getElementById("login-form");
  const emailEl = document.getElementById("login-email");
  const pwEl = document.getElementById("login-password");

  clearValidation(form);
  let valid = true;

  // Email check
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailEl.value.trim() || !emailRx.test(emailEl.value.trim())) {
    markInvalid(emailEl, "Please enter a valid email address.");
    valid = false;
  } else {
    markValid(emailEl);
  }

  // Password check
  if (pwEl.value.length < 6) {
    markInvalid(pwEl, "Password must be at least 6 characters.");
    valid = false;
  } else {
    markValid(pwEl);
  }

  if (!valid) {
    showToast("Please fix the errors below.", "error");
    return;
  }

  // Simulate loading state
  const btn = form.querySelector(".btn-auth-submit");
  btn.textContent = "Logging in…";
  btn.disabled = true;

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `Log In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    showToast("Login successful! Redirecting…", "success");
    setTimeout(() => {
      sessionStorage.setItem("lt_logged_in", "1");
      window.location.href = "index.html";
    }, 1200);
  }, 1400);
}

// ─────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────
function handleSignup(e) {
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

  let valid = true;

  // Name
  if (!nameEl.value.trim() || nameEl.value.trim().length < 2) {
    markInvalid(nameEl, "Enter your full name.");
    valid = false;
  } else markValid(nameEl);

  // Email
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailEl.value.trim() || !emailRx.test(emailEl.value.trim())) {
    markInvalid(emailEl, "Enter a valid email address.");
    valid = false;
  } else markValid(emailEl);

  // Branch
  if (!branchEl.value) {
    markInvalid(branchEl, "Select your branch.");
    valid = false;
  } else markValid(branchEl);

  // Class
  if (!classEl.value) {
    markInvalid(classEl, "Select your year/class.");
    valid = false;
  } else markValid(classEl);

  // Division
  if (!divEl.value.trim()) {
    markInvalid(divEl, "Enter your division.");
    valid = false;
  } else markValid(divEl);

  // Roll number
  if (!rollEl.value.trim()) {
    markInvalid(rollEl, "Enter your roll number.");
    valid = false;
  } else markValid(rollEl);

  // PRN
  if (!prnEl.value.trim() || prnEl.value.trim().length < 8) {
    markInvalid(prnEl, "Enter a valid PRN number.");
    valid = false;
  } else markValid(prnEl);

  // Password
  if (pwEl.value.length < 8) {
    markInvalid(pwEl, "Password must be at least 8 characters.");
    valid = false;
  } else markValid(pwEl);

  // Confirm
  if (confEl.value !== pwEl.value) {
    markInvalid(confEl, "Passwords do not match.");
    valid = false;
  } else if (confEl.value.length >= 8) markValid(confEl);

  // Terms
  if (!termsEl.checked) {
    showToast("Please accept the Terms of Service to continue.", "error");
    valid = false;
  }

  if (!valid) {
    if (termsEl.checked)
      showToast("Please fix the highlighted fields.", "error");
    return;
  }

  // Simulate loading
  const btn = form.querySelector(".btn-auth-submit");
  btn.textContent = "Creating account…";
  btn.disabled = true;

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `Create Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    showToast("Account created! Redirecting to login…", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }, 1600);
}
