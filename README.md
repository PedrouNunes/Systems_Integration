# **Manual explaining how the system was implemented**

---

# **Step 1 — Set Up the Development Environment**

This step will prepare the computer to run the entire Web of Things (WoT) system by installing and configuring the required tools. These tools will support backend development, MQTT communication, database storage, and frontend visualization.

## **1.1. Install Node.js**

The system uses Node.js for:

* The REST API
* The HTTP server for Thing Descriptions
* MQTT logging and consumers
* OAuth 2.0 authentication server

### Instructions:

1. Visit the official Node.js website:
   [https://nodejs.org](https://nodejs.org)
2. Download the **LTS version (Recommended for most users)**.
3. Run the installer:

   * Accept the license agreement.
   * Allow it to add Node.js to the system PATH.
4. Open PowerShell and test the installation:

   ```powershell
   node -v
   npm -v
   ```

   You should see two version numbers displayed.

## **1.2. Install Mosquitto (MQTT Broker)**

Mosquitto acts as the message broker for all MQTT communication in the system. It must support both standard MQTT (port 1883) and MQTT over WebSocket (port 9001).

### Instructions:

1. Download Mosquitto for Windows from:
   [https://mosquitto.org/download/](https://mosquitto.org/download/)
2. Extract the ZIP archive to a permanent folder, e.g.:

   ```
   C:\mosquitto
   ```
3. Create a configuration file:

   * Path: `C:\mosquitto\conf\mosquitto.conf`
   * Contents:

     ```conf
     listener 1883
     protocol mqtt

     listener 9001
     protocol websockets

     allow_anonymous true
     ```
4. To allow external devices (like the ESP32) to publish data, open PowerShell and run:

   ```powershell
   New-NetFirewallRule -DisplayName "Mosquitto MQTT" -Direction Inbound -LocalPort 1883 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Mosquitto WebSocket" -Direction Inbound -LocalPort 9001 -Protocol TCP -Action Allow
   ```
5. Start Mosquitto using the custom config:

   ```powershell
   cd C:\mosquitto
   .\mosquitto.exe -c .\conf\mosquitto.conf -v
   ```

   If successful, you should see a log line indicating that ports 1883 and 9001 are open.

## **1.3. Install SQLite (Command-Line Version)**

SQLite will be used to store historical sensor data locally. You'll use the CLI to inspect the database.

### Instructions:

1. Download the **SQLite command-line tools** ZIP for Windows from:
   [https://www.sqlite.org/download.html](https://www.sqlite.org/download.html)
2. Extract the folder (e.g., to `C:\sqlite`)
3. Add the folder to the Windows PATH:

   * Open Control Panel > System > Advanced system settings > Environment Variables
   * Under "System variables", select "Path" > Edit > New
   * Add:

     ```
     C:\sqlite
     ```
4. Restart PowerShell and verify installation:

   ```powershell
   sqlite3 --version
   ```

## **1.4. Install http-server for Frontend Testing**

You will serve the web interface locally using `http-server`.

### Instructions:

In PowerShell:

```powershell
npm install -g http-server
```

You can now serve any folder with HTML content:

```powershell
http-server ./web
```

---

# **Step 2 — Create the Project Folder Structure and Initialize Node.js Modules**

This step will define the correct structure for your WoT project and prepare each directory with the necessary Node.js environment.

---

## **2.1. Create the Project Base Folder**

Open PowerShell and run the following commands to create the base directory:

```powershell
mkdir C:\WoT\Systems_Integration
cd C:\WoT\Systems_Integration
```

You will use this directory as the root for the entire system.

---

## **2.2. Create the Subfolders**

Now create all required subdirectories for different components:

```powershell
mkdir oauth
mkdir td
mkdir web
mkdir web\css
mkdir consumer
```

Explanation of each folder:

| Folder      | Purpose                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| `oauth/`    | Stores the REST API (`api.js`), MQTT logger, OAuth server, and JWT keys |
| `td/`       | Stores the Thing Descriptions (`*.jsonld`)                              |
| `web/`      | Contains the HTML dashboard                                             |
| `web/css/`  | Stores CSS files like `bootstrap.min.css`                               |
| `consumer/` | (Optional) Node.js clients to consume TDs using WoT libraries           |

---

## **2.3. Initialize the Node.js Projects**

### Initialize in the root folder (optional but good practice):

```powershell
npm init -y
```

> This creates a `package.json` file in `Systems_Integration`.

### Initialize in the `oauth/` folder where Node.js scripts will be executed:

```powershell
cd oauth
npm init -y
```

> You can edit the `name`, `version`, and `description` later if needed.

---

## **2.4. Install Required NPM Dependencies**

Run the following command inside the `oauth/` folder:

```powershell
npm install express mqtt sqlite3 cors body-parser jsonwebtoken
```

These dependencies are used for:

| Package        | Purpose                                   |
| -------------- | ----------------------------------------- |
| `express`      | HTTP server for REST API and OAuth server |
| `mqtt`         | MQTT client to interact with the broker   |
| `sqlite3`      | Local database access                     |
| `cors`         | Allow cross-origin requests between ports |
| `body-parser`  | Parse incoming JSON payloads              |
| `jsonwebtoken` | Create and verify JWT access tokens       |

---

## **2.5. Prepare the Web Folder**

Copy or download the [Bootstrap CSS](https://getbootstrap.com/docs/5.3/getting-started/download/) file into:

```
web/css/bootstrap.min.css
```

You will use this stylesheet for styling the web interface (`index.html`).

---

## **2.6. Place the Database File Outside oauth/**

The SQLite database must reside in the root folder (`Systems_Integration/`), not inside `oauth/`.

You don’t need to create it manually—it will be generated automatically by the `mqtt_logger.js` script later.

Expected path:

```
C:\WoT\Systems_Integration\sensor_data.db
```

---

When all these steps are complete, your folder structure should look like this:

```
Systems_Integration/
├── oauth/
│   ├── api.js
│   ├── mqtt_logger.js
│   ├── auth-server.js
│   ├── public.pem
│   ├── private.pem
│   └── package.json
├── td/
│   └── *.jsonld
├── web/
│   ├── index.html
│   └── css/
│       └── bootstrap.min.css
├── consumer/
│   └── *.js (optional)
├── sensor_data.db  (created later)
```

---

# **Step 3 — Configure Mosquitto and Test MQTT Communication Locally**

In this step, you will configure the Mosquitto broker to support both standard MQTT and MQTT over WebSocket, and verify that MQTT messages are being published and received correctly using PowerShell.

---

## **3.1. Edit the Mosquitto Configuration File**

Open the file located at:

```
C:\mosquitto\conf\mosquitto.conf
```

If it does not exist, create it manually.

Paste the following content into the file:

```conf
# MQTT over TCP
listener 1883
protocol mqtt

# MQTT over WebSocket (for browser clients)
listener 9001
protocol websockets

# Allow unauthenticated clients (for development only)
allow_anonymous true
```

**Important**: Both ports must be open for communication from the ESP32 and web interface.

---

## **3.2. Open the Required Ports on Windows Firewall**

Open PowerShell **as Administrator** and execute:

```powershell
New-NetFirewallRule -DisplayName "Mosquitto MQTT" -Direction Inbound -Protocol TCP -LocalPort 1883 -Action Allow
New-NetFirewallRule -DisplayName "Mosquitto WebSocket" -Direction Inbound -Protocol TCP -LocalPort 9001 -Action Allow
```

This step allows MQTT clients (like ESP32 or browser) to connect to the broker.

---

## **3.3. Start Mosquitto with the Configuration File**

In PowerShell (standard user), run:

```powershell
cd C:\mosquitto
.\mosquitto.exe -c .\conf\mosquitto.conf -v
```

You should see output confirming that Mosquitto is listening on ports 1883 and 9001, like:

```
Opening ipv4 listen socket on port 1883.
Opening websockets listen socket on port 9001.
```

Keep this terminal open and running during the entire system operation.

---

## **3.4. Publish and Subscribe with PowerShell (Local MQTT Test)**

In another PowerShell window, test Mosquitto with the built-in command-line tools.

### Subscribe to all topics:

```powershell
mosquitto_sub -h localhost -t "#" -v
```

Leave this window open to observe incoming messages.

### Publish a test message:

```powershell
mosquitto_pub -h localhost -t "test/topic" -m "Hello, MQTT"
```

You should see the following output in the subscriber window:

```
test/topic Hello, MQTT
```

---

## **3.5. Use the Actual MQTT Topics of the System**

Try publishing to one of the real topics that the ESP32 will use:

```powershell
mosquitto_pub -h localhost -t "sensor/temperature" -m "22.5"
mosquitto_pub -h localhost -t "actuator/led" -m "1"
```

If the messages appear in your subscriber window, then Mosquitto is functioning correctly.

---

## **3.6. Network Access Check (From ESP32 or Other Devices)**

To ensure that other devices (e.g., ESP32) can reach the broker, verify the IP address of the host machine:

```powershell
ipconfig
```

Find your IPv4 address under your active network adapter (e.g., `192.168.1.241`), and use this in the ESP32 code when connecting to the broker.

---

**Summary of This Step**:

* Mosquitto is configured for both TCP and WebSocket
* Ports 1883 and 9001 are opened
* Local publish/subscribe tests are successful
* Broker IP is verified for use in other components
---

# **Step 4 — Implement MQTT Logger and Create the SQLite Database Automatically**

This step creates a Node.js script that subscribes to MQTT topics and stores all incoming messages into a SQLite database. This enables the system to maintain a persistent history of sensor readings and alerts.

---

## **4.1. Confirm the Location of the Database**

The database file must be placed in the **root of the project**, not inside the `oauth/` folder:

```
C:\WoT\Systems_Integration\sensor_data.db
```

The script `mqtt_logger.js` will automatically create this file and the required table if it does not exist.

---

## **4.2. Create the MQTT Logger Script**

Navigate to the `oauth` folder in PowerShell:

```powershell
cd C:\WoT\Systems_Integration\oauth
```

Create a new file named `mqtt_logger.js` and paste the following code into it:

```javascript
// mqtt_logger.js

const mqtt = require("mqtt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Use absolute path to ensure correct location outside "oauth"
const dbPath = path.join(__dirname, "..", "sensor_data.db");

// Connect to SQLite database
const db = new sqlite3.Database(dbPath);

// Create the table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS sensor_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT,
    payload TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("[LOGGER] Database connected.");

// Connect to the MQTT broker
const client = mqtt.connect("mqtt://localhost");

client.on("connect", () => {
  console.log("[LOGGER] Connected to MQTT broker.");

  // Subscribe to sensor and alert topics
  const topics = [
    "sensor/temperature",
    "sensor/humidity",
    "sensor/motion",
    "alert/climate",
    "alert/motion",
    "alert/button"
  ];

  client.subscribe(topics, (err) => {
    if (err) {
      console.error("[LOGGER] Subscription failed:", err.message);
    } else {
      console.log("[LOGGER] Subscribed to topics:", topics.join(", "));
    }
  });
});

// Handle incoming messages and store in the database
client.on("message", (topic, message) => {
  const payload = message.toString();

  db.run(
    "INSERT INTO sensor_logs (topic, payload) VALUES (?, ?)",
    [topic, payload],
    (err) => {
      if (err) {
        console.error("[LOGGER] DB Insert Error:", err.message);
      } else {
        console.log(`[LOGGER] Saved: ${topic} → ${payload}`);
      }
    }
  );
});
```

---

## **4.3. Execute the Logger**

From within the `oauth/` folder, run:

```powershell
node mqtt_logger.js
```

Expected console output:

```
[LOGGER] Database connected.
[LOGGER] Connected to MQTT broker.
[LOGGER] Subscribed to topics: sensor/temperature, sensor/humidity, ...
```

Then try sending test messages in another PowerShell window:

```powershell
mosquitto_pub -h localhost -t "sensor/temperature" -m "23.7"
mosquitto_pub -h localhost -t "alert/motion" -m "Motion Detected"
```

You should see confirmation messages in the logger window like:

```
[LOGGER] Saved: sensor/temperature → 23.7
[LOGGER] Saved: alert/motion → Motion Detected
```

And the file `sensor_data.db` will be created in the `Systems_Integration/` root folder.

---

## **4.4. Inspect the Database (Optional)**

You can open the database using PowerShell:

```powershell
cd C:\WoT\Systems_Integration
sqlite3 sensor_data.db
```

Inside the SQLite CLI:

```sql
.tables
SELECT * FROM sensor_logs;
```

Use `.exit` to leave the SQLite prompt.

---

**Summary of This Step**:

* MQTT logger subscribes to all system topics
* Incoming messages are stored in `sensor_logs` table
* Database is automatically created in the correct path
* Compatible with any MQTT message format (plain or JSON)

---

# **Step 5 — Implement the REST API with Data Access and LED Control**

This step creates a secure and extensible RESTful API using Node.js. The API will:

* Retrieve sensor data from the SQLite database
* Send MQTT commands to control the LED actuator
* Serve as the backend for your web dashboard

---

## **5.1. Create the API Script**

Navigate to the `oauth` folder:

```powershell
cd C:\WoT\Systems_Integration\oauth
```

Create a new file named `api.js` and add the following code:

```javascript
// api.js

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3001;

// Use middleware
app.use(cors());
app.use(bodyParser.json());

// Use absolute path to database file
const dbPath = path.join(__dirname, "..", "sensor_data.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[API] SQLite connection error:", err.message);
  } else {
    console.log("[API] Connected to SQLite database.");
  }
});

// MQTT client connection
const mqttClient = mqtt.connect("mqtt://localhost");

mqttClient.on("connect", () => {
  console.log("[API] Connected to MQTT broker.");
});

// Route: Get last 50 sensor records
app.get("/sensors", (req, res) => {
  const sql = "SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 50";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Route: Get last 50 records by topic
app.get("/sensors/:topic", (req, res) => {
  const { topic } = req.params;
  const sql = "SELECT * FROM sensor_logs WHERE topic = ? ORDER BY timestamp DESC LIMIT 50";
  db.all(sql, [topic], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Route: Control the LED via MQTT
app.post("/led", (req, res) => {
  const { state } = req.body;

  if (typeof state !== "boolean") {
    return res.status(400).json({ error: "Missing or invalid 'state' (boolean)" });
  }

  const payload = state ? "1" : "0";

  mqttClient.publish("actuator/led", payload, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`[API] LED command sent: ${payload}`);
    res.json({ message: `LED turned ${state ? "on" : "off"}` });
  });
});

app.listen(PORT, () => {
  console.log(`[API] Server running at http://localhost:${PORT}`);
});
```

---

## **5.2. Run the REST API**

In PowerShell (in the `oauth` folder):

```powershell
node api.js
```

You should see:

```
[API] Connected to SQLite database.
[API] Connected to MQTT broker.
[API] Server running at http://localhost:3001
```

---

## **5.3. Test the API Using PowerShell**

### Send LED ON command:

```powershell
Invoke-WebRequest -Uri http://localhost:3001/led `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "state": true }'
```

### Get all recent sensor logs:

```powershell
Invoke-WebRequest -Uri http://localhost:3001/sensors
```

### Get logs by topic:

```powershell
Invoke-WebRequest -Uri http://localhost:3001/sensors/sensor/temperature
```

You should receive a JSON response with the data.

---

## **5.4. Add Routes for Update and Delete (CRUD)**

Later, we will extend this file to support `PUT` and `DELETE` for CRUD from the web dashboard.

---

**Summary of This Step**:

* REST API is fully functional
* Retrieves sensor data from the SQLite database
* Sends MQTT commands to control the LED
* Ready for integration with the frontend

---

# **Step 6 — Create and Serve Thing Descriptions (.jsonld files)**

This step ensures that all components of your WoT system (sensors and actuators) are described using the official W3C Thing Description format (JSON-LD), and that they are accessible over HTTP.

---

## **6.1. What is a Thing Description (TD)?**

A Thing Description is a machine-readable file in JSON-LD format that describes:

* What the device does (its properties, actions, events)
* How to interact with it (via MQTT, HTTP, etc.)
* Security and metadata information

You will create a TD for:

* The temperature and humidity sensor (`dht11-thing.jsonld`)
* The motion sensor (`mpu6050-thing.jsonld`)
* The LED actuator (`led-thing.jsonld`)
* The ESP32 as a composite device (`esp32-thing.jsonld`)

---

## **6.2. Create the TD Files**

Navigate to the `td` folder:

```powershell
cd C:\WoT\Systems_Integration\td
```

Create the following four files.

---

### **dht11-thing.jsonld**

```json
{
  "@context": "https://www.w3.org/2019/wot/td/v1",
  "title": "DHT11 Sensor",
  "id": "urn:dev:wot:dht11",
  "securityDefinitions": {
    "nosec_sc": { "scheme": "nosec" }
  },
  "security": ["nosec_sc"],
  "properties": {
    "temperature": {
      "type": "string",
      "forms": [{
        "op": "readproperty",
        "href": "mqtt://localhost/sensor/temperature",
        "contentType": "text/plain",
        "subprotocol": "mqtt"
      }]
    },
    "humidity": {
      "type": "string",
      "forms": [{
        "op": "readproperty",
        "href": "mqtt://localhost/sensor/humidity",
        "contentType": "text/plain",
        "subprotocol": "mqtt"
      }]
    }
  }
}
```

---

### **mpu6050-thing.jsonld**

```json
{
  "@context": "https://www.w3.org/2019/wot/td/v1",
  "title": "MPU6050 Sensor",
  "id": "urn:dev:wot:mpu6050",
  "securityDefinitions": {
    "nosec_sc": { "scheme": "nosec" }
  },
  "security": ["nosec_sc"],
  "properties": {
    "acceleration": {
      "type": "object",
      "forms": [{
        "op": "readproperty",
        "href": "mqtt://localhost/sensor/motion",
        "contentType": "application/json",
        "subprotocol": "mqtt"
      }]
    }
  },
  "events": {
    "motionAlert": {
      "forms": [{
        "op": "subscribeevent",
        "href": "mqtt://localhost/alert/motion",
        "subprotocol": "mqtt"
      }]
    }
  }
}
```

---

### **led-thing.jsonld**

```json
{
  "@context": "https://www.w3.org/2019/wot/td/v1",
  "title": "LED Actuator",
  "id": "urn:dev:wot:led",
  "securityDefinitions": {
    "nosec_sc": { "scheme": "nosec" }
  },
  "security": ["nosec_sc"],
  "properties": {
    "state": {
      "type": "string",
      "enum": ["0", "1"],
      "forms": [{
        "op": "writeproperty",
        "href": "mqtt://localhost/actuator/led",
        "contentType": "text/plain",
        "subprotocol": "mqtt"
      }]
    }
  }
}
```

---

### **esp32-thing.jsonld**

```json
{
  "@context": "https://www.w3.org/2019/wot/td/v1",
  "title": "ESP32 Composite Device",
  "id": "urn:dev:wot:esp32",
  "securityDefinitions": {
    "nosec_sc": { "scheme": "nosec" }
  },
  "security": ["nosec_sc"],
  "properties": {
    "temperature": {
      "type": "string",
      "forms": [{
        "op": "readproperty",
        "href": "mqtt://localhost/sensor/temperature",
        "subprotocol": "mqtt"
      }]
    },
    "motion": {
      "type": "object",
      "forms": [{
        "op": "readproperty",
        "href": "mqtt://localhost/sensor/motion",
        "subprotocol": "mqtt"
      }]
    },
    "ledState": {
      "type": "string",
      "forms": [{
        "op": "writeproperty",
        "href": "mqtt://localhost/actuator/led",
        "subprotocol": "mqtt"
      }]
    }
  }
}
```

---

## **6.3. Serve the TDs Over HTTP**

Navigate to the root of the project and create a file named `server.js`:

```powershell
cd C:\WoT\Systems_Integration
```

Then paste the following code:

```javascript
// server.js

const express = require("express");
const path = require("path");

const app = express();
const PORT = 8080;

app.use("/td", express.static(path.join(__dirname, "td")));

app.get("/", (req, res) => {
  res.send("WoT Server is active! Visit /td to view the Thing Descriptions.");
});

app.listen(PORT, () => {
  console.log(`Thing Description server running at http://localhost:${PORT}/td`);
});
```

---

## **6.4. Install Express and Run the Server**

If not already installed in the root folder:

```powershell
npm install express
```

Then start the server:

```powershell
node server.js
```

Access your Thing Descriptions in a browser:

* [http://localhost:8080/td/dht11-thing.jsonld](http://localhost:8080/td/dht11-thing.jsonld)
* [http://localhost:8080/td/mpu6050-thing.jsonld](http://localhost:8080/td/mpu6050-thing.jsonld)
* [http://localhost:8080/td/led-thing.jsonld](http://localhost:8080/td/led-thing.jsonld)

You should see the JSON-LD content in the browser.

---

**Summary of This Step**:

* All physical components are described using W3C WoT Thing Descriptions
* TDs are served via a local HTTP server for use by external tools or consumers

---


# **Step 7 — Build the Web Dashboard and Display Real-Time Data**

This step will create a full-featured web interface that connects to the REST API and MQTT broker, displays real-time sensor data using Chart.js, and allows control of the LED. The interface will also display stored historical data from the database.

---

## **7.1. Prepare the HTML File**

Navigate to the `web` folder:

```powershell
cd C:\WoT\Systems_Integration\web
```

Create a file named `index.html`. Copy the index.html from this rep.

---

## **7.2. Run the Web Interface**

Use PowerShell to launch the dashboard with `http-server`:

```powershell
cd C:\WoT\Systems_Integration\web
http-server
```

It will serve the content on `http://localhost:8080` by default. Open it in your browser.

---

## **7.3. Verify Functionality**

From the browser:

* LED buttons should send REST API commands
* Sensor data should load in the table
* Real-time charts should update automatically when the ESP32 publishes to `sensor/motion`
* Alerts from MQTT should appear as browser notifications

You may test manually via PowerShell:

```powershell
mosquitto_pub -h localhost -t "sensor/motion" -m "{\"AcX\":1000,\"AcY\":200,\"AcZ\":500,\"GyX\":40,\"GyY\":-22,\"GyZ\":5}"
```

---

**Summary of This Step**:

* Dashboard shows real-time acceleration and gyroscope charts
* Table displays the latest 50 logs from SQLite
* REST API controls the LED
* Alerts and events are received live via MQTT over WebSocket

---

# **Step 8 — Add Full CRUD Operations to the Web Dashboard**

This step enables users to edit or delete sensor records directly from the browser using modals and buttons. It also ensures the backend (API) handles the update and delete operations securely.

---

## **8.1. Extend the REST API with PUT and DELETE**

Navigate to your `oauth` folder:

```powershell
cd C:\WoT\Systems_Integration\oauth
```

Edit the `api.js` file and add the following code below the existing routes:

```javascript
// Update sensor record by ID
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

// Delete sensor record by ID
app.delete("/sensors/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM sensor_logs WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  });
});
```

Restart the API server to apply the changes:

```powershell
node api.js
```

---

## **8.2. Update the Web Interface to Support Edit/Delete**

Edit the `index.html` in the `web/` folder and update the `<table>` and `<script>`.

### Modify the `<thead>` inside the table to include an Actions column:

```html
<thead>
  <tr>
    <th>ID</th>
    <th>Topic</th>
    <th>Payload</th>
    <th>Timestamp</th>
    <th>Actions</th>
  </tr>
</thead>
```

### Update the JavaScript `loadData()` function to add buttons dynamically:

Replace the `forEach` block inside `loadData()` with:

```javascript
data.forEach(row => {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${row.id}</td>
    <td>${row.topic}</td>
    <td>${row.payload}</td>
    <td>${row.timestamp}</td>
    <td>
      <button class="btn btn-sm btn-warning me-1" onclick="openEditModal(${row.id}, '${row.payload}')">Edit</button>
      <button class="btn btn-sm btn-danger" onclick="deleteEntry(${row.id})">Delete</button>
    </td>
  `;

  tbody.appendChild(tr);
});
```

---

## **8.3. Add the Edit Modal**

Paste this HTML just before the closing `</body>` tag:

```html
<!-- Edit Modal -->
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

