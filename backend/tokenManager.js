/**
 * Knox Token Manager
 * Handles OAuth2 Client Credentials Grant flow with in-memory caching
 * and automatic expiration/renewal for Samsung Knox Manage API
 */

const axios = require('axios');

// In-memory token cache
let tokenCache = {
  accessToken: null,
  expiresAt: null,
};

/**
 * Fetches a new OAuth2 access token from Knox Manage
 */
async function fetchNewToken() {
  const serverUrl = process.env.KNOX_SERVER_URL;
  const tenantId  = process.env.KNOX_TENANT_ID;
  const clientId  = process.env.KNOX_CLIENT_ID;
  const clientSecret = process.env.KNOX_CLIENT_SECRET;

  const tokenUrl = `${serverUrl}/emm/oauth/token`;

  console.log(`[TokenManager] Requesting new access token from ${tokenUrl}`);

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-TENANT-ID': tenantId,
    },
    timeout: 30000,
  });

  const { access_token, expires_in } = response.data;

  if (!access_token) {
    throw new Error('No access_token returned from Knox OAuth endpoint');
  }

  // Cache with 60-second safety buffer before actual expiry
  const expiresInMs = ((expires_in || 3600) - 60) * 1000;
  tokenCache = {
    accessToken: access_token,
    expiresAt: Date.now() + expiresInMs,
  };

  console.log(`[TokenManager] Token acquired. Expires in ${Math.round(expiresInMs / 1000)}s`);
  return access_token;
}

/**
 * Returns a valid access token, refreshing it if expired or missing
 */
async function getAccessToken() {
  if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
    console.log('[TokenManager] Using cached token');
    return tokenCache.accessToken;
  }
  return fetchNewToken();
}

/**
 * Invalidates the cached token (forces refresh on next call)
 */
function invalidateToken() {
  tokenCache = { accessToken: null, expiresAt: null };
  console.log('[TokenManager] Token cache invalidated');
}

module.exports = { getAccessToken, invalidateToken };
