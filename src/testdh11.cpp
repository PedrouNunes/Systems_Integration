// #include <ArduinoJson.h>
// #include <Wire.h>
// #include <WiFi.h>
// #include <PubSubClient.h>
// #include <DHT.h>
// #include <queue>

// // Wi-Fi credentials (optional, just to check network and IP address)
// const char* ssid = "PedroNunes";
// const char* password = "12345678";

// // Pins and sensor type
// #define DHTPIN 14
// #define DHTTYPE DHT22
// #define LED_PIN 5
// #define BUTTON_PIN 4

// // Sensor instances
// DHT dht(DHTPIN, DHTTYPE);

// // MPU6050 I2C address
// const int MPU_ADDR = 0x68;
// int16_t AcX, AcY, AcZ, GyX, GyY, GyZ;

// // Alert thresholds
// const float TEMP_MIN = 10.0;
// const float TEMP_MAX = 25.0;
// const float HUM_MAX = 80.0;
// const int MOTION_THRESHOLD = 18000;

// // Flags
// bool motionAlert = false;
// bool climateAlert = false;

// void setup_wifi() {
//   Serial.print("Connecting to Wi-Fi...");
//   WiFi.begin(ssid, password);
//   while (WiFi.status() != WL_CONNECTED) {
//     delay(500); Serial.print(".");
//   }
//   Serial.println("\nWi-Fi connected.");
//   Serial.print("ESP32 IP address: ");
//   Serial.println(WiFi.localIP());
// }

// void setup_mpu() {
//   Wire.begin();
//   Wire.beginTransmission(MPU_ADDR);
//   Wire.write(0x6B);  // Power management register
//   Wire.write(0);     // Wake up MPU6050
//   Wire.endTransmission(true);
// }

// void read_mpu() {
//   Wire.beginTransmission(MPU_ADDR);
//   Wire.write(0x3B);  // Starting register for accelerometer data
//   Wire.endTransmission(false);
//   Wire.requestFrom(MPU_ADDR, 14, true);

//   AcX = Wire.read() << 8 | Wire.read();
//   AcY = Wire.read() << 8 | Wire.read();
//   AcZ = Wire.read() << 8 | Wire.read();
//   Wire.read(); Wire.read();  // Skip temperature registers
//   GyX = Wire.read() << 8 | Wire.read();
//   GyY = Wire.read() << 8 | Wire.read();
//   GyZ = Wire.read() << 8 | Wire.read();
// }

// void checkButton() {
//   if (digitalRead(BUTTON_PIN) == LOW) {
//     delay(200);  // Debounce
//     if (digitalRead(BUTTON_PIN) == LOW) {
//       Serial.println("[BUTTON] Pressed. (Simulated deep sleep trigger)");
//       digitalWrite(LED_PIN, LOW);
//     }
//   }
// }

// void setup() {
//   Serial.begin(115200);
//   pinMode(LED_PIN, OUTPUT);
//   pinMode(BUTTON_PIN, INPUT_PULLUP);
//   dht.begin();
//   setup_wifi();
//   setup_mpu();
// }

// void loop() {
//   float temp = dht.readTemperature();
//   float hum = dht.readHumidity();
//   read_mpu();

//   motionAlert = abs(AcX) > MOTION_THRESHOLD || abs(AcY) > MOTION_THRESHOLD || abs(AcZ) > MOTION_THRESHOLD;
//   climateAlert = (temp < TEMP_MIN || temp > TEMP_MAX || hum > HUM_MAX);

//   digitalWrite(LED_PIN, motionAlert || climateAlert);

//   Serial.println("===== SENSOR STATUS =====");
//   if (isnan(temp) || isnan(hum)) {
//     Serial.println("DHT sensor read failed!");
//   } else {
//     Serial.printf("Temperature: %.2f °C\n", temp);
//     Serial.printf("Humidity: %.2f %%\n", hum);
//   }

//   Serial.printf("Accel: X=%d Y=%d Z=%d\n", AcX, AcY, AcZ);
//   Serial.printf("Gyro: X=%d Y=%d Z=%d\n", GyX, GyY, GyZ);
//   Serial.printf("Motion Alert: %s\n", motionAlert ? "YES" : "NO");
//   Serial.printf("Climate Alert: %s\n", climateAlert ? "YES" : "NO");
//   Serial.println("=========================\n");

//   checkButton();
//   delay(5000);
// }
