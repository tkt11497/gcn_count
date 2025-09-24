/* Facebook Auth/Graph helpers for obtaining user and Page access tokens */

export function loadFacebookSDK(appId) {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Facebook SDK must be loaded in a browser environment.'))
        return
      }
  
      if (window.FB) {
        try {
          window.FB.init({ appId, cookie: true, xfbml: false, version: 'v23.0' })
          resolve(window.FB)
          return
        } catch (e) {
          reject(e)
          return
        }
      }
  
      window.fbAsyncInit = function () {
        try {
          window.FB.init({ appId, cookie: true, xfbml: false, version: 'v23.0' })
          resolve(window.FB)
        } catch (e) {
          reject(e)
        }
      }
  
      const existing = document.getElementById('facebook-jssdk')
      if (existing) {
        existing.addEventListener('load', () => resolve(window.FB))
        existing.addEventListener('error', reject)
        return
      }
  
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      script.onerror = reject
      document.body.appendChild(script)
    })
  }
  
  export function loginAndGetUserAccessToken(scopes = []) {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error('FB SDK not initialized. Call loadFacebookSDK(appId) first.'))
        return
      }
  
      const scopeStr = Array.isArray(scopes) ? scopes.join(',') : String(scopes)
  
      window.FB.login(
        (response) => {
          if (response && response.authResponse && response.authResponse.accessToken) {
            resolve(response.authResponse.accessToken)
          } else {
            reject(new Error('User cancelled login or did not fully authorize.'))
          }
        },
        { scope: scopeStr }
      )
    })
  }
  
  export async function getPageAccessTokens(userAccessToken) {
    const params = new URLSearchParams({
      // fields: 'id,name,access_token,perms',
      access_token: userAccessToken
    })
  
    const res = await fetch(`https://graph.facebook.com/v23.0/me/accounts?${params.toString()}`)
    if (!res.ok) {
      let message = `Graph API error ${res.status}`
      try {
        const err = await res.json()
        if (err && err.error && err.error.message) message += `: ${err.error.message}`
      } catch (_) {}
      throw new Error(message)
    }
  
    const data = await res.json()
    return Array.isArray(data && data.data) ? data.data : []
  }
  
  export async function getPageAccessTokenFor(pageId, userAccessToken) {
    const pages = await getPageAccessTokens(userAccessToken)
    const page = pages.find((p) => p && p.id === String(pageId))
    if (!page) throw new Error('Requested Page not found among /me/accounts')
    return page.access_token
  }
  
  export async function requestUserAndPageTokens({ appId, scopes = [] }) {
    if (!appId) throw new Error('appId is required')
    const FB = await loadFacebookSDK(appId)
    if (!FB) throw new Error('Failed to initialize FB SDK')
  
    const userAccessToken = await loginAndGetUserAccessToken(scopes)
    const pages = await getPageAccessTokens(userAccessToken)
  
    return {
      userAccessToken,
      pages
    }
  }
  
  // ---- Long-lived tokens helpers (use with a backend) ----
  const STORAGE_KEY = 'fb_tokens_v1'
  
  function loadStoredTokens() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch (_) {
      return {}
    }
  }
  
  function saveStoredTokens(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (_) {}
  }
  
  export function persistToken({ kind, token, expiresInSeconds }) {
    const now = Math.floor(Date.now() / 1000)
    const exp = expiresInSeconds ? now + Number(expiresInSeconds) : null
    const store = loadStoredTokens()
    store[kind] = { token, exp }
    saveStoredTokens(store)
  }
  
  export function getStoredToken(kind) {
    const store = loadStoredTokens()
    const item = store[kind]
    if (!item) return null
    if (item.exp && item.exp <= Math.floor(Date.now() / 1000)) return null
    return item.token
  }
  
  export function getStoredExpiry(kind) {
    const store = loadStoredTokens()
    return store[kind]?.exp || null
  }
  
  // Exchange short-lived user token for long-lived on the server.
  // Implement a backend route that accepts POST { shortLivedUserToken }
  // and returns { access_token, token_type, expires_in } from Graph API.
  export async function exchangeForLongLivedUserTokenViaBackend(shortLivedUserToken, { endpoint = '/api/facebook/exchange-token' } = {}) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortLivedUserToken })
    })
    if (!res.ok) {
      let message = `Exchange error ${res.status}`
      try {
        const err = await res.json()
        if (err && err.error) message += `: ${err.error}`
      } catch (_) {}
      throw new Error(message)
    }
    const data = await res.json()
    if (!data || !data.access_token) throw new Error('Invalid exchange response')
    return data
  }
  export async function exchangeForLongLivedUserTokenViaFirebase(shortLivedUserToken) {
    // Use same-origin path that is proxied to Firebase Functions via Hosting rewrites to avoid CORS
    const functionUrl = '/api/facebook/exchange-token'
    
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortLivedUserToken })
    })
    
    if (!res.ok) {
      let message = `Exchange error ${res.status}`
      try {
        const err = await res.json()
        if (err && err.error) message += `: ${err.error}`
      } catch (_) {}
      throw new Error(message)
    }
    
    const data = await res.json()
    console.log('Token exchange response:', data)
    return data
  }
  
  // High-level flow: login -> exchange -> persist -> fetch Page tokens -> persist first Page token
  export async function getLongLivedUserAndPageTokens({ appId, scopes = [], exchangeEndpoint = '/api/facebook/exchange-token', preferredPageId = null }) {
    if (!appId) throw new Error('appId is required')
    await loadFacebookSDK(appId)
  
    const shortUserToken = await loginAndGetUserAccessToken(scopes)
    // const exchange = await exchangeForLongLivedUserTokenViaBackend(shortUserToken, { endpoint: exchangeEndpoint })
    //console.log(shortUserToken,'shortUserToken')
    // const exchange = await exchangeForLongLivedUserTokenWtihoutBackend(shortUserToken)
    console.log('Short-lived token:', shortUserToken)
    
    // Use the secure Firebase Function for token exchange
    const exchange = await exchangeForLongLivedUserTokenViaFirebase(shortUserToken)
    console.log('Long-lived token exchange:', exchange)
    persistToken({ kind: 'user_long_lived', token: exchange.access_token, expiresInSeconds: exchange.expires_in })
  
    const pages = await getPageAccessTokens(exchange.access_token)
    let selected = pages[0]
    if (preferredPageId) {
      const match = pages.find((p) => p.id === String(preferredPageId))
      if (match) selected = match
    }
    if (selected && selected.access_token) {
      // Page tokens issued off a long-lived user token are long-lived
      persistToken({ kind: `page_${selected.id}`, token: selected.access_token })
    }
  
    return {
      longLivedUserAccessToken: exchange.access_token,
      longLivedUserExpiresIn: exchange.expires_in,
      pages
    }
  }
  
  export async function refreshPageAccessTokenIfNeeded(pageId) {
    const pageToken = getStoredToken(`page_${pageId}`)
    if (pageToken) return pageToken
  
    const userToken = getStoredToken('user_long_lived')
    if (!userToken) throw new Error('No stored long-lived user token. Re-auth needed.')
  
    const token = await getPageAccessTokenFor(pageId, userToken)
    persistToken({ kind: `page_${pageId}`, token })
    return token
  } 

 
