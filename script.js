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
    capturedText = event.results[0][0].transcript;
    capturedText = capturedText.charAt(0).toUpperCase() + capturedText.slice(1);
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
      const tasks = { "To Do": [], "In Progress": [], "Complete": [] };
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      rows.forEach(row => {
        const columns = row.split(",");
        const site = columns[0]?.trim();
        const task = columns[1]?.trim();
        const status = columns[2]?.trim();

        if (site === currentSite && task) {
          const li = document.createElement("li");
          li.className = getStatusClass(status);
          li.style.border = "1px solid #ccc";
          li.style.display = "flex";
          li.style.justifyContent = "space-between";
          li.style.alignItems = "center";

          const span = document.createElement("span");
          span.textContent = task;
          span.style.color = "black";

          const select = document.createElement("select");
          select.innerHTML = `
            <option value="To Do" ${status === "To Do" ? "selected" : ""}>To Do</option>
            <option value="In Progress" ${status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Complete" ${status === "Complete" ? "selected" : ""}>Complete</option>
          `;
          select.style.marginLeft = "1rem";
          select.style.color = "black";

          li.appendChild(span);
          li.appendChild(select);

          if (tasks[status]) {
            tasks[status].push(li);
          }
        }
      });

      [...tasks["To Do"], ...tasks["In Progress"], ...tasks["Complete"]].forEach(task => {
        taskList.appendChild(task);
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

function updateTimestamp() {
  const now = new Date();
  document.getElementById("timestamp").textContent =
    "Last updated: " + now.toLocaleString();
}

function getStatusClass(status) {
  if (status === "To Do") return "todo";
  if (status === "In Progress") return "in-progress";
  if (status === "Complete") return "complete";
  return "unknown";
}
