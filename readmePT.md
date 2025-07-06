## Manual do Sistema WoT com ESP32 + MQTT + Sensores

### Visão Geral do Sistema

O sistema implementa uma solução baseada na arquitetura da Web das Coisas (WoT), utilizando um ESP32, sensores de ambiente e movimento, e comunicação via protocolo MQTT, conforme os requisitos da disciplina “Web das Coisas”. O sistema permite:

* Leitura de temperatura e umidade com o sensor DHT11
* Leitura de aceleração e rotação com o sensor MPU6050
* Geração de alertas relacionados ao clima e ao movimento
* Controle remoto de um atuador (LED) via MQTT
* Publicação de dados e alertas em tópicos MQTT
* Subscrição a comandos remotos para atuação no dispositivo

---

### Componentes Utilizados

| Componente       | Função                                           |
| ---------------- | ------------------------------------------------ |
| ESP32            | Microcontrolador principal (Wi-Fi, MQTT)         |
| DHT11            | Sensor de temperatura e umidade                  |
| MPU6050          | Sensor de aceleração e giroscópio                |
| LED              | Atuador visual (para alertas ou controle remoto) |
| Botão            | Simulação de acionamento físico                  |
| Mosquitto Broker | Servidor MQTT executado localmente no computador |

---

### Topologia e Comunicação

**Fluxo de dados:**

* O ESP32 publica nos seguintes tópicos:

  * `sensor/temperature`
  * `sensor/humidity`
  * `sensor/motion`
  * `alert/climate`
  * `alert/motion`

* O ESP32 assina o tópico:

  * `actuator/led` → recebe "1" ou "0" para ligar ou desligar o LED

---

### Lógica de Funcionamento

1. **Conexão Wi-Fi**
   Conecta-se à rede `MEO-02A070` utilizando a senha `3cdd45d1a1`.

2. **Conexão MQTT**
   Conecta-se ao broker Mosquitto localizado em `192.168.1.241`.

3. **Leitura dos Sensores**

   * DHT11: leitura de temperatura e umidade
   * MPU6050: leitura de aceleração (AcX, AcY, AcZ) e giroscópio (GyX, GyY, GyZ)

4. **Geração de Alertas**

   * Alerta climático: temperatura fora do intervalo \[10°C–25°C] ou umidade superior a 80%
   * Alerta de movimento: aceleração acima de 18000 em qualquer eixo

5. **Controle do LED**

   * Liga automaticamente em caso de alerta climático ou de movimento
   * Pode ser ligado ou desligado remotamente via tópico MQTT `actuator/led`

---

### Testes via Terminal MQTT

**Publicar comandos para o LED:**

```bash
mosquitto_pub -h 192.168.1.241 -t "actuator/led" -m "1"   # Liga o LED
mosquitto_pub -h 192.168.1.241 -t "actuator/led" -m "0"   # Desliga o LED
```

**Monitorar todos os tópicos MQTT:**

```bash
mosquitto_sub -h 192.168.1.241 -t "#" -v
```

---

### Configuração do Mosquitto (Broker MQTT)

**Problemas identificados:**

* Mosquitto iniciou em modo local (“local only mode”), impedindo conexões externas
* Porta 1883 estava bloqueada ou indisponível

**Soluções aplicadas:**

1. Criação de arquivo de configuração personalizado:

   ```
   C:\mosquitto\conf\mosquitto.conf
   ```

   Conteúdo do arquivo:

   ```
   listener 1883
   allow_anonymous true
   ```

2. Início do Mosquitto com a configuração personalizada:

   ```bash
   mosquitto -c C:\mosquitto\conf\mosquitto.conf -v
   ```

3. Liberação da porta 1883 no firewall do Windows:

   * Criada regra de entrada para TCP/1883

---

### Validação do Sistema

| Teste                                | Resultado |
| ------------------------------------ | --------- |
| Conexão Wi-Fi                        | Aprovado  |
| Conexão com Mosquitto (MQTT)         | Aprovado  |
| Publicação de dados                  | Aprovado  |
| Controle de LED via MQTT             | Aprovado  |
| Funcionamento do sensor de movimento | Aprovado  |
| Funcionamento do sensor DHT11        | Aprovado  |

