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
