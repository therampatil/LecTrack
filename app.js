/* ══════════════════════════════════════════════════
   LECTRACK – APP.JS
   ══════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let currentSubject = "";
let currentRoom = "";
let currentTopics = [];
let markedTopics = [];
let confusedOnBoard = [];
let currentScene = "lobby";
let nbEditMode = false;
let editBuffer = [];

// ─────────────────────────────────────────
// CONSTANTS / TEMP DATA
// ─────────────────────────────────────────
const CARD_COLORS = [
  "#6C63FF",
  "#22D3EE",
  "#F59E0B",
  "#34D399",
  "#F472B6",
  "#FB923C",
];
const SUBJECT_ICONS = {
  default: "📘",
  math: "📐",
  data: "💾",
  os: "⚙️",
  algo: "🧩",
  db: "🗄️",
  network: "🌐",
};

const STUDENTS = [
  { name: "Arjun", emoji: "🧑‍💻", color: "#6C63FF" },
  { name: "Priya", emoji: "👩‍🎓", color: "#22D3EE" },
  { name: "Rohan", emoji: "🧑‍🔬", color: "#34D399" },
  { name: "Sneha", emoji: "👩‍💼", color: "#F472B6" },
  { name: "Karan", emoji: "🧑‍🚀", color: "#FB923C" },
];

let timetable = [
  {
    subject: "Data Structures",
    room: "Room 101 · Prof. Sharma",
    icon: "💾",
    topics: [
      "Arrays & Pointers",
      "Linked Lists",
      "Stack & Queue",
      "Binary Trees",
      "Graph Traversal",
    ],
  },
  {
    subject: "Algorithms",
    room: "Room 203 · Prof. Mehta",
    icon: "🧩",
    topics: [
      "Time Complexity",
      "Sorting Methods",
      "Dynamic Programming",
      "Greedy Algorithms",
      "Backtracking",
    ],
  },
  {
    subject: "OS Concepts",
    room: "Room 105 · Prof. Rao",
    icon: "⚙️",
    topics: [
      "Process Scheduling",
      "Memory Paging",
      "Deadlocks",
      "Semaphores",
      "Virtual Memory",
    ],
  },
  {
    subject: "DBMS",
    room: "Room 301 · Prof. Gupta",
    icon: "🗄️",
    topics: [
      "SQL Joins",
      "Normalization",
      "Transactions",
      "Indexing",
      "Query Optimization",
    ],
  },
];

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────
function $(id) {
  return document.getElementById(id);
}
function $$(sel) {
  return document.querySelectorAll(sel);
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function transitionTo(callback) {
  const overlay = $("transition-overlay");
  overlay.classList.add("fade-in");
  setTimeout(() => {
    callback();
    overlay.classList.remove("fade-in");
  }, 350);
}

function showScene(name) {
  $$(".scene").forEach((s) => s.classList.remove("visible"));
  $("scene-" + name).classList.add("visible");
  currentScene = name;

  const map = { lobby: 1, classroom: 2, discussion: 3 };
  const active = map[name];
  $$(".step-item").forEach((el, i) => {
    el.classList.remove("active", "done");
    if (i + 1 < active) el.classList.add("done");
    if (i + 1 === active) el.classList.add("active");
  });

  const backBtn = $("back-btn");
  backBtn.style.display = name === "lobby" ? "none" : "inline-flex";
}

// ─────────────────────────────────────────
// LOBBY / NOTICEBOARD
// ─────────────────────────────────────────
function renderNoticeboard() {
  $("nb-date").textContent = formatDate();
  $("nb-count").textContent =
    `${timetable.length} lecture${timetable.length !== 1 ? "s" : ""}`;

  const grid = $("lecture-grid");
  grid.innerHTML = "";

  timetable.forEach((lec, i) => {
    const color = CARD_COLORS[i % CARD_COLORS.length];
    const card = document.createElement("div");
    card.className = "lecture-card fade-up";
    card.style.setProperty("--card-color", color);
    card.style.animationDelay = `${i * 0.06}s`;

    const chips = lec.topics
      .slice(0, 3)
      .map((t) => `<span class="topic-chip">${t.split(" ")[0]}</span>`)
      .join("");

    card.innerHTML = `
      <div class="lc-color-bar"></div>
      <div class="lc-subject">${lec.icon || "📘"} ${lec.subject}</div>
      <div class="lc-room">${lec.room}</div>
      <div class="lc-topics">${chips}</div>
      <div class="lc-enter-hint">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        Enter classroom
      </div>`;

    card.addEventListener("click", () => enterClass(lec, color));
    grid.appendChild(card);
  });
}

// ─────────────────────────────────────────
// CLASSROOM
// ─────────────────────────────────────────
function enterClass(lec, color) {
  currentSubject = lec.subject;
  currentRoom = lec.room;
  currentTopics = [...lec.topics];
  markedTopics = [];
  confusedOnBoard = [];
  nbEditMode = false;

  transitionTo(() => {
    setupClassroom(lec, color);
    showScene("classroom");
  });
}

function setupClassroom(lec, color) {
  // Header
  $("board-subject").textContent = lec.subject;
  $("board-room").textContent = lec.room;
  $("subject-badge-icon").textContent = lec.icon || "📘";

  // Topics on board
  const topicList = $("chalk-topics-list");
  topicList.innerHTML = "";
  confusedOnBoard = [];

  lec.topics.forEach((topic, idx) => {
    const item = document.createElement("div");
    item.className = "chalk-topic-item fade-up";
    item.style.animationDelay = `${idx * 0.05}s`;
    item.dataset.topic = topic;
    item.innerHTML = `
      <span class="chalk-topic-num">${(idx + 1).toString().padStart(2, "0")}</span>
      <span class="chalk-topic-name">${topic}</span>
      <span class="chalk-confused-flag">😵</span>
      <div class="chalk-topic-toggle"></div>`;

    item.addEventListener("click", () => toggleChalkTopic(item, topic));
    topicList.appendChild(item);
  });

  // Notebook
  buildNotebook(lec.topics);

  // Roster
  setupRoster();
  updateConfusionMeter();
}

function toggleChalkTopic(item, topic) {
  item.classList.toggle("confused");
  const toggle = item.querySelector(".chalk-topic-toggle");
  if (item.classList.contains("confused")) {
    toggle.textContent = "✓";
    if (!confusedOnBoard.includes(topic)) confusedOnBoard.push(topic);
  } else {
    toggle.textContent = "";
    confusedOnBoard = confusedOnBoard.filter((t) => t !== topic);
  }
  updateConfusionMeter();
  updateConfusionBadge();
}

function setupRoster() {
  const list = $("roster-list");
  const countLabel = $("roster-count");
  list.innerHTML = "";

  const allStudents = [
    ...STUDENTS,
    { name: "You", emoji: "🧑", color: "#6C63FF", isMe: true },
  ];
  countLabel.textContent = `${allStudents.length} students`;

  allStudents.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "roster-student fade-up";
    row.style.animationDelay = `${i * 0.06}s`;
    row.innerHTML = `
      <div class="student-avatar" style="background:${s.color}22;color:${s.color}">${s.emoji}</div>
      <div class="student-name">${s.name}${s.isMe ? ' <span style="font-size:10px;color:var(--text-muted)">(you)</span>' : ""}</div>
      <div class="student-status"></div>`;
    list.appendChild(row);
  });
}

function updateConfusionMeter() {
  const pct =
    currentTopics.length === 0
      ? 0
      : Math.round((confusedOnBoard.length / currentTopics.length) * 100);
  $("confusion-pct").textContent = pct + "%";
  $("confusion-meter-fill").style.width = pct + "%";
}

function updateConfusionBadge() {
  const total = new Set([...markedTopics, ...confusedOnBoard]).size;
  const badge = $("confusion-badge");
  $("badge-count").textContent = total;
  if (total > 0 && currentScene === "classroom") {
    badge.classList.add("visible");
  } else {
    badge.classList.remove("visible");
  }
}

// ─────────────────────────────────────────
// NOTEBOOK
// ─────────────────────────────────────────
function buildNotebook(topics) {
  $("nb-subtitle").textContent =
    `${currentSubject} – mark topics you found confusing`;
  const container = $("notebook-topics");
  container.innerHTML = "";
  nbEditMode = false;

  const toggle = $("nb-edit-toggle");
  toggle.classList.remove("active");
  toggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit`;

  const addRow = $("add-topic-row");
  addRow.classList.add("hidden");
  $("add-topic-input").value = "";

  topics.forEach((t) => appendNotebookRow(t, container, false));
  updateMarkedCountLabel();
}

function appendNotebookRow(topic, container, inEditMode) {
  const row = document.createElement("div");
  row.className = "topic-row" + (inEditMode ? " edit-mode-on show-del" : "");
  row.dataset.topic = topic;

  if (inEditMode) {
    row.innerHTML = `
      <div class="topic-checkbox" style="opacity:0.35;pointer-events:none"></div>
      <input class="topic-label-input" value="${escHtml(topic)}" />
      <span class="topic-confused-emoji">😵</span>
      <button class="del-row-btn" title="Delete topic" onclick="deleteRow(this)">✕</button>`;
    row.querySelector(".topic-label-input").addEventListener("input", (e) => {
      const old = row.dataset.topic;
      row.dataset.topic = e.target.value;
      const idx = markedTopics.indexOf(old);
      if (idx > -1) markedTopics[idx] = e.target.value;
    });
  } else {
    row.innerHTML = `
      <div class="topic-checkbox"></div>
      <div class="topic-label-text">${escHtml(topic)}</div>
      <span class="topic-confused-emoji">😵</span>
      <button class="del-row-btn" title="Delete topic" onclick="deleteRow(this)">✕</button>`;
    const clickMark = () => toggleMark(row);
    row.querySelector(".topic-checkbox").addEventListener("click", clickMark);
    row.querySelector(".topic-label-text").addEventListener("click", clickMark);
  }
  container.appendChild(row);
}

function toggleMark(row) {
  const topic = row.dataset.topic;
  row.classList.toggle("marked");
  const cb = row.querySelector(".topic-checkbox");
  if (row.classList.contains("marked")) {
    cb.textContent = "✓";
    if (!markedTopics.includes(topic)) markedTopics.push(topic);
  } else {
    cb.textContent = "";
    markedTopics = markedTopics.filter((t) => t !== topic);
  }
  updateMarkedCountLabel();
  updateConfusionBadge();
}

function deleteRow(btn) {
  const row = btn.closest(".topic-row");
  const topic = row.dataset.topic;
  markedTopics = markedTopics.filter((t) => t !== topic);
  currentTopics = currentTopics.filter((t) => t !== topic);
  row.style.transition = "all 0.2s";
  row.style.opacity = "0";
  row.style.transform = "translateX(12px)";
  setTimeout(() => row.remove(), 200);
  updateMarkedCountLabel();
  updateConfusionBadge();
}

function toggleNbEdit() {
  nbEditMode = !nbEditMode;
  const toggle = $("nb-edit-toggle");
  const addRow = $("add-topic-row");
  toggle.classList.toggle("active", nbEditMode);

  if (nbEditMode) {
    toggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Done`;
    addRow.classList.remove("hidden");
    $("add-topic-input").value = "";
  } else {
    toggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit`;
    addRow.classList.add("hidden");
  }

  const container = $("notebook-topics");
  const rows = [...container.querySelectorAll(".topic-row")];

  if (nbEditMode) {
    rows.forEach((row) => {
      const topic = row.dataset.topic;
      const isMarked = row.classList.contains("marked");
      row.classList.add("edit-mode-on", "show-del");
      row.innerHTML = `
        <div class="topic-checkbox" style="opacity:0.35;pointer-events:none">${isMarked ? "✓" : ""}</div>
        <input class="topic-label-input" value="${escHtml(topic)}" />
        <span class="topic-confused-emoji" style="opacity:${isMarked ? 1 : 0}">😵</span>
        <button class="del-row-btn" title="Delete topic" onclick="deleteRow(this)">✕</button>`;
      row.querySelector(".topic-label-input").addEventListener("input", (e) => {
        const old = row.dataset.topic;
        row.dataset.topic = e.target.value;
        const idx = markedTopics.indexOf(old);
        if (idx > -1) markedTopics[idx] = e.target.value;
      });
    });
  } else {
    rows.forEach((row) => {
      const inp = row.querySelector(".topic-label-input");
      const topic = inp ? inp.value : row.dataset.topic;
      const isMarked = row.classList.contains("marked");
      row.dataset.topic = topic;
      row.classList.remove("edit-mode-on", "show-del");
      row.innerHTML = `
        <div class="topic-checkbox">${isMarked ? "✓" : ""}</div>
        <div class="topic-label-text">${escHtml(topic)}</div>
        <span class="topic-confused-emoji">😵</span>
        <button class="del-row-btn" title="Delete topic" onclick="deleteRow(this)">✕</button>`;
      const clickMark = () => toggleMark(row);
      row.querySelector(".topic-checkbox").addEventListener("click", clickMark);
      row
        .querySelector(".topic-label-text")
        .addEventListener("click", clickMark);
    });
  }
}

function confirmAddTopic() {
  const input = $("add-topic-input");
  const val = input.value.trim();
  if (!val) return;

  const container = $("notebook-topics");
  const row = document.createElement("div");
  row.className = "topic-row edit-mode-on show-del";
  row.dataset.topic = val;
  row.innerHTML = `
    <div class="topic-checkbox" style="opacity:0.35;pointer-events:none"></div>
    <input class="topic-label-input" value="${escHtml(val)}" />
    <span class="topic-confused-emoji" style="opacity:0">😵</span>
    <button class="del-row-btn" title="Delete topic" onclick="deleteRow(this)">✕</button>`;
  row.querySelector(".topic-label-input").addEventListener("input", (e) => {
    const old = row.dataset.topic;
    row.dataset.topic = e.target.value;
    const idx = markedTopics.indexOf(old);
    if (idx > -1) markedTopics[idx] = e.target.value;
  });

  container.appendChild(row);
  currentTopics.push(val);
  input.value = "";
  input.focus();
}

function updateMarkedCountLabel() {
  const el = $("marked-count-label");
  if (el) {
    el.textContent =
      markedTopics.length === 0
        ? "No topics marked yet"
        : `${markedTopics.length} topic${markedTopics.length > 1 ? "s" : ""} marked as confusing`;
  }
}

function openNotebook() {
  $("notebook-overlay").classList.add("open");
}
function closeNotebook() {
  if (nbEditMode) toggleNbEdit();
  $("notebook-overlay").classList.remove("open");
}

function saveAndDiscuss() {
  if (nbEditMode) toggleNbEdit();
  closeNotebook();
  confusedOnBoard.forEach((t) => {
    if (!markedTopics.includes(t)) markedTopics.push(t);
  });
  $("confusion-badge").classList.remove("visible");
  transitionTo(() => {
    setupDiscussion();
    showScene("discussion");
  });
}

// ─────────────────────────────────────────
// TIMETABLE EDITOR
// ─────────────────────────────────────────
function openTimetableEditor() {
  editBuffer = timetable.map((l) => ({ ...l, topics: [...l.topics] }));
  renderTimetableEditor();
  $("tt-editor-overlay").classList.add("open");
}
function closeTimetableEditor() {
  $("tt-editor-overlay").classList.remove("open");
}

function renderTimetableEditor() {
  const body = $("te-body");
  body.innerHTML = "";

  editBuffer.forEach((lec, i) => {
    const color = CARD_COLORS[i % CARD_COLORS.length];
    const card = document.createElement("div");
    card.className = "te-card";
    card.innerHTML = `
      <div class="te-color-bar" style="background:${color}"></div>
      <button class="te-del-btn" onclick="removeTeCard(${i})">✕ Remove</button>
      <div class="te-card-row">
        <span class="te-label">Subject</span>
        <input class="te-input" data-field="subject" value="${escHtml(lec.subject)}" placeholder="Subject name" />
      </div>
      <div class="te-card-row">
        <span class="te-label">Room / Prof</span>
        <input class="te-input" data-field="room" value="${escHtml(lec.room)}" placeholder="Room 101 · Prof. Name" />
      </div>
      <div class="te-card-row">
        <span class="te-label">Topics</span>
        <input class="te-topics-input" data-field="topics" value="${lec.topics.map(escHtml).join(", ")}" placeholder="Topic A, Topic B, …" />
      </div>`;

    card.querySelectorAll("[data-field]").forEach((inp) => {
      inp.addEventListener("input", () => {
        if (inp.dataset.field === "topics") {
          editBuffer[i].topics = inp.value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        } else {
          editBuffer[i][inp.dataset.field] = inp.value;
        }
      });
    });
    body.appendChild(card);
  });

  const addBtn = document.createElement("div");
  addBtn.className = "te-add-btn";
  addBtn.textContent = "＋ Add New Lecture";
  addBtn.addEventListener("click", addTeCard);
  body.appendChild(addBtn);
}

function removeTeCard(idx) {
  editBuffer.splice(idx, 1);
  renderTimetableEditor();
}
function addTeCard() {
  editBuffer.push({ subject: "", room: "", icon: "📘", topics: [] });
  renderTimetableEditor();
  $("te-body").scrollTop = 99999;
}
function saveTimetable() {
  timetable = editBuffer.filter((l) => l.subject.trim() !== "");
  closeTimetableEditor();
  renderNoticeboard();
}

// ─────────────────────────────────────────
// DISCUSSION
// ─────────────────────────────────────────
function goToDiscussion() {
  confusedOnBoard.forEach((t) => {
    if (!markedTopics.includes(t)) markedTopics.push(t);
  });
  $("confusion-badge").classList.remove("visible");
  transitionTo(() => {
    setupDiscussion();
    showScene("discussion");
  });
}

function setupDiscussion() {
  // Summary strip
  const strip = $("confused-strip");
  if (markedTopics.length > 0) {
    strip.innerHTML = `😵 You marked <strong>${markedTopics.length} topic${markedTopics.length > 1 ? "s" : ""}</strong> as confusing in <strong>${currentSubject}</strong>: ${markedTopics.map((t) => `<em>${escHtml(t)}</em>`).join(", ")} · Pick a room to discuss!`;
  } else {
    strip.innerHTML = `✅ No confused topics from <strong>${currentSubject}</strong>. Still, feel free to join any discussion below.`;
  }

  const container = $("rooms-container");
  container.innerHTML = "";

  const rooms = [
    {
      icon: "👥",
      name: "Group Study",
      desc: "Discuss confusing topics with your entire class in real-time.",
      color: "rgba(34,211,238,0.08)",
      badge: "12 online",
      tags: markedTopics.slice(0, 3),
    },
    {
      icon: "🔒",
      name: "Private Message",
      desc: "Send a direct message to a classmate for focused help.",
      color: "rgba(168,85,247,0.08)",
      badge: null,
      tags: [],
    },
    {
      icon: "🤖",
      name: "AI Tutor",
      desc: "Get instant, topic-specific explanations from your AI tutor.",
      color: "rgba(251,191,36,0.08)",
      badge: "Always on",
      tags: markedTopics,
    },
  ];

  rooms.forEach((room, i) => {
    const card = document.createElement("div");
    card.className = "room-card fade-up";
    card.style.setProperty("--room-color", room.color);
    card.style.animationDelay = `${i * 0.08}s`;

    const tags = room.tags
      .slice(0, 3)
      .map((t) => `<span class="rtag">#${t.split(" ")[0]}</span>`)
      .join("");

    card.innerHTML = `
      <div class="room-card-top">
        <div class="room-icon-wrap">${room.icon}</div>
        ${room.badge ? `<div class="room-badge">${room.badge}</div>` : ""}
      </div>
      <div class="room-name">${room.name}</div>
      <div class="room-desc">${room.desc}</div>
      ${tags ? `<div class="room-tags">${tags}</div>` : ""}`;

    card.addEventListener("click", () => openChat(room));
    container.appendChild(card);
  });
}

// ─────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────
const DUMMY_MSGS = [
  (ref, name) => ({
    sender: name,
    text: `Anyone else confused about ${ref}? 😅`,
    me: false,
  }),
  (_ref, name) => ({
    sender: name,
    text: `Same here! The explanation went by really fast.`,
    me: false,
  }),
  (ref) => ({
    sender: null,
    text: `I marked ${ref} too. Let's break it down together! 💪`,
    me: true,
  }),
  (_ref, name) => ({
    sender: name,
    text: `Found a great resource on this, sharing now!`,
    me: false,
  }),
];
const BOT_REPLIES = (ref) => [
  `Great question on ${ref}! It's fundamentally about how data is organised in memory.`,
  `Same doubt here 🤔 Let's try a group session!`,
  `I found a video on ${ref} that really clicked for me — happy to share!`,
  `Check the professor's slide deck — slide 42 covers this in detail.`,
  `${ref} is tricky! The key insight is thinking about it step-by-step from first principles.`,
];

function openChat(room) {
  $("chat-room-icon").textContent = room.icon;
  $("chat-room-title").textContent = room.name;

  const ref = markedTopics.length > 0 ? markedTopics[0] : currentSubject;
  $("chat-ref-tag").textContent = "📌 " + ref;

  const onlineEl = $("online-count");
  if (onlineEl) onlineEl.textContent = room.badge || "Direct";

  const msgs = $("chat-messages");
  msgs.innerHTML = "";

  const dummyPairs = DUMMY_MSGS.map((fn, i) =>
    fn(ref, STUDENTS[i % STUDENTS.length].name),
  );
  dummyPairs.forEach((m, i) => {
    setTimeout(() => addMessage(m.sender, m.text, m.me, ref, i === 0), i * 280);
  });

  $("chat-overlay").classList.add("open");
}

function addMessage(senderName, text, isMe, ref, showRef = false) {
  const msgs = $("chat-messages");
  const el = document.createElement("div");
  el.className = "msg" + (isMe ? " me" : "");

  const avatarText = isMe
    ? "🧑"
    : STUDENTS.find((s) => s.name === senderName)?.emoji || "👤";

  el.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div class="msg-content">
      ${!isMe && senderName ? `<div class="msg-name">${escHtml(senderName)}</div>` : ""}
      <div class="msg-bubble">
        ${escHtml(text)}
        ${showRef ? `<div class="msg-ref-tag">📌 ${escHtml(ref)}</div>` : ""}
      </div>
    </div>`;

  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function closeChat() {
  $("chat-overlay").classList.remove("open");
}

function sendMessage() {
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text) return;

  const ref = markedTopics.length > 0 ? markedTopics[0] : currentSubject;
  addMessage(null, text, true, ref, false);
  input.value = "";

  const replies = BOT_REPLIES(ref);
  const reply = replies[Math.floor(Math.random() * replies.length)];
  const sender = STUDENTS[Math.floor(Math.random() * STUDENTS.length)];
  setTimeout(
    () => addMessage(sender.name, reply, false, ref, false),
    900 + Math.random() * 600,
  );
}

// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────
function goBack() {
  closeNotebook();
  closeChat();
  transitionTo(() => {
    showScene("lobby");
    $("confusion-badge").classList.remove("visible");
  });
}

function goToDiscussionFromBadge() {
  confusedOnBoard.forEach((t) => {
    if (!markedTopics.includes(t)) markedTopics.push(t);
  });
  $("confusion-badge").classList.remove("visible");
  transitionTo(() => {
    setupDiscussion();
    showScene("discussion");
  });
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Close overlays on backdrop click
["notebook-overlay", "tt-editor-overlay", "chat-overlay"].forEach((id) => {
  const el = $(id);
  if (!el) return;
  el.addEventListener("click", (e) => {
    if (e.target === el) {
      if (id === "notebook-overlay") closeNotebook();
      if (id === "tt-editor-overlay") closeTimetableEditor();
      if (id === "chat-overlay") closeChat();
    }
  });
});

// Keyboard: Escape to close
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeNotebook();
  closeTimetableEditor();
  closeChat();
});

// Wire confusion badge click
const badge = $("confusion-badge");
if (badge) badge.addEventListener("click", goToDiscussionFromBadge);

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
renderNoticeboard();