---

### Próximos Passos Sugeridos 

* Criar Thing Descriptions (JSON-LD) para os sensores e atuadores
* Implementar uma API REST com banco de dados para histórico
* Criar um painel web para visualização e controle
* Implementar autenticação para MQTT ou HTTP

---
## Manual do Sistema WoT com ESP32 + MQTT + Thing Descriptions

**Parte 2 — Exposição de Thing Descriptions via HTTP**

### Objetivo

Permitir que clientes WoT (consumidores automáticos, painéis web ou ferramentas como o Thingweb CLI) possam acessar os arquivos `.jsonld` que descrevem os sensores e atuadores do sistema, seguindo o padrão da arquitetura Web of Things definida pelo W3C.

---

### Organização do Projeto

```
Systems_Integration/
├── td/                        ← Contém os arquivos .jsonld (Thing Descriptions)
│   ├── esp32-thing.jsonld
│   ├── dht11-thing.jsonld
│   ├── mpu6050-thing.jsonld
│   └── led-thing.jsonld
├── server.js                  ← Servidor HTTP em Node.js
├── package.json               ← Arquivo de configuração do projeto Node.js
└── node_modules/              ← Pasta com dependências (Express.js)
```

---

### Servidor HTTP — server.js

O servidor foi desenvolvido com Node.js e Express para disponibilizar os arquivos `.jsonld` via a rota `/td`.

**Código completo do servidor:**

