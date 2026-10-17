
"use strict";

/* =========================================
   GYMMATE - PERSONAL GYM ASSISTANT
========================================= */

const $ = (selector) => document.querySelector(selector);

const STORAGE = {
  logs: "gymmate_logs_v1",
  completed: "gymmate_completed_v1",
  recovery: "gymmate_recovery_v1",
  settings: "gymmate_settings_v1"
};

const DEFAULT_SETTINGS = {
  reminderTime: "17:00",
  reminderMinutes: 15
};

const PLAN = [
  {
    id: "push",
    day: 1,
    dayName: "Senin",
    shortDay: "SEN",
    title: "Push Day",
    category: "DADA · BAHU · TRISEPS",
    description: "Latihan gerakan dorong dengan teknik yang terkontrol.",
    exercises: [
      { name: "Barbell Bench Press", sets: 3, reps: "6–10", rest: 150, type: "Compound" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "8–12", rest: 120, type: "Compound" },
      { name: "Machine Shoulder Press", sets: 2, reps: "8–12", rest: 120, type: "Compound" },
      { name: "Dumbbell Lateral Raise", sets: 3, reps: "12–15", rest: 75, type: "Isolation" },
      { name: "Cable Triceps Pushdown", sets: 3, reps: "10–15", rest: 75, type: "Isolation" }
    ]
  },
  {
    id: "pull",
    day: 2,
    dayName: "Selasa",
    shortDay: "SEL",
    title: "Pull Day",
    category: "PUNGGUNG · BISep · REAR DELTS",
    description: "Latih gerakan tarik dan otot punggung secara seimbang.",
    exercises: [
      { name: "Lat Pulldown", sets: 3, reps: "8–12", rest: 120, type: "Compound" },
      { name: "Seated Cable Row", sets: 3, reps: "8–12", rest: 120, type: "Compound" },
      { name: "Chest-Supported Row", sets: 2, reps: "10–12", rest: 120, type: "Compound" },
      { name: "Face Pull", sets: 2, reps: "12–15", rest: 75, type: "Isolation" },
      { name: "Dumbbell Biceps Curl", sets: 3, reps: "10–15", rest: 75, type: "Isolation" }
    ]
  },
  {
    id: "legs",
    day: 3,
    dayName: "Rabu",
    shortDay: "RAB",
    title: "Leg Day",
    category: "PAHA · GLUTES · BETIS",
    description: "Bangun kekuatan tubuh bagian bawah dengan rentang gerak nyaman.",
    exercises: [
      { name: "Leg Press", sets: 3, reps: "8–12", rest: 150, type: "Compound" },
      { name: "Dumbbell Romanian Deadlift", sets: 3, reps: "8–12", rest: 150, type: "Compound" },
      { name: "Seated Leg Curl", sets: 3, reps: "10–15", rest: 90, type: "Isolation" },
      { name: "Leg Extension", sets: 2, reps: "10–15", rest: 90, type: "Isolation" },
      { name: "Standing Calf Raise", sets: 3, reps: "12–15", rest: 75, type: "Isolation" }
    ]
  },
  {
    id: "upper",
    day: 5,
    dayName: "Jumat",
    shortDay: "JUM",
    title: "Upper Body",
    category: "DADA · PUNGGUNG · BAHU · LENGAN",
    description: "Sesi tubuh atas dengan volume yang disesuaikan untuk pemula.",
    exercises: [
      { name: "Machine Chest Press", sets: 3, reps: "8–12", rest: 120, type: "Compound" },
      { name: "Lat Pulldown", sets: 3, reps: "8–12", rest: 120, type: "Compound" },
      { name: "Seated Cable Row", sets: 2, reps: "10–12", rest: 120, type: "Compound" },
      { name: "Dumbbell Lateral Raise", sets: 2, reps: "12–15", rest: 75, type: "Isolation" },
      { name: "Cable Biceps Curl", sets: 2, reps: "10–15", rest: 75, type: "Isolation" },
      { name: "Triceps Pushdown", sets: 2, reps: "10–15", rest: 75, type: "Isolation" }
    ]
  },
  {
    id: "lower",
    day: 6,
    dayName: "Sabtu",
    shortDay: "SAB",
    title: "Lower Body",
    category: "PAHA · GLUTES · BETIS",
    description: "Sesi kaki kedua dengan variasi gerakan dan volume moderat.",
    exercises: [
      { name: "Goblet Squat", sets: 3, reps: "8–12", rest: 120, type: "Compound" },
      { name: "Hip Thrust Machine", sets: 3, reps: "8–12", rest: 120, type: "Compound" },
      { name: "Seated Leg Curl", sets: 3, reps: "10–15", rest: 90, type: "Isolation" },
      { name: "Leg Extension", sets: 2, reps: "12–15", rest: 90, type: "Isolation" },
      { name: "Seated Calf Raise", sets: 3, reps: "12–15", rest: 75, type: "Isolation" }
    ]
  }
];

