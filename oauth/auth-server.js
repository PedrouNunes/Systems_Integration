const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();
const privateKey = fs.readFileSync("private.pem");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Endpoint para emitir token OAuth 2.0 JWT
app.post("/token", (req, res) => {
  const { client_id, client_secret } = req.body;

  // Validação simples
  if (client_id !== "my-client" || client_secret !== "my-secret") {
    return res.status(401).json({ error: "Invalid client credentials" });
  }

  const token = jwt.sign(
    { sub: client_id, scope: "default" },
    privateKey,
    { algorithm: "RS256", expiresIn: "1h" }
  );

  res.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600
  });
});

app.listen(3000, () => {
  console.log("OAuth 2.0 JWT Auth Server running at http://localhost:3000");
});
