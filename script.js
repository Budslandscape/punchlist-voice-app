// === CONFIGURATION ===
const zapierWebhookURL = "https://hook.eu2.make.com/m7eegp093miks8ar3vy3s51bbjvayymg";
const taskCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXXdCoJthM6f0KA6kDO_vyQ-jekGEU-dNUWAqfWD46zJ-0w_Z_0R6T9_Us_8ItEmyi-luXXAUvHV4-/pub?output=csv";

// === GLOBAL VARIABLES ===
let recognition;
let currentSite = "Site A";
let capturedText = "";

// === SETUP ===
window.addEventListener("DOMContentLoaded", () => {
  setupSiteDropdown();
  setupVoiceToText();
  setupButtons();
  loadTasks();
  updateTimestamp();
  setInterval(() => {
    loadTasks();
    updateTimestamp();
  }, 30000);
});

// === FUNCTIONS ===

// Dropdown site selection
function setupSiteDropdown() {
  const dropdown = document.getElementById("siteSelector");
  currentSite = dropdown.value;
  dropdown.addEventListener("change", (e) => {
    currentSite = e.target.value;
    loadTasks();
    updateTimestamp();
  });
}

// Voice-to-text
function setupVoiceToText() {
  const startBtn = document.getElementById("startBtn");
  const retryBtn = document.getElementById("retryBtn");
  const output = document.getElementById("output");

  if (!("webkitSpeechRecognition" in window)) {
    alert("❌ Speech recognition not supported. Use Chrome.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let text = event.results[0][0].transcript;
    capturedText = text.charAt(0).toUpperCase() + text.slice(1);
    output.value = capturedText;
  };

  recognition.onerror = (event) => {
    alert("Speech error: " + event.error);
  };

  startBtn.onclick = () => recognition.start();
  retryBtn.onclick = () => {
    output.value = "";
    capturedText = "";
  };
}

// Buttons for adding tasks
function setupButtons() {
  document.getElementById("submitBtn").onclick = () => sendToWebhook("To Do");
  document.getElementById("inProgressBtn").onclick = () => sendToWebhook("In Progress");
  document.getElementById("completeBtn").onclick = () => sendToWebhook("Complete");
}

// Send new task
function sendToWebhook(status) {
  const task = capturedText || document.getElementById("output").value.trim();
  if (!task) return alert("Please record or type a task first.");

  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: currentSite, task, status, row: null })
  })
    .then((res) => {
      if (res.ok) {
        document.getElementById("output").value = "";
        capturedText = "";
        loadTasks();
        updateTimestamp();
      } else {
        alert("❌ Failed to send. Try again.");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("❌ Error: " + err.message);
    });
}

// Update task status
function updateTaskStatus(task, newStatus, row) {
  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update", site: currentSite, task, status: newStatus, row })
  })
    .then((res) => {
      if (res.ok) {
        loadTasks();
        updateTimestamp();
      } else {
        alert("❌ Failed to update task.");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("❌ Error updating task.");
    });
}

// Delete task
function deleteTask(task, row) {
  if (!confirm(`Are you sure you want to delete "${task}"?`)) return;

  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", row })
  })
    .then((res) => {
      if (res.ok) {
        alert(`🗑️ Task "${task}" deleted.`);
        loadTasks();
        updateTimestamp();
      } else {
        alert("❌ Failed to delete task.");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("❌ Error deleting task: " + err.message);
    });
}

// Load and display tasks
function loadTasks() {
  fetch(taskCSVUrl)
    .then((res) => res.text())
    .then((csv) => {
      const rows = csv.split("\n").slice(1);
      const grouped = { "To Do": [], "In Progress": [], "Complete": [], unknown: [] };

      rows.forEach((row, index) => {
        const cols = row.split(",");
        const site = cols[0]?.trim();
        const task = cols[1]?.trim();
        const status = cols[2]?.trim();

        if (site === currentSite && task) {
          const item = { task, status, row: index + 2 };
          if (grouped[status]) grouped[status].push(item);
          else grouped.unknown.push(item);
        }
      });

      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      ["To Do", "In Progress", "Complete", "unknown"].forEach(group => {
        grouped[group].forEach(item => {
          const li = document.createElement("li");
          const cssClass = getStatusClass(item.status);
          li.className = cssClass;

          const taskInfo = document.createElement("div");
          taskInfo.className = "task-info";
          taskInfo.textContent = item.task;

          const statusSelect = document.createElement("select");
          statusSelect.className = "status-dropdown";
          ["To Do", "In Progress", "Complete"].forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            if (opt === item.status) option.selected = true;
            statusSelect.appendChild(option);
          });

          statusSelect.onchange = () => updateTaskStatus(item.task, statusSelect.value, item.row);

          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "🗑️";
          deleteBtn.className = "delete-btn";
          deleteBtn.onclick = () => deleteTask(item.task, item.row);

          const controls = document.createElement("div");
          controls.className = "task-controls";
          controls.appendChild(statusSelect);
          controls.appendChild(deleteBtn);

          li.appendChild(taskInfo);
          li.appendChild(controls);
          taskList.appendChild(li);
        });
      });

      if (!taskList.innerHTML) {
        taskList.innerHTML = `<li>⚠️ No tasks found for ${currentSite}</li>`;
      }
    })
    .catch((err) => {
      console.error("❌ Error loading tasks:", err);
      document.getElementById("taskList").innerHTML = "<li>⚠️ Could not load tasks</li>";
    });
}

// Style mapping
function getStatusClass(status) {
  const s = status?.toLowerCase();
  if (s === "to do") return "todo";
  if (s === "in progress") return "in-progress";
  if (s === "complete") return "complete";
  return "unknown";
}

// Timestamp
function updateTimestamp() {
  const now = new Date();
  document.getElementById("timestamp").textContent =
    "Last updated: " + now.toLocaleString();
}
