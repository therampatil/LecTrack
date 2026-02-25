/* ══════════════════════════════════════════════════
   LECTRACK – PROFILE.JS  (Supabase-connected)
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
// BRANCH / YEAR LABELS
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// INIT – Load profile on page load
// ─────────────────────────────────────────
async function initProfile() {
  // Check auth session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.replace("login.html");
    return;
  }

  const userId = session.user.id;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    showToast("Could not load profile. Please try again.", "error");
    return;
  }

  // Populate sidebar
  const name = profile.full_name || session.user.email;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  document.getElementById("avatar-initials").textContent = initials;
  document.getElementById("display-name").textContent = name;
  document.getElementById("display-prn").textContent =
    "PRN: " + (profile.prn || "—");
  document.getElementById("display-branch").textContent =
    BRANCH_LABELS[profile.branch] || profile.branch || "—";
  document.getElementById("display-year").textContent =
    YEAR_LABELS[profile.year] || profile.year || "—";

  // Also update nav avatar initials on index.html if stored
  sessionStorage.setItem("lt_initials", initials);
  sessionStorage.setItem("lt_logged_in", "1");
  sessionStorage.setItem("lt_user_id", userId);

  // Apply avatar image if available
  if (profile.avatar_url) {
    applyAvatarUrl(profile.avatar_url);
  }

  // Populate Personal Info fields
  setValue("field-name", profile.full_name);
  setValue("field-email", profile.email || session.user.email);
  setValue("field-phone", profile.phone);
  setValue("field-prn", profile.prn);
  setValue("field-roll", profile.roll_number);
  setValue("field-division", profile.division);

  // Populate Academic fields
  setSelect("field-branch", profile.branch);
  setSelect("field-year", profile.year);
  setValue("field-college", profile.college);
  setValue("field-acad-year", profile.academic_year);
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}
function setSelect(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.value = val;
}

// ─────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────
function triggerAvatarUpload() {
  document.getElementById("avatar-upload").click();
}
window.triggerAvatarUpload = triggerAvatarUpload;

async function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Please upload a valid image file.", "error");
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const ext = file.name.split(".").pop();
  const path = `avatars/${session.user.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    showToast("Upload failed: " + uploadError.message, "error");
    return;
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Update profile table
  await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", session.user.id);

  // Update UI
  const circle = document.getElementById("avatar-circle");
  circle.innerHTML = `<img src="${publicUrl}?t=${Date.now()}" alt="Avatar"/>`;
  showToast("Profile picture updated!", "success");
}
window.handleAvatarUpload = handleAvatarUpload;

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
window.toggleEditInfo = toggleEditInfo;

function cancelEditInfo() {
  infoEditing = true;
  toggleEditInfo();
}
window.cancelEditInfo = cancelEditInfo;

async function saveInfo(e) {
  e.preventDefault();
  const name = document.getElementById("field-name").value.trim();
  if (!name || name.length < 2) {
    showToast("Please enter a valid full name.", "error");
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const updates = {
    full_name: name,
    phone: document.getElementById("field-phone").value.trim(),
    prn: document.getElementById("field-prn").value.trim(),
    roll_number: document.getElementById("field-roll").value.trim(),
    division: document.getElementById("field-division").value.trim(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", session.user.id);

  if (error) {
    showToast("Save failed: " + error.message, "error");
    return;
  }

  // Update sidebar
  document.getElementById("display-name").textContent = name;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  document.getElementById("avatar-initials").textContent = initials;
  document.getElementById("display-prn").textContent =
    "PRN: " + (updates.prn || "—");

  infoEditing = true;
  toggleEditInfo();
  showToast("Personal information saved!", "success");
}
window.saveInfo = saveInfo;

// ─────────────────────────────────────────
// EDIT ACADEMIC INFO
// ─────────────────────────────────────────
let academicEditing = false;

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
window.toggleEditAcademic = toggleEditAcademic;

function cancelEditAcademic() {
  academicEditing = true;
  toggleEditAcademic();
}
window.cancelEditAcademic = cancelEditAcademic;

async function saveAcademic(e) {
  e.preventDefault();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const branchVal = document.getElementById("field-branch").value;
  const yearVal = document.getElementById("field-year").value;

  const updates = {
    branch: branchVal,
    year: yearVal,
    college: document.getElementById("field-college").value.trim(),
    academic_year: document.getElementById("field-acad-year").value.trim(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", session.user.id);

  if (error) {
    showToast("Save failed: " + error.message, "error");
    return;
  }

  document.getElementById("display-branch").textContent =
    BRANCH_LABELS[branchVal] || branchVal;
  document.getElementById("display-year").textContent =
    YEAR_LABELS[yearVal] || yearVal;

  academicEditing = true;
  toggleEditAcademic();
  showToast("Academic details saved!", "success");
}
window.saveAcademic = saveAcademic;

// ─────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────
function togglePwField(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  const svg = btn.querySelector("svg");
  if (svg) {
    svg.innerHTML = isHidden
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}
window.togglePwField = togglePwField;

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
window.checkStrengthProfile = checkStrengthProfile;

async function savePassword(e) {
  e.preventDefault();
  const curPw = document.getElementById("field-cur-pw").value;
  const nw = document.getElementById("field-new-pw").value;
  const conf = document.getElementById("field-conf-pw").value;

  if (!curPw) {
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

  // Re-authenticate with current password first
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    showToast("Session expired. Please log in again.", "error");
    btn.disabled = false;
    return;
  }

  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: session.user.email,
    password: curPw,
  });

  if (reAuthError) {
    showToast("Current password is incorrect.", "error");
    btn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2l-3 3m-14.5 14.5L1 22l2.5-2.5M14 5l5 5M3.5 17.5l-1-1 9-9 1 1"/></svg> Update Password`;
    return;
  }

  const { error } = await supabase.auth.updateUser({ password: nw });

  btn.disabled = false;
  btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2l-3 3m-14.5 14.5L1 22l2.5-2.5M14 5l5 5M3.5 17.5l-1-1 9-9 1 1"/></svg> Update Password`;

  if (error) {
    showToast("Password update failed: " + error.message, "error");
    return;
  }

  // Clear fields
  document.getElementById("field-cur-pw").value = "";
  document.getElementById("field-new-pw").value = "";
  document.getElementById("field-conf-pw").value = "";
  const fill = document.getElementById("profile-pw-fill");
  const label = document.getElementById("profile-pw-label");
  if (fill) fill.style.width = "0%";
  if (label) label.textContent = "";

  showToast("Password updated successfully! 🔐", "success");
}
window.savePassword = savePassword;

// ─────────────────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────────────────
function confirmDelete() {
  document.getElementById("delete-modal").classList.add("open");
}
window.confirmDelete = confirmDelete;

function closeDeleteModal(e) {
  if (e.target === document.getElementById("delete-modal")) {
    document.getElementById("delete-modal").classList.remove("open");
  }
}
window.closeDeleteModal = closeDeleteModal;

function closeDeleteModalDirect() {
  document.getElementById("delete-modal").classList.remove("open");
}
window.closeDeleteModalDirect = closeDeleteModalDirect;

async function executeDelete() {
  const btn = document.querySelector(".btn-modal-danger");
  btn.textContent = "Deleting…";
  btn.disabled = true;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.replace("login.html");
    return;
  }

  const userId = session.user.id;

  // Delete profile row
  await supabase.from("profiles").delete().eq("id", userId);

  // Delete avatar from storage (best-effort)
  await supabase.storage
    .from("avatars")
    .remove([
      `avatars/${userId}.jpg`,
      `avatars/${userId}.png`,
      `avatars/${userId}.webp`,
    ]);

  // Sign out and clear session
  await supabase.auth.signOut();
  sessionStorage.clear();

  showToast("Account deleted. Goodbye! 👋", "success");
  setTimeout(() => {
    window.location.replace("signup.html");
  }, 1500);
}
window.executeDelete = executeDelete;

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
async function handleLogout(e) {
  if (e) e.preventDefault();
  await supabase.auth.signOut();
  sessionStorage.clear();
  window.location.replace("login.html");
}
window.handleLogout = handleLogout;

// ─────────────────────────────────────────
// LOAD STATS FROM APP DATA (localStorage)
// ─────────────────────────────────────────
function loadStats() {
  // Try to read lecture/confusion stats saved by app.js
  try {
    const timetable = JSON.parse(localStorage.getItem("lt_timetable") || "[]");
    const lectures = timetable.length;
    document.getElementById("stat-lectures").textContent = lectures || "—";

    const confusions = parseInt(
      localStorage.getItem("lt_total_confusions") || "0",
      10,
    );
    document.getElementById("stat-confused").textContent = confusions || "—";

    const resolved = parseInt(localStorage.getItem("lt_resolved") || "0", 10);
    document.getElementById("stat-resolved").textContent = resolved || "—";

    const streak = parseInt(localStorage.getItem("lt_streak") || "0", 10);
    document.getElementById("stat-streak").textContent = streak
      ? "🔥 " + streak
      : "—";
  } catch (_) {
    /* silently ignore */
  }
}

// ─────────────────────────────────────────
// AVATAR – show image if URL stored
// ─────────────────────────────────────────
function applyAvatarUrl(url) {
  if (!url) return;
  const circle = document.getElementById("avatar-circle");
  if (circle) {
    circle.innerHTML = `<img src="${url}?t=${Date.now()}" alt="Profile picture" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
  }
}

// ─────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initProfile().then(() => {
    loadStats();
  });
});
