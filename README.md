## WoT System Manual – ESP32 + MQTT + Sensors

### System Overview

This system implements a solution based on the Web of Things (WoT) architecture, using an ESP32 microcontroller, environmental and motion sensors, and communication via the MQTT protocol. The development follows the requirements of the course "Web of Things". The system provides the following features:

* Temperature and humidity reading using the DHT11 sensor
* Motion and rotation detection using the MPU6050 sensor
* Generation of climate and motion alerts
* Remote control of an actuator (LED) via MQTT
* Publication of sensor data and alerts on MQTT topics
* Subscription to remote commands for device actuation

---

### Hardware Components

| Component        | Function                                             |
| ---------------- | ---------------------------------------------------- |
| ESP32            | Main microcontroller (handles Wi-Fi and MQTT)        |
| DHT11            | Temperature and humidity sensor                      |
| MPU6050          | Accelerometer and gyroscope sensor                   |
| LED              | Visual actuator (used for alerts and remote control) |
| Button           | Simulated physical trigger                           |
| Mosquitto Broker | MQTT broker running locally on the PC                |

---

### Communication Topology

**Data Flows:**

* The ESP32 **publishes** to the following MQTT topics:

  * `sensor/temperature`
  * `sensor/humidity`
  * `sensor/motion`
  * `alert/climate`
  * `alert/motion`

* The ESP32 **subscribes** to:

  * `actuator/led` → Receives `"1"` to turn the LED on, or `"0"` to turn it off

---

### System Logic

1. **Wi-Fi Connection**
   Connects to the network named `MEO-02A070` with the password `3cdd45d1a1`.

2. **MQTT Connection**
   Connects to the MQTT broker at `192.168.1.241` (the local IP address of the PC running Mosquitto).

3. **Sensor Data Acquisition**

   * **DHT11**: captures temperature and humidity values
   * **MPU6050**: captures acceleration (AcX, AcY, AcZ) and gyroscope data

4. **Alert Generation**

   * **Climate Alert**: triggered if the temperature is outside the range \[10°C–25°C] or if humidity exceeds 80%
   * **Motion Alert**: triggered if acceleration exceeds 18,000 in any axis

5. **LED Behavior**

   * Turns on automatically in case of a climate or motion alert
   * Can also be turned on/off manually via MQTT (`actuator/led` topic, receiving "1" or "0")

---

### MQTT Terminal Tests

**To publish values and control the LED:**

```bash
mosquitto_pub -h 192.168.1.241 -t "actuator/led" -m "1"   # Turns LED ON
mosquitto_pub -h 192.168.1.241 -t "actuator/led" -m "0"   # Turns LED OFF
```

**To monitor all MQTT topics:**

```bash
mosquitto_sub -h 192.168.1.241 -t "#" -v
```

---

### Mosquitto Configuration (MQTT Broker)

**Issues Identified:**

* Mosquitto started in "local only mode", which blocked external connections
* Port 1883 was blocked or unavailable

**Solutions Implemented:**

1. Created a custom configuration file:
   `C:\mosquitto\conf\mosquitto.conf`

   ```
   listener 1883
   allow_anonymous true
   ```

2. Started Mosquitto using the configuration file:

   ```bash
   mosquitto -c C:\mosquitto\conf\mosquitto.conf -v
   ```

3. Opened port 1883 in the Windows Firewall:

   * A new inbound rule was created for TCP port 1883

---

### System Validation

| Test                                    | Result |
| --------------------------------------- | ------ |
| Wi-Fi connected                         | Passed |
| MQTT connection to Mosquitto successful | Passed |
| Data published correctly                | Passed |
| LED controlled via MQTT topic           | Passed |
| Motion sensor functioning               | Passed |
| Climate sensor (DHT11) functioning      | Passed |

---

## WoT System Manual with ESP32 + MQTT + Thing Descriptions (Part 2)

### Step 2 — Exposure of Thing Descriptions via HTTP

**Objective**
Enable WoT clients (automated consumers, dashboards, or tools such as Thingweb CLI) to access `.jsonld` files that describe the system’s sensors and actuators, following the W3C Web of Things standard.

---

