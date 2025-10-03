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
          
        const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?${channelParams.toString()}`);
        if (!channelRes.ok) {
          console.error(`YouTube channels API error for ${channelId}:`, channelRes.status, channelRes.statusText);
          return { channelId, videoId: null };
        }
        
        const channelData = await channelRes.json();
        if (channelData.error) {
          console.error(`YouTube channels API error for ${channelId}:`, channelData.error);
          return { channelId, videoId: null };
        }
        
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
        
        const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);
        if (!searchRes.ok) {
          console.error(`YouTube search API error for ${channelId}:`, searchRes.status, searchRes.statusText);
          return { channelId, videoId: null };
        }
        
        const searchData = await searchRes.json();
        if (searchData.error) {
          console.error(`YouTube search API error for ${channelId}:`, searchData.error);
          return { channelId, videoId: null };
        }
        
        const videoId = searchData?.items?.[0]?.id?.videoId || null;
        
        // Cache the search result
        const cacheKey = `search_${channelId}`;
        youtubeSearchCache.set(cacheKey, {
          data: { channelId, videoId },
          timestamp: now
        });
        
        return { channelId, videoId };
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
      
      const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        if (videosData.error) {
          console.error('YouTube videos API error:', videosData.error);
        } else {
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
        console.error('YouTube videos API HTTP error:', videosRes.status, videosRes.statusText);
      }
    } else {
      // No live videos found
      for (const channelId of channelIds) {
        channels[channelId] = { live: false, viewers: 0, videoId: null };
      }
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
