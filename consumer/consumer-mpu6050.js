const { Servient } = require("@node-wot/core");
const { MqttClientFactory } = require("@node-wot/binding-mqtt");
const fs = require("fs");

// Load MPU6050 TD
const td = JSON.parse(fs.readFileSync("../td/mpu6050-thing.jsonld", "utf-8"));

const servient = new Servient();
servient.addClientFactory(new MqttClientFactory());

// OAuth credentials
servient.addCredentials({
  "urn:dev:wot:mpu6050": {
    clientId: "my-client",
    clientSecret: "my-secret",
    token: "http://localhost:3000/token"
  }
});

servient.start().then(async (WoT) => {
  try {
    const thing = await WoT.consume(td);
    console.log(`✅ Thing consumed: ${thing.title}`);

    const accel = await thing.readProperty("acceleration");
    const a = await accel.value?.();
    console.log("Acceleration:", a || "No data");

    const gyroEvent = thing.subscribeEvent("motionAlert", (data) => {
      console.log("Motion Alert:", data);
    });

    setTimeout(() => {
      gyroEvent.unsubscribe();
      console.log("Unsubscribed from motionAlert");
    }, 10000);
  } catch (err) {
    console.error("MPU6050 Error:", err.message || err);
  }
});
