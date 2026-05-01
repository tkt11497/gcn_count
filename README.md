# Firebase Functions for Facebook Token Exchange

This directory contains Firebase Cloud Functions for securely exchanging Facebook short-lived tokens for long-lived tokens.

## Setup Instructions

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Environment Variables
Create a `.env` file in the functions directory with:
```
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

### 3. Deploy Functions
```bash
firebase deploy --only functions
```

### 4. Update Function URL
After deployment, update the function URL in `src/js/facebookAuth.js`:
```javascript
const functionUrl = 'https://us-central1-gcc-live-count.cloudfunctions.net/exchangeFacebookToken'
```

## Available Functions

### 1. exchangeFacebookToken
- **Purpose**: Exchange short-lived Facebook token for long-lived token
- **Method**: POST
- **Body**: `{ shortLivedUserToken: "string" }`
- **Returns**: `{ access_token, token_type, expires_in }`

### 2. getPageTokens
- **Purpose**: Get page access tokens for a user
- **Method**: POST
- **Body**: `{ userAccessToken: "string" }`
- **Returns**: `{ pages: [...] }`

### 3. healthCheck
- **Purpose**: Health check endpoint
- **Method**: GET
- **Returns**: `{ status: "ok", message: "..." }`

### 4. Google Sheet Social Metrics Sync
- **Admin page:** `/sheet-sync`
- **Purpose:** Discover recent Facebook, Instagram, YouTube, and TikTok content and write rows to Google Sheets.
- **Manual run endpoint:** `POST https://us-central1-gcc-live-count.cloudfunctions.net/runSheetSync`
- **Preview endpoint:** `POST https://us-central1-gcc-live-count.cloudfunctions.net/runSheetSync` with `{ "preview": true }`
- **Config endpoint:** `POST https://us-central1-gcc-live-count.cloudfunctions.net/saveSyncConfig`
- **Sheet test endpoint:** `POST https://us-central1-gcc-live-count.cloudfunctions.net/testSheetConnection`
- **Instagram OAuth:** `POST https://us-central1-gcc-live-count.cloudfunctions.net/startInstagramOAuth`, callback at `https://us-central1-gcc-live-count.cloudfunctions.net/oauthCallbackInstagram`
- **TikTok OAuth:** `POST https://us-central1-gcc-live-count.cloudfunctions.net/startTikTokOAuth`, callback at `https://us-central1-gcc-live-count.cloudfunctions.net/oauthCallbackTikTok`

Required backend environment:
```
GOOGLE_SERVICE_ACCOUNT_JSON={"client_email":"...","private_key":"..."}
YT_API_KEY=...
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
INSTAGRAM_REDIRECT_URI=https://us-central1-gcc-live-count.cloudfunctions.net/oauthCallbackInstagram
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_REDIRECT_URI=https://us-central1-gcc-live-count.cloudfunctions.net/oauthCallbackTikTok
```

Notes:
- Share the target Google Sheet with the `client_email` from the service account.
- For this internal tool, credentials entered from `/sheet-sync` are stored server-side in Firestore for the sync functions to use.
- The scheduled function runs every 15 minutes and only performs the sync once the configured local schedule time has been reached for that day.
- Instagram sync supports either separately connected Instagram Business/Creator accounts or Instagram accounts linked to connected Facebook Pages.
- For separate Instagram OAuth, use the Instagram app ID/secret from **Meta > Instagram > API setup with Instagram login**, not the Facebook Login app credentials.
- TikTok requires approved `user.info.basic` and `video.list` scopes before owned-account video sync will return production data.

Google service account setup:
1. Open Google Cloud Console and select the Firebase project.
2. Go to **IAM & Admin > Service Accounts**.
3. Create a service account, or open an existing one.
4. Go to **Keys > Add key > Create new key > JSON** and download the file.
5. Open the JSON file and copy the full contents into `/sheet-sync` > **Service account JSON**.
6. Copy the `client_email` value from that JSON and share the target Google Sheet with that email as **Editor**.
7. Click **Save Config**, then **Test Sheet**.

## Security Notes

- The Facebook App Secret is now stored securely on the server
- CORS is enabled for cross-origin requests
- Input validation is implemented
- Error handling is comprehensive

## Testing

You can test the functions locally using:
```bash
firebase emulators:start --only functions
```

Then call the functions at:
- `http://localhost:5001/gcc-live-count/us-central1/exchangeFacebookToken`
- `http://localhost:5001/gcc-live-count/us-central1/getPageTokens`
- `http://localhost:5001/gcc-live-count/us-central1/healthCheck`
# vue-composition-api-noteballs

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

---

## 🎉 OBS Real-Time Reactions Overlay

Use the lightweight tooling inside `obs-reactions/` to capture viewer reactions from a web page and render them live inside OBS as a Browser Source overlay.

### Folder contents

| Path | Description |
| --- | --- |
| `obs-reactions/server/reactions-server.js` | Node.js + WebSocket relay server that receives reactions and broadcasts them to every connected overlay client |
| `obs-reactions/web/overlay.html` | Transparent overlay page (add it as a Browser Source in OBS) that animates incoming reactions |
| `obs-reactions/web/reactions-panel.html` | Simple viewer-facing panel where people can click emojis to react |

### 1. Install dependencies

```bash
npm install express ws cors
```

### 2. Start the reactions relay server

```bash
node obs-reactions/server/reactions-server.js
```

The server listens on `ws://localhost:4000` by default (override via the `PORT` env variable).

### 3. Serve the overlay + reaction panel

You can open the HTML files directly in a browser or host them with any static server. Pass a custom WebSocket URL via the `?ws=` query parameter if the relay server runs on a different host/port.

Example:

```
file:///.../obs-reactions/web/overlay.html?ws=ws://your-server:4000
```

### 4. Add overlay to OBS

1. In OBS → *Sources* → `+` → **Browser**
2. Set the URL to the overlay file (local file path or hosted URL)
3. Width/Height should match your canvas (e.g. 1920×1080)
4. Ensure *Background Color* is transparent

### 5. Share the reaction panel with viewers

Send `reactions-panel.html` to your audience (host it publicly or embed it on a site). Each click sends a WebSocket message to the relay server which then pushes the animated reaction to your overlay.

### Advanced

- Customize emojis/labels/colors by editing `reactions-panel.html`
- Change animation style/positioning inside `overlay.html`
- Secure the relay server behind HTTPS/WSS when deploying publicly
