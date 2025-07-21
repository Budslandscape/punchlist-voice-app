// Your existing setup...

const testWebhookUrl = "https://hooks.zapier.com/hooks/catch/310398021/310411788/";

function sendTestStatusUpdate() {
  fetch(testWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      site: "Site A",
      task: "Fix fence post",
      status: "Complete"
    })
  })
    .then((response) => {
      if (response.ok) {
        alert("✅ Test update sent to Zapier. Go check your Zap!");
      } else {
        alert("❌ Something went wrong. Check your webhook URL or try again.");
      }
    })
    .catch((error) => {
      alert("❌ Failed to send test update: " + error.message);
    });
}

// Add a temporary button to the page to trigger it
window.addEventListener("DOMContentLoaded", () => {
  const testButton = document.createElement("button");
  testButton.textContent = "Send Test Update to Zapier";
  testButton.style.marginTop = "20px";
  testButton.style.padding = "10px";
  testButton.style.background = "#007BFF";
  testButton.style.color = "#fff";
  testButton.style.border = "none";
  testButton.style.borderRadius = "8px";
  testButton.style.cursor = "pointer";
  testButton.onclick = sendTestStatusUpdate;

  document.body.appendChild(testButton);
});
