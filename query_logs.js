const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Optional topic argument (e.g. sensor/temperature)
const filterTopic = process.argv[2];

// Open the database
const dbPath = path.join(__dirname, "sensor_data.db");
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Failed to open database:", err.message);
    process.exit(1);
  }
});

const query = filterTopic
  ? "SELECT * FROM sensor_logs WHERE topic = ? ORDER BY timestamp DESC LIMIT 50"
  : "SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 50";

console.log(`Querying latest sensor data${filterTopic ? ` for topic "${filterTopic}"` : ""}...\n`);

db.all(query, filterTopic ? [filterTopic] : [], (err, rows) => {
  if (err) {
    console.error("Query error:", err.message);
    return;
  }

  if (rows.length === 0) {
    console.log("No data found.");
    return;
  }

  rows.forEach(row => {
    console.log(`[${row.timestamp}] ${row.topic}: ${row.payload}`);
  });
});

db.close();
