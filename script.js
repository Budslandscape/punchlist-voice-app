// === CONFIGURATION ===
const zapierWebhookURL = "https://hook.eu2.make.com/m7eegp093miks8ar3vy3s51bbjvayymg";
const taskCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXXdCoJthM6f0KA6kDO_vyQ-jekGEU-dNUWAqfWD46zJ-0w_Z_0R6T9_Us_8ItEmyi-luXXAUvHV4-/pub?output=csv";

// === GLOBAL VARIABLES ===
let recognition;
let currentSite = "Site A";
let capturedText = "";

// === SETUP ===
window.addEventListener("DOMContentLoaded", () => {
  promptSiteSelection();
  setupVoiceToText();
  setupButtons();
  loadTasks();
});

// === FUNCTIONS ===

// Prompt builder to choose job site
function promptSiteSelection() {
  const site = prompt("Select site: Site A, Site B, or Site C").trim();
  if (["Site A", "Site B", "Site C"].includes(site)) {
    currentSite = site;
  } else {
    alert("Invalid site selected. Defaulting to Site A.");
  }
}

// Set up speech recognition
function setupVoiceToText() {
  const startBtn = document.getElementById("startBtn");
  const retryBtn = document.getElementById("retryBtn");
  const output = document.getElementById("output");

  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser.");
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

  startBtn.onclick = () => {
    recognition.start();
  };

  retryBtn.onclick = () => {
    output.value = "";
    capturedText = "";
  };
}

// Set up buttons for submitting tasks and updating status
function setupButtons() {
  document.getElementById("submitBtn").onclick = () => sendToZapier("New");
  document.getElementById("inProgressBtn").onclick = () => sendToZapier("In Progress");
  document.getElementById("completeBtn").onclick = () => sendToZapier("Complete");
}

// Send task update to Zapier
function sendToZapier(status) {
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
        alert(`✅ Task marked as "${status}" and sent for ${currentSite}`);
        document.getElementById("output").value = "";
        capturedText = "";
      } else {
        alert("❌ Failed to send. Please try again.");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("❌ Error: " + err.message);
    });
}

// Load and display tasks from Google Sheets
function loadTasks() {
  fetch(taskCSVUrl)
    .then(response => response.text())
    .then(csv => {
      const rows = csv.split("\n").slice(1); // Skip header
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = ""; // Clear previous

      rows.forEach(row => {
        const [site, task, status] = row.split(",");
        if (site && task && site.trim() === currentSite) {
          const li = document.createElement("li");
          li.textContent = `${task} (${status || "Pending"})`;
          taskList.appendChild(li);
        }
      });
    })
    .catch(err => {
      console.error("Error loading tasks:", err);
    });
}