---

## **8.4. Add the Supporting JavaScript Functions**

Below the `loadData()` function, add:

```javascript
function openEditModal(id, payload) {
  document.getElementById("editId").value = id;
  document.getElementById("editPayload").value = payload;
  new bootstrap.Modal(document.getElementById("editModal")).show();
}

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
    alert("Payload updated!");
    loadData();
  } else {
    alert("Update failed: " + result.error);
  }

  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
}

async function deleteEntry(id) {
  if (!confirm(`Are you sure you want to delete entry ID ${id}?`)) return;

  const res = await fetch(`http://localhost:3001/sensors/${id}`, {
    method: "DELETE"
  });

  const result = await res.json();

  if (res.ok) {
    alert("Entry deleted.");
    loadData();
  } else {
    alert("Delete failed: " + result.error);
  }
}
```

---

## **8.5. Refresh the Page and Test CRUD Features**

In the browser:

* Click the "Edit" button next to any row → modify the payload → click Save.
* Click "Delete" to remove an entry after confirmation.
* Check the API logs in PowerShell for update/delete confirmations.

---

**Summary of This Step**:

* REST API now supports PUT and DELETE
* Web dashboard allows editing and deleting database entries
* Functionality is fully integrated with the existing table and REST backend

---


# **Step 9 — Add OAuth 2.0 Authentication with JWT for Securing the API**

This step includes:

* Generating RSA key pairs for signing and verifying JWTs
* Creating a custom OAuth 2.0 server with the `client_credentials` flow
* Securing the `POST`, `PUT`, and `DELETE` API routes
* Automatically requesting and attaching tokens in the frontend

---

## **9.1. Generate RSA Key Pair**

Navigate to the `oauth` folder:

```powershell
cd C:\WoT\Systems_Integration\oauth
```

Run the following commands to generate the keys:

```powershell
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

