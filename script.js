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
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      const tasks = [];
      rows.forEach(row => {
        const columns = row.split(",");
        const site = columns[0]?.trim();
        const task = columns[1]?.trim();
        const status = columns[2]?.trim();

        if (site === currentSite && task) {
          tasks.push({ task, status });
        }
      });

      const grouped = { "To Do": [], "In Progress": [], "Complete": [] };
      tasks.forEach(t => {
        if (grouped[t.status]) grouped[t.status].push(t);
        else grouped["To Do"].push(t);
      });

      const renderTasks = (status, cssClass) => {
        grouped[status].forEach(({ task }) => {
          const li = document.createElement("li");
          li.className = cssClass;

          const span = document.createElement("span");
          span.textContent = `${task} (${status})`;

          const select = document.createElement("select");
          ["To Do", "In Progress", "Complete"].forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            if (opt === status) option.selected = true;
            select.appendChild(option);
          });
          select.onchange = () => {
            sendToWebhook(select.value, task);
          };

          select.style.float = "right";
          select.style.marginLeft = "10px";

          li.appendChild(span);
          li.appendChild(select);
          taskList.appendChild(li);
        });
      };

      renderTasks("To Do", "todo");
      renderTasks("In Progress", "in-progress");
      renderTasks("Complete", "complete");

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
