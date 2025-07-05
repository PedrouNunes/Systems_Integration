const fs = require("fs");
const mqtt = require("mqtt");

// Parse command-line argument
const command = process.argv[2];
if (!["on", "off"].includes(command)) {
  console.log("Usage: node led_consumer_from_td.js [on|off]");
  process.exit(1);
}

// Load Thing Description
const td = JSON.parse(fs.readFileSync("td/led-thing.jsonld"));

// Verify TD structure
if (!td.properties || !td.properties.state || !td.properties.state.forms) {
  console.error("Invalid TD: missing 'state' property or 'forms'.");
  process.exit(1);
}

const form = td.properties.state.forms.find(f => 
  f.op.includes("writeproperty") && f.subprotocol === "mqtt"
);

if (!form) {
  console.error("No writable MQTT form found for 'state' property.");
  process.exit(1);
}

// Extract MQTT base and topic
const broker = td.base || "mqtt://localhost:1883";
const topic = form.href.replace(/^\//, ""); // Remove leading slash if exists
const payload = command === "on" ? "1" : "0";

// Connect and publish
const client = mqtt.connect(broker);

client.on("connect", () => {
  console.log(`Connected to ${broker}`);
  console.log(`Publishing '${payload}' to topic '${topic}'`);
  client.publish(topic, payload, {}, () => {
    console.log("Done.");
    client.end();
  });
});

client.on("error", (err) => {
  console.error("MQTT error:", err.message);
});