These files will be used by:

* `private.pem` → to sign tokens (OAuth server)
* `public.pem` → to verify tokens (API server)

You should now have:

```
oauth/
├── private.pem
├── public.pem
```

---

## **9.2. Create the OAuth 2.0 Server**

In the same folder, create `auth-server.js` with the following content:

```javascript
// auth-server.js

const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

const privateKey = fs.readFileSync("private.pem");

app.post("/token", (req, res) => {
  const clientId = req.body.client_id;
  const clientSecret = req.body.client_secret;

  if (clientId === "my-client" && clientSecret === "my-secret") {
    const token = jwt.sign(
      { sub: clientId, scope: "default" },
      privateKey,
      { algorithm: "RS256", expiresIn: "1h" }
    );

    res.json({
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600
    });
  } else {
    res.status(401).json({ error: "Invalid client credentials" });
  }
});

app.listen(PORT, () => {
  console.log(`[AUTH] Server running at http://localhost:${PORT}`);
});
```

### Run the server:

```powershell
node auth-server.js
```

---

## **9.3. Protect API Routes with JWT Middleware**

Edit `api.js` and add these lines at the top (after imports):

```javascript
const jwt = require("jsonwebtoken");
const fs = require("fs");

const publicKey = fs.readFileSync("public.pem");

