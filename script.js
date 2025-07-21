const startBtn = document.getElementById("start");
const retryBtn = document.getElementById("retry");
const sendBtn = document.getElementById("send");
const transcriptBox = document.getElementById("transcript");
const siteSelect = document.getElementById("site");
const status = document.getElementById("status");

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/310398021/310411788/";

let recognition;
try {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    status.textContent = "🎤 Listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    transcriptBox.value = transcript;
    status.textContent = "✅ Transcribed!";
  };

  recognition.onerror = (e) => {
    status.textContent = "❌ Error: " + e.error;
  };

  recognition.onend = () => {
    if (!transcriptBox.value) {
      status.textContent = "⚠️ Nothing captured. Try again.";
    }
  };
} catch (err) {
  status.textContent = "Speech recognition not supported in this browser.";
}

startBtn.onclick = () => {
  if (!siteSelect.value) {
    status.textContent = "⚠️ Please select a site.";
    return;
  }
  transcriptBox.value = "";
  recognition.start();
};

retryBtn.onclick = () => {
  transcriptBox.value = "";
  status.textContent = "Cleared. Try again.";
};

sendBtn.onclick = () => {
  const site = siteSelect.value;
  const task = transcriptBox.value;

  if (!site || !task) {
    status.textContent = "⚠️ Site and task required.";
    return;
  }

  status.textContent = "📤 Sending...";

  fetch(ZAPIER_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: site, task: task })
  }).then(res => {
    if (res.ok) {
      status.textContent = "✅ Task sent to PunchList.";
      transcriptBox.value = "";
    } else {
      status.textContent = "❌ Failed to send.";
    }
  });
};

