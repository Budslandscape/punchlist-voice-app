const zapierWebhookURL = "https://hook.eu2.make.com/m7eegp093miks8ar3vy3s51bbjvayymg";
const taskCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXXdCoJthM6f0KA6kDO_vyQ-jekGEU-dNUWAqfWD46zJ-0w_Z_0R6T9_Us_8ItEmyi-luXXAUvHV4-/pub?output=csv";

let recognition;
let currentSite = "Site A";
let capturedText = "";

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
    allTasks.push({ task, status, row: index + 2 }); // +2 since header is row 1
  }
});

      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      ["To Do", "In Progress", "Complete", "unknown"].forEach(group => {
        grouped[group].forEach(item => {
          const li = document.createElement("li");
          let cssClass = "unknown";
if (item.status === "To Do") cssClass = "todo";
else if (item.status === "In Progress") cssClass = "in-progress";
else if (item.status === "Complete") cssClass = "complete";
li.className = cssClass;


          const taskInfo = document.createElement("div");
          taskInfo.className = "task-info";
          taskInfo.textContent = `${item.task}`;

          const statusSelect = document.createElement("select");
          statusSelect.className = "status-dropdown";
          ["To Do", "In Progress", "Complete"].forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            if (opt === item.status) option.selected = true;
            statusSelect.appendChild(option);
          });

          statusSelect.onchange = () => sendToWebhook(statusSelect.value);

          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "🗑️";
          deleteBtn.className = "delete-btn";
          deleteBtn.onclick = () => alert("🛠️ Delete functionality coming soon");

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

function updateTimestamp() {
  const now = new Date();
  document.getElementById("timestamp").textContent =
    "Last updated: " + now.toLocaleString();
}