const REST_DAYS = {
  0: "Recovery Day",
  4: "Recovery Day"
};

let logs = readStore(STORAGE.logs, []);
let completed = readStore(STORAGE.completed, []);
let recovery = readStore(STORAGE.recovery, []);
let settings = readStore(STORAGE.settings, DEFAULT_SETTINGS);

let selectedPlanId = "push";
let calendarDate = new Date();
let toastTimer = null;
let reminderTimer = null;
let deferredInstallPrompt = null;
let lastReminderKey = "";

/* =========================================
   UTILITIES
========================================= */

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function localDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function mondayOf(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + ((result.getDay() + 6) % 7) * -1);
  return result;
}

function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

function getPlanForDate(date) {
  return PLAN.find((plan) => plan.day === date.getDay()) || null;
}

function getPlanById(id) {
  return PLAN.find((plan) => plan.id === id) || PLAN[0];
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================
   NAVIGATION
========================================= */

const PAGE_TITLES = {
  dashboard: "Dashboard",
  workout: "Program Latihan",
  calendar: "Kalender",
  progress: "Progres Saya",
  recovery: "Recovery"
};

function navigateTo(pageId) {
  const target = document.getElementById(pageId);
  if (!target) return;

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  $("#pageTitle").textContent = PAGE_TITLES[pageId] || "GymMate";

  if (pageId === "dashboard") renderDashboard();
  if (pageId === "workout") renderWorkout();
  if (pageId === "calendar") renderCalendar();
  if (pageId === "progress") renderProgress();
  if (pageId === "recovery") renderRecovery();

  if (location.hash !== `#${pageId}`) {
    history.replaceState(null, "", `#${pageId}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo(link.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => navigateTo(button.dataset.go));
});

/* =========================================
   WORKOUT PROGRAM
========================================= */

function renderWorkoutTabs() {
  $("#workoutDayTabs").innerHTML = PLAN.map((plan) => `
    <button class="day-tab ${plan.id === selectedPlanId ? "active" : ""}"
      data-plan="${plan.id}">
      <strong>${plan.shortDay}</strong>
      <small>${plan.title}</small>
    </button>
  `).join("");

  document.querySelectorAll("[data-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPlanId = button.dataset.plan;
      renderWorkout();
    });
  });
}

function renderExerciseRows(plan) {
  return plan.exercises.map((exercise, index) => `
    <div class="exercise-row">
      <div class="exercise-main">
        <div class="exercise-badge">${String(index + 1).padStart(2, "0")}</div>
        <div>
          <strong>${escapeHTML(exercise.name)}</strong>
          <small>${exercise.type} · Istirahat ${exercise.rest} detik</small>
        </div>
      </div>
      <div>
        <strong>${exercise.sets} × ${exercise.reps}</strong>
        <small>set × repetisi</small>
      </div>
    </div>
  `).join("");
}

function renderWorkout() {
  renderWorkoutTabs();

  const plan = getPlanById(selectedPlanId);
  $("#workoutCategory").textContent = plan.category;
  $("#workoutTitle").textContent = plan.title;
  $("#workoutDuration").textContent = "± 90 menit";
  $("#workoutDescription").textContent = plan.description;
  $("#exerciseList").innerHTML = renderExerciseRows(plan);

  const select = $("#logExercise");
  const oldValue = select.value;
  const allExercises = [...new Set(PLAN.flatMap((p) => p.exercises.map((e) => e.name)))];

  select.innerHTML = allExercises.map((name) =>
    `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`
  ).join("");

  if (allExercises.includes(oldValue)) select.value = oldValue;
}

/* =========================================
   DASHBOARD
========================================= */

function isCompleted(date) {
  const day = typeof date === "string" ? date : localDate(date);
  return completed.some((item) => item.date === day);
}

function getLogsInRange(start, end) {
  return logs.filter((log) => log.date >= localDate(start) && log.date <= localDate(end));
}

function getVolume(items) {
  return items.reduce((sum, log) => sum + Number(log.weight) * Number(log.reps), 0);
}

function renderDashboard() {
  const now = new Date();
  const today = localDate(now);
  const plan = getPlanForDate(now);

  $("#todayLabel").textContent = formatDate(now, {
    weekday: "short", day: "numeric", month: "short"
  });

  const start = mondayOf(now);
  const end = addDays(start, 6);

  const weeklyDone = completed.filter((item) => item.date >= localDate(start) && item.date <= localDate(end));
  const weeklyLogs = getLogsInRange(start, end);

  $("#weeklySessions").innerHTML = `${weeklyDone.length} <small>/ 5</small>`;
  $("#weeklyProgressBar").style.width = `${Math.min(weeklyDone.length / 5 * 100, 100)}%`;
  $("#weeklyVolume").innerHTML = `${Math.round(getVolume(weeklyLogs)).toLocaleString("id-ID")} <small>kg</small>`;
  $("#streakDays").innerHTML = `${calculateStreak()} <small>hari</small>`;

  $("#todayWorkoutTitle").textContent = plan ? plan.title : "Recovery Day";
  $("#todayWorkoutDescription").textContent = plan
    ? `${plan.category} · 17.00–18.30`
    : "Tidak ada sesi beban terjadwal. Prioritaskan pemulihan.";

  $("#todayWorkoutStatus").textContent = isCompleted(today) ? "Selesai" : (plan ? "Terjadwal" : "Istirahat");
  $("#todayExercisePreview").innerHTML = plan
    ? plan.exercises.slice(0, 3).map((exercise) => `
        <div class="preview-row">
          <div><strong>${escapeHTML(exercise.name)}</strong><small>${exercise.sets} set · ${exercise.reps} repetisi</small></div>
          <span class="exercise-badge">↗</span>
        </div>
      `).join("")
    : `<div class="empty-state">Hari ini fokus pada recovery, tidur, hidrasi, dan aktivitas ringan.</div>`;

  $("#todayActionBtn").textContent = plan ? "Lihat detail latihan" : "Lihat recovery";
  $("#todayActionBtn").onclick = () => {
    if (plan) {
      selectedPlanId = plan.id;
      navigateTo("workout");
    } else {
      navigateTo("recovery");
    }
  };

  $("#startWorkoutBtn").onclick = () => {
    if (plan) selectedPlanId = plan.id;
    navigateTo(plan ? "workout" : "recovery");
  };

  $("#weekSplit").innerHTML = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const dayPlan = getPlanForDate(date);
    return `
      <div class="split-row">
        <span class="split-day">${formatDate(date, { weekday: "short" })}</span>
        <strong>${dayPlan ? dayPlan.title : "Recovery"}</strong>
        <small>${isCompleted(date) ? "✓ Selesai" : dayPlan ? "17.00" : "Rest"}</small>
      </div>
    `;
  }).join("");

  const recent = [...completed].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  $("#recentLogs").innerHTML = recent.length
    ? recent.map((item) => `
      <div class="history-row">
        <div><strong>${escapeHTML(item.title)}</strong><div class="muted">${formatDate(parseDate(item.date), { dateStyle: "medium" })}</div></div>
        <span class="status-pill">Selesai</span>
      </div>
    `).join("")
    : `<div class="empty-state">Belum ada sesi selesai. Catat latihan pertamamu hari ini.</div>`;
}

function calculateStreak() {
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Jika hari ini belum selesai, streak dihitung mulai kemarin.
  if (!isCompleted(cursor)) cursor = addDays(cursor, -1);

  while (isCompleted(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
    if (streak > 365) break;
  }

  return streak;
}

/* =========================================
   COMPLETE WORKOUT
========================================= */

$("#finishWorkoutBtn").addEventListener("click", () => {
  const date = localDate();
  const plan = getPlanById(selectedPlanId);

  if (isCompleted(date)) {
    showToast("Sesi hari ini sudah ditandai selesai.");
    return;
  }

  completed.push({
    date,
    planId: plan.id,
    title: plan.title,
    finishedAt: new Date().toISOString()
  });

  saveStore(STORAGE.completed, completed);
  renderWorkout();
  renderDashboard();
  showToast(`${plan.title} berhasil ditandai selesai.`);
});

/* =========================================
   WORKOUT LOGGING
========================================= */

$("#logDate").value = localDate();

$("#logForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const entry = {
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    exercise: $("#logExercise").value,
    date: $("#logDate").value,
    set: Number($("#logSet").value),
    weight: Number($("#logWeight").value),
    reps: Number($("#logReps").value),
    rpe: Number($("#logRpe").value),
    rir: Number($("#logRir").value),
    notes: $("#logNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!entry.date || entry.weight < 0 || entry.reps < 0 || entry.set < 1) {
    showToast("Periksa kembali data latihan.");
    return;
  }

  logs.push(entry);
  saveStore(STORAGE.logs, logs);

  $("#logWeight").value = "";
  $("#logReps").value = "";
  $("#logNotes").value = "";

  renderProgress();
  renderDashboard();
  showOverloadSuggestion(entry.exercise);
  showToast("Hasil set berhasil disimpan.");
});

function showOverloadSuggestion(exerciseName) {
  const history = logs
    .filter((log) => log.exercise === exerciseName)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const current = history[0];
  const box = $("#overloadSuggestion");

  if (!current) {
    box.hidden = true;
    return;
  }

  const exercise = PLAN.flatMap((plan) => plan.exercises)
    .find((item) => item.name === exerciseName);

  if (!exercise) {
    box.hidden = true;
    return;
  }

  const maxReps = Number(exercise.reps.split(/[–-]/).pop());
  const latestDate = current.date;
  const sameDateSets = history.filter((item) => item.date === latestDate);
  const allAtTop = sameDateSets.length >= exercise.sets &&
    sameDateSets.every((item) => item.reps >= maxReps && item.rpe <= 8);

  let suggestion = "Pertahankan beban saat ini, prioritaskan teknik, dan tambah repetisi secara bertahap.";

  if (allAtTop) {
    suggestion = "Kamu mencapai batas atas repetisi pada seluruh set dengan RPE ≤ 8. Pertimbangkan kenaikan beban terkecil pada sesi berikutnya jika teknik tetap baik.";
  } else if (current.rpe >= 9 || current.rir <= 1) {
    suggestion = "Set terasa sangat berat. Jangan buru-buru menaikkan beban; pertahankan atau kurangi beban bila teknik mulai terganggu.";
  } else if (current.reps < maxReps) {
    suggestion = `Target gerakan ini ${exercise.reps} repetisi. Pertahankan beban dan coba tambah 1 repetisi dengan teknik yang baik pada sesi berikutnya.`;
  }

  box.hidden = false;
  box.innerHTML = `<strong>Saran progressive overload</strong><br>${escapeHTML(suggestion)}<br><small>Gunakan tren beberapa sesi, bukan satu set saja, untuk mengambil keputusan.</small>`;
}

/* =========================================
   CALENDAR
========================================= */

function renderCalendar() {
  const monday = mondayOf(calendarDate);
  const sunday = addDays(monday, 6);

  $("#calendarMonthLabel").textContent =
    `${formatDate(monday, { month: "long", year: "numeric" })}` +
    (monday.getMonth() !== sunday.getMonth()
      ? ` – ${formatDate(sunday, { month: "short", year: "numeric" })}` : "");

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const cells = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const plan = getPlanForDate(date);
    const today = localDate(date) === localDate();
    const done = isCompleted(date);

    cells.push(`
      <div class="calendar-cell ${today ? "today" : ""}">
        <div class="day-name">${dayNames[i]}</div>
        <div class="date-number">${date.getDate()}</div>
        ${plan ? `
          <div class="event">
            <strong>${escapeHTML(plan.title)}</strong><br>
            17.00–18.30<br>
            ${done ? "✓ Selesai" : "Terjadwal"}
          </div>
        ` : `<div class="event" style="background:#273129;color:#b3beb5">Recovery</div>`}
      </div>
    `);
  }

  $("#calendarGrid").innerHTML = cells.join("");
}

$("#prevWeekBtn").addEventListener("click", () => {
  calendarDate = addDays(calendarDate, -7);
  renderCalendar();
});

$("#nextWeekBtn").addEventListener("click", () => {
  calendarDate = addDays(calendarDate, 7);
  renderCalendar();
});

function icsEscape(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDateTime(date, hour, minute) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
}

function exportCalendar() {
  const events = [];
  const start = mondayOf(new Date());

  // Ekspor jadwal delapan minggu ke depan.
  for (let week = 0; week < 8; week++) {
    for (const plan of PLAN) {
      const date = addDays(start, week * 7 + plan.day - 1);
      const startTime = icsDateTime(date, 17, 0);
      const endTime = icsDateTime(date, 18, 30);

      events.push(
        "BEGIN:VEVENT",
        `UID:gymmate-${plan.id}-${localDate(date)}@gymmate.local`,
        `DTSTAMP:${icsDateTime(new Date(), new Date().getHours(), new Date().getMinutes())}Z`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:${icsEscape("GymMate - " + plan.title)}`,
        `DESCRIPTION:${icsEscape(plan.category + ". " + plan.description + " Program pemula; sesuaikan beban dengan kemampuan.")}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape("GymMate: latihan dimulai dalam 15 menit.")}`,
        "END:VALARM",
        "END:VEVENT"
      );
    }
  }

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GymMate//Personal Gym Assistant//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:GymMate Workout Plan",
    "X-WR-TIMEZONE:Asia/Jakarta",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Jakarta",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:WIB",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR"
  ].join("\r\n");

  downloadFile(calendar, "gymmate-workout.ics", "text/calendar;charset=utf-8");
  showToast("File kalender berhasil dibuat.");
}

