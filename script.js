// === CONFIGURATION ===
const zapierWebhookURL = "https://hook.eu2.make.com/m7eegp093miks8ar3vy3s51bbjvayymg";
const taskCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXXdCoJthM6f0KA6kDO_vyQ-jekGEU-dNUWAqfWD46zJ-0w_Z_0R6T9_Us_8ItEmyi-luXXAUvHV4-/pub?output=csv";

// === GLOBAL VARIABLES ===
let recognition;
let currentSite = "Site A";
let capturedText = "";

// === SETUP ===
window.addEventListener("DOMContentLoaded", () => {
  setupVoiceToText();
  setupButtons();
  updateTimestamp();
  loadTasks();

  document.getElementById("siteSelector").addEventListener("change", (e) => {
    currentSite = e.target.value;
    loadTasks();
  });

  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadTasks();
    updateTimestamp();
  });
});

// === FUNCTIONS ===

// Set up voice recognition
function setupVoiceToText() {
  const startBtn = document.getElementById("startBtn");
  const retryBtn = document.getElementById("retryBtn");
  const output = document.getElementById("output");

  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    capturedText = event.results[0][0].transcript;
    output.value = capturedText;
  };

  recognition.onerror = (event) => {
    alert("Error: " + event.error);
  };

  startBtn.onclick = () => recognition.start();
  retryBtn.onclick = () => {
    output.value = "";
    capturedText = "";
  };
}

// Set up submission buttons
function setupButtons() {
  document.getElementById("submitBtn").onclick = () => sendToZapier("To Do");
  document.getElementById("inProgressBtn").onclick = () => sendToZapier("In Progress");
  document.getElementById("completeBtn").onclick = () => sendToZapier("Complete");
}

// Send task to webhook
function sendToZapier(status) {
  const task = capturedText || document.getElementById("output").value.trim();
  if (!task) return alert("Please record or type a task before submitting.");

  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: currentSite, task: task, status: status })
  })
    .then((res) => {
      if (res.ok) {
        alert(`✅ Task sent as "${status}" for ${currentSite}`);
        document.getElementById("output").value = "";
        capturedText = "";
        loadTasks();
        updateTimestamp();
      } else {
        alert("❌ Failed to send task.");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("❌ Error: " + err.message);
    });
}

// Load tasks from CSV and display
function loadTasks() {
  fetch(taskCSVUrl)
    .then((res) => res.text())
    .then((data) => {
      const rows = data.split("\n").slice(1); // skip header
      const filtered = rows.filter(row => row.includes(currentSite));
      const list = document.getElementById("taskList");
      list.innerHTML = "";

      if (filtered.length === 0) {
        list.innerHTML = "<li><em>No tasks found for " + currentSite + "</em></li>";
        return;
      }

      filtered.forEach(row => {
        const [timestamp, site, task, status] = row.split(",");

        // Clean up status tag from task if embedded
        const match = task.match(/\[status:\s*(.*?)\]/i);
        let cleanTask = task.replace(/\[status:.*?\]/i, "").trim();
        let statusText = status?.trim() || (match ? match[1] : "To Do");

        let icon = "➕", css = "todo";
        if (statusText.toLowerCase() === "in progress") {
          icon = "🕒"; css = "in-progress";
        } else if (statusText.toLowerCase() === "complete") {
          icon = "✅"; css = "complete";
        }

        const li = document.createElement("li");
        li.className = css;
        li.innerHTML = `<span>${icon}</span> ${cleanTask}`;
        list.appendChild(li);
      });
    })
    .catch((err) => {
      console.error("Task fetch error:", err);
      document.getElementById("taskList").innerHTML = "<li><em>Failed to load tasks</em></li>";
    });
}

// Update timestamp display
function updateTimestamp() {
  const now = new Date();
  document.getElementById("timestamp").textContent =
    "Last updated: " + now.toLocaleString();
}