// Middleware to verify JWT
function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
}
```

Now protect the following routes by adding `verifyJWT`:

```javascript
app.post("/led", verifyJWT, ...);
app.put("/sensors/:id", verifyJWT, ...);
app.delete("/sensors/:id", verifyJWT, ...);
```

Example:

```javascript
app.post("/led", verifyJWT, (req, res) => {
  // ...
});
```

---

## **9.4. Update the Web Interface to Request and Use Token**

Inside `index.html`, add this global variable and token fetch logic at the top of your `<script>`:

```html
<script>
  let accessToken = "";

  async function getToken() {
    const params = new URLSearchParams();
    params.append("client_id", "my-client");
    params.append("client_secret", "my-secret");

    const res = await fetch("http://localhost:3000/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const data = await res.json();
    accessToken = data.access_token;
  }

  getToken(); // automatically request token at page load
```

Update `toggleLED()`, `submitEdit()` and `deleteEntry()` functions to include the Authorization header:

### Example:

```javascript
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${accessToken}`
}
```

---

## **9.5. Test OAuth Protection**

### Test without a token:

```powershell
Invoke-WebRequest -Uri http://localhost:3001/led -Method POST -Body '{ "state": true }' -ContentType "application/json"
```

You should get:

```
401 Unauthorized
```

### Test with a valid token:

```powershell
$body = @{ client_id = "my-client"; client_secret = "my-secret" }
$token = (Invoke-RestMethod http://localhost:3000/token -Method POST -Body $body).access_token

Invoke-WebRequest -Uri http://localhost:3001/led `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{ "state": true }'
```

You should get:

```
200 OK
```

---

**Summary of This Step**:

* An OAuth 2.0 server issues JWT access tokens
* REST API protects sensitive routes using public key verification
* Web dashboard securely fetches tokens and uses them silently
* Manual or automated testing confirms enforcement of access control

---

# **Step 10 — Final Execution Sequence and Testing the Complete System**

This step describes how to start each component in the correct order and verify that the entire WoT system functions as expected. All services must be running simultaneously for full operation.

---

## **10.1. Final Directory Structure Review**

Ensure that your project folders and files are structured like this:

```
Systems_Integration/
├── sensor_data.db                     # SQLite database (auto-generated)
├── server.js                          # TD HTTP server
├── td/
│   ├── dht11-thing.jsonld
│   ├── mpu6050-thing.jsonld
│   ├── led-thing.jsonld
│   └── esp32-thing.jsonld
├── oauth/
│   ├── api.js
│   ├── auth-server.js
│   ├── mqtt_logger.js
│   ├── private.pem
│   ├── public.pem
│   └── package.json
├── web/
│   ├── index.html
│   └── css/
│       └── bootstrap.min.css
```

---

## **10.2. Start All Components**

Each of these must run in a **separate PowerShell window**. Use `cd` to go to the correct folder in each one.

---

### **1. Start the Mosquitto MQTT Broker**

```powershell
cd C:\mosquitto
.\mosquitto.exe -c .\conf\mosquitto.conf -v
```

Expected output:

```
Opening ipv4 listen socket on port 1883.
Opening websockets listen socket on port 9001.
```

---

### **2. Start the OAuth 2.0 Server**

```powershell
cd C:\WoT\Systems_Integration\oauth
node auth-server.js
```

Expected output:

```
[AUTH] Server running at http://localhost:3000
```

---

### **3. Start the REST API**

```powershell
cd C:\WoT\Systems_Integration\oauth
node api.js
```

Expected output:

```
[API] Connected to SQLite database.
[API] Connected to MQTT broker.
[API] Server running at http://localhost:3001
```

---

### **4. Start the MQTT Logger**

```powershell
cd C:\WoT\Systems_Integration\oauth
node mqtt_logger.js
```

Expected output:

```
[LOGGER] Database connected.
[LOGGER] Connected to MQTT broker.
[LOGGER] Subscribed to topics: sensor/temperature, sensor/humidity, ...
```

---

### **5. Start the Thing Description HTTP Server**

```powershell
cd C:\WoT\Systems_Integration
node server.js
```

Expected output:

```
Thing Description server running at http://localhost:8080/td
```

Access example:
[http://localhost:8080/td/dht11-thing.jsonld](http://localhost:8080/td/dht11-thing.jsonld)

---

### **6. Start the Web Dashboard**

```powershell
cd C:\WoT\Systems_Integration\web
http-server
```

Access in browser:
[http://localhost:8080](http://localhost:8080)

---

## **10.3. Test the System Functionality**

### From the Web Dashboard:

* Confirm real-time charts update when MQTT data arrives
* Verify LED buttons work (ON/OFF via REST)
* Check the data table loads sensor history
* Edit and delete entries (CRUD)
* Observe alerts via MQTT (motion/climate/button)
* Open Developer Tools > Network and confirm `Authorization: Bearer ...` is sent

---

### From PowerShell (manual tests):

#### Publish a sensor message:

```powershell
mosquitto_pub -h localhost -t "sensor/motion" -m "{\"AcX\":500,\"AcY\":100,\"AcZ\":2000,\"GyX\":40,\"GyY\":-10,\"GyZ\":5}"
```

#### Trigger alerts:

```powershell
mosquitto_pub -h localhost -t "alert/climate" -m "Temperature too high"
mosquitto_pub -h localhost -t "alert/button" -m "Sleep Mode activated"
```

#### Check the database:

```powershell
cd C:\WoT\Systems_Integration
sqlite3 sensor_data.db
SELECT * FROM sensor_logs ORDER BY id DESC LIMIT 10;
```

---

**Summary of This Step**:

* Full system is now live and connected
* Each service is running independently
* Functionality spans: MQTT, SQLite, REST API, TDs, Web Interface, OAuth 2.0
* Real-time data and full CRUD operations are verified








