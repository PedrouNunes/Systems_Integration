const tokens = {};
const clients = [{
  clientId: "my-client",
  clientSecret: "my-secret",
  grants: ["client_credentials"],
  accessTokenLifetime: 3600 // 1 hora
}];

module.exports = {
  // validate clientId and clientSecret recieved
  getClient: (clientId, clientSecret) =>
    clients.find(c => c.clientId === clientId && c.clientSecret === clientSecret),

  // salve the emited token 
  saveToken: (token, client, user) => {
    tokens[token.accessToken] = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      client,
      user
    };
    return tokens[token.accessToken];
  },

  // search for token to autenticate in the routs
  getAccessToken: (accessToken) => {
    const token = tokens[accessToken];
    return token ? { ...token, user: {}, client: {} } : null;
  },

  // check if the token is valid
  isTokenValid: (token) => !!tokens[token]
};
