const { Turnkey } = require("@turnkey/sdk-server");
const organizationId = process.env.TURNKEY_ORG_KEY;
const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
const turnkeyClient = new Turnkey({
  apiBaseUrl: "https://api.turnkey.com",
  apiPublicKey: apiPublicKey,
  apiPrivateKey: apiPrivateKey,
  defaultOrganizationId: organizationId,
});

module.exports = { turnkeyClient };