```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Servir a pasta "td" com os arquivos JSON-LD
app.use('/td', express.static(path.join(__dirname, 'td')));

app.get('/', (req, res) => {
  res.send('Servidor WoT ativo! Acesse /td para ver os arquivos JSON-LD.');
});

app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando em http://localhost:${PORT}`);
});
```

---

### Execução do Servidor

1. Inicializar o projeto Node.js (caso ainda não tenha sido feito):

   ```bash
   npm init -y
   ```

2. Instalar dependência do Express:

   ```bash
   npm install express
   ```

3. Iniciar o servidor:

   ```bash
   npm start
   ```

---

### URLs Disponíveis

Após o servidor estar ativo, os seguintes arquivos estarão acessíveis pelo navegador ou por clientes WoT:

* [http://localhost:8080/td/esp32-thing.jsonld](http://localhost:8080/td/esp32-thing.jsonld)
* [http://localhost:8080/td/dht11-thing.jsonld](http://localhost:8080/td/dht11-thing.jsonld)
* [http://localhost:8080/td/mpu6050-thing.jsonld](http://localhost:8080/td/mpu6050-thing.jsonld)
* [http://localhost:8080/td/led-thing.jsonld](http://localhost:8080/td/led-thing.jsonld)

Também é possível acessá-los por IP local, por exemplo:

* [http://192.168.1.241:8080/td/esp32-thing.jsonld](http://192.168.1.241:8080/td/esp32-thing.jsonld)

---

### Resultado Esperado

Ao acessar qualquer uma dessas URLs, o cliente WoT ou navegador deve exibir um conteúdo em formato JSON-LD contendo:

* Campo `@context` com a referência do W3C
* Campos `title`, `id`, `properties`, `forms`
* Descrição da interface de comunicação MQTT

> Observação: No relatório final, recomenda-se incluir capturas de tela exemplificando essa exibição.

---

### Impacto para o Projeto

Essa etapa cumpre os seguintes requisitos obrigatórios definidos no enunciado do projeto:

| Requisito | Descrição                                                                 |
| --------- | ------------------------------------------------------------------------- |
| 3         | As “Things” devem ser descritas por Thing Descriptions em formato JSON-LD |
| 11        | O sistema deve seguir a arquitetura Web of Things proposta pelo W3C       |

---

### Pronto para os Próximos Passos

Com o servidor WoT operando corretamente, é possível agora:

1. Testar os arquivos `.jsonld` com clientes WoT automáticos, como o Thingweb CLI
2. Desenvolver uma API RESTful para sensores e atuadores
3. Construir um painel web com HTML/JavaScript para visualização e controle
4. Integrar o sistema com um banco de dados para histórico de medições

---
## Manual do Sistema WoT com ESP32 + MQTT + Thing Descriptions

**Parte 3 — Thing Descriptions: Consumo, Integração e Alternativas**

### Sobre Thing Descriptions (TDs)

No projeto, foram criadas diversas Thing Descriptions (TDs) em conformidade com o padrão da Web das Coisas (WoT) do W3C. Essas descrições utilizam o formato JSON-LD e contêm os seguintes campos:

* `@context`: "[https://www.w3.org/2019/wot/td/v1](https://www.w3.org/2019/wot/td/v1)"
* `title`, `id`, `securityDefinitions`, `properties`
* `forms` com os atributos `op`, `href`, `subprotocol`, `contentType`

Essas TDs representam formalmente os sensores e atuadores do sistema:

| Arquivo JSON-LD        | Descrição                                |
| ---------------------- | ---------------------------------------- |
| `led-thing.jsonld`     | Atuador LED com controle remoto via MQTT |
| `dht11-thing.jsonld`   | Sensor de temperatura e umidade          |
| `mpu6050-thing.jsonld` | Sensor de movimento (aceleração)         |
| `esp32-thing.jsonld`   | Descrição composta do dispositivo ESP32  |

---

### Exposição das TDs via HTTP

Foi desenvolvido um servidor HTTP simples com Node.js e Express (`server.js`) para disponibilizar os arquivos TD pela rede. Os arquivos podem ser acessados por clientes WoT automáticos por meio do seguinte endereço:

```
http://<ip_local>:8080/td/esp32-thing.jsonld
```

Esse servidor permite que os arquivos `.jsonld` sejam consumidos por ferramentas externas, conforme os princípios da arquitetura WoT.

---

### Tentativa com o cliente oficial wot-servient

O cliente oficial da Eclipse Thingweb, chamado `wot-servient`, foi instalado e executado com o seguinte comando:

```bash
wot-servient http://localhost:8080/td/led-thing.jsonld
```

**Resultado:**
Nenhuma resposta foi exibida no terminal. Foram testados vários formatos de TD, incluindo versões mínimas baseadas em HTTP, mas o `wot-servient` não iniciou corretamente em nenhum dos casos.

---

### Solução alternativa: Consumidor personalizado de TDs

Diante das limitações encontradas com o `wot-servient`, foi implementado um **cliente WoT personalizado** usando Node.js, capaz de:

* Ler o arquivo `.jsonld` (por exemplo, `led-thing.jsonld`)
* Interpretar os campos `base`, `forms`, `href`, `op` e `subprotocol`
* Conectar-se ao broker MQTT e realizar ações com base na descrição da TD

**Script criado:**

* `led_consumer_from_td.js`

**Exemplos de uso:**

```bash
node led_consumer_from_td.js on    # Liga o LED
node led_consumer_from_td.js off   # Desliga o LED
```

O script atua como cliente Web of Things ao consumir diretamente a Thing Description, sem depender do `wot-servient`.

---

### Conformidade com o Enunciado

| Requisito | Atendido? | Descrição                                                    |
| --------- | --------- | ------------------------------------------------------------ |
| 3         | Sim       | TDs criadas em JSON-LD segundo a estrutura definida pelo W3C |
| 4         | Sim       | Clientes são capazes de controlar atuadores a partir das TDs |
| 11        | Sim       | Arquitetura WoT aplicada com exposição e consumo de TDs      |

O uso de Thing Descriptions foi implementado de forma completa e em conformidade com os objetivos do projeto.

---

### Observações Finais

* Os arquivos `.jsonld` **não são executados no ESP32**. Eles são lidos por clientes WoT para saber como interagir com os sensores e atuadores.
* A abordagem personalizada com Node.js permite o controle via MQTT de acordo com a TD, sem dependência do `wot-servient`, mantendo conformidade com a arquitetura WoT.
* O servidor HTTP é essencial para tornar os arquivos disponíveis na rede, permitindo o consumo remoto e testes com ferramentas externas.
---
## Manual do Sistema WoT com ESP32 + MQTT + Thing Descriptions

**Parte 4 — Armazenamento e Consulta de Dados com SQLite**

### Armazenamento dos Dados dos Sensores

Em conformidade com o **Requisito 5** do enunciado do projeto, foi implementado um mecanismo de armazenamento local utilizando **SQLite**, permitindo registrar o histórico de medições dos sensores e os alertas gerados pelo ESP32.

---

### Componentes Utilizados

| Componente       | Descrição                                                     |
| ---------------- | ------------------------------------------------------------- |
| `sqlite3`        | Biblioteca Node.js para manipulação do banco de dados SQLite  |
| `mqtt_logger.js` | Script Node.js que escuta tópicos MQTT e grava dados no banco |
| `sensor_data.db` | Arquivo de banco de dados SQLite com os registros de sensores |

---

### Estrutura da Tabela `sensor_logs`

| Campo       | Tipo     | Descrição                            |
| ----------- | -------- | ------------------------------------ |
| `id`        | INTEGER  | Identificador único (chave primária) |
| `topic`     | TEXT     | Nome do tópico MQTT                  |
| `payload`   | TEXT     | Conteúdo da mensagem publicada       |
| `timestamp` | DATETIME | Data e hora da inserção (automática) |

---

### Execução do Logger MQTT

O script `mqtt_logger.js` conecta-se ao broker MQTT e escuta os seguintes tópicos:

* `sensor/temperature`
* `sensor/humidity`
* `sensor/motion`
* `alert/climate`
* `alert/motion`

Ao receber mensagens, os dados são inseridos automaticamente na base de dados local `sensor_data.db`.

---

### Consulta ao Histórico dos Dados

Para visualizar os dados armazenados, foi criado o script `query_logs.js`, que:

* Lê os dados mais recentes da tabela `sensor_logs`
* Permite filtrar os registros por tópico MQTT
* Exibe os resultados diretamente no terminal

**Exemplos de uso:**

```bash
# Consultar os últimos registros:
node query_logs.js

