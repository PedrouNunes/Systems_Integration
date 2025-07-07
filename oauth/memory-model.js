const tokens = {};
const clients = [{
  clientId: "my-client",
  clientSecret: "my-secret",
  grants: ["client_credentials"],
  accessTokenLifetime: 3600 // 1 hora
}];

module.exports = {
  // Valida clientId e clientSecret recebidos
  getClient: (clientId, clientSecret) =>
    clients.find(c => c.clientId === clientId && c.clientSecret === clientSecret),

  // Salva o token emitido
  saveToken: (token, client, user) => {
    tokens[token.accessToken] = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      client,
      user
    };
    return tokens[token.accessToken];
  },

  // Busca token para autenticação nas rotas protegidas
  getAccessToken: (accessToken) => {
    const token = tokens[accessToken];
    return token ? { ...token, user: {}, client: {} } : null;
  },

  // Método auxiliar para introspecção externa (opcional)
  isTokenValid: (token) => !!tokens[token]
};
