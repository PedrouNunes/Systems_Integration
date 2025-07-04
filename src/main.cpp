#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <queue>

// Wi-Fi credentials
const char* ssid = "PedroNunes";
const char* password = "12345678";

// MQTT broker IP (your PC with Mosquitto)
const char* mqtt_server = "10.50.2.152";

// GPIO pins
#define DHTPIN 14
#define DHTTYPE DHT11
#define LED_PIN 5
#define BUTTON_PIN 4

// MQTT and sensor objects
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

// State variables
std::queue<String> messageQueue;
unsigned long lastMsg = 0;
bool motionAlert = false;
bool climateAlert = false;

// MPU6050 settings
const int MPU_ADDR = 0x68;
int16_t AcX, AcY, AcZ, GyX, GyY, GyZ;

// Alert thresholds
const float TEMP_MIN = 10.0;
const float TEMP_MAX = 40.0;
const float HUM_MAX = 70.0;
const int MOTION_THRESHOLD = 18000;

void setup_wifi() {
  delay(100);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected.");
  Serial.print("ESP32 IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT broker... ");
    if (client.connect("ESP32Client")) {
      Serial.println("connected.");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(". Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void setup_mpu() {
  Wire.begin();
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);  // PWR_MGMT_1 register
  Wire.write(0);     // Wake up MPU6050
  Wire.endTransmission(true);
  Serial.println("MPU6050 initialized.");
}

void read_mpu() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true); // ✅ correct form for ESP32

  AcX = Wire.read() << 8 | Wire.read();
  AcY = Wire.read() << 8 | Wire.read();
  AcZ = Wire.read() << 8 | Wire.read();
  Wire.read(); Wire.read(); // Skip temperature
  GyX = Wire.read() << 8 | Wire.read();
  GyY = Wire.read() << 8 | Wire.read();
  GyZ = Wire.read() << 8 | Wire.read();
}

void publishData() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  read_mpu();

  motionAlert = abs(AcX) > MOTION_THRESHOLD || abs(AcY) > MOTION_THRESHOLD || abs(AcZ) > MOTION_THRESHOLD;
  climateAlert = (temp < TEMP_MIN || temp > TEMP_MAX || hum > HUM_MAX);

  digitalWrite(LED_PIN, motionAlert || climateAlert);

  // Create sensor payload
  StaticJsonDocument<256> doc;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["AcX"] = AcX;
  doc["AcY"] = AcY;
  doc["AcZ"] = AcZ;
  doc["GyX"] = GyX;
  doc["GyY"] = GyY;
  doc["GyZ"] = GyZ;
  doc["motionAlert"] = motionAlert;
  doc["climateAlert"] = climateAlert;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  if (client.connected()) {
    client.publish("esp32/sensors", payload.c_str());
    Serial.println("Sensor data published.");
  } else {
    messageQueue.push(payload);
    Serial.println("MQTT disconnected. Message queued.");
  }

  // Publish system state
  StaticJsonDocument<128> stateDoc;
  stateDoc["led"] = digitalRead(LED_PIN);
  stateDoc["reason"] = motionAlert ? "Motion" : (climateAlert ? "Climate" : "None");
  String statePayload;
  serializeJson(stateDoc, statePayload);
  client.publish("esp32/state", statePayload.c_str());
}

void enterDeepSleep() {
  StaticJsonDocument<64> doc;
  doc["sleep"] = true;
  String msg;
  serializeJson(doc, msg);
  client.publish("esp32/deepsleep", msg.c_str());

  Serial.println("Entering deep sleep mode.");
  delay(1000);
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_4, 0); // Wake up on button press
  esp_deep_sleep_start();
}

void checkButton() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(200);
    if (digitalRead(BUTTON_PIN) == LOW) {
      client.publish("esp32/button", "pressed");
      Serial.println("Button pressed. Going to sleep.");
      enterDeepSleep();
    }
  }
}

void flushQueue() {
  while (!messageQueue.empty() && client.connected()) {
    String msg = messageQueue.front();
    client.publish("esp32/sensors", msg.c_str());
    messageQueue.pop();
    Serial.println("Queued message published.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32 booting...");

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  dht.begin();

  setup_wifi();
  client.setServer(mqtt_server, 1883);
  setup_mpu();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
    publishData();
    flushQueue();
  }

  checkButton();
}
