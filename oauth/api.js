const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const mqtt = require("mqtt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Load RSA public key
const publicKey = fs.readFileSync("public.pem");

// Resolve correct path to the SQLite database (one folder above)
const dbPath = path.join(__dirname, "..", "sensor_data.db");

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to open database:", err.message);
  } else {
    console.log("✅ Connected to database at:", dbPath);
  }
});

// Connect to MQTT broker
const mqttClient = mqtt.connect("mqtt://localhost:1883");

// JWT verification middleware
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token missing" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    next();
  });
}

// GET /sensors — Retrieve last 50 records
app.get("/sensors", (req, res) => {
  db.all("SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 50", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /sensors/:topic — Filter by topic
app.get("/sensors/:topic", (req, res) => {
  const topic = req.params.topic;
  db.all(
    "SELECT * FROM sensor_logs WHERE topic = ? ORDER BY timestamp DESC LIMIT 50",
    [topic],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST /sensors — Insert new sensor data (manual)
app.post("/sensors", verifyJWT, (req, res) => {
  const { topic, payload } = req.body;

  if (!topic || !payload) {
    return res.status(400).json({ error: "Missing 'topic' or 'payload'" });
  }

  const sql = "INSERT INTO sensor_logs (topic, payload, timestamp) VALUES (?, ?, datetime('now'))";
  db.run(sql, [topic, payload], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      message: "Record inserted successfully",
      id: this.lastID,
      topic,
      payload,
    });
  });
});

// PUT /sensors/:id — Update a sensor record
app.put("/sensors/:id", verifyJWT, (req, res) => {
  const id = req.params.id;
  const { payload } = req.body;

  if (!payload) return res.status(400).json({ error: "Missing payload" });

  db.run(
    "UPDATE sensor_logs SET payload = ? WHERE id = ?",
    [payload, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
      res.json({ message: "Record updated", id });
    }
  );
});

// DELETE /sensors/:id — Delete a sensor record
app.delete("/sensors/:id", verifyJWT, (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM sensor_logs WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted", id });
  });
});

// POST /led — Send MQTT command to control LED
app.post("/led", verifyJWT, (req, res) => {
  const message = req.body.state === true || req.body.state === "1" ? "1" : "0";
  mqttClient.publish("actuator/led", message);
  res.json({ message: "LED command sent", state: message });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
