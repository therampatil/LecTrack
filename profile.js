/* ══════════════════════════════════════════════════
   LECTRACK – PROFILE.JS
   ══════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────
// TOAST (reuse auth pattern)
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
// AVATAR
// ─────────────────────────────────────────
function triggerAvatarUpload() {
  document.getElementById("avatar-upload").click();
}

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Please upload a valid image file.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const circle = document.getElementById("avatar-circle");
    // Replace initials with the image
    circle.innerHTML = `<img src="${ev.target.result}" alt="Avatar"/>`;
    showToast("Profile picture updated!", "success");
  };
  reader.readAsDataURL(file);
}

// ─────────────────────────────────────────
// EDIT PERSONAL INFO
// ─────────────────────────────────────────
let infoEditing = false;

function toggleEditInfo() {
  infoEditing = !infoEditing;
  const ids = [
    "field-name",
    "field-email",
    "field-phone",
    "field-prn",
    "field-roll",
    "field-division",
  ];
  const actionsEl = document.getElementById("info-form-actions");
  const editBtn = document.getElementById("edit-info-btn");

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !infoEditing;
  });

  if (infoEditing) {
    actionsEl.classList.remove("info-form-actions--hidden");
    editBtn.classList.add("editing");
    editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Editing`;
  } else {
    actionsEl.classList.add("info-form-actions--hidden");
    editBtn.classList.remove("editing");
    editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit`;
  }
}

function cancelEditInfo() {
  infoEditing = true; // trick toggleEditInfo into turning editing off
  toggleEditInfo();
}

function saveInfo(e) {
  e.preventDefault();
  const name = document.getElementById("field-name").value.trim();
  if (!name || name.length < 2) {
    showToast("Please enter a valid full name.", "error");
    return;
  }
  // Update display name and initials
  document.getElementById("display-name").textContent = name;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const initialsEl = document.getElementById("avatar-initials");
  if (initialsEl) initialsEl.textContent = initials;

  const prn = document.getElementById("field-prn").value.trim();
  document.getElementById("display-prn").textContent = "PRN: " + (prn || "—");

  infoEditing = true;
  toggleEditInfo();
  showToast("Personal information saved!", "success");
}

// ─────────────────────────────────────────
// EDIT ACADEMIC INFO
// ─────────────────────────────────────────
let academicEditing = false;

const BRANCH_LABELS = {
  computer: "Computer Engineering",
  it: "Information Technology",
  entc: "Electronics & Telecom",
  mechanical: "Mechanical Engineering",
  civil: "Civil Engineering",
  electrical: "Electrical Engineering",
  aids: "AI & Data Science",
  aiml: "AI & Machine Learning",
};
const YEAR_LABELS = {
  fe: "First Year",
  se: "Second Year",
  te: "Third Year",
  be: "Final Year",
};

function toggleEditAcademic() {
  academicEditing = !academicEditing;
  const ids = [
    "field-branch",
    "field-year",
    "field-college",
    "field-acad-year",
  ];
  const actionsEl = document.getElementById("academic-form-actions");
  const editBtn = document.getElementById("edit-academic-btn");

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !academicEditing;
  });

  if (academicEditing) {
    actionsEl.classList.remove("info-form-actions--hidden");
    editBtn.classList.add("editing");
    editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Editing`;
  } else {
    actionsEl.classList.add("info-form-actions--hidden");
    editBtn.classList.remove("editing");
    editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit`;
  }
}

function cancelEditAcademic() {
  academicEditing = true;
  toggleEditAcademic();
}

function saveAcademic(e) {
  e.preventDefault();
  const branchVal = document.getElementById("field-branch").value;
  const yearVal = document.getElementById("field-year").value;

  // Update sidebar badges
  const branchBadge = document.getElementById("display-branch");
  const yearBadge = document.getElementById("display-year");
  if (branchBadge)
    branchBadge.textContent = BRANCH_LABELS[branchVal] || branchVal;
  if (yearBadge) yearBadge.textContent = YEAR_LABELS[yearVal] || yearVal;

  academicEditing = true;
  toggleEditAcademic();
  showToast("Academic details saved!", "success");
}

// ─────────────────────────────────────────
// PASSWORD
// ─────────────────────────────────────────
function togglePwField(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";

  const svg = btn.querySelector("svg");
  if (svg) {
    if (isHidden) {
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
}

function checkStrengthProfile(value) {
  const bar = document.getElementById("profile-pw-fill");
  const label = document.getElementById("profile-pw-label");
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

function savePassword(e) {
  e.preventDefault();
  const cur = document.getElementById("field-cur-pw").value;
  const nw = document.getElementById("field-new-pw").value;
  const conf = document.getElementById("field-conf-pw").value;

  if (!cur) {
    showToast("Please enter your current password.", "error");
    return;
  }
  if (nw.length < 8) {
    showToast("New password must be at least 8 characters.", "error");
    return;
  }
  if (nw !== conf) {
    showToast("New passwords do not match.", "error");
    return;
  }

  const btn = document.querySelector("#password-form .btn-save");
  btn.textContent = "Updating…";
  btn.disabled = true;

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2l-3 3m-14.5 14.5L1 22l2.5-2.5M14 5l5 5M3.5 17.5l-1-1 9-9 1 1"/></svg> Update Password`;
    document.getElementById("field-cur-pw").value = "";
    document.getElementById("field-new-pw").value = "";
    document.getElementById("field-conf-pw").value = "";
    // reset strength bar
    const bar = document.getElementById("profile-pw-fill");
    const label = document.getElementById("profile-pw-label");
    if (bar) {
      bar.style.width = "0";
      bar.style.background = "transparent";
    }
    if (label) label.textContent = "";
    showToast("Password updated successfully!", "success");
  }, 1200);
}

// ─────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────
function confirmDelete() {
  document.getElementById("delete-modal").classList.add("open");
}
function closeDeleteModal(e) {
  if (e.target === document.getElementById("delete-modal")) {
    document.getElementById("delete-modal").classList.remove("open");
  }
}
function closeDeleteModalDirect() {
  document.getElementById("delete-modal").classList.remove("open");
}
function executeDelete() {
  showToast("Account deleted. Redirecting…", "error");
  setTimeout(() => {
    window.location.href = "signup.html";
  }, 1800);
}

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
function handleLogout(e) {
  e.preventDefault();
  sessionStorage.removeItem("lt_logged_in");
  showToast("Logged out. See you next time! 👋", "default");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1200);
}