$("#exportCalendarBtn").addEventListener("click", exportCalendar);
$("#exportCalendarBtn2").addEventListener("click", exportCalendar);

/* =========================================
   PROGRESS AND CSV
========================================= */

function renderProgress() {
  const totalVolume = getVolume(logs);
  $("#totalSets").textContent = logs.length;
  $("#totalVolume").innerHTML = `${Math.round(totalVolume).toLocaleString("id-ID")} <small>kg</small>`;
  $("#totalWorkouts").textContent = completed.length;

  const sorted = [...logs].sort((a, b) =>
    b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
  );

  $("#historyTable").innerHTML = sorted.length ? `
    <table>
      <thead>
        <tr>
          <th>Tanggal</th><th>Gerakan</th><th>Set</th>
          <th>Beban</th><th>Repetisi</th><th>RPE</th><th>RIR</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map((log) => `
          <tr>
            <td>${escapeHTML(log.date)}</td>
            <td>${escapeHTML(log.exercise)}</td>
            <td>${log.set}</td>
            <td>${log.weight} kg</td>
            <td>${log.reps}</td>
            <td>${log.rpe}</td>
            <td>${log.rir}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : `<div class="empty-state">Belum ada data. Catat set pertamamu di Program Latihan.</div>`;
}

$("#exportDataBtn").addEventListener("click", () => {
  if (!logs.length) {
    showToast("Belum ada data untuk diekspor.");
    return;
  }

  const headers = ["Tanggal", "Gerakan", "Set", "Beban (kg)", "Repetisi", "RPE", "RIR", "Catatan"];
  const rows = logs.map((log) => [
    log.date, log.exercise, log.set, log.weight,
    log.reps, log.rpe, log.rir, log.notes
  ]);

  const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

  downloadFile(csv, "gymmate-workout-logs.csv", "text/csv;charset=utf-8");
  showToast("Data latihan berhasil diekspor.");
});