# Consultar apenas registros do tópico de temperatura:
node query_logs.js sensor/temperature
```

---

### Benefícios Desta Etapa

* Permite **armazenamento persistente** dos dados coletados pelos sensores
* Viabiliza a criação futura de uma **API REST** para acesso remoto aos dados
* Atende ao requisito do projeto de **manter um histórico consultável**

---

### Próximos Passos Planejados

* Criar uma **API REST** para permitir acesso aos dados via HTTP
* Adicionar funcionalidade para **exportar os dados** em formatos como CSV ou JSON (opcional)
* Desenvolver uma **interface web** para visualização de históricos e alertas registrados
---
## Manual do Sistema WoT com ESP32 + MQTT + Thing Descriptions

**Parte 5 — API REST para Consulta e Controle**

### Objetivo

Atender ao **Requisito 8** do enunciado do projeto:

> "Deve ser programada uma REST Web API, que ofereça dados presentes na base de dados ou controle o estado de sensores e atuadores, podendo ser invocadas as operações CRUD por clientes Web."

---

### Implementação

Foi desenvolvida uma **API REST** utilizando Node.js com a biblioteca **Express**, que:

* Lê os dados armazenados no banco SQLite (`sensor_data.db`)
* Permite o controle do LED por meio de requisições POST
* Expõe endpoints HTTP simples, acessíveis por qualquer cliente Web

---

### Dependências Utilizadas

Instalação das bibliotecas necessárias:

```bash
npm install express sqlite3 mqtt body-parser
```

---

### Arquivo Principal: `api.js`

Este arquivo é responsável por:

* Iniciar o servidor na **porta 3001**
* Conectar ao broker MQTT no endereço `mqtt://192.168.1.241`
* Disponibilizar rotas HTTP para consulta e controle do sistema

---

### Endpoints Disponíveis