export async function getPageLiveStatus(pageId, pageAccessToken) {
  try {
    // Get page posts to check for live status
    const postsUrl = `https://graph.facebook.com/v23.0/${pageId}/posts`;
    const postsParams = new URLSearchParams({
      access_token: pageAccessToken,
      fields: 'id,message,created_time,type,status_type,insights.metric(video_views)',
      limit: 10
    });

    const postsResponse = await fetch(`${postsUrl}?${postsParams.toString()}`);
    if (!postsResponse.ok) {
      throw new Error(`Failed to get page posts: ${postsResponse.status}`);
    }

    const postsData = await postsResponse.json();
    const posts = postsData.data || [];

    // Look for live video posts
    const livePosts = posts.filter(post => 
      post.type === 'video' && 
      post.status_type === 'live_video'
    );

    return {
      isLive: livePosts.length > 0,
      livePosts: livePosts,
      totalPosts: posts.length
    };
  } catch (error) {
    console.error('Error getting page live status:', error);
    throw error;
  }
}

export async function getPageInsights(pageId, pageAccessToken) {
  try {
    const insightsUrl = `https://graph.facebook.com/v23.0/${pageId}/insights`;
    const params = new URLSearchParams({
      access_token: pageAccessToken,
      metric: 'page_views_total,page_fans,page_fan_adds',
      period: 'day'
    });

    const response = await fetch(`${insightsUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to get page insights: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error getting page insights:', error);
    throw error;
  }
}

export async function getLiveVideoData(pageId, pageAccessToken) {
  try {
    // Try to get live videos (this might fail without app review)
    //const res=await fetch(`https://graph.facebook.com/v20.0/${page_id}/live_videos?fields=id,status,stream_url&access_token=${page_token}`)
    const liveVideosUrl = `https://graph.facebook.com/v23.0/${pageId}/live_videos`;
    const liveParams = new URLSearchParams({
      access_token: pageAccessToken,
      //fields: 'id,title,status,viewer_count,creation_time'
      fields: 'id,status,stream_url,title,viewer_count,creation_time'
    });

    const liveResponse = await fetch(`${liveVideosUrl}?${liveParams.toString()}`);
    
    if (liveResponse.ok) {
      const liveData = await liveResponse.json();
      const liveVideos = liveData.data || [];
      
      // Find active live video
      const activeLive = liveVideos.find(video => video.status === 'LIVE');
      
      if (activeLive) {
        let viewerCount = typeof activeLive.viewer_count === 'number' ? activeLive.viewer_count : null;

        // Fallback: try fetching live_views/views from the video node if viewer_count is missing
        if (viewerCount == null) {
          try {
            const videoDetailsRes = await fetch(`https://graph.facebook.com/v23.0/${activeLive.id}?fields=live_views&access_token=${encodeURIComponent(pageAccessToken)}`);
            if (videoDetailsRes.ok) {
              const vd = await videoDetailsRes.json();
              if (typeof vd.live_views === 'number') viewerCount = vd.live_views;
              else if (typeof vd.views === 'number') viewerCount = vd.views;
            }
          } catch (_) {}
        }

        return {
          isLive: true,
          viewerCount: viewerCount ?? 0,
          videoId: activeLive.id,
          title: activeLive.title,
          startTime: activeLive.creation_time,
          stream_url:activeLive.stream_url
        };
      }
    }
    
    // Fallback: check posts for live status
    // const liveStatus = await getPageLiveStatus(pageId, pageAccessToken);
    
    // if (liveStatus.isLive) {
    //   return {
    //     isLive: true,
    //     viewerCount: 'Live (exact count requires app review)',
    //     videoId: liveStatus.livePosts[0]?.id,
    //     title: 'Live Video',
    //     startTime: liveStatus.livePosts[0]?.created_time
    //   };
    // }
    
    return {
      isLive: false,
      viewerCount: 0,
      videoId: null,
      title: null,
      startTime: null,
      stream_url:null
    };
    
  } catch (error) {
    console.error('Error getting live video data:', error);
    // Fallback to posts method
    // try {
    //   const liveStatus = await getPageLiveStatus(pageId, pageAccessToken);
    //   return {
    //     isLive: liveStatus.isLive,
    //     viewerCount: liveStatus.isLive ? 'Live (approximate)' : 0,
    //     videoId: liveStatus.livePosts[0]?.id,
    //     title: 'Live Video',
    //     startTime: liveStatus.livePosts[0]?.created_time
    //   };
    // } catch (fallbackError) {
    //   console.error('Fallback method also failed:', fallbackError);
    //   return {
    //     isLive: false,
    //     viewerCount: 0,
    //     videoId: null,
    //     title: null,
    //     startTime: null,
    //     error: error.message
    //   };
    // }
  }
} 

 