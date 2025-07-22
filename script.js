<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PunchList Pro</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Roboto Slab', serif;
      background-color: #f4f4f4;
      padding: 1rem;
      color: #1c1c1c;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #003366;
      margin-bottom: 1rem;
      border: 2px solid #003366;
      padding: 0.5rem;
      border-radius: 6px;
    }
    label, select {
      font-size: 16px;
    }
    select {
      padding: 0.4rem;
      margin-left: 0.5rem;
    }
    textarea {
      width: 100%;
      height: 80px;
      margin: 1rem 0;
      font-size: 16px;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid #ccc;
      resize: vertical;
    }
    button {
      margin: 0.3rem;
      padding: 0.5rem 1rem;
      font-size: 14px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    }

    /* Primary Buttons */
    .start, .retry {
      background-color: #007bff;
      color: white;
    }

    /* Status Buttons */
    button.submit { background-color: #dc3545; color: white; } /* Red */
    button.progress { background-color: #ffc107; color: black; } /* Yellow */
    button.complete { background-color: #1e7e34; color: white; } /* Bold Green */

    /* Task List Styling */
    ul#taskList {
      margin-top: 1.5rem;
      padding-left: 0;
      list-style: none;
    }
    ul#taskList li {
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 15px;
      text-align: left;
    }
    ul#taskList li.todo {
      background-color: #dc3545;
      color: white;
    }
    ul#taskList li.in-progress {
      background-color: #ffc107;
      color: black;
    }
    ul#taskList li.complete {
      background-color: #1e7e34;
      color: white;
    }
    ul#taskList li.unknown {
      background-color: #e2e3e5;
      color: black;
    }

    #timestamp {
      margin-top: 0.5rem;
      font-size: 12px;
      color: #666;
    }

    @media (max-width: 500px) {
      .container {
        padding: 1rem;
      }
      button {
        width: 100%;
        font-size: 15px;
        margin-bottom: 0.4rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>PunchList Pro</h1>

    <div>
      <label for="siteSelector">Select Job Site:</label>
      <select id="siteSelector">
        <option value="Site A">Site A</option>
        <option value="Site B">Site B</option>
        <option value="Site C">Site C</option>
      </select>
    </div>

    <textarea id="output" placeholder="Speak or type a task..."></textarea>

    <button id="startBtn" class="start">🎤 Start Voice Note</button>
    <button id="retryBtn" class="retry">🔁 Retry</button>

    <div class="action-group">
      <button id="submitBtn" class="submit">➕ To Do</button>
      <button id="inProgressBtn" class="progress">🚧 In Progress</button>
      <button id="completeBtn" class="complete">✅ Complete</button>
    </div>

    <ul id="taskList"></ul>
    <div id="timestamp"></div>
  </div>

  <script src="script.js"></script>
</body>
</html>