| Método | Rota              | Descrição                                               |
| ------ | ----------------- | ------------------------------------------------------- |
| GET    | `/sensors`        | Retorna os últimos 50 registros da base de dados        |
| GET    | `/sensors/:topic` | Retorna os últimos 50 registros de um tópico específico |
| POST   | `/led`            | Envia comando via MQTT para ligar ou desligar o LED     |

---

### Exemplo: Ligar o LED via PowerShell

```powershell
Invoke-WebRequest -Uri http://localhost:3001/led `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "state": true }'
```

**Se o campo `state` estiver ausente ou for inválido**, a API retorna a mensagem:

```json
{ "error": "Missing or invalid 'state' (boolean)" }
```

---

### Exemplo de Resposta da Rota `/sensors`

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

### Resultados

* A API REST está totalmente funcional
* Integrada com o banco SQLite e o broker MQTT
* Oferece acesso estruturado e seguro ao sistema WoT
* Testada com sucesso usando PowerShell e comandos `Invoke-WebRequest`
* Pronta para ser consumida por **painéis web**, **aplicativos móveis** ou **sistemas externos**

---

### Observações

* A API está disponível localmente no endereço:
  `http://localhost:3001`

* Pode ser testada com ferramentas como:

  * `curl`
  * Postman
  * Insomnia
  * Navegador web
  * Aplicações JavaScript

* Todos os endpoints **GET** e **POST** foram testados com sucesso e respondem conforme o esperado
---

## Módulo Integrado: API REST + MQTT + SQLite + Painel Web com Bootstrap

Esta seção descreve a implementação e execução do sistema completo e funcional, composto pelos seguintes elementos:

* ESP32 publicando dados via MQTT
* Mosquitto como broker MQTT
* Node.js com:

  * API REST (`api.js`)
  * Logger MQTT que grava no SQLite (`mqtt_logger.js`)
* SQLite como banco de dados local
* Painel Web baseado em Bootstrap com uso de MQTT.js para visualização em tempo real

---

### Estrutura de Pastas do Projeto

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

### Pré-Requisitos

1. Node.js instalado (versão 22 ou superior)
2. Mosquitto com suporte a WebSocket ativado
3. SQLite 3 instalado (comando `sqlite3` disponível)
4. ESP32 configurado para publicar nos tópicos MQTT:

   * `sensor/temperature`
   * `sensor/humidity`
   * `sensor/motion`
   * `alert/motion`
   * `alert/climate`

---

### 1. Broker MQTT (Mosquitto)

**Arquivo de configuração `mosquitto.conf`:**

```
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true
```

**Comando para execução:**

```bash
mosquitto -c caminho/para/mosquitto.conf -v
```

---

### 2. Banco de Dados (SQLite)

**Arquivo:**
`sensor_data.db`

**Tabela:**
`sensor_logs`

**Exemplo de schema (criado automaticamente pelo logger):**

```sql
CREATE TABLE sensor_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT,
  payload TEXT,
  timestamp TEXT
);
```

---

### 3. Logger MQTT → SQLite (`mqtt_logger.js`)

**Objetivo:**
Escutar os tópicos MQTT do ESP32 e registrar os dados recebidos no banco de dados `sensor_data.db`.

**Execução:**

```bash
node mqtt_logger.js
```

Os dados serão inseridos automaticamente ao serem publicados nos tópicos pelo ESP32.

---

### 4. API REST (`api.js`)

**Objetivo:**

* Servir os dados do banco SQLite via REST
* Permitir controle do LED via POST na rota `/led`
* Publicar comandos MQTT por meio da API

**Implementação destacada:**

```javascript
const cors = require("cors");
app.use(cors()); // Libera requisições entre portas diferentes
```

**Principais rotas:**

| Rota              | Método | Função                                        |
| ----------------- | ------ | --------------------------------------------- |
| `/sensors`        | GET    | Retorna os 50 dados mais recentes             |
| `/sensors/:topic` | GET    | Retorna os 50 dados filtrados por tópico MQTT |
| `/led`            | POST   | Envia comando MQTT para ligar/desligar o LED  |

**Execução da API:**

```bash
npm install express mqtt sqlite3 cors body-parser
node api.js
```

