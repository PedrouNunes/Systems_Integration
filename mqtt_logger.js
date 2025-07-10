const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// MQTT broker URL (correct format with protocol)
const brokerUrl = "mqtt://192.168.0.5";

// Topics to subscribe
const topics = [
  "sensor/temperature",
  "sensor/humidity",
  "sensor/motion",
  "alert/climate",
  "alert/motion",
  "alert/button"
];

// Connect to MQTT broker
const client = mqtt.connect(brokerUrl);

// Connect to SQLite database (or create if not exists)
const dbPath = path.join(__dirname, 'sensor_data.db');
const db = new sqlite3.Database(dbPath);

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS sensor_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    payload TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

client.on("connect", () => {
  console.log("Connected to MQTT broker.");
  client.subscribe(topics, (err) => {
    if (err) {
      console.error("Subscription error:", err.message);
    } else {
      console.log("Subscribed to topics:", topics.join(", "));
    }
  });
});

client.on("message", (topic, message) => {
  const payload = message.toString();
  console.log(`[MQTT] ${topic} => ${payload}`);

  db.run(
    "INSERT INTO sensor_logs (topic, payload) VALUES (?, ?)",
    [topic, payload],
    (err) => {
      if (err) console.error("DB insert error:", err.message);
    }
  );
});

process.on("SIGINT", () => {
  console.log("\nClosing connections...");
  client.end();
  db.close();
  process.exit(0);
});
