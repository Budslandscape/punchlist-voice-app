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
    capturedText = capitalizeFirstLetter(event.results[0][0].transcript);
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

function setupButtons() {
  document.getElementById("submitBtn").onclick = () => sendToWebhook("To Do");
  document.getElementById("inProgressBtn").onclick = () => sendToWebhook("In Progress");
  document.getElementById("completeBtn").onclick = () => sendToWebhook("Complete");
}

function sendToWebhook(status, taskText = null) {
  const task = taskText || capturedText || document.getElementById("output").value.trim();
  if (!task) {
    if (!taskText) return; // silently return if called from dropdown without new input
  }

  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: currentSite, task, status })
  })
    .then((res) => {
      if (res.ok) {
        if (!taskText) {
          alert(`✅ Task sent as "${status}" for ${currentSite}`);
          document.getElementById("output").value = "";
          capturedText = "";
        }
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

function loadTasks() {
  fetch(taskCSVUrl)
    .then((res) => res.text())
    .then((csv) => {
      const rows = csv.split("\n").slice(1);
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      const grouped = { "To Do": [], "In Progress": [], "Complete": [], "Unknown": [] };

      rows.forEach(row => {
        const columns = row.split(",");
        const site = columns[0]?.trim();
        const task = columns[1]?.trim();
        const statusRaw = columns[2]?.trim();
        const status = statusRaw ? statusRaw.toLowerCase() : "unknown";

        if (site === currentSite && task) {
          const li = document.createElement("li");

          let cssClass = "unknown";
          if (status === "to do") cssClass = "todo";
          else if (status === "in progress") cssClass = "in-progress";
          else if (status === "complete") cssClass = "complete";

          li.className = cssClass;

          const statusSelect = document.createElement("select");
          ["To Do", "In Progress", "Complete"].forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            if (opt.toLowerCase() === status) option.selected = true;
            statusSelect.appendChild(option);
          });

          statusSelect.addEventListener("change", (e) => {
            sendToWebhook(e.target.value, task);
          });

          li.textContent = `${task} (`;
          li.appendChild(statusSelect);
          li.append(" )");

          if (status === "to do") grouped["To Do"].push(li);
          else if (status === "in progress") grouped["In Progress"].push(li);
          else if (status === "complete") grouped["Complete"].push(li);
          else grouped["Unknown"].push(li);
        }
      });

      Object.values(grouped).forEach(group => group.forEach(item => taskList.appendChild(item)));

      if (!taskList.innerHTML) {
        taskList.innerHTML = `<li>⚠️ No tasks found for ${currentSite}</li>`;
      }
    })
    .catch((err) => {
      console.error("❌ Error loading tasks:", err);
      document.getElementById("taskList").innerHTML = "<li>⚠️ Could not load tasks</li>";
    });
}

function updateTimestamp() {
  const now = new Date();
  document.getElementById("timestamp").textContent =
    "Last updated: " + now.toLocaleString();
}

function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