/* =========================================
   RECOVERY CHECK-IN
========================================= */

$("#recoveryForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const entry = {
    date: localDate(),
    sleep: Number($("#sleepHours").value),
    energy: Number($("#energyLevel").value),
    soreness: Number($("#sorenessLevel").value),
    stress: Number($("#stressLevel").value)
  };

  recovery = recovery.filter((item) => item.date !== entry.date);
  recovery.push(entry);
  saveStore(STORAGE.recovery, recovery);

  renderRecovery();
  showToast("Check-in recovery tersimpan.");
});

function renderRecovery() {
  const today = recovery.find((item) => item.date === localDate());

  if (!today) {
    $("#recoveryTitle").textContent = "Belum ada check-in hari ini";
    $("#recoveryAdvice").textContent = "Catat kondisi tubuh untuk mendapatkan saran pemulihan umum.";
    return;
  }

  let advice = "Kondisi tercatat. Lakukan pemanasan dan evaluasi kondisi tubuh selama latihan.";

  if (today.sleep < 6 || today.energy <= 2 || today.soreness >= 4 || today.stress >= 5) {
    advice = "Pertimbangkan mengurangi volume atau intensitas, memilih sesi ringan, atau beristirahat. Jangan memaksakan latihan berat jika tubuh belum pulih.";
  } else if (today.sleep >= 7 && today.energy >= 4 && today.soreness <= 2) {
    advice = "Indikator check-in terlihat cukup baik. Tetap ikuti program dan tingkatkan beban hanya jika teknik serta target repetisi tercapai.";
  }

  $("#recoveryTitle").textContent = `Check-in ${today.date}`;
  $("#recoveryAdvice").textContent = advice;
}