### Project Structure

```
Systems_Integration/
├── td/                        ← Contains the .jsonld Thing Description files
│   ├── esp32-thing.jsonld
│   ├── dht11-thing.jsonld
│   ├── mpu6050-thing.jsonld
│   └── led-thing.jsonld
├── server.js                  ← Node.js HTTP server
├── package.json               ← Node.js project configuration
└── node_modules/              ← Dependencies (Express.js)
```

---

### HTTP Server — server.js

The server was implemented using Node.js with the Express framework. It exposes the `.jsonld` files through the `/td` route.

**Full server code:**

```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve the "td" folder with JSON-LD files
app.use('/td', express.static(path.join(__dirname, 'td')));

app.get('/', (req, res) => {
  res.send('WoT Server is active! Visit /td to view the JSON-LD files.');
});

app.listen(PORT, () => {
  console.log(`HTTP Server running at http://localhost:${PORT}`);
});
```

---

### Running the Server

1. Initialize the Node.js project (if not done already):

   ```bash
   npm init -y
   ```

2. Install the required dependency:

   ```bash
   npm install express
   ```

3. Start the server:

   ```bash
   npm start
   ```

---

### Available URLs

Once the server is running, the following files are accessible through any web browser or WoT client:

* [http://localhost:8080/td/esp32-thing.jsonld](http://localhost:8080/td/esp32-thing.jsonld)
* [http://localhost:8080/td/dht11-thing.jsonld](http://localhost:8080/td/dht11-thing.jsonld)
* [http://localhost:8080/td/mpu6050-thing.jsonld](http://localhost:8080/td/mpu6050-thing.jsonld)
* [http://localhost:8080/td/led-thing.jsonld](http://localhost:8080/td/led-thing.jsonld)

Also accessible from the local network:

* [http://192.168.1.241:8080/td/esp32-thing.jsonld](http://192.168.1.241:8080/td/esp32-thing.jsonld)

---

### Expected Result

When accessing one of these URLs, the web browser or WoT client should display a structured JSON-LD document, including:

* The `@context` field referencing the W3C WoT specification
* Metadata such as `title`, `id`, `properties`, and `forms`
* A description of the MQTT interface for the device

*Note: A visual screenshot example should be included in the final report.*

---

### Project Impact

This step fulfills the following mandatory requirements from the original assignment:

| Requirement | Description                                               |
| ----------- | --------------------------------------------------------- |
| 3           | Things must be described using JSON-LD Thing Descriptions |
| 11          | The system must follow the W3C Web of Things architecture |

---

## WoT System Manual with ESP32 + MQTT + Thing Descriptions

**Part 3 — Thing Descriptions: Consumption, Integration, and Alternatives**

### About Thing Descriptions (TDs)

In this project, several Thing Descriptions were created in compliance with the W3C Web of Things (WoT) standard. These TDs are structured using the JSON-LD format and contain the following fields:

* `@context`: "[https://www.w3.org/2019/wot/td/v1](https://www.w3.org/2019/wot/td/v1)"
* `title`, `id`, `securityDefinitions`, `properties`
* `forms` including `op`, `href`, `subprotocol`, and `contentType`

These TDs formally represent the system’s sensors and actuators:

| JSON-LD File           | Description                               |
| ---------------------- | ----------------------------------------- |
| `led-thing.jsonld`     | LED actuator (remote control via MQTT)    |
| `dht11-thing.jsonld`   | Temperature and humidity sensor           |
| `mpu6050-thing.jsonld` | Motion sensor (acceleration)              |
| `esp32-thing.jsonld`   | Composite description of the ESP32 device |

---

### Hosting TDs via HTTP

A basic HTTP server was implemented using Node.js and Express (`server.js`) to serve the TD files over the network. These files are accessible to WoT clients using the following URL:

```
http://<local_ip>:8080/td/esp32-thing.jsonld
```

This server enables automatic WoT clients to retrieve TDs, thus fulfilling a requirement of the WoT architecture.

---

### Attempt with wot-servient

The official WoT client from Eclipse Thingweb (`wot-servient`) was installed and executed using the following command:

```bash
wot-servient http://localhost:8080/td/led-thing.jsonld
```

**Result:**
No output was shown in the terminal. Multiple TD formats were tested, including simplified HTTP-based examples, but `wot-servient` failed to initialize correctly, even with minimal working examples.

---

### Alternative Solution: Custom Thing Consumer

Due to the failures with `wot-servient`, a custom Thing Consumer was developed using Node.js. This script:

* Reads the `.jsonld` file (e.g., `led-thing.jsonld`)
* Parses fields such as `base`, `forms`, `href`, `op`, and `subprotocol`
* Connects to the MQTT broker and performs actions according to the TD definition

**Script created:**

* `led_consumer_from_td.js`

**Usage:**

```bash
node led_consumer_from_td.js on    # Turn LED on  
node led_consumer_from_td.js off   # Turn LED off
```

This script consumes the TD directly and acts as a WoT client following the specification, without relying on `wot-servient`.

---

### Compliance with the Assignment Requirements

| Requirement | Fulfilled                                                    |
| ----------- | ------------------------------------------------------------ |
| 3           | TDs were created in JSON-LD using the W3C structure          |
| 4           | Clients control actuators by consuming TDs                   |
| 11          | WoT architecture applied through TD exposure and consumption |

The structure and use of Thing Descriptions fully meet the project’s objectives and required specifications.

---

### Final Remarks

* The `.jsonld` files are **not executed on the ESP32**; they are interpreted by WoT clients to understand how to interact with the sensors and actuators.
* The custom client approach allows MQTT-based control via the TD, ensuring compatibility with the WoT architecture even without `wot-servient`.
* The HTTP server plays a crucial role by making the TDs available over the network, enabling remote consumption and testing using external tools.

---

## WoT System Manual with ESP32 + MQTT + Thing Descriptions

**Part 4 — Data Storage and Querying with SQLite**

### Sensor Data Storage

To comply with **Requirement 5** of the project assignment, a local storage mechanism was implemented using **SQLite**. This enables persistent logging of sensor measurements and alerts generated by the ESP32.

---

### Components Used

| Component        | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `sqlite3`        | Node.js library used to interact with the SQLite database  |
| `mqtt_logger.js` | Node.js script that listens to MQTT topics and stores data |
| `sensor_data.db` | SQLite database file containing the sensor and alert logs  |

---

### `sensor_logs` Table Structure

| Field       | Type     | Description                            |
| ----------- | -------- | -------------------------------------- |
| `id`        | INTEGER  | Unique identifier (Primary Key)        |
| `topic`     | TEXT     | MQTT topic name                        |
| `payload`   | TEXT     | Content of the published message       |
| `timestamp` | DATETIME | Date and time of insertion (automatic) |

---

### Executing the MQTT Logger

The script `mqtt_logger.js` connects to the MQTT broker and subscribes to the following topics:

* `sensor/temperature`
* `sensor/humidity`
* `sensor/motion`
* `alert/climate`
* `alert/motion`

Whenever a message is received on these topics, the script logs the information automatically into the local SQLite database.

---

### Querying the Historical Data

To access and inspect the stored data, the script `query_logs.js` was created. This script:

* Retrieves the most recent entries from the `sensor_logs` table
* Allows filtering by MQTT topic
* Displays the results directly in the terminal

**Examples of usage:**

```bash
# View the latest records
node query_logs.js

