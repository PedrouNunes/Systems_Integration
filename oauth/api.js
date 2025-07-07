const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
const PORT = 3001;
const publicKey = fs.readFileSync("public.pem");

app.use(cors());
app.use(bodyParser.json());

// Middleware para verificar o token JWT assinado
function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Acesso bloqueado: sem token");
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
    req.user = payload;
    console.log("✅ Token válido:", payload);
    next();
  } catch (err) {
    console.log("Token inválido:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}


// SQLite
const dbPath = path.join(__dirname, "../sensor_data.db");
const db = new sqlite3.Database(dbPath);

// MQTT
const mqttClient = mqtt.connect("mqtt://192.168.1.241");
const mqttLedTopic = "actuator/led";

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker.");
});

// Public route
app.get("/sensors", (req, res) => {
  db.all("SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 50", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

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

// Protected: LED control
app.post("/led", verifyJWT, (req, res) => {
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

// Protected: Update
app.put("/sensors/:id", verifyJWT, (req, res) => {
  const { id } = req.params;
  const { payload } = req.body;

  if (typeof payload !== "string") {
    return res.status(400).json({ error: "Invalid 'payload'" });
  }

  const sql = "UPDATE sensor_logs SET payload = ? WHERE id = ?";
  db.run(sql, [payload, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record updated successfully" });
  });
});

// Protected: Delete
app.delete("/sensors/:id", verifyJWT, (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM sensor_logs WHERE id = ?";
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`API REST with JWT validation running at http://localhost:${PORT}`);
});
