const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Servir arquivos JSON-LD da pasta "td" diretamente na raiz do projeto
app.use('/td', express.static(path.join(__dirname, 'td')));

// Rota principal (opcional)
app.get('/', (req, res) => {
  res.send('Servidor WoT ativo! Acesse /td para ver os arquivos JSON-LD.');
});

app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando em http://localhost:${PORT}`);
});