A API ficará disponível em:
[http://localhost:3001](http://localhost:3001)

---

### 5. Painel Web (Interface Visual)

**Caminho:**
`/web/index.html`

**Recursos:**

* Botões com Bootstrap para controle do LED via REST
* Tabela com os últimos 50 registros da base de dados
* Alertas em tempo real utilizando MQTT.js (via WebSocket)

**Execução do painel:**

```bash
npm install -g http-server
http-server ./web
```

**Acesso via navegador:**
[http://localhost:8080](http://localhost:8080)

---

### Fluxo Completo de Execução (Passo a Passo)

1. Iniciar o Mosquitto com o arquivo `mosquitto.conf`
2. Iniciar o logger MQTT:

   ```bash
   node mqtt_logger.js
   ```
3. Iniciar a API REST:

   ```bash
   node api.js
   ```
4. Iniciar o servidor da interface web:

   ```bash
   http-server ./web
   ```
5. Acessar o painel web:
   [http://localhost:8080](http://localhost:8080)

---

### Funcionalidades Testadas e Aprovadas

* Recepção de dados MQTT enviados pelo ESP32
* Armazenamento contínuo no banco SQLite
* API REST fornecendo dados filtrados por tópico
* Painel web funcionando com interface responsiva
* Controle remoto do LED através do botão REST
* Exibição de alertas em tempo real com MQTT.js
* Problemas de CORS resolvidos utilizando `cors()` na API

---

### Ajuste Necessário no Sistema: PATH do SQLite no Windows

Durante o desenvolvimento, foi necessário configurar a variável de ambiente do sistema para que o comando `sqlite3` funcionasse corretamente no PowerShell e no VS Code.

---

### Passos Realizados

1. O SQLite foi baixado do site oficial:
   [https://www.sqlite.org/download.html](https://www.sqlite.org/download.html)

2. O executável `sqlite3.exe` foi extraído, por exemplo, para a pasta:
   `C:\sqlite`

3. Essa pasta foi adicionada manualmente à variável de ambiente `PATH`:

   * Acessar: Painel de Controle → Sistema → Configurações Avançadas → Variáveis de Ambiente
   * Editar a variável `Path` e adicionar: `C:\sqlite`

4. Terminal reiniciado e testado com:

   ```bash
   sqlite3 --version
   ```

**Resultado esperado:** O terminal exibe a versão instalada corretamente.

---

### Resultado

Após essa configuração, o comando `sqlite3 sensor_data.db` passou a funcionar normalmente no terminal, permitindo acessar e testar o conteúdo do banco de forma prática.
---
## Etapa: Adição dos dados do giroscópio ao painel web (MPU6050)

### Objetivo

Permitir que o painel web exiba **dois gráficos distintos em tempo real** com os dados do sensor MPU6050:

* Um gráfico com os valores de aceleração: AcX, AcY, AcZ
* Um gráfico com os valores de giroscópio: GyX, GyY, GyZ

---

### Alteração Necessária no ESP32

A função original `publishMotionData()` não incluía os dados do giroscópio no JSON enviado via MQTT. Para corrigir isso, a função foi modificada da seguinte forma:

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

Com essa alteração, o ESP32 passou a publicar mensagens com o seguinte conteúdo:

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

Esses dados são enviados para o tópico MQTT `sensor/motion`.

---

### Comportamento no Painel Web

O arquivo `index.html` já estava configurado para:

* Assinar o tópico `sensor/motion` via MQTT.js (WebSocket)
* Separar os dados de aceleração e giroscópio em **dois gráficos distintos** usando Chart.js
* Atualizar os gráficos em tempo real, mantendo no máximo **20 amostras visíveis por gráfico**

Dessa forma, **nenhuma modificação adicional no frontend foi necessária**.

---

### Resultado

Após a atualização no código do ESP32, ao iniciar o sistema:

* O painel web passou a exibir corretamente os gráficos de aceleração e giroscópio em tempo real
* Os dados são processados automaticamente, sem necessidade de recarregar a página
* O histórico das medições continua acessível por meio da **API REST** e da **tabela de dados da interface**

