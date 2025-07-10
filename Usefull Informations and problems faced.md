
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

## Step: Full CRUD Functionality via Web Interface

### Objective

Allow users to view, edit, and delete sensor records directly through the web interface, integrating **Create**, **Read**, **Update**, and **Delete** operations with the REST API and the SQLite database.

---

### Implemented Functionality

The web interface was extended to support a **complete CRUD** over the data stored in the `sensor_logs` table. The interface now supports:

* **Create**: Automatic insertion of data via `mqtt_logger.js` (sensor → MQTT → SQLite)
* **Read**: Display of the 50 most recent records in the interface
* **Update**: Editing of the `payload` field for any record through a modal
* **Delete**: Direct deletion of records with user confirmation

---

### Technical Implementation

#### File: `index.html`

The data table was updated to include an **"Actions"** column with Edit and Delete buttons for each record:

```html
<tr>
  <th>ID</th>
  <th>Topic</th>
  <th>Payload</th>
  <th>Timestamp</th>
  <th>Actions</th>
</tr>
```

Each row includes buttons created dynamically via JavaScript:

```javascript
const tr = document.createElement("tr");
tr.innerHTML = `
  <td>${row.id}</td>
  <td>${row.topic}</td>
  <td>${row.payload}</td>
  <td>${row.timestamp}</td>
  <td>
    <button class="btn btn-sm btn-warning me-1">Edit</button>
    <button class="btn btn-sm btn-danger">Delete</button>
  </td>`;
tbody.appendChild(tr);

const [editBtn, deleteBtn] = tr.querySelectorAll("button");
editBtn.addEventListener("click", () => openEditModal(row.id, row.payload));
deleteBtn.addEventListener("click", () => deleteEntry(row.id));
```

---

#### Edit Modal

A Bootstrap modal was created to allow editing of the `payload` value:

```html
<div class="modal fade" id="editModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title">Edit Payload</h5></div>
      <div class="modal-body">
        <input type="hidden" id="editId" />
        <input type="text" class="form-control" id="editPayload" />
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="submitEdit()">Save</button>
      </div>
    </div>
  </div>
</div>
```

The `submitEdit()` function sends a `PUT` request to the API:

```javascript
async function submitEdit() {
  const id = document.getElementById("editId").value;
  const payload = document.getElementById("editPayload").value;

  const res = await fetch(`http://localhost:3001/sensors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload })
  });

  const result = await res.json();
  if (res.ok) {
    showAlert("✅ Payload updated!", "success");
    loadData();
  } else {
    showAlert(`❌ Update failed: ${result.error}`, "danger");
  }
  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
}
```

---

#### Record Deletion

Deletion is handled with a simple confirmation dialog:

```javascript
async function deleteEntry(id) {
  if (!confirm(`Are you sure you want to delete entry ID ${id}?`)) return;

  const res = await fetch(`http://localhost:3001/sensors/${id}`, { method: "DELETE" });
  const result = await res.json();

  if (res.ok) {
    showAlert("🗑️ Entry deleted.", "warning");
    loadData();
  } else {
    showAlert(`❌ Delete failed: ${result.error}`, "danger");
  }
}
```

---

### File: `api.js`

The following API routes were added to support `PUT` and `DELETE` operations:

```js
// PUT /sensors/:id
app.put("/sensors/:id", (req, res) => {
  const { id } = req.params;
  const { payload } = req.body;

  if (typeof payload !== "string") {
    return res.status(400).json({ error: "Invalid 'payload'" });
  }

  const sql = "UPDATE sensor_logs SET payload = ? WHERE id = ?";
  db.run(sql, [payload, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record updated successfully" });
  });
});

