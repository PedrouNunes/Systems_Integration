const { Servient } = require("@node-wot/core");
const { MqttClientFactory } = require("@node-wot/binding-mqtt");
const fs = require("fs");

// Load DHT11 TD
const td = JSON.parse(fs.readFileSync("../td/dht11-thing.jsonld", "utf-8"));

const servient = new Servient();
servient.addClientFactory(new MqttClientFactory());

// OAuth credentials for this Thing
servient.addCredentials({
  "urn:dev:wot:dht11": {
    clientId: "my-client",
    clientSecret: "my-secret",
    token: "http://localhost:3000/token"
  }
});

servient.start().then(async (WoT) => {
  try {
    const thing = await WoT.consume(td);
    console.log(`✅ Thing consumed: ${thing.title}`);

    const temp = await thing.readProperty("temperature");
    console.log("🌡️ Temperature:", await temp.value?.() || "No data");

    const hum = await thing.readProperty("humidity");
    console.log("💧 Humidity:", await hum.value?.() || "No data");
  } catch (err) {
    console.error("❌ DHT11 Error:", err.message || err);
  }
});
