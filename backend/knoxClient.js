/**
 * Knox API Client
 * Centralized Axios instance with automatic token injection,
 * retry logic on 401 (token expiry), and request/response logging.
 *
 * Knox Manage OAPI endpoints require:
 * Content-Type: application/x-www-form-urlencoded
 * Authorization: Bearer <token>
 * Accept: application/json
 */

const axios = require('axios');
const { getAccessToken, invalidateToken } = require('./tokenManager');

const BASE_URL = process.env.KNOX_SERVER_URL || 'https://ap01.manage.samsungknox.com';
const TENANT_ID = process.env.KNOX_TENANT_ID || '';

/**
 * Makes an authenticated POST request to the Knox OAPI
 * Automatically formats payload as application/x-www-form-urlencoded
 */
async function knoxPost(endpoint, body = {}, attempt = 1) {
  const token = await getAccessToken();
  const url = `${BASE_URL}${endpoint}`;

  console.log(`[KnoxClient] POST ${url} (attempt ${attempt})`);

  // Build URL-encoded form parameters
  const params = new URLSearchParams();
  if (typeof body === 'object' && body !== null) {
    Object.entries(body).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
  }

  try {
    const response = await axios.post(url, params.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'X-TENANT-ID': TENANT_ID,
      },
      timeout: 45000,
    });

    const data = response.data;
    if (data && (data.resultCode === 'E_TOKEN_INVALID' || data.resultCode === 'E_SESSION_EXPIRED' || data.resultCode === '401')) {
      if (attempt === 1) {
        console.warn('[KnoxClient] Token invalid per resultCode - refreshing and retrying...');
        invalidateToken();
        return knoxPost(endpoint, body, 2);
      }
    }

    return data;
  } catch (err) {
    if (err.response && err.response.status === 401 && attempt === 1) {
      console.warn('[KnoxClient] 401 Unauthorized - refreshing token and retrying...');
      invalidateToken();
      return knoxPost(endpoint, body, 2);
    }
    console.error(`[KnoxClient] Error calling ${url}:`, err.message);
    throw err;
  }
}

/**
 * Makes an authenticated GET request to the Knox OAPI
 */
async function knoxGet(endpoint, params = {}, attempt = 1) {
  const token = await getAccessToken();
  const url = `${BASE_URL}${endpoint}`;

  console.log(`[KnoxClient] GET ${url} (attempt ${attempt})`);

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'X-TENANT-ID': TENANT_ID,
      },
      params,
      timeout: 45000,
    });

    const data = response.data;
    if (data && (data.resultCode === 'E_TOKEN_INVALID' || data.resultCode === 'E_SESSION_EXPIRED')) {
      if (attempt === 1) {
        console.warn('[KnoxClient] Token invalid per resultCode - refreshing and retrying...');
        invalidateToken();
        return knoxGet(endpoint, params, 2);
      }
    }

    return data;
  } catch (err) {
    if (err.response && err.response.status === 401 && attempt === 1) {
      console.warn('[KnoxClient] 401 Unauthorized - refreshing token and retrying...');
      invalidateToken();
      return knoxGet(endpoint, params, 2);
    }
    console.error(`[KnoxClient] Error calling ${url}:`, err.message);
    throw err;
  }
}

module.exports = { knoxPost, knoxGet };