// DELETE /sensors/:id
app.delete("/sensors/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM sensor_logs WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  });
});
```

---

### Result

After this implementation, the system supports a **fully functional CRUD interface**. The user can:

* View the latest sensor records
* Edit specific entries directly from the browser
* Delete outdated, invalid, or unwanted entries
* Interact with the same panel that provides real-time charts and alerts

---

## Step: Authentication with OAuth 2.0 and JWT

In this step, the system was secured using authentication based on the **OAuth 2.0 protocol**, specifically the **Client Credentials flow** with **JWT tokens signed using an RSA key pair**.

---

### Objective

Restrict access to **sensitive REST API routes**, such as actuator control (LED) and data modification (update/delete), requiring a valid **access token** issued by a trusted OAuth server.

---

### Step-by-Step Implementation

#### 1. Generate RSA Key Pair

In the terminal:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

These keys are used for:

* `private.pem`: signing JWT tokens (OAuth server)
* `public.pem`: verifying received tokens (secured API)

---

#### 2. Create the OAuth 2.0 Server (`auth-server.js`)

A Node.js server built with `express` and `jsonwebtoken`:

* The `/token` endpoint issues a signed JWT
* Uses `private.pem` to sign the token
* Responds with `access_token`, `expires_in`, etc.

Example token generation:

```js
jwt.sign(
  { sub: client_id, scope: "default" },
  privateKey,
  { algorithm: "RS256", expiresIn: "1h" }
);
```

---

#### 3. Protect the REST API (`api.js`)

* Loads `public.pem` to verify tokens
* Defines a middleware `verifyJWT` that:

  * Checks for the `Authorization: Bearer ...` header
  * Validates the token using `jwt.verify(...)`
  * Rejects unauthorized requests with status `401` or `403`

**Protected routes include:**

* `POST /led`
* `PUT /sensors/:id`
* `DELETE /sensors/:id`

---

#### 4. Adapt the Web Interface (`index.html`)

* Automatically obtains the token when the page loads
* Stores it in a variable `accessToken`
* Adds `Authorization: Bearer ${accessToken}` to `fetch()` requests for protected routes

Example usage:

```js
await fetch("http://localhost:3001/led", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`
  },
  body: JSON.stringify({ state: true })
});
```

---

### Validation and Testing

* Requests **without a token** receive `401 Unauthorized`
* Requests **with a valid, signed token** are authorized
* The API terminal logs messages such as:

```bash
Valid token: { sub: 'my-client', scope: 'default', ... }
```

---

### Result

The REST API now only accepts sensitive commands from **authorized clients**.
The web dashboard integrates seamlessly with the OAuth 2.0 `client_credentials` flow, enabling secure and silent authentication for all relevant operations.

---

## Final Execution Sequence for the Complete Web of Things System

This section presents the **full and final sequence** for running the complete Web of Things (WoT) system with:

* Web Interface
* REST API with SQLite
* Real-time charts and CRUD support
* MQTT integration with sensors and actuators
* OAuth 2.0 + JWT-based authentication
* Thing Descriptions (TDs) with token protection
* Optional WoT Client integration

---

## Project Folder Structure (Expected)

```
/Systems_Integration/
├── oauth/
│   ├── auth-server.js        ← OAuth 2.0 Authorization Server
│   ├── api.js                ← REST API (JWT-protected)
│   ├── mqtt_logger.js        ← MQTT to SQLite Logger (optional)
│   ├── public.pem            ← Public RSA Key for JWT validation
│   ├── private.pem           ← Private RSA Key for JWT signing
│   └── sensor_data.db        ← SQLite Database
├── web/
│   └── index.html            ← Full-featured Web Dashboard
├── td/
│   ├── esp32-thing.jsonld
│   ├── dht11-thing.jsonld
│   ├── mpu6050-thing.jsonld
│   └── led-thing.jsonld
├── consumer/ (optional)
│   └── consumer.js           ← WoT Client using node-wot
```

---

## STEP 1 — Start All Servers

### 1. Start the OAuth 2.0 Authorization Server

```bash
cd Systems_Integration/oauth
node auth-server.js
```

> Port: 3000 — Issues JWT access tokens

---

### 2. Start the JWT-Protected REST API

```bash
cd Systems_Integration/oauth
node api.js
```

> Port: 3001 — Serves sensor data with authentication

---

### 3. (Optional) Start the MQTT → SQLite Logger

```bash
node mqtt_logger.js
```

> Records MQTT sensor data into the SQLite database

---

### 4. Start the Web Dashboard

```bash
http-server ./web
```

> Accessible at:
> [http://localhost:8080](http://localhost:8080)

---

## STEP 2 — Test in the Browser

Once the panel is opened:

1. It automatically requests a token from the OAuth server
2. It displays real-time charts (temperature, humidity, motion, gyroscope)
3. It shows the latest sensor records (`/sensors` route)
4. It allows the user to:

   * Turn the LED on/off via REST
   * Edit `payload` fields
   * Delete sensor log entries

In the terminal running the REST API, you should see logs such as:

```bash
Valid token: { sub: 'my-client', scope: 'default', ... }
```

---

## STEP 3 — Optional: Test the WoT Client

### 1. Install Required Dependencies

```bash
cd Systems_Integration/consumer
npm install @node-wot/core @node-wot/binding-http @node-wot/binding-mqtt @node-wot/binding-file
```

### 2. Run the WoT Client

```bash
node consumer.js
```

> This client reads the Thing Description and interacts with the system using a valid OAuth 2.0 token automatically.

---

## STEP 4 — Security Validation

* Access the REST API manually **without a token** → returns `401 Unauthorized`
* Access the API **with a valid token** → authorized
* Use browser DevTools (F12 → Network) to confirm the use of:

```
Authorization: Bearer eyJ...
```

## Consuming Things with OAuth 2.0 (WoT Consumers)

The system implements three distinct WoT consumers that interact with devices described by Thing Descriptions secured via **OAuth 2.0**. Each consumer is built using the `@node-wot/core` package and the **MQTT binding**, with authentication performed through the **client\_credentials** grant flow.

---

### OAuth 2.0 Security in the Consumers

All consumers follow the same authentication pattern:

```js
servient.addCredentials({
  "urn:dev:wot:[thing-id]": {
    clientId: "my-client",
    clientSecret: "my-secret",
    token: "http://localhost:3000/token"
  }
});
```

This setup allows each consumer to automatically request an access token and interact with protected Things.

---

## `consumer-dht11.js` – Reading Temperature and Humidity

This consumer accesses the TD `dht11-thing.jsonld` and reads the `temperature` and `humidity` properties.

**Example Code:**

```js
const temp = await thing.readProperty("temperature");
const hum = await thing.readProperty("humidity");
```

**Execution:**

```bash
cd Systems_Integration/consumer
node consumer-dht11.js
```

---

## `consumer-mpu6050.js` – Reading Acceleration and Subscribing to Events

This consumer interacts with the TD `mpu6050-thing.jsonld` and performs:

* Reading the `acceleration` property (AcX, AcY, AcZ)
* Subscribing to the `motionAlert` event

**Example Code:**

```js
const accel = await thing.readProperty("acceleration");
thing.subscribeEvent("motionAlert", (data) => {
  console.log("Motion Alert:", data);
});
```

**Execution:**

```bash
node consumer-mpu6050.js
```

---

## `consumer-led.js` – Controlling the Actuator (LED)

This consumer uses the TD `led-thing.jsonld` to send MQTT commands with payloads `"1"` and `"0"` to turn the LED on and off.

The `state` property in the TD was defined as:

```json
"type": "string",
"enum": ["0", "1"]
```

**Example Code:**

```js
await thing.writeProperty("state", "1"); // Turn ON
await thing.writeProperty("state", "0"); // Turn OFF
```

**Execution:**

```bash
node consumer-led.js
```

---

## Thing Descriptions Used

* `dht11-thing.jsonld`: exposes `temperature` and `humidity` over MQTT
* `mpu6050-thing.jsonld`: exposes `acceleration` and `motionAlert` event
* `led-thing.jsonld`: exposes the `state` property for LED control

All Thing Descriptions implement the following security definition:

```json
"securityDefinitions": {
  "oauth2_auth": {
    "scheme": "oauth2",
    "flow": "client",
    "token": "http://localhost:3000/token",
    "scopes": ["default"]
  }
},
"security": ["oauth2_auth"]
```

---

## Conclusion

This stage demonstrates:

* Advanced usage of Web of Things with OAuth 2.0 authentication
* Secure consumption of multiple Things
* Full interoperability with real-world sensors and actuators (ESP32 + MQTT)
* Clear separation of concerns through distinct Thing Descriptions and consumer modules

Each consumer is modular and secure, reinforcing key principles of **interoperability**, **security**, and **scalability** in IoT systems.



---
# Technical Report — Integration of CRUD and Real-Time Charts in the WoT Web Dashboard

---

## Objective

Integrate an interactive web dashboard with the following capabilities:

* Full CRUD support via a REST API protected by OAuth 2.0 (JWT)
* Real-time charts using MQTT over WebSocket
* Remote LED control
* Data filtering by MQTT topic
* Manual data entry support

---

## Issues Encountered During Implementation

---

### 1. API Could Not Access the Database Properly

* **Cause:** The `api.js` file was moved to the `/oauth` directory but still referenced `sensor_data.db` using a relative path.
* **Error:** The API returned a 500 status and the message `data.forEach is not a function`.
* **Solution:** Used `__dirname` to generate an absolute path:

```js
const dbPath = path.join(__dirname, "..", "sensor_data.db");
```

---

### 2. Missing `toggleLED()` Function in the Web Panel

* **Cause:** The `toggleLED()` function was not included in the HTML script.
* **Symptom:** Clicking the "Turn ON" or "Turn OFF" buttons caused the error `toggleLED is not defined`.
* **Solution:** The function was added to the main `<script>` section of the HTML file.

---

### 3. Real-Time Charts Were Not Working

* **Cause:** The MQTT WebSocket connection on port 9001 was failing.
* **Error:** Running `mosquitto_sub -p 9001` returned `network protocol error`.

---

## Diagnosing the Mosquitto WebSocket Issue

* Mosquitto was only listening on port 1883 (standard TCP), while browsers require WebSocket.
* The original `mosquitto.conf` file did **not include `protocol websockets`**.

---

### Solution Applied

#### 1. Updated `mosquitto.conf` File:

```ini
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true
```

#### 2. Restarted Mosquitto with the Corrected Configuration:

```bash
mosquitto -v -c C:\mosquitto\conf\mosquitto.conf
```

#### 3. Result:

* Port 9001 activated: `Opening websockets listen socket on port 9001`
* Verified using `netstat`: Port 9001 was `LISTENING`
* Real-time charts became operational immediately after restart

---

## Real-Time Charts and MQTT Events

* `sensor/temperature` and `sensor/humidity`: plotted in real-time
* `sensor/motion`: plots acceleration (AcX, AcY, AcZ) and gyroscope (GyX, GyY, GyZ)
* `alert/climate` and `alert/motion`: trigger visual alerts via the `showAlert()` function

---

## Manual Testing Performed

| Component                   | Status                           |
| --------------------------- | -------------------------------- |
| LED control via buttons     | ✅ Functional                     |
| CRUD (POST, PUT, DELETE)    | ✅ Functional                     |
| Topic filtering             | ✅ Functional                     |
| Manual entry insertion      | ✅ Functional                     |
| MQTT WebSocket              | ✅ Functional after Mosquitto fix |
| Real-time charts (Chart.js) | ✅ Functional                     |
| MQTT from ESP32             | ✅ Functional                     |
| OAuth 2.0 protection        | ✅ Functional                     |

---
## Manual LED Control Priority Logic (ESP32)

This section describes the logic implemented in the ESP32 firmware to handle LED control priority between automatic alerts and manual commands issued from the web interface.

---

### Manual Command Priority for LED Control

In the embedded system running on the ESP32, the LED can be triggered automatically by two types of alerts:

* **Motion Alert** (`motionAlert`)
* **Climate Alert** (`climateAlert`)

However, a temporary **priority mechanism** was added to allow **manual control via the Web Interface** using the MQTT topic `actuator/led`.

---

### How It Works

* When the user sends a `"1"` or `"0"` command through the interface, the LED immediately adopts that manual state.
* This manual state **takes priority over automatic alerts for a duration of 10 seconds**.
* After this period, the system reverts to automatic alert-based control.

---

### Rationale

This logic prevents the LED from staying on **indefinitely**, even after the user tries to turn it off, which would otherwise happen if alerts remain active in the background.

---

### Code Implementation

* A variable named `lastManualControl` stores the timestamp of the last manual command.
* The control condition checks whether the manual override is still in effect:

```cpp
bool override = (millis() - lastManualControl < overrideDuration);
if (override) {
  digitalWrite(LED_PIN, ledState);
} else {
  digitalWrite(LED_PIN, (motionAlert || climateAlert));
}
```

---

### Override Duration

* The default duration of manual command priority is **10 seconds**.
* This can be adjusted easily by modifying the constant:

```cpp
const unsigned long overrideDuration = 10000; // in milliseconds
```

---

This mechanism ensures responsive control of the actuator and improves user experience by temporarily suppressing automatic behavior when a manual command is issued. 

---

# Technical Manual – Implementation of Button Logic for Sleep Mode

## Objective

Implement logic so that the **physical button connected to the ESP32** works as a **Sleep Mode switch**, allowing the system to be **completely paused** (sensors, alerts, LED, MQTT publications) and **resumed** by pressing the button again.

---

## Implemented Logic

### Desired behavior:

* **Press the button once** → Sleep Mode is activated:

  * LED is turned off.
  * The system stops sending sensor data and alerts.
  * A `"Sleep Mode activated"` message is sent via MQTT.

* **Press again** → Sleep Mode is deactivated:

  * The system resumes normal operation.
  * LED returns to automatic control.
  * A `"Sleep Mode deactivated"` message is sent via MQTT.

---

## Involved Components

| Component                    | Function                                  |
| ---------------------------- | ----------------------------------------- |
| **ESP32**                    | Controls sensors, LED, and button logic   |
| **Physical Button** (GPIO 4) | Digital input using `INPUT_PULLUP`        |
| **Mosquitto**                | MQTT broker                               |
| **mqtt\_logger.js**          | Logs messages into the SQLite database    |
| **index.html**               | Web interface using MQTT.js and Bootstrap |
| **api.js**                   | (No changes needed)                       |

---

## Code on ESP32 (`main.cpp`)

### 1. Definitions:

```cpp
#define BUTTON_PIN 4
bool sleepMode = false;
bool lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;
```

### 2. `checkButton()` function with debounce:

```cpp
void checkButton() {
  bool currentState = digitalRead(BUTTON_PIN);
  unsigned long now = millis();

  if (currentState != lastButtonState && currentState == LOW && (now - lastDebounceTime > debounceDelay)) {
    sleepMode = !sleepMode;

    if (sleepMode) {
      Serial.println("[BUTTON] Sleep Mode activated");
      digitalWrite(LED_PIN, LOW);
      ledState = false;
      client.publish("alert/button", "Sleep Mode activated");
    } else {
      Serial.println("[BUTTON] Sleep Mode deactivated");
      client.publish("alert/button", "Sleep Mode deactivated");
    }

    lastDebounceTime = now;
  }

  lastButtonState = currentState;
}
```

### 3. Full system pause in `loop()`:

```cpp
checkButton(); // Always check first

if (sleepMode) {
  Serial.println("[SLEEP MODE] System is paused.");
  digitalWrite(LED_PIN, LOW);
  return; // Exit loop early
}
```

---

## MQTT Publication

### Topic used:

* `alert/button`

### Payloads:

* `"Sleep Mode activated"`
* `"Sleep Mode deactivated"`

These messages are:

* Captured by the web interface (via MQTT.js)
* Automatically stored by `mqtt_logger.js` in the SQLite database (`sensor_logs`)

---

## Web Interface (`index.html`)

### 1. MQTT subscription:

```js
mqttClient.subscribe("alert/button");
```

### 2. Message handler:

```js
else if (topic === "alert/button") {
  showAlert("Sleep Mode: " + payload, "info");
}
```

### 3. Displayed alert:

```html
<div class="alert alert-info">Sleep Mode: Sleep Mode activated</div>
```

---

## Database Storage

The script `mqtt_logger.js` is already configured to store the topic `alert/button`. Each activation or deactivation of sleep mode is recorded as a new entry in the SQLite database.

---

## Validation

| Action               | Expected Result                               |
| -------------------- | --------------------------------------------- |
| Button pressed       | LED turns off, sensors pause, MQTT alert sent |
| Button pressed again | LED turns on, sensors resume, MQTT alert sent |
| Web Interface        | Displays a visual alert using Bootstrap       |
| MQTT Logger          | Saves the event in `sensor_data.db`           |

---

## Final Considerations

* The button acts as a **simple toggle** with debounce and MQTT publishing.
* The logic is **safe, stable, and scalable** for use with other devices.
* No changes were needed in `api.js` since control logic is internal to the ESP32.
* Integration with the web dashboard follows the existing alert standard.














