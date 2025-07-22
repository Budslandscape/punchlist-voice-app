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

function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function setupButtons() {
  document.getElementById("submitBtn").onclick = () => {
    const task = capturedText || document.getElementById("output").value.trim();
    if (!task) return alert("Please record or type a task first.");
    sendToWebhook(task, "To Do");
  };

  document.getElementById("inProgressBtn").onclick = () => {
    const task = capturedText || document.getElementById("output").value.trim();
    if (!task) return alert("Please record or type a task first.");
    sendToWebhook(task, "In Progress");
  };

  document.getElementById("completeBtn").onclick = () => {
    const task = capturedText || document.getElementById("output").value.trim();
    if (!task) return alert("Please record or type a task first.");
    sendToWebhook(task, "Complete");
  };
}

function sendToWebhook(task, status) {
  fetch(zapierWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: currentSite, task, status })
  })
    .then((res) => {
      if (res.ok) {
        alert(`✅ Task sent as "${status}" for ${currentSite}`);
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

function loadTasks() {
  fetch(taskCSVUrl)
    .then((res) => res.text())
    .then((csv) => {
      const rows = csv.split("\n").slice(1);
      const grouped = { "To Do": [], "In Progress": [], "Complete": [] };

      rows.forEach(row => {
        const columns = row.split(",");
        const site = columns[0]?.trim();
        const task = columns[1]?.trim();
        const status = columns[2]?.trim();

        if (site === currentSite && task) {
          const li = document.createElement("li");
          li.className = statusToClass(status);

          const select = document.createElement("select");
          ["To Do", "In Progress", "Complete"].forEach(option => {
            const opt = document.createElement("option");
            opt.value = option;
            opt.text = option;
            if (option === status) opt.selected = true;
            select.appendChild(opt);
          });

          select.onchange = () => {
            sendToWebhook(task, select.value);
          };

          li.textContent = `${task} `;
          li.appendChild(select);
          grouped[status]?.push(li);
        }
      });

      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      ["To Do", "In Progress", "Complete"].forEach(status => {
        if (grouped[status].length) {
          grouped[status].forEach(li => taskList.appendChild(li));
        }
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

function statusToClass(status) {
  const s = status.toLowerCase();
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
