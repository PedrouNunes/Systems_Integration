// #include <Wire.h>
// #include <ArduinoJson.h>


// const int MPU_ADDR = 0x68; // Endereço I2C padrão do MPU6050

// void setup() {
//   Serial.begin(115200);
//   Serial.println("I2C Scanner + MPU6050 Test");
//   Wire.begin(21, 22); // SDA, SCL

//   // Scanner I2C
//   bool found = false;
//   for (byte addr = 1; addr < 127; addr++) {
//     Wire.beginTransmission(addr);
//     if (Wire.endTransmission() == 0) {
//       Serial.print("I2C device found at address 0x");
//       Serial.println(addr, HEX);
//       found = true;
//     }
//   }
//   if (!found) {
//     Serial.println("No I2C devices found!");
//     while (true);
//   }

//   // Acordar o MPU6050
//   Wire.beginTransmission(MPU_ADDR);
//   Wire.write(0x6B);  // Power management
//   Wire.write(0);     // Wake up
//   Wire.endTransmission(true);
// }

// void loop() {
//   Wire.beginTransmission(MPU_ADDR);
//   Wire.write(0x3B);  // Acelerômetro começa neste registrador
//   Wire.endTransmission(false);
//   Wire.requestFrom(MPU_ADDR, 14, true);

//   if (Wire.available() == 14) {
//     int16_t AcX = Wire.read() << 8 | Wire.read();
//     int16_t AcY = Wire.read() << 8 | Wire.read();
//     int16_t AcZ = Wire.read() << 8 | Wire.read();
//     Wire.read(); Wire.read();  // Ignorar temperatura
//     int16_t GyX = Wire.read() << 8 | Wire.read();
//     int16_t GyY = Wire.read() << 8 | Wire.read();
//     int16_t GyZ = Wire.read() << 8 | Wire.read();

//     Serial.printf("Accel: X=%d Y=%d Z=%d\n", AcX, AcY, AcZ);
//     Serial.printf("Gyro:  X=%d Y=%d Z=%d\n\n", GyX, GyY, GyZ);
//   } else {
//     Serial.println("Failed to read from MPU6050!");
//   }

//   delay(1000);
// }
