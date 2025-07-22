// === CONFIGURATION ===
const zapierWebhookURL = "https://hook.eu2.make.com/your_real_webhook_here";
const taskCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXXdCoJthM6f0KA6kDO_vyQ-jekGEU-dNUWAqfWD46zJ-0w_Z_0R6T9_Us_8ItEmyi-luXXAUvHV4-/pub?output=csv";

// === GLOBAL VARIABLES ===
let recognition;
let currentSite = "Site A";
let capturedText = "";

// === INITIALISE ON LOAD ===
window.addEventListener("DOMContentLoaded", () => {
  promptSiteSelection();
  setupVoiceToText();
  setupButtons();
  loadTasks();
});

// === FUNCTIONS ===

// Prompt builder to choose a job site
function promptSiteSelection() {
  const site = prompt("Select site: Site A, Site B, or Site C")?.trim();
  if (["Site A", "Site B", "Site C"].includes(site)) {
    currentSite = site;
  } else {
    alert("Invalid site selected. Defaulting to Site A.");
  }
}

// Set up speech-to-text
function setupVoiceToText() {
  const startBtn = document.getElementById("startBtn");
  const retryBtn = document.getElementById("retryBtn");
  const output = document.getElementById("output");

  if (!("webkitSpeechRecognition" in window)) {
    alert("❌ Speech recognition is not supported in this browser. Please use Chrome.");
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

// Set up task control buttons
function setupButtons() {
  document.getElementById("submitBtn").onclick = () => sendToWebhook("New");
  document.getElementById("inProgressBtn").onclick = () => sendToWebhook("In Progress");
  document.getElementById("completeBtn").onclick = () => sendToWebhook("Complete");
}

// Send task data to Make webhook
function sendToWebhook(status) {
  const task = capturedText || document.getElementById("output").value.trim();
  if (!task) return alert("Please record or type a task before submitting.");

  fetch(zapierWebhookURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      site: currentSite,
      task: task,
      status: status
    })
  })
    .then((res) => {
      if (res.ok) {
        alert(`✅ Task marked as "${status}" for ${currentSite}`);
        document.getElementById("output").value = "";
        capturedText = "";
        loadTasks(); // Optionally refresh task list
      } else {
        alert("❌ Failed to send. Please try again.");
      }
    })
    .catch((err) => {
      console.error("Error sending to webhook:", err);
      alert("❌ Error: " + err.message);
    });
}

// Load and display tasks from Google Sheet
function loadTasks() {
  fetch(taskCSVUrl)
    .then((response) => response.text())
    .then((csv) => {
      const rows = csv.split("\n").slice(1); // Skip header
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = ""; // Clear old list

      rows.forEach((row) => {
        const [site, task, status] = row.split(",");
        if (site && task && site.trim() === currentSite) {
          const li = document.createElement("li");
          li.textContent = `${task.trim()} (${(status || "Pending").trim()})`;
          taskList.appendChild(li);
        }
      });
    })
    .catch((err) => {
      console.error("Error loading tasks:", err);
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "<li>⚠️ Failed to load tasks.</li>";
    });
}