# View records for temperature only
node query_logs.js sensor/temperature
```

---

### Benefits of This Stage

* Enables **persistent** storage of sensor and alert data
* Prepares the system for future integration with a **RESTful API**
* Fulfills the requirement to maintain a **queryable history** of data

---

### Planned Next Steps

* Implement a **REST API** to provide HTTP access to the data
* Enable **export** of data in CSV or JSON formats (optional)
* Build a **web interface** to visualize historical data and alerts

---

## WoT System Manual with ESP32 + MQTT + Thing Descriptions

**Part 5 — REST API for Querying and Control**

### Objective

This section addresses **Requirement 8** of the project assignment:

> "A REST Web API must be implemented, capable of providing data stored in the database or controlling the state of sensors and actuators. It should support standard CRUD operations and be accessible to web clients."

---

### Implementation

A REST API was developed using **Node.js** and the **Express** framework. This API:

* Reads data from the SQLite database (`sensor_data.db`)
* Allows remote control of the LED via HTTP POST requests
* Exposes simple HTTP endpoints that can be consumed by any web client

---

### Dependencies Used

To install the required libraries, run:

```bash
npm install express sqlite3 mqtt body-parser
```

---

### Main File: `api.js`

This file is responsible for:

* Launching the API server on **port 3001**
* Connecting to the MQTT broker at `mqtt://192.168.1.241`
* Providing HTTP routes for data retrieval and LED control