/* =========================================
   NOTIFICATIONS
========================================= */

async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast("Browser ini tidak mendukung notifikasi.");
    return;
  }

  if (!window.isSecureContext) {
    showToast("Buka aplikasi melalui HTTPS atau localhost untuk mengaktifkan notifikasi.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      showToast("Izin notifikasi belum diberikan.");
      return;
    }

    showToast("Izin notifikasi aktif. Pengingat bekerja saat aplikasi terbuka.");
    scheduleOpenPageReminder();
  } catch {
    showToast("Notifikasi tidak dapat diaktifkan.");
  }
}

$("#notificationBtn").addEventListener("click", enableNotifications);

function scheduleOpenPageReminder() {
  clearInterval(reminderTimer);

  reminderTimer = setInterval(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const [hour, minute] = settings.reminderTime.split(":").map(Number);
    const target = new Date(now);
    target.setHours(hour, minute, 0, 0);

    const diff = target.getTime() - now.getTime();
    const key = `${localDate(now)}-${settings.reminderTime}`;

    if (diff >= 0 && diff <= 60_000 && lastReminderKey !== key) {
      lastReminderKey = key;

      const plan = getPlanForDate(now);
      if (!plan || isCompleted(now)) return;

      try {
        new Notification("GymMate — Waktu latihan!", {
          body: `${plan.title} dimulai sekarang. Siapkan air minum dan lakukan pemanasan.`,
          tag: key
        });
      } catch {
        // Browser mungkin membatasi notifikasi dari halaman.
      }
    }
  }, 30_000);
}

/* =========================================
   PWA INSTALL AND SERVICE WORKER
========================================= */

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  $("#installBtn").hidden = false;
});

$("#installBtn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showToast("Gunakan menu browser Tambahkan ke Layar Utama.");
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $("#installBtn").hidden = true;
});

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("GymMate service worker aktif"))
      .catch((error) => console.error("Service worker gagal:", error));
  });
}

/* =========================================
   INITIALIZE
========================================= */

function init() {
  $("#todayLabel").textContent = formatDate(new Date(), {
    weekday: "short", day: "numeric", month: "short"
  });

  renderWorkout();
  renderDashboard();
  renderCalendar();
  renderProgress();
  renderRecovery();

  if (Notification.permission === "granted") {
    scheduleOpenPageReminder();
  }

  const initialPage = location.hash.replace("#", "");
  if (PAGE_TITLES[initialPage]) navigateTo(initialPage);
}

init();
