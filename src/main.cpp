#include <ArduinoJson.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// Wi-Fi credentials
const char* ssid = "MEO-02A070";
const char* password = "3cdd45d1a1";

// MQTT Broker
const char* mqtt_server = "192.168.1.241";
WiFiClient espClient;
PubSubClient client(espClient);

// Pins and sensor type
#define DHTPIN 14
#define DHTTYPE DHT11
#define LED_PIN 5
#define BUTTON_PIN 4

DHT dht(DHTPIN, DHTTYPE);

// MPU6050
const int MPU_ADDR = 0x68;
int16_t AcX, AcY, AcZ, GyX, GyY, GyZ;

// Alert thresholds
const float TEMP_MIN = 10.0;
const float TEMP_MAX = 25.0;
const float HUM_MAX = 80.0;
const int MOTION_THRESHOLD = 18000;

bool motionAlert = false;
bool climateAlert = false;
bool ledState = false;

void setup_wifi() {
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWi-Fi connected.");
  Serial.print("ESP32 IP address: ");
  Serial.println(WiFi.localIP());
}

void mqttCallback(char* topic, byte* message, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) {
    msg += (char)message[i];
  }

  Serial.printf("[MQTT] Message received on topic %s: %s\n", topic, msg.c_str());

  if (String(topic) == "actuator/led") {
    if (msg == "1") {
      ledState = true;
    } else if (msg == "0") {
      ledState = false;
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      client.subscribe("actuator/led");
      Serial.println("Subscribed to actuator/led");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(". Retrying in 5s...");
      delay(5000);
    }
  }
}

void setup_mpu() {
  Wire.begin(21, 22);
  delay(100);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0);
  Wire.endTransmission(true);
}

void read_mpu() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);

  if (Wire.available() >= 14) {
    AcX = Wire.read() << 8 | Wire.read();
    AcY = Wire.read() << 8 | Wire.read();
    AcZ = Wire.read() << 8 | Wire.read();
    Wire.read(); Wire.read();  // skip temp
    GyX = Wire.read() << 8 | Wire.read();
    GyY = Wire.read() << 8 | Wire.read();
    GyZ = Wire.read() << 8 | Wire.read();
  } else {
    Serial.println("Failed to read from MPU6050!");
    AcX = AcY = AcZ = GyX = GyY = GyZ = -9999;
  }
}

void checkButton() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(200);
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("[BUTTON] Pressed. (Simulated deep sleep trigger)");
      digitalWrite(LED_PIN, LOW);
    }
  }
}

void publishSensorData(float temp, float hum) {
  client.publish("sensor/temperature", String(temp).c_str());
  client.publish("sensor/humidity", String(hum).c_str());
}

void publishMotionData() {
  StaticJsonDocument<256> json;
  json["AcX"] = AcX;
  json["AcY"] = AcY;
  json["AcZ"] = AcZ;
  json["GyX"] = GyX;
  json["GyY"] = GyY;
  json["GyZ"] = GyZ;
  char buffer[256];
  serializeJson(json, buffer);
  client.publish("sensor/motion", buffer);
}

void publishAlerts() {
  client.publish("alert/motion", motionAlert ? "1" : "0");
  client.publish("alert/climate", climateAlert ? "1" : "0");
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  dht.begin();
  setup_wifi();
  setup_mpu();
  client.setServer(mqtt_server, 1883);
  client.setCallback(mqttCallback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  read_mpu();

  motionAlert = abs(AcX) > MOTION_THRESHOLD || abs(AcY) > MOTION_THRESHOLD || abs(AcZ) > MOTION_THRESHOLD;
  climateAlert = (temp < TEMP_MIN || temp > TEMP_MAX || hum > HUM_MAX);

  digitalWrite(LED_PIN, (motionAlert || climateAlert || ledState));

  Serial.println("===== SENSOR STATUS =====");
  if (isnan(temp) || isnan(hum)) {
    Serial.println("DHT sensor read failed!");
  } else {
    Serial.printf("Temperature: %.2f °C\n", temp);
    Serial.printf("Humidity: %.2f %%\n", hum);
    publishSensorData(temp, hum);
  }

  Serial.printf("Accel: X=%d Y=%d Z=%d\n", AcX, AcY, AcZ);
  Serial.printf("Gyro: X=%d Y=%d Z=%d\n", GyX, GyY, GyZ);
  publishMotionData();

  Serial.printf("Motion Alert: %s\n", motionAlert ? "YES" : "NO");
  Serial.printf("Climate Alert: %s\n", climateAlert ? "YES" : "NO");
  publishAlerts();
  Serial.printf("LED Remote State: %s\n", ledState ? "ON" : "OFF");
  Serial.println("=========================\n");

  checkButton();
  delay(5000);
}