---

### Available Endpoints

| Method | Route             | Description                                        |
| ------ | ----------------- | -------------------------------------------------- |
| GET    | `/sensors`        | Returns the last 50 records from the database      |
| GET    | `/sensors/:topic` | Returns the last 50 records for a specific topic   |
| POST   | `/led`            | Sends a command via MQTT to turn the LED on or off |

---

### Example: Turning the LED On via PowerShell

```powershell
Invoke-WebRequest -Uri http://localhost:3001/led `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "state": true }'
```

**If the `state` field is missing or invalid**, the API returns:

```json
{ "error": "Missing or invalid 'state' (boolean)" }
```

---

### Example Response from `/sensors`

```json
[
  {
    "id": 101,
    "topic": "sensor/temperature",
    "payload": "24.6",
    "timestamp": "2025-07-05 21:54:10"
  },
  ...
]
```

---

### Results

* The REST API is **fully functional** and integrated with both the SQLite database and the MQTT broker
* All routes provide **structured and secure** access to the WoT system
* Successfully tested using PowerShell and `Invoke-WebRequest`
* The API is **ready to be used** by web dashboards, mobile apps, or external systems

---

### Additional Notes

* The API is available locally at:
  `http://localhost:3001`
* It can be tested using tools such as **curl**, **Postman**, **Insomnia**, web browsers, or JavaScript clients
* All **GET** and **POST** routes have been successfully verified

---

## Integrated Module: REST API + MQTT + SQLite + Web Dashboard with Bootstrap

This section describes the implementation and execution of the fully functional system, composed of the following components:

* ESP32 publishing data via MQTT
* Mosquitto acting as the MQTT broker
* Node.js providing:

  * REST API (`api.js`)
  * MQTT Logger to SQLite (`mqtt_logger.js`)
* SQLite as the local database
* Web dashboard using Bootstrap and MQTT.js for real-time visualization

---

### Project Folder Structure

```
Systems_Integration/
├── api.js
├── mqtt_logger.js
├── sensor_data.db
├── td/
├── web/
│   ├── index.html
│   └── css/
│       └── bootstrap.min.css
```

---

### Prerequisites

1. Node.js installed (version 22 or higher)
2. Mosquitto with WebSocket support enabled
3. SQLite 3 installed (`sqlite3`)
4. ESP32 publishing to the following MQTT topics:

   * `sensor/temperature`
   * `sensor/humidity`
   * `sensor/motion`
   * `alert/motion`
   * `alert/climate`

---

### 1. MQTT Broker (Mosquitto)

**Configuration file: `mosquitto.conf`**

```
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true
```

**Run Mosquitto:**

```bash
mosquitto -c path/to/mosquitto.conf -v
```

---

### 2. Database (SQLite)

**Database file:**
`sensor_data.db`

**Table name:**
`sensor_logs`

**Schema (automatically created by `mqtt_logger.js`):**

```sql
CREATE TABLE sensor_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT,
  payload TEXT,
  timestamp TEXT
);
```

---

### 3. MQTT Logger to SQLite (`mqtt_logger.js`)

**Objective:**
Listen to MQTT topics and store the received messages in `sensor_data.db`.

**Execution:**

```bash
node mqtt_logger.js
```

All messages published by the ESP32 will be inserted automatically into the database.

---

### 4. REST API (`api.js`)

**Objective:**

* Serve data from the SQLite database via REST
* Allow LED control via HTTP POST to `/led`
* Publish MQTT commands from the API

**Key implementation detail:**

