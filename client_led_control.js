const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Connect to SQLite database
const dbPath = path.join(__dirname, "sensor_data.db");
const db = new sqlite3.Database(dbPath);

// MQTT connection (adjust IP if needed)
const mqttClient = mqtt.connect("mqtt://192.168.0.5");
const mqttLedTopic = "actuator/led";

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker.");
});

// --- GET /sensors ---
// Return the 50 most recent sensor messages
app.get("/sensors", (req, res) => {
  db.all(
    "SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 50",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// --- GET /sensors/:topic ---
// Return the 50 most recent messages for a specific topic
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

// --- POST /led ---
// Control the LED: expects { "state": true } or false
app.post("/led", (req, res) => {
  const { state } = req.body;

  if (typeof state !== "boolean") {
    return res.status(400).json({ error: "Missing or invalid 'state' (boolean)" });
  }

  const payload = state ? "1" : "0";
  mqttClient.publish(mqttLedTopic, payload, {}, (err) => {
    if (err) return res.status(500).json({ error: "Failed to publish to MQTT" });
    res.json({ status: "LED command sent", value: state });
  });
});

// --- PUT /sensors/:id ---
// Update the payload of a sensor log entry
app.put("/sensors/:id", (req, res) => {
  const { id } = req.params;
  const { payload } = req.body;

  if (typeof payload !== "string") {
    return res.status(400).json({ error: "Invalid 'payload' (must be a string)" });
  }

  const sql = "UPDATE sensor_logs SET payload = ? WHERE id = ?";
  db.run(sql, [payload, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record updated successfully" });
  });
});

// --- DELETE /sensors/:id ---
// Delete a sensor log entry by ID
app.delete("/sensors/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM sensor_logs WHERE id = ?";
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  });
});

// Start the API server
app.listen(PORT, () => {
  console.log(`API REST server running at http://localhost:${PORT}`);
});
