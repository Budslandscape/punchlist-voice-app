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
  }, 30000); // Auto-refresh every 30 seconds
});

// === FUNCTIONS ===
function setupSiteDropdown() {
  const dropdown = document.getElementById("siteSelector");
  currentSite = dropdown.value;
  dropdown.addEventListener("change", (e) => {
    currentSite = e.target.value;
    loadTasks();
    updateTimestamp();
  });
}

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
    capturedText = capitalize(event.results[0][0].transcript);
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function setupButtons() {
  document.getElementById("submitBtn").onclick = () => sendToWebhook("To Do");
  document.getElementById("inProgressBtn").onclick = () => sendToWebhook("In Progress");
  document.getElementById("completeBtn").onclick = () => sendToWebhook("Complete");
}

function sendToWebhook(status) {
  const task = capturedText || document.getElementById("output").value.trim();
  if (!task) return alert("Please record or type a task first.");

  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: currentSite, task, status })
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

function deleteTask(task) {
  if (!confirm(`Delete task: "${task}"?`)) return;

  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: currentSite, task, status: "Delete" })
  })
    .then((res) => {
      if (res.ok) {
        loadTasks();
        updateTimestamp();
      } else {
        alert("❌ Failed to delete.");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("❌ Error deleting task.");
    });
}

function updateTaskStatus(task, newStatus) {
  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: currentSite, task, status: newStatus })
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

function loadTasks() {
  fetch(taskCSVUrl)
    .then((res) => res.text())
    .then((csv) => {
      const rows = csv.split("\n").slice(1);
      const allTasks = [];

      rows.forEach(row => {
        const columns = row.split(",");
        const site = columns[0]?.trim();
        const task = columns[1]?.trim();
        const status = columns[2]?.trim();

        if (site === currentSite && task) {
          allTasks.push({ task, status });
        }
      });

      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      const groups = {
        "To Do": [],
        "In Progress": [],
        "Complete": [],
        "Other": []
      };

      allTasks.forEach(t => {
        const key = ["To Do", "In Progress", "Complete"].includes(t.status) ? t.status : "Other";
        groups[key].push(t);
      });

      Object.entries(groups).forEach(([group, tasks]) => {
        tasks.forEach(t => {
          const li = document.createElement("li");
          li.className = getStatusClass(t.status);

          const taskSpan = document.createElement("span");
          taskSpan.textContent = t.task;

          const select = document.createElement("select");
          ["To Do", "In Progress", "Complete"].forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.text = opt;
            if (opt === t.status) option.selected = true;
            select.appendChild(option);
          });
          select.onchange = () => updateTaskStatus(t.task, select.value);

          const delBtn = document.createElement("button");
          delBtn.textContent = "🗑️";
          delBtn.style.marginLeft = "10px";
          delBtn.onclick = () => deleteTask(t.task);

          li.appendChild(taskSpan);
          li.appendChild(select);
          li.appendChild(delBtn);
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

function getStatusClass(status) {
  const s = status?.toLowerCase();
  if (s === "to do") return "todo";
  if (s === "in progress") return "in-progress";
  if (s === "complete") return "complete";
  return "unknown";
}

function updateTimestamp() {
  const now = new Date();
  document.getElementById("timestamp").textContent =
    "Last updated: " + now.toLocaleString();
}
