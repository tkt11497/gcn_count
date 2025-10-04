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

// Cache for YouTube live video searches (40 minutes = 2400000 ms)
const youtubeSearchCache = new Map();
const CACHE_DURATION = 40 * 60 * 1000; // 40 minutes in milliseconds

// Helper function to make API calls with fallback
async function makeYouTubeAPICall(url, apiKey, apiKey2 = null) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Check if quota exceeded
    if (data.error && data.error.code === 403 && data.error.errors && 
        data.error.errors.some(err => err.reason === 'quotaExceeded')) {
      
      console.log('Primary API key quota exceeded, trying fallback...');
      
      if (apiKey2) {
        // Replace API key in URL and try again
        const fallbackUrl = url.replace(`key=${apiKey}`, `key=${apiKey2}`);
        const fallbackResponse = await fetch(fallbackUrl);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.error && fallbackData.error.code === 403 && 
            fallbackData.error.errors && fallbackData.error.errors.some(err => err.reason === 'quotaExceeded')) {
          console.error('Both API keys quota exceeded');
          return { error: 'All API keys quota exceeded', data: fallbackData };
        }
        
        return { data: fallbackData, usedFallback: true };
      } else {
        console.error('No fallback API key available');
        return { error: 'Quota exceeded and no fallback key', data };
      }
    }
    
    return { data, usedFallback: false };
  } catch (error) {
    console.error('API call error:', error);
    return { error: error.message, data: null };
  }
}

/**
 * YouTube live viewers for multiple channels.
 * POST { channelIds: string[] }
 * Returns { channels: { [channelId]: { live: boolean, viewers: number, videoId: string|null } }, totalLiveViewers }
 * Requires env YT_API_KEY.
 * Supports both channel IDs (UC...) and handles (@username).
 * Uses 40-minute caching to reduce API usage.
 */
export const youtubeLiveCounts = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  try {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed. Use POST.' }); return; }
    const { channelIds } = req.body || {};
    if (!Array.isArray(channelIds) || channelIds.length === 0) { res.status(400).json({ error: 'channelIds array required' }); return; }
    const apiKey = process.env.YT_API_KEY;
    const apiKey2 = process.env.YT_API_KEY_2; // Second API key for fallback
    if (!apiKey) { res.status(500).json({ error: 'Missing YT_API_KEY env' }); return; }

    const now = Date.now();
    let searchResults = [];
    let needsSearch = false;
    
    // Check cache for each channel
    for (const channelId of channelIds) {
      const cacheKey = `search_${channelId}`;
      const cached = youtubeSearchCache.get(cacheKey);
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        // Use cached result
        searchResults.push(cached.data);
      } else {
        // Need to search for this channel
        needsSearch = true;
        break;
      }
    }
    
    // If we have cached results for all channels, use them
    if (!needsSearch && searchResults.length === channelIds.length) {
      console.log('Using cached YouTube search results');
    } else {
      console.log('Performing fresh YouTube search (cache expired or missing)');
      // Step 1: Convert handles to channel IDs if needed, then search for live videos
      const searchPromises = channelIds.map(async (channelId) => {
        let actualChannelId = channelId;
        
        // If it's a handle (starts with @), we need to get the channel ID first
        if (channelId.startsWith('@')) {
          const handle = channelId.substring(1);
          const channelParams = new URLSearchParams({
            part: 'id',
            forHandle: handle,
            key: apiKey
          });
          
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?${channelParams.toString()}`;
        const channelResult = await makeYouTubeAPICall(channelUrl, apiKey, apiKey2);
        
        if (channelResult.error) {
          console.error(`YouTube channels API error for ${channelId}:`, channelResult.error);
          return { channelId, videoId: null };
        }
        
        const channelData = channelResult.data;
        
        actualChannelId = channelData?.items?.[0]?.id || null;
        if (!actualChannelId) {
          console.error(`No channel ID found for handle ${channelId}`);
          return { channelId, videoId: null };
        }
        }
        
        // Now search for live videos using the actual channel ID
        const searchParams = new URLSearchParams({
          part: 'id',
          channelId: actualChannelId,
          eventType: 'live',
          type: 'video',
          maxResults: '1',
          key: apiKey
        });
        
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;
        const searchResult = await makeYouTubeAPICall(searchUrl, apiKey, apiKey2);
        
        if (searchResult.error) {
          console.error(`YouTube search API error for ${channelId}:`, searchResult.error);
          return { channelId, videoId: null };
        }
        
        const searchData = searchResult.data;
        
        const videoId = searchData?.items?.[0]?.id?.videoId || null;
        
        // Cache the search result
        const cacheKey = `search_${channelId}`;
        youtubeSearchCache.set(cacheKey, {
          data: { channelId, videoId },
          timestamp: now
        });
        
        return { channelId, videoId, usedFallback: searchResult.usedFallback };
      });
      
      searchResults = await Promise.all(searchPromises);
    }
    const liveVideoIds = searchResults.filter(r => r.videoId).map(r => r.videoId);
    const channelToVideo = Object.fromEntries(searchResults.map(r => [r.channelId, r.videoId]));

    let channels = {};
    let totalLiveViewers = 0;
    if (liveVideoIds.length > 0) {
      // Step 2: Get live streaming details for videos (this is called more frequently)
      const videosParams = new URLSearchParams({
        part: 'liveStreamingDetails',
        id: liveVideoIds.join(','),
        key: apiKey
      });
      
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`;
      const videosResult = await makeYouTubeAPICall(videosUrl, apiKey, apiKey2);
      
      if (videosResult.error) {
        console.error('YouTube videos API error:', videosResult.error);
      } else {
        const videosData = videosResult.data;
        const videoDetails = new Map(videosData.items.map(item => [item.id, item.liveStreamingDetails]));
        
        for (const channelId of channelIds) {
          const videoId = channelToVideo[channelId];
          if (videoId && videoDetails.has(videoId)) {
            const details = videoDetails.get(videoId) || {};
            const viewers = Number(details.concurrentViewers || 0);
            channels[channelId] = { live: true, viewers, videoId };
            totalLiveViewers += viewers;
          } else {
            channels[channelId] = { live: false, viewers: 0, videoId: null };
          }
        }
      }
    } else {
      // No live videos found
      for (const channelId of channelIds) {
        channels[channelId] = { live: false, viewers: 0, videoId: null };
      }
    }

    // Log if fallback was used
    const usedFallback = searchResults.some(result => result.usedFallback);
    if (usedFallback) {
      console.log('Used fallback API key for some requests');
    }
    
    res.status(200).json({ channels, totalLiveViewers });
  } catch (error) {
    console.error('youtubeLiveCounts error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      channels: {},
      totalLiveViewers: 0
    });
  }
});
