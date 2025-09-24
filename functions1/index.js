import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { defineString } from 'firebase-functions/params';
import fetch from 'node-fetch';
//import * as functions from "firebase-functions";

// Initialize Firebase Admin
initializeApp();

// Facebook App Configuration using environment variables
// const facebookAppId = functions.config().facebook.app_id;
// const facebookAppSecret = functions.config().facebook.app_secret;

function getFacebookConfig() {
  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET

  // Validate environment variables
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw new Error('FACEBOOK_APP_ID22 and FACEBOOK_APP_SECRET must be set as environment variables');
  }

  return { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET };
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Exchange short-lived Facebook token for long-lived token
 * This function should be called from your frontend after getting a short-lived token
 */
export const exchangeFacebookToken = onRequest({
  cors: true, // Enable CORS for cross-origin requests
  maxInstances: 10,
}, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    // Get the short-lived token from request body
    const { shortLivedUserToken } = req.body;

    if (!shortLivedUserToken) {
      res.status(400).json({ error: 'shortLivedUserToken is required' });
      return;
    }

    // Exchange the token using Facebook Graph API
    const exchangeUrl = `https://graph.facebook.com/v23.0/oauth/access_token`;
    const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = getFacebookConfig();
    
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      fb_exchange_token: shortLivedUserToken
    });

    const response = await fetch(`${exchangeUrl}?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Facebook API error:', errorData);
      res.status(response.status).json({ 
        error: 'Failed to exchange token',
        details: errorData
      });
      return;
    }

    const data = await response.json();
    
    // Return the long-lived token data
    res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * Get page access tokens for a user
 * This function gets all pages the user has access to
 */
export const getPageTokens = onRequest({
  cors: true,
  maxInstances: 10,
}, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    const { userAccessToken } = req.body;

    if (!userAccessToken) {
      res.status(400).json({ error: 'userAccessToken is required' });
      return;
    }

    // Get user's pages
    const pagesUrl = `https://graph.facebook.com/v23.0/me/accounts`;
    const params = new URLSearchParams({
      access_token: userAccessToken
    });

    const response = await fetch(`${pagesUrl}?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Facebook API error:', errorData);
      res.status(response.status).json({ 
        error: 'Failed to get page tokens',
        details: errorData
      });
      return;
    }

    const data = await response.json();
    
    res.status(200).json({
      pages: data.data || []
    });

  } catch (error) {
    console.error('Get page tokens error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * Health check endpoint
 */
export const healthCheck = onRequest({
  cors: true,
}, (req, res) => {
  setCors(res);
  res.status(200).json({ 
    status: 'ok', 
    message: 'Facebook token exchange service is running' 
  });
});
