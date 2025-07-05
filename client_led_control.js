const fs = require("fs");
const mqtt = require("mqtt");

// Validate CLI argument
const arg = process.argv[2];
if (!arg || (arg !== "on" && arg !== "off")) {
  console.log('Usage: node client_led_control.js [on|off]');
  process.exit(1);
}

// Load Thing Description from file
const td = JSON.parse(fs.readFileSync("td/led-thing.jsonld"));

// Extract broker base URL and MQTT topic from the TD
const base = td.base || "mqtt://localhost:1883";
const topic = td.properties.state.forms[0].href;
const fullTopic = topic.startsWith("/") ? topic.slice(1) : topic;

// Connect to MQTT broker
const client = mqtt.connect(base);

client.on("connect", () => {
  console.log(`Connected to MQTT broker at ${base}`);
  const payload = arg === "on" ? "1" : "0";

  // Publish payload to the topic
  client.publish(fullTopic, payload, () => {
    console.log(`Published: topic='${fullTopic}' payload='${payload}'`);
    client.end();
  });
});

client.on("error", (err) => {
  console.error("MQTT connection error:", err.message);
});
