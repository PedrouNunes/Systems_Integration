const { Servient } = require("@node-wot/core");
const { MqttClientFactory } = require("@node-wot/binding-mqtt");
const fs = require("fs");

// Load LED Thing Description
const td = JSON.parse(fs.readFileSync("../td/led-thing.jsonld", "utf-8"));

const servient = new Servient();
servient.addClientFactory(new MqttClientFactory());

// Add OAuth credentials
servient.addCredentials({
  "urn:dev:wot:led": {
    clientId: "my-client",
    clientSecret: "my-secret",
    token: "http://localhost:3000/token"
  }
});

servient.start().then(async (WoT) => {
  try {
    const thing = await WoT.consume(td);
    console.log(`✅ Thing consumed: ${thing.title}`);

    // Turn LED ON
    await thing.writeProperty("state", "1");
    console.log("LED turned ON");

    // Wait 3 seconds and turn OFF
    setTimeout(async () => {
      await thing.writeProperty("state", "0");
      console.log("LED turned OFF");
    }, 3000);
    
  } catch (err) {
    console.error("LED Error:", err.message || err);
  }
});