```javascript
const cors = require("cors");
app.use(cors()); // Enables cross-origin requests between different ports
```

**Main routes:**

| Route             | Method | Description                               |
| ----------------- | ------ | ----------------------------------------- |
| `/sensors`        | GET    | Returns the 50 most recent entries        |
| `/sensors/:topic` | GET    | Returns the last 50 entries by topic      |
| `/led`            | POST   | Publishes MQTT command to control the LED |

**Run the API:**

```bash
npm install express mqtt sqlite3 cors body-parser
node api.js
```

The API will be available at:
[http://localhost:3001](http://localhost:3001)

---

### 5. Web Dashboard (User Interface)

**File path:**
`/web/index.html`

**Features:**

* Buttons with Bootstrap to turn the LED on/off via REST
* Table displaying the last 50 records from the database
* Real-time alerts via MQTT.js

**Requirement:**

* Serve using `http-server` or Live Server

**Execution:**

```bash
npm install -g http-server
http-server ./web
```

**Access via browser:**
[http://localhost:8080](http://localhost:8080)

---

### Full System Execution Flow

1. Start Mosquitto with the configured `mosquitto.conf`
2. Start the MQTT logger:

   ```bash
   node mqtt_logger.js
   ```
3. Start the REST API:

   ```bash
   node api.js
   ```
4. Start the web server:

   ```bash
   http-server ./web
   ```
5. Access the dashboard:
   [http://localhost:8080](http://localhost:8080)

---

### Validated Features

* Reception of MQTT data from the ESP32
* Continuous logging into the SQLite database
* REST API serving filtered data
* Functional web dashboard with Bootstrap
* Remote LED control via REST button
* Real-time alerts using MQTT.js
* CORS issue resolved using `cors()` middleware in `api.js`

---

### System Adjustment: Setting SQLite Path on Windows

During development, it was necessary to configure system environment variables so the `sqlite3` command would work correctly in PowerShell and VS Code.

---

### Steps Taken:

1. Downloaded SQLite from the official website:
   [https://www.sqlite.org/download.html](https://www.sqlite.org/download.html)

2. Extracted the folder containing `sqlite3.exe`, for example to:
   `C:\sqlite`

3. Manually added this folder to the system’s `PATH` environment variable:

   * Control Panel → System → Advanced Settings → Environment Variables
   * Under "Path", add:
     `C:\sqlite`

4. Restarted the terminal and tested with:

   ```bash
   sqlite3 --version
   ```

**Expected result:** The installed SQLite version is displayed correctly.

---

### Final Result

After this configuration, the command `sqlite3 sensor_data.db` worked correctly in the terminal, allowing for convenient access and testing of the database content.

---


## Step: Adding Gyroscope Data to the Web Dashboard (MPU6050)

### Objective

Enable the web dashboard to display **two distinct real-time charts** using data from the MPU6050 sensor:

* One chart for **acceleration values**: AcX, AcY, AcZ
* One chart for **gyroscope values**: GyX, GyY, GyZ

---

### Required Modification in the ESP32

The original implementation of the `publishMotionData()` function did not include gyroscope values in the JSON payload sent via MQTT. To correct this, the function was modified as follows:

**Updated Function Code:**

```cpp
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
```

With this update, the ESP32 began publishing messages in the following format:

```json
{
  "AcX": 1234,
  "AcY": -567,
  "AcZ": 9000,
  "GyX": 40,
  "GyY": -22,
  "GyZ": 5
}
```

These values are sent via MQTT to the topic: `sensor/motion`.

---

### Behavior on the Web Dashboard

The `index.html` file was already configured to:

* Subscribe to the `sensor/motion` topic using MQTT.js (via WebSocket)
* Separate acceleration and gyroscope data into **two independent charts** using Chart.js
* Automatically update both charts in real-time with a **maximum of 20 visible samples** per chart

Therefore, **no changes to the frontend were required**.

---

### Result

After updating the ESP32:

* The web dashboard correctly displays **real-time charts** for both acceleration and gyroscope data
* The charts update automatically without requiring a page refresh
* The historical data can still be accessed through the **REST API** and the data table on the interface

---










