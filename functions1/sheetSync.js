import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';
import fetch from 'node-fetch';

const DEFAULT_CONFIG_ID = 'default';
const DEFAULT_TIMEZONE = 'Asia/Rangoon';
const DEFAULT_TIKTOK_REDIRECT_URI = 'https://us-central1-gcc-live-count.cloudfunctions.net/oauthCallbackTikTok';
const DEFAULT_YOUTUBE_REDIRECT_URI = 'https://us-central1-gcc-live-count.cloudfunctions.net/oauthCallbackYouTube';
const DEFAULT_INSTAGRAM_REDIRECT_URI = 'https://us-central1-gcc-live-count.cloudfunctions.net/oauthCallbackInstagram';
const YOUTUBE_REACH_REPORT_TYPE_ID = 'channel_reach_basic_a1';
const YOUTUBE_REACH_REPORT_JOB_NAME = 'Sheet Sync YouTube Reach';
const YOUTUBE_REACH_CACHE_REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000;
const FACEBOOK_POST_FIELDS = 'id,created_time,message,story,permalink_url,status_type,attachments{media_type}';
const FACEBOOK_POST_FIELDS_BASIC = 'id,created_time,message,story,permalink_url,status_type';
const INSTAGRAM_PROFILE_FIELDS = 'id,user_id,username,name,account_type,profile_picture_url,followers_count,media_count';
const INSTAGRAM_BASIC_PROFILE_FIELDS = 'id,user_id,username,name,account_type,profile_picture_url';
const INSTAGRAM_DIRECT_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
];
const SHEET_HEADERS = [
  'Date',
  'Content',
  'Platform',
  'Type',
  'Link',
  'Reach',
  'Impressions',
  'Interactions',
  'Video View',
  'CTR',
];
const FOLLOWER_HEADERS = [
  'Date Range',
  'Platform',
  'Account',
  'Account ID',
  'Start Followers',
  'End Followers',
  'Growth',
  'Current Followers',
];
const SECRET_FIELDS = [
  {
    name: 'googleServiceAccountJson',
    label: 'Service account JSON',
    envNames: ['GOOGLE_SERVICE_ACCOUNT_JSON'],
    fallbackEnvPair: ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'],
  },
  { name: 'youtubeApiKey', label: 'YouTube API key', envNames: ['YT_API_KEY'] },
  {
    name: 'googleOAuthClientId',
    label: 'Google OAuth client ID',
    envNames: ['GOOGLE_OAUTH_CLIENT_ID', 'YOUTUBE_CLIENT_ID'],
  },
  {
    name: 'googleOAuthClientSecret',
    label: 'Google OAuth client secret',
    envNames: ['GOOGLE_OAUTH_CLIENT_SECRET', 'YOUTUBE_CLIENT_SECRET'],
  },
  { name: 'youtubeRedirectUri', label: 'YouTube redirect URI', envNames: ['YOUTUBE_REDIRECT_URI'], revealValue: true },
  { name: 'instagramClientId', label: 'Instagram client ID', envNames: ['INSTAGRAM_CLIENT_ID'] },
  { name: 'instagramClientSecret', label: 'Instagram client secret', envNames: ['INSTAGRAM_CLIENT_SECRET'] },
  { name: 'instagramRedirectUri', label: 'Instagram redirect URI', envNames: ['INSTAGRAM_REDIRECT_URI'], revealValue: true },
  { name: 'tiktokClientKey', label: 'TikTok client key', envNames: ['TIKTOK_CLIENT_KEY'] },
  { name: 'tiktokClientSecret', label: 'TikTok client secret', envNames: ['TIKTOK_CLIENT_SECRET'] },
  { name: 'tiktokRedirectUri', label: 'TikTok redirect URI', envNames: ['TIKTOK_REDIRECT_URI'], revealValue: true },
];
const SECRET_FIELD_NAMES = SECRET_FIELDS.map((field) => field.name);

function db() {
  return getFirestore();
}

function setCors(res, methods = 'POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function jsonError(res, status, error, details = {}) {
  res.status(status).json({ ok: false, error, ...details });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function requireFirebaseUser(req) {
  const authHeader = req.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error('Missing Firebase Authorization bearer token');
  }
  return getAuth().verifyIdToken(match[1]);
}

function numberOrDash(value) {
  if (value == null) return '-';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : '-';
}

function nullableNumber(value) {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function insightValueToNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return toNumber(value, null);
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + (insightValueToNumber(item) || 0), 0);
  }
  if (typeof value === 'object') {
    return Object.values(value).reduce((sum, item) => sum + (insightValueToNumber(item) || 0), 0);
  }
  return null;
}

function sanitizeDocId(value) {
  return String(value || '').replace(/\//g, '_');
}

function apiErrorMessage(data, fallback) {
  if (typeof data?.error === 'string') return data.error;
  return data?.error?.message
    || data?.error_description
    || data?.error_message
    || data?.error_type
    || fallback;
}

function isUnsupportedMethodError(error, method) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('unsupported')
    && message.includes('method type')
    && message.includes(String(method || '').toLowerCase());
}

function shouldRetryInstagramTokenExchangeWithPost(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return isUnsupportedMethodError(error, 'get')
    || message.includes('did not return an access token')
    || message.includes("content isn't available");
}

function formatSheetDate(dateValue, timezone = DEFAULT_TIMEZONE) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || DEFAULT_TIMEZONE,
    day: 'numeric',
    month: 'short',
  }).formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  return `${day}-${month}`;
}

function isoFromSeconds(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return '';
  return new Date(seconds * 1000).toISOString();
}

function dateValueMillis(value) {
  const millis = new Date(value || '').getTime();
  return Number.isFinite(millis) ? millis : null;
}

function isoDateOnly(value) {
  if (!value) return '';
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}$/);
  if (match) return match[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function defaultStartDate() {
  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

function localDateString(value = new Date(), timezone = DEFAULT_TIMEZONE) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : '';
}

function shiftIsoDate(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function timestampToLocalDate(value, timezone = DEFAULT_TIMEZONE) {
  if (!value) return '';
  if (typeof value.toDate === 'function') return localDateString(value.toDate(), timezone);
  return localDateString(value, timezone);
}

function isCurrentLocalDate(date, timezone = DEFAULT_TIMEZONE) {
  return String(date || '') === localDateString(new Date(), timezone);
}

function syncWindowDates(config) {
  return {
    startDate: isoDateOnly(config.startDate) || defaultStartDate(),
    endDate: isoDateOnly(config.endDate) || defaultEndDate(),
  };
}

function getSyncWindow(config) {
  const { startDate, endDate } = syncWindowDates(config);
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);
  return { start, end };
}

function configForDateScope(config, scope) {
  if (scope === 'followers') {
    const ranges = getFollowerDateRanges(config);
    const firstRange = ranges[0] || {
      startDate: config.followerStartDate || config.startDate,
      endDate: config.followerEndDate || config.endDate,
    };
    return {
      ...config,
      startDate: firstRange.startDate,
      endDate: firstRange.endDate,
      followerDateRanges: ranges,
    };
  }

  return {
    ...config,
    startDate: config.contentStartDate || config.startDate,
    endDate: config.contentEndDate || config.endDate,
  };
}

function normalizeFollowerDateRanges(input = {}, fallbackStartDate, fallbackEndDate) {
  const rawRanges = Array.isArray(input.followerDateRanges) ? input.followerDateRanges : [];
  if (rawRanges.length) {
    return rawRanges.map((range) => ({
      startDate: isoDateOnly(range?.startDate),
      endDate: isoDateOnly(range?.endDate),
    }));
  }

  return [{
    startDate: isoDateOnly(input.followerStartDate) || fallbackStartDate,
    endDate: isoDateOnly(input.followerEndDate) || fallbackEndDate,
  }];
}

function getFollowerDateRanges(config = {}) {
  const ranges = Array.isArray(config.followerDateRanges) ? config.followerDateRanges : [];
  const normalized = ranges
    .map((range) => ({
      startDate: isoDateOnly(range?.startDate),
      endDate: isoDateOnly(range?.endDate),
    }))
    .filter((range) => range.startDate && range.endDate);

  if (normalized.length) return normalized;
  return [{
    startDate: isoDateOnly(config.followerStartDate || config.startDate) || defaultStartDate(),
    endDate: isoDateOnly(config.followerEndDate || config.endDate) || defaultEndDate(),
  }];
}

function followerTargetDates(config = {}) {
  return Array.from(new Set(
    getFollowerDateRanges(config)
      .flatMap((range) => [range.startDate, range.endDate])
      .filter(Boolean),
  ));
}

function normalizeConfig(input = {}) {
  const legacyStartDate = input.startDate
    ? isoDateOnly(input.startDate)
    : new Date(
      Date.now() - Math.max(1, Math.min(90, Number(input.lookbackDays || 14))) * 24 * 60 * 60 * 1000,
    ).toISOString().slice(0, 10);
  const legacyEndDate = isoDateOnly(input.endDate) || defaultEndDate();
  const contentStartDate = isoDateOnly(input.contentStartDate) || legacyStartDate;
  const contentEndDate = isoDateOnly(input.contentEndDate) || legacyEndDate;
  const followerStartDate = isoDateOnly(input.followerStartDate) || legacyStartDate;
  const followerEndDate = isoDateOnly(input.followerEndDate) || legacyEndDate;
  const followerDateRanges = normalizeFollowerDateRanges(input, followerStartDate, followerEndDate);
  const firstFollowerRange = followerDateRanges[0] || {
    startDate: followerStartDate,
    endDate: followerEndDate,
  };

  const normalized = {
    sheetId: String(input.sheetId || '').trim(),
    sheetTab: String(input.sheetTab || 'Sheet1').trim(),
    followerSheetTab: String(input.followerSheetTab || 'Follower Growth').trim(),
    headerRow: Math.max(1, Number(input.headerRow || 1)),
    timezone: String(input.timezone || DEFAULT_TIMEZONE).trim(),
    scheduleTime: String(input.scheduleTime || '09:00').trim(),
    scheduleEnabled: Boolean(input.scheduleEnabled),
    startDate: contentStartDate,
    endDate: contentEndDate,
    contentStartDate,
    contentEndDate,
    followerStartDate: firstFollowerRange.startDate,
    followerEndDate: firstFollowerRange.endDate,
    followerDateRanges,
    enabledPlatforms: {
      facebook: input.enabledPlatforms?.facebook !== false,
      instagram: input.enabledPlatforms?.instagram !== false,
      youtube: input.enabledPlatforms?.youtube !== false,
      tiktok: input.enabledPlatforms?.tiktok !== false,
    },
    selectedAccounts: {
      facebook: Array.isArray(input.selectedAccounts?.facebook)
        ? input.selectedAccounts.facebook.map(String)
        : [],
      instagram: Array.isArray(input.selectedAccounts?.instagram)
        ? input.selectedAccounts.instagram.map(String)
        : [],
      youtube: Array.isArray(input.selectedAccounts?.youtube)
        ? input.selectedAccounts.youtube.map(String)
        : [],
      tiktok: Array.isArray(input.selectedAccounts?.tiktok)
        ? input.selectedAccounts.tiktok.map(String)
        : [],
    },
  };

  if (input.lastFollowerTotals) {
    normalized.lastFollowerTotals = {
      facebook: nullableNumber(input.lastFollowerTotals?.facebook),
      instagram: nullableNumber(input.lastFollowerTotals?.instagram),
      tiktok: nullableNumber(input.lastFollowerTotals?.tiktok),
      youtube: nullableNumber(input.lastFollowerTotals?.youtube),
    };
  }

  if (input.lastFollowerAccounts && typeof input.lastFollowerAccounts === 'object') {
    normalized.lastFollowerAccounts = Object.fromEntries(
      Object.entries(input.lastFollowerAccounts)
        .map(([key, value]) => [key, nullableNumber(value)])
        .filter(([, value]) => value !== null),
    );
  }

  return normalized;
}

function assertDateRange(label, startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error(`${label} start date must use YYYY-MM-DD format`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error(`${label} end date must use YYYY-MM-DD format`);
  }
  const { start, end } = getSyncWindow({ startDate, endDate });
  if (start > end) throw new Error(`${label} start date must be before or equal to end date`);
}

function assertValidConfig(config) {
  if (!config.sheetId) throw new Error('Google Sheet ID is required');
  if (!config.sheetTab) throw new Error('Worksheet/tab name is required');
  if (!config.followerSheetTab) throw new Error('Follower worksheet/tab name is required');
  if (!/^\d{2}:\d{2}$/.test(config.scheduleTime)) {
    throw new Error('Schedule time must use HH:mm format');
  }
  assertDateRange('Content tab', config.contentStartDate || config.startDate, config.contentEndDate || config.endDate);
  getFollowerDateRanges(config).forEach((range, index) => {
    assertDateRange(`Follower tab range ${index + 1}`, range.startDate, range.endDate);
  });
}

function normalizeRunTarget(value) {
  const target = String(value || 'both').toLowerCase();
  if (target === 'content') return 'content';
  if (target === 'follower' || target === 'followers') return 'followers';
  return 'both';
}

function targetIncludesContent(target) {
  return target === 'both' || target === 'content';
}

function targetIncludesFollowers(target) {
  return target === 'both' || target === 'followers';
}

async function saveSecretPatch(configId, secrets = {}) {
  const patch = {};

  for (const fieldName of SECRET_FIELD_NAMES) {
    if (Object.prototype.hasOwnProperty.call(secrets, fieldName) && secrets[fieldName]) {
      patch[fieldName] = String(secrets[fieldName]);
    }
  }

  if (!Object.keys(patch).length) return;
  patch.updatedAt = FieldValue.serverTimestamp();
  await db().collection('sync_secrets').doc(configId).set(patch, { merge: true });
}

async function getSecretDoc(configId = DEFAULT_CONFIG_ID) {
  const snap = await db().collection('sync_secrets').doc(configId).get();
  return snap.exists ? snap.data() : {};
}

function maskSecretValue(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.length <= 8) return 'Stored';
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function timestampToIso(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function rawEnvSecretValue(field) {
  for (const envName of field.envNames || []) {
    if (process.env[envName]) {
      return process.env[envName];
    }
  }

  if (
    field.fallbackEnvPair
    && field.fallbackEnvPair.every((envName) => process.env[envName])
  ) {
    if (field.name === 'googleServiceAccountJson') {
      return JSON.stringify({
        client_email: process.env[field.fallbackEnvPair[0]],
        private_key: process.env[field.fallbackEnvPair[1]],
      }, null, 2);
    }
    return process.env[field.fallbackEnvPair[0]];
  }

  return null;
}

function envSecretValue(field) {
  const value = rawEnvSecretValue(field);
  return value ? { value, source: 'Environment' } : null;
}

function serviceAccountInfo(value) {
  const text = String(value || '').trim();
  if (text.includes('@')) {
    return `client_email: ${text}`;
  }
  try {
    const parsed = JSON.parse(text);
    const parts = [
      parsed.client_email ? `client_email: ${parsed.client_email}` : '',
      parsed.project_id ? `project_id: ${parsed.project_id}` : '',
    ].filter(Boolean);
    return parts.join(' | ');
  } catch (_) {
    return maskSecretValue(value);
  }
}

function secretDisplayInfo(field, value, source) {
  if (!value) return '';
  if (field.name === 'googleServiceAccountJson') {
    return serviceAccountInfo(value);
  }
  if (field.revealValue) {
    return String(value);
  }
  if (field.name.endsWith('ClientId') || field.name === 'tiktokClientKey') {
    return maskSecretValue(value);
  }
  return source === 'Environment' ? 'Configured in environment' : 'Stored securely';
}

function buildSecretStatus(secrets = {}, { includeValues = false } = {}) {
  return SECRET_FIELDS.map((field) => {
    const envSecret = envSecretValue(field);
    const savedValue = secrets?.[field.name];
    const resolved = envSecret || (savedValue ? { value: savedValue, source: 'Saved setting' } : null);

    const status = {
      name: field.name,
      label: field.label,
      configured: Boolean(resolved?.value),
      source: resolved?.source || '',
      info: resolved?.value ? secretDisplayInfo(field, resolved.value, resolved.source) : '',
    };

    if (includeValues && resolved?.value) {
      status.value = String(resolved.value);
    }

    return status;
  });
}

async function getSecretValue(configId, name, envNames = []) {
  for (const envName of envNames) {
    if (process.env[envName]) return process.env[envName];
  }
  const secrets = await getSecretDoc(configId);
  return secrets?.[name] || '';
}

async function getGoogleCredentials(configId) {
  const json = await getSecretValue(configId, 'googleServiceAccountJson', [
    'GOOGLE_SERVICE_ACCOUNT_JSON',
  ]);
  if (json) {
    const parsed = JSON.parse(json);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
  }

  throw new Error('Google service account credentials are not configured');
}

async function getSheetsToken(configId) {
  const auth = new GoogleAuth({
    credentials: await getGoogleCredentials(configId),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return typeof token === 'string' ? token : token?.token;
}

function quoteSheetName(tab) {
  return `'${String(tab || 'Sheet1').replace(/'/g, "''")}'`;
}

function rangeFor(config, range) {
  return `${quoteSheetName(config.sheetTab)}!${range}`;
}

function rangeForTab(tab, range) {
  return `${quoteSheetName(tab)}!${range}`;
}

function columnName(index) {
  let value = Number(index);
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name || 'A';
}

async function sheetsFetch(configId, config, method, range, body) {
  const token = await getSheetsToken(configId);
  const encodedRange = encodeURIComponent(rangeFor(config, range));
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodedRange}`;
  if (method === 'POST') {
    url += ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';
  } else if (method === 'PUT') {
    url += '?valueInputOption=USER_ENTERED';
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Google Sheets API error ${response.status}`);
  }
  return data;
}

async function sheetsBatchUpdate(configId, config, data) {
  if (!data.length) return {};
  const token = await getSheetsToken(configId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values:batchUpdate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error?.message || `Google Sheets batch update error ${response.status}`);
  }
  return result;
}

async function sheetsBatchClear(configId, config, ranges) {
  if (!ranges.length) return {};
  const token = await getSheetsToken(configId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values:batchClear`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ranges }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error?.message || `Google Sheets batch clear error ${response.status}`);
  }
  return result;
}

async function sheetsSpreadsheetRequest(configId, config, method = 'GET', body) {
  const token = await getSheetsToken(configId);
  const suffix = method === 'POST' ? ':batchUpdate' : '';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}${suffix}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error?.message || `Google Sheets spreadsheet error ${response.status}`);
  }
  return result;
}

async function ensureWorksheetExists(configId, config, tabName) {
  const spreadsheet = await sheetsSpreadsheetRequest(configId, config, 'GET');
  const sheet = (spreadsheet?.sheets || [])
    .find((item) => item?.properties?.title === tabName);
  if (sheet?.properties?.sheetId != null) return sheet.properties.sheetId;

  const created = await sheetsSpreadsheetRequest(configId, config, 'POST', {
    requests: [{
      addSheet: {
        properties: {
          title: tabName,
        },
      },
    }],
  });
  return created?.replies?.[0]?.addSheet?.properties?.sheetId;
}

async function ensureHeadersForTab(configId, config, tabName, headers) {
  const row = Number(config.headerRow || 1);
  const tabConfig = { ...config, sheetTab: tabName };
  const endColumn = columnName(headers.length);
  const current = await sheetsFetch(configId, tabConfig, 'GET', `A${row}:${endColumn}${row}`);
  const existing = current?.values?.[0] || [];
  const missing = headers.some((header, index) => existing[index] !== header);
  if (missing) {
    await sheetsFetch(configId, tabConfig, 'PUT', `A${row}:${endColumn}${row}`, { values: [headers] });
  }
}

async function ensureSheetHeaders(configId, config) {
  const row = Number(config.headerRow || 1);
  await ensureWorksheetExists(configId, config, config.sheetTab || 'Sheet1');
  const current = await sheetsFetch(configId, config, 'GET', `A${row}:J${row}`);
  const existing = current?.values?.[0] || [];
  const missing = SHEET_HEADERS.some((header, index) => existing[index] !== header);
  if (missing) {
    await sheetsFetch(configId, config, 'PUT', `A${row}:J${row}`, { values: [SHEET_HEADERS] });
  }
  await applyContentSheetFormats(configId, config);
}

async function applyContentSheetFormats(configId, config) {
  const sheetId = await ensureWorksheetExists(configId, config, config.sheetTab || 'Sheet1');
  const startRowIndex = Number(config.headerRow || 1);
  await sheetsSpreadsheetRequest(configId, config, 'POST', {
    requests: [
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex,
            startColumnIndex: 5,
            endColumnIndex: 9,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'NUMBER',
                pattern: '#,##0',
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex,
            startColumnIndex: 9,
            endColumnIndex: 10,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'PERCENT',
                pattern: '0.00%',
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      },
    ],
  });
}

async function ensureFollowerSheetHeaders(configId, config) {
  const followerTab = config.followerSheetTab || 'Follower Growth';
  const followerConfig = { ...config, sheetTab: followerTab };
  const row = Number(config.headerRow || 1);
  await ensureWorksheetExists(configId, config, followerTab);

  const current = await sheetsFetch(configId, followerConfig, 'GET', `A${row}:J${row}`);
  const existing = current?.values?.[0] || [];
  const missing = FOLLOWER_HEADERS.some((header, index) => existing[index] !== header);
  if (missing) {
    await sheetsBatchClear(configId, config, [rangeForTab(followerTab, 'A:Z')]);
    await sheetsFetch(configId, followerConfig, 'PUT', `A${row}:H${row}`, { values: [FOLLOWER_HEADERS] });
  }

  await sheetsBatchClear(configId, config, [rangeForTab(followerTab, 'I:Z')]);
}

async function writeSheetRowsAt(configId, config, startRow, rows) {
  if (!rows.length) return;
  await sheetsBatchUpdate(configId, config, [{
    range: rangeFor(config, `A${startRow}:J${startRow + rows.length - 1}`),
    values: rows,
  }]);
}

async function rewriteContentSheetRows(configId, config, discoveredRows) {
  const startRow = Number(config.headerRow || 1) + 1;
  const sheetValues = await sheetsFetch(configId, config, 'GET', 'A:J');
  const lastValueRow = Math.max(Number(config.headerRow || 1), sheetValues?.values?.length || 0);
  const clearEndRow = Math.max(
    lastValueRow,
    startRow + discoveredRows.length + 25,
  );

  await sheetsBatchClear(configId, config, [
    rangeFor(config, `A${startRow}:J${clearEndRow}`),
  ]);

  if (discoveredRows.length) {
    await writeSheetRowsAt(configId, config, startRow, discoveredRows.map((item) => item.row));
  }

  return { appended: discoveredRows.length, updated: 0 };
}

async function commitSnapshotWrites(items) {
  const chunkSize = 450;
  for (let index = 0; index < items.length; index += chunkSize) {
    const batch = db().batch();
    for (const item of items.slice(index, index + chunkSize)) {
      batch.set(item.snapshotRef, item.payload, { merge: true });
    }
    await batch.commit();
  }
}

async function fbGet(path, token, params = {}) {
  const query = new URLSearchParams({ ...params, access_token: token });
  const response = await fetch(`https://graph.facebook.com/v25.0/${path}?${query.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(apiErrorMessage(data, `Facebook API error on ${path}`));
  }
  return data;
}

function isFacebookDeprecatedAttachmentFieldError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('deprecate_post_aggregated_fields_for_attachement')
    || (message.includes('deprecated') && message.includes('attachment'));
}

async function fetchFacebookPosts(page, since, until) {
  const baseParams = {
    since: String(since),
    until: String(until),
    limit: '50',
  };

  try {
    return {
      data: await fbGet(`${page.id}/posts`, page.access_token, {
        ...baseParams,
        fields: FACEBOOK_POST_FIELDS,
      }),
      warnings: [],
    };
  } catch (error) {
    if (!isFacebookDeprecatedAttachmentFieldError(error)) throw error;
    const data = await fbGet(`${page.id}/posts`, page.access_token, {
      ...baseParams,
      fields: FACEBOOK_POST_FIELDS_BASIC,
    });
    return {
      data,
      warnings: [{
        platform: 'facebook',
        accountId: page.id,
        message: 'Facebook rejected attachment media fields as deprecated, so this run used basic post fields for Facebook content type detection.',
      }],
    };
  }
}

async function igDirectGet(path, token, params = {}) {
  const query = new URLSearchParams({ ...params, access_token: token });
  const response = await fetch(`https://graph.instagram.com/v25.0/${path}?${query.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(apiErrorMessage(data, `Instagram API error on ${path}`));
  }
  return data;
}

async function tryFacebookMetric(postId, token, metricNames) {
  for (const metricName of metricNames) {
    try {
      const data = await fbGet(`${postId}/insights`, token, {
        metric: metricName,
        period: 'lifetime',
      });
      const values = data?.data?.[0]?.values || [];
      if (values.length) return insightValueToNumber(values[values.length - 1]?.value);
    } catch (_) {
      // Some metrics are unavailable depending on content type and app permissions.
    }
  }
  return null;
}

function facebookContentType(post) {
  const attachment = post?.attachments?.data?.[0] || {};
  const mediaType = String(attachment.media_type || '').toLowerCase();
  const statusType = String(post?.status_type || '').toLowerCase();

  if (statusType === 'live_video' || mediaType === 'live_video') {
    return 'Live';
  }

  if (
    mediaType === 'reel' ||
    mediaType === 'reels' ||
    statusType === 'reel' ||
    statusType === 'reels'
  ) {
    return 'Reels';
  }

  if (mediaType === 'video' || statusType === 'added_video') {
    return 'Video';
  }

  if (
    ['album', 'link', 'photo', 'status'].includes(mediaType) ||
    [
      'added_photos',
      'app_created_story',
      'approved_friend',
      'created_event',
      'created_group',
      'created_note',
      'mobile_status_update',
      'published_story',
      'shared_story',
      'tagged_in_photo',
      'wall_post',
    ].includes(statusType)
  ) {
    return 'Post';
  }

  return 'Unknown';
}

function facebookTitle(post) {
  return (
    post?.message ||
    post?.story ||
    post?.id ||
    ''
  ).trim();
}

async function discoverFacebookRows(config) {
  const rows = [];
  const errors = [];
  const warnings = [];
  const { start, end } = getSyncWindow(config);
  const sinceMs = start.getTime();
  const untilMs = end.getTime();
  const since = Math.floor(start.getTime() / 1000);
  const until = Math.floor(end.getTime() / 1000);
  const pagesSnap = await db().collection('pages').get();
  const selectedPageIds = new Set(config.selectedAccounts?.facebook || []);

  for (const pageDoc of pagesSnap.docs) {
    const page = { id: pageDoc.id, ...pageDoc.data() };
    if (selectedPageIds.size && !selectedPageIds.has(String(page.id))) continue;
    if (!page.access_token) continue;

    await db().collection('social_accounts').doc(`facebook_${sanitizeDocId(page.id)}`).set({
      platform: 'facebook',
      accountId: page.id,
      displayName: page.name || page.id,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    try {
      const { data: postsResp, warnings: postWarnings } = await fetchFacebookPosts(page, since, until);
      warnings.push(...postWarnings);

      for (const post of postsResp?.data || []) {
        const createdAtMs = dateValueMillis(post.created_time);
        if (createdAtMs === null || createdAtMs > untilMs || createdAtMs < sinceMs) continue;

        const type = facebookContentType(post);
        const isVideoLikeType = ['Live', 'Reels', 'Video'].includes(type);
        const [reach, impressions, videoViews, interactions] = await Promise.all([
          tryFacebookMetric(post.id, page.access_token, [
            'post_impressions_unique',
            'post_total_media_view_unique',
          ]),
          tryFacebookMetric(post.id, page.access_token, [
            'post_impressions',
            'post_media_view',
          ]),
          isVideoLikeType
            ? tryFacebookMetric(post.id, page.access_token, [
              'post_video_views',
              'post_media_view',
            ])
            : Promise.resolve(null),
          tryFacebookMetric(post.id, page.access_token, [
            'post_activity_by_action_type',
            'post_reactions_by_type_total',
          ]),
        ]);

        rows.push({
          key: `facebook:${post.id}`,
          platform: 'Facebook',
          contentId: post.id,
          createdAt: post.created_time,
          link: post.permalink_url || '',
          row: [
            formatSheetDate(post.created_time, config.timezone),
            facebookTitle(post),
            'Facebook',
            type,
            post.permalink_url || '',
            numberOrDash(reach),
            numberOrDash(impressions),
            numberOrDash(interactions),
            isVideoLikeType ? numberOrDash(videoViews) : '-',
            '-',
          ],
          metrics: {
            reach,
            impressions,
            interactions,
            videoViews,
            rawMediaType: post?.attachments?.data?.[0]?.media_type || '',
            rawStatusType: post?.status_type || '',
          },
        });
      }
    } catch (error) {
      errors.push({ platform: 'facebook', accountId: page.id, message: error.message });
    }
  }

  return { rows, errors, warnings };
}

function instagramAccountDocId(igUserId) {
  return `instagram_${sanitizeDocId(igUserId)}`;
}

function instagramAccountSelected(selectedAccountIds, account) {
  if (!selectedAccountIds.size) return true;
  const candidates = [
    account?.id,
    account?.accountId,
    account?.oauthUserId,
    account?.appScopedId,
    account?.user_id,
    account?.oauth_user_id,
    account?.app_scoped_user_id,
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .flatMap((value) => {
      const raw = String(value);
      return [raw, instagramAccountDocId(raw)];
    });
  return candidates.some((value) => selectedAccountIds.has(value));
}

async function getInstagramOAuthConfig(configId) {
  const [clientId, clientSecret, savedRedirectUri] = await Promise.all([
    getSecretValue(configId, 'instagramClientId', ['INSTAGRAM_CLIENT_ID']),
    getSecretValue(configId, 'instagramClientSecret', ['INSTAGRAM_CLIENT_SECRET']),
    getSecretValue(configId, 'instagramRedirectUri', ['INSTAGRAM_REDIRECT_URI']),
  ]);
  if (!clientId || !clientSecret) {
    throw new Error('Instagram client ID/secret are not configured. Use the Instagram app ID and app secret from Meta > Instagram > API setup with Instagram login.');
  }
  const trimmedRedirectUri = String(savedRedirectUri || '').trim();
  const redirectUri = trimmedRedirectUri === DEFAULT_INSTAGRAM_REDIRECT_URI
    ? trimmedRedirectUri
    : DEFAULT_INSTAGRAM_REDIRECT_URI;
  return { clientId, clientSecret, redirectUri };
}

async function instagramOAuthTokenRequest(params) {
  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error || data?.error_type || data?.error_message) {
    throw new Error(apiErrorMessage(data, `Instagram OAuth error ${response.status}`));
  }
  const tokenData = Array.isArray(data?.data) ? data.data[0] || {} : data;
  if (!tokenData?.access_token) {
    throw new Error('Instagram OAuth did not return an access token');
  }
  return {
    ...tokenData,
    raw: data,
  };
}

async function instagramTokenExchangeFetch(url, options, fallback) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error || data?.error_type || data?.error_message) {
    throw new Error(apiErrorMessage(data, fallback || `Instagram token exchange error ${response.status}`));
  }
  if (!data?.access_token) {
    throw new Error('Instagram token exchange did not return an access token');
  }
  return data;
}

async function exchangeInstagramLongLivedToken(shortLivedToken, clientSecret) {
  const query = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: clientSecret,
    access_token: shortLivedToken,
  });
  const getUrl = `https://graph.instagram.com/access_token?${query.toString()}`;

  try {
    return await instagramTokenExchangeFetch(getUrl, undefined, 'Instagram token exchange failed');
  } catch (getError) {
    if (!shouldRetryInstagramTokenExchangeWithPost(getError)) throw getError;

    try {
      return await instagramTokenExchangeFetch('https://graph.instagram.com/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: query,
      }, 'Instagram token exchange failed');
    } catch (postError) {
      throw new Error(`Instagram token exchange failed. GET: ${getError.message}; POST: ${postError.message}`);
    }
  }
}

async function getUsableInstagramToken(shortLivedToken, clientSecret) {
  try {
    return {
      ...(await exchangeInstagramLongLivedToken(shortLivedToken, clientSecret)),
      isLongLived: true,
    };
  } catch (error) {
    throw new Error(`Instagram long-lived token exchange failed: ${error.message}`);
  }
}

async function saveInstagramTokenSecret(accountId, tokenData, existingTokens = {}) {
  const expiresIn = Math.max(3600, Number(tokenData.expires_in || existingTokens.expires_in || 60 * 24 * 60 * 60));
  const tokens = {
    ...existingTokens,
    ...tokenData,
    access_token: tokenData.access_token || existingTokens.access_token,
    token_type: tokenData.token_type || existingTokens.token_type || 'bearer',
    expires_in: expiresIn,
    expires_at: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  };
  await db().collection('social_account_secrets').doc(accountId).set({
    provider: 'instagram',
    tokens: JSON.stringify(tokens),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return tokens;
}

async function getInstagramTokenSecret(accountId) {
  const secretSnap = await db().collection('social_account_secrets').doc(accountId).get();
  if (!secretSnap.exists) throw new Error(`Missing Instagram OAuth token for ${accountId}`);
  return JSON.parse(secretSnap.data()?.tokens || '{}');
}

async function refreshInstagramLongLivedToken(accessToken) {
  const query = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: accessToken,
  });
  const response = await fetch(`https://graph.instagram.com/refresh_access_token?${query.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error || data?.error_type || data?.error_message) {
    throw new Error(apiErrorMessage(data, `Instagram token refresh error ${response.status}`));
  }
  return data;
}

async function getInstagramAccessToken(accountId) {
  const tokens = await getInstagramTokenSecret(accountId);
  if (!tokens.access_token) throw new Error(`Missing Instagram access token for ${accountId}`);
  if (tokens.isLongLived === false && Number(tokens.expires_at || 0) <= Date.now()) {
    throw new Error(`Instagram short-lived token expired for ${accountId}; reconnect Instagram`);
  }
  const refreshWindowMs = 7 * 24 * 60 * 60 * 1000;
  if (tokens.isLongLived === false) return tokens.access_token;
  if (Number(tokens.expires_at || 0) > Date.now() + refreshWindowMs) return tokens.access_token;

  const refreshed = await refreshInstagramLongLivedToken(tokens.access_token);
  const merged = await saveInstagramTokenSecret(accountId, refreshed, tokens);
  return merged.access_token;
}

function normalizeInstagramProfilePayload(data, fallbackId = '') {
  const payload = Array.isArray(data?.data)
    ? data.data[0] || {}
    : data || {};
  const appScopedId = String(payload.id || '').trim();
  const professionalId = String(payload.user_id || '').trim();
  const id = professionalId || appScopedId || String(fallbackId || '').trim();
  return {
    ...payload,
    id,
    user_id: professionalId || id,
    appScopedId: appScopedId && appScopedId !== id ? appScopedId : '',
  };
}

function fallbackInstagramProfile(userId, profileWarning = '') {
  const id = String(userId || '').trim();
  return {
    id,
    user_id: id,
    username: '',
    name: '',
    account_type: '',
    profile_picture_url: '',
    followers_count: null,
    media_count: null,
    appScopedId: '',
    profileWarning,
  };
}

async function getInstagramProfileFromPath(path, accessToken, fallbackId = '') {
  try {
    return normalizeInstagramProfilePayload(await igDirectGet(path, accessToken, {
      fields: INSTAGRAM_PROFILE_FIELDS,
    }), fallbackId);
  } catch (fullProfileError) {
    try {
      const profile = normalizeInstagramProfilePayload(await igDirectGet(path, accessToken, {
        fields: INSTAGRAM_BASIC_PROFILE_FIELDS,
      }), fallbackId);
      return {
        ...profile,
        profileWarning: fullProfileError.message,
      };
    } catch (basicProfileError) {
      throw new Error(`${basicProfileError.message}; full profile fields also failed: ${fullProfileError.message}`);
    }
  }
}

async function getInstagramProfile(instagramUserId, accessToken) {
  const fallbackId = String(instagramUserId || '').trim();
  let meError = null;
  try {
    return await getInstagramProfileFromPath('me', accessToken, fallbackId);
  } catch (error) {
    meError = error;
  }

  if (!fallbackId) {
    throw new Error(`Instagram profile lookup failed: ${meError.message}`);
  }

  try {
    return await getInstagramProfileFromPath(fallbackId, accessToken, fallbackId);
  } catch (idError) {
    throw new Error(`Instagram profile lookup failed. /me: ${meError.message}; /${fallbackId}: ${idError.message}`);
  }
}

async function discoverInstagramDirectAccounts(config, seen = new Set()) {
  const accounts = [];
  const errors = [];
  const selectedAccountIds = new Set(config.selectedAccounts?.instagram || []);
  const accountsSnap = await db()
    .collection('social_accounts')
    .where('platform', '==', 'instagram')
    .get();

  for (const accountDoc of accountsSnap.docs) {
    const account = { id: accountDoc.id, ...accountDoc.data() };
    if (account.tokenSource !== 'instagram' && account.authSource !== 'instagram') continue;
    if (!instagramAccountSelected(selectedAccountIds, account)) {
      continue;
    }

    try {
      const accessToken = await getInstagramAccessToken(account.id);
      const profile = await getInstagramProfile(account.accountId, accessToken)
        .catch((error) => fallbackInstagramProfile(account.accountId || account.oauthUserId || account.id, error.message));
      const accountId = String(profile?.id || account.accountId || account.id);
      if (seen.has(accountId)) continue;

      const docId = instagramAccountDocId(accountId);
      const displayName = profile?.username || profile?.name || account.displayName || accountId;
      const followers = nullableNumber(profile?.followers_count);
      const normalizedAccount = {
        id: docId,
        accountId,
        displayName,
        username: profile?.username || account.username || '',
        name: profile?.name || account.name || '',
        accessToken,
        followers,
        tokenSource: 'instagram',
      };
      accounts.push(normalizedAccount);
      seen.add(accountId);

      await db().collection('social_accounts').doc(docId).set({
        platform: 'instagram',
        accountId,
        displayName,
        username: normalizedAccount.username,
        name: normalizedAccount.name,
        accountType: profile?.account_type || account.accountType || '',
        appScopedId: profile?.appScopedId || account.appScopedId || '',
        oauthUserId: account.oauthUserId || profile?.appScopedId || '',
        tokenSource: 'instagram',
        authSource: 'instagram',
        profileWarning: profile?.profileWarning || '',
        latestFollowerCount: followers,
        mediaCount: nullableNumber(profile?.media_count),
        profilePictureUrl: profile?.profile_picture_url || account.profilePictureUrl || '',
        connectedBy: account.connectedBy || '',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      if (account.id !== docId) {
        const secret = await db().collection('social_account_secrets').doc(account.id).get();
        if (secret.exists) {
          await db().collection('social_account_secrets').doc(docId).set(secret.data(), { merge: true });
        }
      }
    } catch (error) {
      errors.push({ platform: 'instagram', accountId: account.accountId || account.id, message: error.message });
    }
  }

  return { accounts, errors };
}

async function discoverInstagramAccounts(config) {
  const seen = new Set();
  return discoverInstagramDirectAccounts(config, seen);
}

function instagramContentType(media) {
  const mediaProductType = String(media?.media_product_type || '').toLowerCase();
  const mediaType = String(media?.media_type || '').toLowerCase();
  if (mediaProductType.includes('reel')) return 'Reels';
  if (mediaProductType.includes('live')) return 'Live';
  if (mediaProductType.includes('stor')) return 'Stories';
  if (mediaType.includes('video')) return 'Video';
  if (mediaType.includes('carousel')) return 'Carousel';
  return 'Post';
}

function instagramTitle(media) {
  return String(media?.caption || media?.id || '').trim();
}

function safeInstagramDebugValue(value) {
  if (Array.isArray(value)) return value.map(safeInstagramDebugValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/^(access[_-]?token|refresh[_-]?token|id[_-]?token)$/i.test(key))
      .map(([key, item]) => [key, safeInstagramDebugValue(item)]),
  );
}

function pushInstagramDebug(debug, event) {
  if (!Array.isArray(debug)) return;
  debug.push({
    at: new Date().toISOString(),
    ...safeInstagramDebugValue(event),
  });
}

function instagramAccountDebug(account) {
  return safeInstagramDebugValue({
    id: account?.id,
    accountId: account?.accountId,
    displayName: account?.displayName,
    username: account?.username,
    tokenSource: account?.tokenSource,
    authSource: account?.authSource,
    tokenType: account?.tokenType,
    oauthUserId: account?.oauthUserId,
    appScopedId: account?.appScopedId,
  });
}

function instagramPrimaryInsightMetricNames(media = null) {
  const contentType = media ? instagramContentType(media) : '';
  if (contentType === 'Stories') return ['reach', 'views', 'replies', 'shares', 'navigation'];
  return ['reach', 'views', 'total_interactions', 'likes', 'comments', 'saved', 'shares'];
}

function instagramLegacyInsightMetricNames(media = null) {
  if (!media) return ['impressions', 'plays', 'video_views', 'engagement'];
  const contentType = media ? instagramContentType(media) : '';
  if (contentType === 'Stories') {
    return ['impressions', 'replies', 'exits', 'taps_forward', 'taps_back'];
  }
  if (['Reels', 'Video', 'Live'].includes(contentType)) {
    return ['plays', 'impressions', 'video_views', 'engagement'];
  }
  return ['impressions', 'engagement'];
}

function instagramExpandedInsightField(metricNames) {
  return `insights.metric(${metricNames.join(',')})`;
}

async function requestInstagramMediaPage(account, path, baseParams, fieldSet, debug = [], reason = '') {
  const params = { ...baseParams, fields: fieldSet.fields };
  pushInstagramDebug(debug, {
    stage: 'media_list_request',
    account: instagramAccountDebug(account),
    path,
    params,
    fieldSet: fieldSet.name,
    reason,
  });
  const data = await igDirectGet(path, account.accessToken, params);
  pushInstagramDebug(debug, {
    stage: 'media_list_response',
    path,
    fieldSet: fieldSet.name,
    response: data,
  });
  return data;
}

async function requestInstagramMediaPageWithFallbacks(account, path, baseParams, fieldSets, debug = [], reason = '') {
  let lastError = null;
  for (const fieldSet of fieldSets) {
    try {
      return await requestInstagramMediaPage(account, path, baseParams, fieldSet, debug, reason);
    } catch (error) {
      lastError = error;
      pushInstagramDebug(debug, {
        stage: 'media_list_error',
        path,
        params: { ...baseParams, fields: fieldSet.fields },
        fieldSet: fieldSet.name,
        reason,
        message: error.message,
      });
    }
  }
  throw lastError || new Error(`Instagram media request failed for ${path}`);
}

async function getInstagramMediaPage(account, after = '', debug = []) {
  const baseParams = {
    limit: '50',
    ...(after ? { after } : {}),
  };
  const fullFields = 'id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count';
  const basicFields = 'id,caption,media_type,permalink,timestamp';
  const fieldSets = [
    {
      name: 'expanded_current_insights',
      fields: `${fullFields},${instagramExpandedInsightField(instagramPrimaryInsightMetricNames())}`,
    },
    {
      name: 'expanded_legacy_insights',
      fields: `${fullFields},${instagramExpandedInsightField(['reach', ...instagramLegacyInsightMetricNames()])}`,
    },
    {
      name: 'media_fields',
      fields: fullFields,
    },
    {
      name: 'basic_media_fields',
      fields: basicFields,
    },
  ];
  const mediaPath = `${account.accountId}/media`;
  const fallbackMediaPath = account.tokenSource === 'instagram' ? 'me/media' : '';

  const data = await requestInstagramMediaPageWithFallbacks(account, mediaPath, baseParams, fieldSets, debug);
  if (!fallbackMediaPath || after || (data?.data || []).length) return data;

  try {
    return await requestInstagramMediaPageWithFallbacks(
      account,
      fallbackMediaPath,
      baseParams,
      fieldSets,
      debug,
      'primary returned no media',
    );
  } catch (fallbackError) {
    pushInstagramDebug(debug, {
      stage: 'media_list_error',
      path: fallbackMediaPath,
      reason: 'fallback after primary returned no media',
      message: fallbackError.message,
    });
    return data;
  }
}

function instagramInsightMetricNames(media) {
  return [
    ...instagramPrimaryInsightMetricNames(media),
    ...instagramLegacyInsightMetricNames(media),
  ].filter((metricName, index, all) => all.indexOf(metricName) === index);
}

function instagramInsightsMap(data) {
  const insights = {};
  for (const item of data?.data || []) {
    const value = item?.values?.[0]?.value;
    insights[item?.name] = insightValueToNumber(value);
  }
  return insights;
}

function mergeInstagramInsights(...items) {
  return items.reduce((merged, item) => {
    for (const [key, value] of Object.entries(item || {})) {
      if (value !== null && value !== undefined) merged[key] = value;
    }
    return merged;
  }, {});
}

function instagramExpandedInsightsFromMedia(media) {
  return instagramInsightsMap(media?.insights || {});
}

function instagramNeedsMoreInsights(media, insights) {
  const isStory = instagramContentType(media) === 'Stories';
  const hasReach = instagramMetricFromInsights(insights, ['reach']) !== null;
  const hasViews = instagramMetricFromInsights(insights, ['views', 'impressions', 'plays', 'video_views']) !== null;
  const hasInteractions = isStory
    ? instagramMetricFromInsights(insights, ['total_interactions', 'engagement', 'replies', 'shares']) !== null
    : instagramMetricFromInsights(insights, [
      'total_interactions',
      'engagement',
      'likes',
      'comments',
      'saved',
      'shares',
    ]) !== null;
  return !hasReach || !hasViews || !hasInteractions;
}

async function getInstagramInsightsForMedia(media, token, debug = [], existingInsights = {}) {
  const primaryMetricNames = instagramPrimaryInsightMetricNames(media);
  const metricNames = instagramInsightMetricNames(media);
  const path = `${media.id}/insights`;
  const insights = { ...existingInsights };
  if (!instagramNeedsMoreInsights(media, insights)) {
    pushInstagramDebug(debug, {
      stage: 'insights_from_media_list',
      mediaId: media.id,
      insights,
    });
    return insights;
  }

  try {
    pushInstagramDebug(debug, {
      stage: 'insights_request',
      media: safeInstagramDebugValue(media),
      path,
      params: { metric: primaryMetricNames.join(',') },
    });
    const data = await igDirectGet(path, token, {
      metric: primaryMetricNames.join(','),
    });
    pushInstagramDebug(debug, {
      stage: 'insights_response',
      mediaId: media.id,
      path,
      response: data,
    });
    Object.assign(insights, instagramInsightsMap(data));
  } catch (error) {
    pushInstagramDebug(debug, {
      stage: 'insights_error',
      mediaId: media.id,
      path,
      params: { metric: primaryMetricNames.join(',') },
      message: error.message,
    });
    for (const metricName of metricNames) {
      if (nullableNumber(insights[metricName]) !== null) continue;
      try {
        pushInstagramDebug(debug, {
          stage: 'insights_request',
          mediaId: media.id,
          path,
          params: { metric: metricName },
          reason: 'single metric fallback',
        });
        const data = await igDirectGet(path, token, {
          metric: metricName,
        });
        pushInstagramDebug(debug, {
          stage: 'insights_response',
          mediaId: media.id,
          path,
          response: data,
        });
        Object.assign(insights, instagramInsightsMap(data));
      } catch (singleMetricError) {
        pushInstagramDebug(debug, {
          stage: 'insights_error',
          mediaId: media.id,
          path,
          params: { metric: metricName },
          message: singleMetricError.message,
        });
        // Some metrics are unavailable depending on media type, age, and permissions.
      }
    }
  }

  if (instagramNeedsMoreInsights(media, insights)) {
    for (const metricName of metricNames) {
      if (nullableNumber(insights[metricName]) !== null) continue;
      try {
        pushInstagramDebug(debug, {
          stage: 'insights_request',
          mediaId: media.id,
          path,
          params: { metric: metricName },
          reason: 'fill missing metric after batch response',
        });
        const data = await igDirectGet(path, token, {
          metric: metricName,
        });
        pushInstagramDebug(debug, {
          stage: 'insights_response',
          mediaId: media.id,
          path,
          response: data,
        });
        Object.assign(insights, instagramInsightsMap(data));
      } catch (singleMetricError) {
        pushInstagramDebug(debug, {
          stage: 'insights_error',
          mediaId: media.id,
          path,
          params: { metric: metricName },
          message: singleMetricError.message,
        });
      }
    }
  }

  return mergeInstagramInsights(existingInsights, insights);
}

function instagramMetricFromInsights(insights, names) {
  for (const name of names) {
    const value = nullableNumber(insights?.[name]);
    if (value !== null) return value;
  }
  return null;
}

function sumPresentNumbers(values) {
  let total = 0;
  let hasValue = false;
  for (const value of values) {
    const numeric = nullableNumber(value);
    if (numeric !== null) {
      total += numeric;
      hasValue = true;
    }
  }
  return hasValue ? total : null;
}

function instagramInteractionTotal(media, insights, isStory) {
  const directTotal = instagramMetricFromInsights(
    insights,
    ['total_interactions', 'engagement'],
  );
  if (directTotal !== null) return directTotal;

  if (isStory) {
    return sumPresentNumbers([
      instagramMetricFromInsights(insights, ['replies']),
      instagramMetricFromInsights(insights, ['shares']),
    ]);
  }

  const likes = instagramMetricFromInsights(insights, ['likes']);
  const comments = instagramMetricFromInsights(insights, ['comments']);
  return sumPresentNumbers([
    likes ?? nullableNumber(media?.like_count),
    comments ?? nullableNumber(media?.comments_count),
    instagramMetricFromInsights(insights, ['saved', 'saves']),
    instagramMetricFromInsights(insights, ['shares']),
  ]);
}

async function discoverInstagramRows(config) {
  const rows = [];
  const debug = [];
  const { start, end } = getSyncWindow(config);
  const sinceMs = start.getTime();
  const untilMs = end.getTime();
  const discovered = await discoverInstagramAccounts(config);
  const errors = [...discovered.errors];
  pushInstagramDebug(debug, {
    stage: 'sync_window',
    start: start.toISOString(),
    end: end.toISOString(),
    configStartDate: config.startDate,
    configEndDate: config.endDate,
    timezone: config.timezone,
  });
  pushInstagramDebug(debug, {
    stage: 'accounts_discovered',
    accounts: discovered.accounts.map(instagramAccountDebug),
    errors,
  });

  for (const account of discovered.accounts) {
    try {
      pushInstagramDebug(debug, {
        stage: 'account_sync_start',
        account: instagramAccountDebug(account),
      });
      let after = '';
      let keepGoing = true;
      const stats = {
        pages: 0,
        mediaSeen: 0,
        mediaInRange: 0,
        mediaSkippedNewer: 0,
        mediaSkippedOlder: 0,
        mediaSkippedInvalid: 0,
        rowsCreated: 0,
      };

      while (keepGoing) {
        const data = await getInstagramMediaPage(account, after, debug);
        const mediaItems = data?.data || [];
        stats.pages += 1;
        stats.mediaSeen += mediaItems.length;
        pushInstagramDebug(debug, {
          stage: 'media_page_items',
          account: instagramAccountDebug(account),
          count: mediaItems.length,
          after,
        });
        if (!mediaItems.length) break;

        for (const media of mediaItems) {
          const createdAt = media?.timestamp || '';
          const createdAtMs = dateValueMillis(createdAt);
          if (createdAtMs === null) {
            stats.mediaSkippedInvalid += 1;
            pushInstagramDebug(debug, {
              stage: 'media_skipped',
              mediaId: media.id,
              reason: 'missing or invalid created timestamp',
            });
            continue;
          }
          if (createdAtMs > untilMs) {
            stats.mediaSkippedNewer += 1;
            pushInstagramDebug(debug, {
              stage: 'media_skipped',
              mediaId: media.id,
              reason: 'newer than configured end date',
              createdAt,
              endDate: config.endDate,
            });
            continue;
          }
          if (createdAtMs < sinceMs) {
            keepGoing = false;
            stats.mediaSkippedOlder += 1;
            pushInstagramDebug(debug, {
              stage: 'media_skipped',
              mediaId: media.id,
              reason: 'older than configured start date; stopping pagination',
              createdAt,
              startDate: config.startDate,
            });
            continue;
          }

          stats.mediaInRange += 1;
          const type = instagramContentType(media);
          const expandedInsights = instagramExpandedInsightsFromMedia(media);
          const insights = await getInstagramInsightsForMedia(
            media,
            account.accessToken,
            debug,
            expandedInsights,
          );
          const isVideo = ['Live', 'Reels', 'Video'].includes(type);
          const isStory = type === 'Stories';
          const reach = instagramMetricFromInsights(insights, ['reach']);
          const viewsOrImpressions = instagramMetricFromInsights(
            insights,
            ['views', 'impressions', 'plays', 'video_views'],
          );
          const fallbackInteractions = toNumber(media.like_count) + toNumber(media.comments_count);
          const interactions = instagramInteractionTotal(media, insights, isStory) ?? fallbackInteractions;
          const videoViews = isVideo ? viewsOrImpressions : null;

          rows.push({
            key: `instagram:${media.id}`,
            platform: 'Instagram',
            contentId: media.id,
            createdAt,
            link: media.permalink || '',
            row: [
              formatSheetDate(createdAt, config.timezone),
              instagramTitle(media),
              'Instagram',
              type,
              media.permalink || '',
              numberOrDash(reach),
              numberOrDash(viewsOrImpressions),
              numberOrDash(interactions),
              isVideo ? numberOrDash(videoViews) : '-',
              '-',
            ],
            metrics: {
              reach,
              viewsOrImpressions,
              interactions,
              videoViews,
              saved: instagramMetricFromInsights(insights, ['saved', 'saves']),
              insights,
            },
          });
          stats.rowsCreated += 1;
          pushInstagramDebug(debug, {
            stage: 'row_created',
            mediaId: media.id,
            type,
            row: rows[rows.length - 1].row,
            metrics: rows[rows.length - 1].metrics,
          });
        }

        after = data?.paging?.cursors?.after || '';
        if (!after) break;
      }
      pushInstagramDebug(debug, {
        stage: 'account_sync_complete',
        account: instagramAccountDebug(account),
        stats,
        note: stats.mediaSeen && !stats.mediaInRange
          ? 'No insights were requested because no Instagram media fell inside the selected sheet date range.'
          : '',
      });
    } catch (error) {
      errors.push({ platform: 'instagram', accountId: account.accountId, message: error.message });
      pushInstagramDebug(debug, {
        stage: 'account_sync_error',
        account: instagramAccountDebug(account),
        message: error.message,
      });
    }
  }

  return { rows, errors, debug };
}

async function youtubeApi(configId, path, params) {
  const apiKey = await getSecretValue(configId, 'youtubeApiKey', ['YT_API_KEY']);
  if (!apiKey) throw new Error('YouTube API key is not configured');
  const query = new URLSearchParams({ ...params, key: apiKey });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${query.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || `YouTube API error on ${path}`);
  }
  return data;
}

async function youtubeDataApiWithToken(accessToken, path, params) {
  const query = new URLSearchParams(params);
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || `YouTube Data API error on ${path}`);
  }
  return data;
}

async function resolveYouTubeChannel(configId, channelIdOrHandle) {
  if (String(channelIdOrHandle).startsWith('UC')) return channelIdOrHandle;
  const handle = String(channelIdOrHandle).replace(/^@/, '');
  const data = await youtubeApi(configId, 'channels', {
    part: 'id',
    forHandle: handle,
  });
  return data?.items?.[0]?.id || channelIdOrHandle;
}

async function getYouTubeChannelProfile(accessToken, channelIdOrHandle) {
  const channelId = String(channelIdOrHandle);
  const data = await youtubeDataApiWithToken(accessToken, 'channels', {
    part: 'id,contentDetails',
    id: channelId,
  });
  const item = data?.items?.[0] || {};
  return {
    channelId: item.id || channelId,
    uploadsPlaylistId: item?.contentDetails?.relatedPlaylists?.uploads || '',
  };
}

function youtubeDashboardVideoFields(video) {
  const liveBroadcastContent = String(video?.snippet?.liveBroadcastContent || '').toLowerCase();
  const isLive = Boolean(video?.liveStreamingDetails)
    || liveBroadcastContent === 'live'
    || liveBroadcastContent === 'upcoming';
  if (isLive) {
    return {
      type: 'Live',
      link: `https://www.youtube.com/watch?v=${video.id}`,
    };
  }
  return {
    type: 'Video',
    link: `https://youtu.be/${video.id}`,
  };
}

function youtubeCreatorContentTypeFields(video, creatorContentType) {
  const type = String(creatorContentType || '').toUpperCase();
  if (type === 'SHORTS') {
    return {
      type: 'Short Video',
      link: `https://www.youtube.com/shorts/${video.id}`,
    };
  }
  if (type === 'VIDEO_ON_DEMAND') {
    return {
      type: 'Video',
      link: `https://youtu.be/${video.id}`,
    };
  }
  if (type === 'LIVE_STREAM') {
    return {
      type: 'Live',
      link: `https://www.youtube.com/watch?v=${video.id}`,
    };
  }
  if (type === 'STORY') {
    return {
      type: 'Story',
      link: `https://youtu.be/${video.id}`,
    };
  }
  return youtubeDashboardVideoFields(video);
}

async function listYouTubeUploadVideoIds(accessToken, uploadsPlaylistId, sinceIso, untilIso) {
  if (!uploadsPlaylistId) return [];

  const sinceMs = new Date(sinceIso).getTime();
  const untilMs = new Date(untilIso).getTime();
  const videoIds = [];
  const seen = new Set();
  let pageToken = '';
  let keepGoing = true;

  while (keepGoing) {
    const data = await youtubeDataApiWithToken(accessToken, 'playlistItems', {
      part: 'contentDetails,snippet',
      playlistId: uploadsPlaylistId,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });

    const items = data?.items || [];
    if (!items.length) break;

    for (const item of items) {
      const videoId = item?.contentDetails?.videoId;
      const publishedAt = item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt;
      const publishedMs = dateValueMillis(publishedAt);

      if (!videoId || publishedMs === null) continue;
      if (publishedMs > untilMs) continue;
      if (publishedMs < sinceMs) {
        keepGoing = false;
        break;
      }
      if (seen.has(videoId)) continue;
      seen.add(videoId);
      videoIds.push(videoId);
    }

    pageToken = data?.nextPageToken || '';
    if (!pageToken) break;
  }

  return videoIds;
}

async function getYouTubeOAuthConfig(configId) {
  const [clientId, clientSecret, savedRedirectUri] = await Promise.all([
    getSecretValue(configId, 'googleOAuthClientId', ['GOOGLE_OAUTH_CLIENT_ID', 'YOUTUBE_CLIENT_ID']),
    getSecretValue(configId, 'googleOAuthClientSecret', ['GOOGLE_OAUTH_CLIENT_SECRET', 'YOUTUBE_CLIENT_SECRET']),
    getSecretValue(configId, 'youtubeRedirectUri', ['YOUTUBE_REDIRECT_URI']),
  ]);
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth client ID/secret are not configured');
  }
  const trimmedRedirectUri = String(savedRedirectUri || '').trim();
  const redirectUri = trimmedRedirectUri === DEFAULT_YOUTUBE_REDIRECT_URI
    ? trimmedRedirectUri
    : DEFAULT_YOUTUBE_REDIRECT_URI;
  return { clientId, clientSecret, redirectUri };
}

async function youtubeTokenRequest(params) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(data?.error_description || data?.error || `YouTube OAuth error ${response.status}`);
  }
  return data;
}

async function saveYouTubeTokenSecret(accountId, tokenData, existingTokens = {}) {
  const tokens = {
    ...existingTokens,
    ...tokenData,
    refresh_token: tokenData.refresh_token || existingTokens.refresh_token,
    expires_at: Date.now() + Math.max(60, Number(tokenData.expires_in || 3600) - 60) * 1000,
  };
  await db().collection('social_account_secrets').doc(accountId).set({
    provider: 'youtube',
    tokens: JSON.stringify(tokens),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return tokens;
}

async function getYouTubeTokenSecret(accountId) {
  const secretSnap = await db().collection('social_account_secrets').doc(accountId).get();
  if (!secretSnap.exists) throw new Error(`Missing YouTube OAuth token for ${accountId}`);
  return JSON.parse(secretSnap.data()?.tokens || '{}');
}

async function getYouTubeAccessToken(configId, accountId) {
  const tokens = await getYouTubeTokenSecret(accountId);
  if (tokens.access_token && Number(tokens.expires_at || 0) > Date.now()) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error(`Missing YouTube refresh token for ${accountId}`);

  const { clientId, clientSecret } = await getYouTubeOAuthConfig(configId);
  const refreshed = await youtubeTokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokens.refresh_token,
    grant_type: 'refresh_token',
  });
  const merged = await saveYouTubeTokenSecret(accountId, refreshed, tokens);
  return merged.access_token;
}

async function youtubeAnalyticsQuery(accessToken, params) {
  const query = new URLSearchParams(params);
  const response = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || `YouTube Analytics API error ${response.status}`);
  }
  return data;
}

async function youtubeDataApiDebugQuery(accessToken, path, params) {
  const query = new URLSearchParams(params);
  const endpoint = `https://www.googleapis.com/youtube/v3/${path}`;
  const url = `${endpoint}?${query.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const rawText = await response.text().catch(() => '');
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (_) {
    data = { rawText };
  }
  return {
    endpoint,
    method: 'GET',
    url,
    params,
    status: response.status,
    ok: response.ok && !data?.error,
    rawText,
    response: data,
  };
}

function analyticsColumnMap(data) {
  return Object.fromEntries((data?.columnHeaders || []).map((header, index) => [header.name, index]));
}

function analyticsNumber(row, columnMap, name) {
  return nullableNumber(row?.[columnMap[name]]);
}

async function queryYouTubeCreatorContentTypes(accessToken, channelId, videoIds, config = {}) {
  const typeMap = new Map();
  const warnings = [];
  if (!videoIds.length) return { typeMap, warnings };

  const startDate = isoDateOnly(config.startDate) || defaultStartDate();
  const endDate = defaultEndDate();
  const chunkSize = 100;

  for (let index = 0; index < videoIds.length; index += chunkSize) {
    const ids = videoIds.slice(index, index + chunkSize);
    try {
      const data = await youtubeAnalyticsQuery(accessToken, {
        ids: `channel==${channelId}`,
        startDate,
        endDate,
        metrics: 'views',
        dimensions: 'video,creatorContentType',
        filters: `video==${ids.join(',')}`,
        maxResults: '200',
      });
      const columns = analyticsColumnMap(data);
      for (const row of data?.rows || []) {
        const videoId = row?.[columns.video];
        const creatorContentType = row?.[columns.creatorContentType];
        if (!videoId || !creatorContentType) continue;
        const views = analyticsNumber(row, columns, 'views') || 0;
        const previous = typeMap.get(videoId);
        if (!previous || views >= previous.views) {
          typeMap.set(videoId, { creatorContentType, views });
        }
      }
    } catch (error) {
      warnings.push(`YouTube Analytics creatorContentType lookup failed: ${error.message}. Type defaults to "Video" unless YouTube Data API marks the video as live.`);
    }
  }

  return { typeMap, warnings };
}

async function youtubeReportingJson(accessToken, path, { method = 'GET', params = {}, body = null } = {}) {
  const query = new URLSearchParams(params);
  const url = `https://youtubereporting.googleapis.com/v1${path}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || `YouTube Reporting API error ${response.status}`);
  }
  return data;
}

async function youtubeReportingText(accessToken, url) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `YouTube Reporting download error ${response.status}`);
  }
  return response.text();
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < String(text || '').length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((items) => items.some((item) => String(item || '').trim()));
}

function reportingTimestamp(dateValue) {
  const date = isoDateOnly(dateValue);
  return date ? `${date}T00:00:00.000Z` : '';
}

function enumerateIsoDates(startDate, endDate) {
  const start = isoDateOnly(startDate);
  const end = isoDateOnly(endDate);
  if (!start || !end || start > end) return [];
  const dates = [];
  let current = start;
  while (current && current <= end) {
    dates.push(current);
    current = shiftIsoDate(current, 1);
  }
  return dates;
}

function youtubeReachCacheDayId(channelId, date) {
  return `${sanitizeDocId(channelId)}_${date}`;
}

function youtubeReachCacheRangeId(channelId, startDate, endDate) {
  return `${sanitizeDocId(channelId)}_${isoDateOnly(startDate)}_${isoDateOnly(endDate)}`;
}

function youtubeReachLifetimeCacheId(channelId) {
  return `${sanitizeDocId(channelId)}_lifetime`;
}

function youtubeReachDayRef(channelId, date) {
  return db().collection('youtube_reach_daily').doc(youtubeReachCacheDayId(channelId, date));
}

function youtubeReachRangeMetaRef(channelId, startDate, endDate) {
  return db().collection('youtube_reach_cache_meta').doc(youtubeReachCacheRangeId(channelId, startDate, endDate));
}

function youtubeReachLifetimeMetaRef(channelId) {
  return db().collection('youtube_reach_cache_meta').doc(youtubeReachLifetimeCacheId(channelId));
}

function timestampMillis(value) {
  if (!value) return 0;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function isFreshTimestamp(value, maxAgeMs = YOUTUBE_REACH_CACHE_REFRESH_INTERVAL_MS) {
  const millis = timestampMillis(value);
  return Boolean(millis && Date.now() - millis < maxAgeMs);
}

async function listAllYouTubeReportingJobs(accessToken) {
  const jobs = [];
  let pageToken = '';
  do {
    const data = await youtubeReportingJson(accessToken, '/jobs', {
      params: {
        pageSize: '100',
        ...(pageToken ? { pageToken } : {}),
      },
    });
    jobs.push(...(data.jobs || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return jobs;
}

async function ensureYouTubeReachReportJob(accessToken) {
  const jobs = await listAllYouTubeReportingJobs(accessToken);
  const existing = jobs.find((job) => job.reportTypeId === YOUTUBE_REACH_REPORT_TYPE_ID);
  if (existing) return { job: existing, created: false };

  try {
    const job = await youtubeReportingJson(accessToken, '/jobs', {
      method: 'POST',
      body: {
        reportTypeId: YOUTUBE_REACH_REPORT_TYPE_ID,
        name: YOUTUBE_REACH_REPORT_JOB_NAME,
      },
    });
    return { job, created: true };
  } catch (error) {
    if (!String(error.message || '').toLowerCase().includes('already exists')) {
      throw error;
    }
    const refreshedJobs = await listAllYouTubeReportingJobs(accessToken);
    const refreshed = refreshedJobs.find((job) => job.reportTypeId === YOUTUBE_REACH_REPORT_TYPE_ID);
    if (refreshed) return { job: refreshed, created: false };
    throw error;
  }
}

async function listYouTubeReachReports(accessToken, jobId, config = {}) {
  const reports = [];
  let pageToken = '';
  const startDate = isoDateOnly(config.startDate);
  const endExclusive = shiftIsoDate(isoDateOnly(config.endDate), 1);
  do {
    const data = await youtubeReportingJson(accessToken, `/jobs/${encodeURIComponent(jobId)}/reports`, {
      params: {
        pageSize: '100',
        ...(startDate ? { startTimeAtOrAfter: reportingTimestamp(startDate) } : {}),
        ...(endExclusive ? { startTimeBefore: reportingTimestamp(endExclusive) } : {}),
        ...(pageToken ? { pageToken } : {}),
      },
    });
    reports.push(...(data.reports || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return reports;
}

function addYouTubeReachMetric(target, impressions, ctr) {
  const current = target || {
    impressions: 0,
    ctrWeightedSum: 0,
    ctrWeight: 0,
    ctrSum: 0,
    ctrCount: 0,
  };
  const impressionValue = nullableNumber(impressions);
  const ctrValue = nullableNumber(ctr);
  if (impressionValue !== null) current.impressions += impressionValue;
  if (ctrValue !== null && impressionValue !== null && impressionValue > 0) {
    current.ctrWeightedSum += ctrValue * impressionValue;
    current.ctrWeight += impressionValue;
  } else if (ctrValue !== null) {
    current.ctrSum += ctrValue;
    current.ctrCount += 1;
  }
  return current;
}

function finalizeYouTubeReachMetric(value) {
  if (!value) return null;
  let viewsPerImpression = null;
  if (value.ctrWeight > 0) {
    viewsPerImpression = value.ctrWeightedSum / value.ctrWeight;
  } else if (value.ctrCount > 0) {
    viewsPerImpression = value.ctrSum / value.ctrCount;
  }
  return {
    impressions: value.impressions || null,
    viewsPerImpression,
  };
}

async function readYouTubeReachCache(channelId, videoIds, config = {}) {
  const videoIdSet = new Set(videoIds.map(String));
  const reachMap = new Map();
  if (!videoIdSet.size) return reachMap;

  const useDateRange = config.scope !== 'lifetime' && config.startDate && config.endDate;
  const snapshots = useDateRange
    ? await Promise.all(enumerateIsoDates(config.startDate, config.endDate).map((date) => youtubeReachDayRef(channelId, date).get()))
    : (await db().collection('youtube_reach_daily')
      .where('channelId', '==', channelId)
      .get()).docs;
  const aggregate = new Map();

  for (const snapshot of snapshots) {
    if (!snapshot.exists) continue;
    const data = snapshot.data() || {};
    const metrics = data.metrics || {};
    for (const videoId of videoIdSet) {
      const metric = metrics[videoId];
      if (!metric) continue;
      aggregate.set(videoId, addYouTubeReachMetric(
        aggregate.get(videoId),
        metric.impressions,
        metric.viewsPerImpression,
      ));
    }
  }

  for (const [videoId, value] of aggregate.entries()) {
    const finalized = finalizeYouTubeReachMetric(value);
    if (finalized) reachMap.set(videoId, finalized);
  }

  return reachMap;
}

async function getYouTubeReachCacheMeta(channelId, config = {}) {
  const metaRef = config.scope === 'lifetime'
    ? youtubeReachLifetimeMetaRef(channelId)
    : youtubeReachRangeMetaRef(channelId, config.startDate, config.endDate);
  const snap = await metaRef.get();
  return snap.exists ? snap.data() : {};
}

async function writeYouTubeReachCache(channelId, metricsByDate, reportIds = []) {
  const writes = [];
  const refreshedAt = new Date().toISOString();
  for (const [date, metrics] of metricsByDate.entries()) {
    writes.push({
      snapshotRef: youtubeReachDayRef(channelId, date),
      payload: {
        channelId,
        date,
        metrics,
        reportIds: Array.from(new Set(reportIds)).filter(Boolean),
        refreshedAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  }
  await commitSnapshotWrites(writes);
}

async function refreshYouTubeReachCache(accessToken, channelId, videoIds, config = {}, { force = false } = {}) {
  const videoIdSet = new Set(videoIds.map(String));
  const warnings = [];
  if (!videoIdSet.size) return { warnings, updatedRows: 0, reportCount: 0, skipped: true };

  const lifetimeMode = config.scope === 'lifetime';
  const startDate = lifetimeMode ? '' : isoDateOnly(config.startDate);
  const endDate = lifetimeMode ? '' : isoDateOnly(config.endDate);
  const metaRef = lifetimeMode
    ? youtubeReachLifetimeMetaRef(channelId)
    : youtubeReachRangeMetaRef(channelId, startDate, endDate);
  const metaSnap = await metaRef.get();
  const meta = metaSnap.exists ? metaSnap.data() : {};
  if (!force && isFreshTimestamp(meta.lastRefreshAt)) {
    return {
      warnings,
      updatedRows: 0,
      reportCount: Number(meta.reportCount || 0),
      skipped: true,
    };
  }

  let jobState;
  try {
    jobState = await ensureYouTubeReachReportJob(accessToken);
  } catch (error) {
    warnings.push(`YouTube Reporting reach job unavailable: ${error.message}. Reach, Impressions, and CTR are shown as "-".`);
    return { warnings, updatedRows: 0, reportCount: 0, skipped: false };
  }

  if (jobState.created) {
    warnings.push('Created YouTube Reporting reach job. Google usually generates the first reach report within 24 hours, so Reach, Impressions, and CTR may be "-" until the next generated report.');
  }

  const reports = await listYouTubeReachReports(
    accessToken,
    jobState.job.id,
    lifetimeMode ? {} : config,
  );
  await metaRef.set({
    channelId,
    cacheScope: lifetimeMode ? 'lifetime' : 'date_range',
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    jobId: jobState.job.id,
    jobCreated: Boolean(jobState.created),
    reportCount: reports.length,
    lastRefreshAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (!reports.length) {
    warnings.push('No generated YouTube Reporting reach reports were available yet. Reach, Impressions, and CTR are shown as "-".');
    return { warnings, updatedRows: 0, reportCount: 0, skipped: false };
  }

  const metricsByDate = new Map();
  const reportIds = [];
  let updatedRows = 0;
  for (const report of reports) {
    if (!report.downloadUrl) continue;
    const csv = await youtubeReportingText(accessToken, report.downloadUrl);
    if (report.id) reportIds.push(report.id);
    const rows = parseCsvRows(csv);
    const headers = rows.shift() || [];
    const columns = Object.fromEntries(headers.map((header, index) => [header, index]));
    for (const row of rows) {
      const rowDate = row[columns.date];
      const rowChannelId = row[columns.channel_id];
      const videoId = row[columns.video_id];
      if (!rowDate) continue;
      if (!videoIdSet.has(String(videoId))) continue;
      if (rowChannelId && channelId && rowChannelId !== channelId) continue;
      if (startDate && rowDate && rowDate < startDate) continue;
      if (endDate && rowDate && rowDate > endDate) continue;
      const impressions = nullableNumber(row[columns.video_thumbnail_impressions]);
      const viewsPerImpression = nullableNumber(row[columns.video_thumbnail_impressions_ctr]);
      if (impressions === null && viewsPerImpression === null) continue;
      const dateMetrics = metricsByDate.get(rowDate) || {};
      dateMetrics[videoId] = {
        impressions,
        viewsPerImpression,
        reportId: report.id || '',
        reportStartTime: report.startTime || '',
        reportEndTime: report.endTime || '',
        refreshedAt: new Date().toISOString(),
      };
      metricsByDate.set(rowDate, dateMetrics);
      updatedRows += 1;
    }
  }

  if (!updatedRows) {
    warnings.push('YouTube Reporting reach reports were found, but none matched these videos. Reach, Impressions, and CTR are shown as "-".');
    return { warnings, updatedRows: 0, reportCount: reports.length, skipped: false };
  }

  await writeYouTubeReachCache(channelId, metricsByDate, reportIds);
  await metaRef.set({
    channelId,
    cacheScope: lifetimeMode ? 'lifetime' : 'date_range',
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    jobId: jobState.job.id,
    reportCount: reports.length,
    updatedRows,
    cachedDates: Array.from(metricsByDate.keys()).sort(),
    reportIds: Array.from(new Set(reportIds)).filter(Boolean),
    lastSuccessfulRefreshAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { warnings, updatedRows, reportCount: reports.length, skipped: false };
}

async function queryYouTubeReachReportMetrics(accessToken, channelId, videoIds, config = {}, { forceRefresh = false } = {}) {
  const warnings = [];
  const cacheConfig = { ...config, scope: 'lifetime' };
  let reachMap = await readYouTubeReachCache(channelId, videoIds, cacheConfig);
  const meta = await getYouTubeReachCacheMeta(channelId, cacheConfig);
  const shouldRefresh = forceRefresh || !isFreshTimestamp(meta.lastRefreshAt) || !reachMap.size;

  if (shouldRefresh) {
    const refreshResult = await refreshYouTubeReachCache(accessToken, channelId, videoIds, cacheConfig, { force: forceRefresh });
    warnings.push(...refreshResult.warnings);
    if (refreshResult.updatedRows) {
      reachMap = await readYouTubeReachCache(channelId, videoIds, cacheConfig);
    }
  }

  if (!reachMap.size) {
    warnings.push('No cached YouTube reach data is available for these videos yet. Reach, Impressions, and CTR are shown as "-".');
  }

  return { reachMap, warnings };
}

async function getYouTubeSubscriberDelta(accessToken, channelId, startDate, endDate) {
  if (!startDate || !endDate || startDate > endDate) return null;
  const data = await youtubeAnalyticsQuery(accessToken, {
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: 'subscribersGained,subscribersLost',
    dimensions: 'day',
  });
  const columns = analyticsColumnMap(data);
  return (data?.rows || []).reduce((sum, row) => {
    const gained = analyticsNumber(row, columns, 'subscribersGained') || 0;
    const lost = analyticsNumber(row, columns, 'subscribersLost') || 0;
    return sum + gained - lost;
  }, 0);
}

async function estimateYouTubeSubscribersOnDate(accessToken, channelId, currentSubscribers, targetDate, timezone) {
  const current = nullableNumber(currentSubscribers);
  if (current === null || !targetDate) return null;
  const today = localDateString(new Date(), timezone);
  if (targetDate >= today) return { followers: current, sourceDate: today };

  const afterTarget = shiftIsoDate(targetDate, 1);
  const deltaAfterTarget = await getYouTubeSubscriberDelta(accessToken, channelId, afterTarget, today);
  if (deltaAfterTarget === null) return null;
  return {
    followers: current - deltaAfterTarget,
    sourceDate: targetDate,
  };
}

async function buildYouTubeDataDebug(configId, config, { maxVideos = 50 } = {}) {
  const contentConfig = configForDateScope(config, 'content');
  const { start, end } = getSyncWindow(contentConfig);
  const sinceIso = start.toISOString();
  const untilIso = end.toISOString();
  const videoLimit = Math.max(1, Math.min(200, Number(maxVideos || 50)));
  const channelsSnap = await db().collection('youtube_channels').get();
  const selectedChannelIds = new Set(contentConfig.selectedAccounts?.youtube || []);
  const channels = [];
  const errors = [];
  const rawResponses = [];

  for (const channelDoc of channelsSnap.docs) {
    const channel = { id: channelDoc.id, ...channelDoc.data() };
    if (selectedChannelIds.size && !selectedChannelIds.has(String(channel.id))) continue;
    try {
      const actualChannelId = await resolveYouTubeChannel(configId, channel.id);
      const oauthAccountId = channel.oauthAccountId || `youtube_${sanitizeDocId(actualChannelId)}`;
      const accessToken = await getYouTubeAccessToken(configId, oauthAccountId);
      const channelProfile = await getYouTubeChannelProfile(accessToken, actualChannelId);
      const allVideoIds = await listYouTubeUploadVideoIds(
        accessToken,
        channelProfile.uploadsPlaylistId,
        sinceIso,
        untilIso,
      );
      const videoIds = allVideoIds.slice(0, videoLimit);
      const dataApiRequests = [];

      for (let index = 0; index < videoIds.length; index += 50) {
        const ids = videoIds.slice(index, index + 50);
        const params = {
          part: 'snippet,statistics,contentDetails,liveStreamingDetails',
          id: ids.join(','),
        };
        const apiResult = await youtubeDataApiDebugQuery(accessToken, 'videos', params);
        dataApiRequests.push({
          purpose: 'Sheet Sync current YouTube video metadata and totals',
          videoIds: ids,
          ...apiResult,
        });
        rawResponses.push({
          accountId: channel.id,
          accountName: channel.name || channel.id,
          channelId: channelProfile.channelId,
          videoIds: ids,
          status: apiResult.status,
          ok: apiResult.ok,
          body: apiResult.rawText,
        });
      }

      channels.push({
        accountId: channel.id,
        accountName: channel.name || channel.id,
        oauthAccountId,
        channelId: channelProfile.channelId,
        uploadsPlaylistId: channelProfile.uploadsPlaylistId,
        totalVideosInDateRange: allVideoIds.length,
        requestedVideos: videoIds.length,
        skippedVideos: Math.max(0, allVideoIds.length - videoIds.length),
        dataApiRequests,
      });
    } catch (error) {
      errors.push({ platform: 'youtube', accountId: channel.id, message: error.message });
    }
  }

  return {
    ok: true,
    success: !errors.length,
    configId,
    generatedAt: new Date().toISOString(),
    startDate: contentConfig.startDate,
    endDate: contentConfig.endDate,
    maxVideos: videoLimit,
    note: 'This shows the YouTube Data API v3 videos.list response used for content rows. Video View comes from statistics.viewCount. Interactions come from statistics.likeCount + statistics.commentCount. Reach, Impressions, and CTR come from the YouTube Reporting API cache.',
    rawResponses,
    channels,
    errors,
  };
}

async function discoverYouTubeRows(configId, config) {
  const rows = [];
  const errors = [];
  const warnings = [];
  const { start, end } = getSyncWindow(config);
  const sinceIso = start.toISOString();
  const untilIso = end.toISOString();
  const channelsSnap = await db().collection('youtube_channels').get();
  const selectedChannelIds = new Set(config.selectedAccounts?.youtube || []);

  for (const channelDoc of channelsSnap.docs) {
    const channel = { id: channelDoc.id, ...channelDoc.data() };
    if (selectedChannelIds.size && !selectedChannelIds.has(String(channel.id))) continue;
    try {
      const actualChannelId = await resolveYouTubeChannel(configId, channel.id);
      const oauthAccountId = channel.oauthAccountId || `youtube_${sanitizeDocId(actualChannelId)}`;
      const accessToken = await getYouTubeAccessToken(configId, oauthAccountId);
      const channelProfile = await getYouTubeChannelProfile(accessToken, actualChannelId);
      await db().collection('social_accounts').doc(`youtube_${sanitizeDocId(channel.id)}`).set({
        platform: 'youtube',
        accountId: channel.id,
        resolvedChannelId: channelProfile.channelId,
        oauthAccountId,
        displayName: channel.name || channel.id,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      const videoIds = await listYouTubeUploadVideoIds(
        accessToken,
        channelProfile.uploadsPlaylistId,
        sinceIso,
        untilIso,
      );
      if (!videoIds.length) continue;

      const [reachResult, typeResult, videoGroups] = await Promise.all([
        queryYouTubeReachReportMetrics(accessToken, channelProfile.channelId, videoIds, config)
          .catch((error) => ({
            reachMap: new Map(),
            warnings: [`YouTube Reporting reach lookup failed: ${error.message}. Reach, Impressions, and CTR are shown as "-".`],
          })),
        queryYouTubeCreatorContentTypes(accessToken, channelProfile.channelId, videoIds, config)
          .catch((error) => ({
            typeMap: new Map(),
            warnings: [`YouTube Analytics creatorContentType lookup failed: ${error.message}. Type defaults to "Video" unless YouTube Data API marks the video as live.`],
          })),
        Promise.all(Array.from({ length: Math.ceil(videoIds.length / 50) }, (_, groupIndex) => {
          const chunkIds = videoIds.slice(groupIndex * 50, groupIndex * 50 + 50);
          return youtubeDataApiWithToken(accessToken, 'videos', {
            part: 'snippet,statistics,contentDetails,liveStreamingDetails',
            id: chunkIds.join(','),
          });
        })),
      ]);
      for (const warning of reachResult.warnings || []) {
        warnings.push({
          platform: 'youtube',
          accountId: channel.id,
          message: warning,
        });
      }
      for (const warning of typeResult.warnings || []) {
        warnings.push({
          platform: 'youtube',
          accountId: channel.id,
          message: warning,
        });
      }
      const reachMap = reachResult.reachMap || new Map();
      const typeMap = typeResult.typeMap || new Map();

      for (const group of videoGroups) {
        for (const video of group?.items || []) {
          const stats = video.statistics || {};
          const reachMetrics = reachMap.get(video.id) || {};
          const impressions = nullableNumber(reachMetrics.impressions);
          const viewsPerImpression = nullableNumber(reachMetrics.viewsPerImpression);
          const views = nullableNumber(stats.viewCount);
          const interactions = toNumber(stats.likeCount) + toNumber(stats.commentCount);
          const createdAt = video?.snippet?.publishedAt || new Date().toISOString();
          const creatorContentType = typeMap.get(video.id)?.creatorContentType;
          const { type, link } = youtubeCreatorContentTypeFields(video, creatorContentType);

          rows.push({
            key: `youtube:${video.id}`,
            platform: 'YouTube',
            contentId: video.id,
            createdAt,
            link,
            row: [
              formatSheetDate(createdAt, config.timezone),
              video?.snippet?.title || video.id,
              'YouTube',
              type,
              link,
              numberOrDash(impressions),
              numberOrDash(impressions),
              numberOrDash(interactions),
              numberOrDash(views),
              numberOrDash(viewsPerImpression),
            ],
            metrics: { views, interactions, impressions, viewsPerImpression, creatorContentType },
          });
        }
      }
    } catch (error) {
      errors.push({ platform: 'youtube', accountId: channel.id, message: error.message });
    }
  }

  return { rows, errors, warnings };
}

async function getTikTokClientConfig(configId) {
  const [clientKey, clientSecret, savedRedirectUri] = await Promise.all([
    getSecretValue(configId, 'tiktokClientKey', ['TIKTOK_CLIENT_KEY']),
    getSecretValue(configId, 'tiktokClientSecret', ['TIKTOK_CLIENT_SECRET']),
    getSecretValue(configId, 'tiktokRedirectUri', ['TIKTOK_REDIRECT_URI']),
  ]);
  if (!clientKey || !clientSecret) {
    throw new Error('TikTok client key/secret are not configured');
  }
  const trimmedRedirectUri = String(savedRedirectUri || '').trim();
  const redirectUri = trimmedRedirectUri === DEFAULT_TIKTOK_REDIRECT_URI
    ? trimmedRedirectUri
    : DEFAULT_TIKTOK_REDIRECT_URI;
  return { clientKey, clientSecret, redirectUri };
}

async function tiktokTokenRequest(params) {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(data?.error_description || data?.error || `TikTok OAuth error ${response.status}`);
  }
  return data;
}

async function saveTikTokTokenSecret(accountId, tokenData) {
  const expiresAt = Date.now() + toNumber(tokenData.expires_in, 0) * 1000;
  const payload = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: expiresAt,
  };
  await db().collection('social_account_secrets').doc(accountId).set({
    tokens: JSON.stringify(payload),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function getTikTokAccessToken(configId, accountId) {
  const secretSnap = await db().collection('social_account_secrets').doc(accountId).get();
  if (!secretSnap.exists) throw new Error(`Missing TikTok token for ${accountId}`);
  const tokens = JSON.parse(secretSnap.data()?.tokens || '{}');
  if (tokens.expires_at && tokens.expires_at > Date.now() + 5 * 60 * 1000) {
    return tokens.access_token;
  }

  const { clientKey, clientSecret } = await getTikTokClientConfig(configId);
  const refreshed = await tiktokTokenRequest({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
  });
  await saveTikTokTokenSecret(accountId, refreshed);
  return refreshed.access_token;
}

async function tiktokApi(path, accessToken, fields, body = {}) {
  const response = await fetch(`https://open.tiktokapis.com/v2/${path}/?fields=${encodeURIComponent(fields)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error?.code && data.error.code !== 'ok') {
    throw new Error(data?.error?.message || `TikTok API error on ${path}`);
  }
  return data;
}

async function queryTikTokVideoMetrics(accessToken, videoIds, fields) {
  if (!videoIds.length) return new Map();
  try {
    const data = await tiktokApi('video/query', accessToken, fields, {
      filters: { video_ids: videoIds },
    });
    const videos = data?.data?.videos || [];
    return new Map(videos.map((video) => [video.id, video]));
  } catch (_) {
    return new Map();
  }
}

async function discoverTikTokRows(configId, config) {
  const rows = [];
  const errors = [];
  const { start, end } = getSyncWindow(config);
  const sinceMs = start.getTime();
  const untilMs = end.getTime();
  const selectedAccountIds = new Set(config.selectedAccounts?.tiktok || []);
  const accountsSnap = await db()
    .collection('social_accounts')
    .where('platform', '==', 'tiktok')
    .get();

  for (const accountDoc of accountsSnap.docs) {
    const account = { id: accountDoc.id, ...accountDoc.data() };
    if (selectedAccountIds.size && !selectedAccountIds.has(String(account.id))) continue;
    try {
      const accessToken = await getTikTokAccessToken(configId, account.id);
      let cursor = undefined;
      let keepGoing = true;
      const fields = 'id,create_time,share_url,video_description,title,like_count,comment_count,share_count,view_count,duration';

      while (keepGoing) {
        const data = await tiktokApi('video/list', accessToken, fields, {
          max_count: 20,
          ...(cursor ? { cursor } : {}),
        });
        const videos = data?.data?.videos || [];
        const metricMap = await queryTikTokVideoMetrics(
          accessToken,
          videos.map((video) => video.id).filter(Boolean),
          fields,
        );
        for (const video of videos) {
          const mergedVideo = { ...video, ...(metricMap.get(video.id) || {}) };
          const createdAt = isoFromSeconds(mergedVideo.create_time);
          const createdAtMs = dateValueMillis(createdAt);
          if (createdAtMs === null) continue;
          if (createdAtMs > untilMs) continue;
          if (createdAtMs < sinceMs) {
            keepGoing = false;
            continue;
          }
          const views = toNumber(mergedVideo.view_count);
          const interactions = toNumber(mergedVideo.like_count)
            + toNumber(mergedVideo.comment_count)
            + toNumber(mergedVideo.share_count);
          rows.push({
            key: `tiktok:${mergedVideo.id}`,
            platform: 'TikTok',
            contentId: mergedVideo.id,
            createdAt,
            link: mergedVideo.share_url || '',
            row: [
              formatSheetDate(createdAt, config.timezone),
              mergedVideo.title || mergedVideo.video_description || mergedVideo.id,
              'TikTok',
              'Video',
              mergedVideo.share_url || '',
              '-',
              numberOrDash(views),
              numberOrDash(interactions),
              numberOrDash(views),
              '-',
            ],
            metrics: { views, interactions },
          });
        }
        cursor = data?.data?.cursor;
        keepGoing = keepGoing && Boolean(data?.data?.has_more && cursor);
      }
    } catch (error) {
      errors.push({ platform: 'tiktok', accountId: account.id, message: error.message });
    }
  }

  return { rows, errors };
}

function followerAccountKey(platform, accountId) {
  return `${platform}:${accountId}`;
}

function facebookInsightFollowersForDate(data, targetDate, timezone = DEFAULT_TIMEZONE) {
  const values = data?.data?.[0]?.values || [];
  const datedValues = values
    .map((item) => {
      const date = localDateString(item?.end_time, timezone);
      const followers = insightValueToNumber(item?.value);
      return { date, followers };
    })
    .filter((item) => item.date && item.followers !== null);

  const onOrBefore = datedValues
    .filter((item) => item.date <= targetDate)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  if (onOrBefore) return onOrBefore;

  return datedValues
    .filter((item) => item.date > targetDate)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null;
}

async function getFacebookFollowerCountForDate(pageId, accessToken, targetDate, timezone) {
  if (!targetDate) return null;
  const data = await fbGet(`${pageId}/insights`, accessToken, {
    metric: 'page_follows',
    period: 'day',
    since: shiftIsoDate(targetDate, -7),
    until: shiftIsoDate(targetDate, 2),
  });
  return facebookInsightFollowersForDate(data, targetDate, timezone);
}

async function getFacebookFollowerAccounts(config) {
  if (!config.enabledPlatforms?.facebook) return { accounts: [], errors: [] };

  const errors = [];
  const accounts = [];
  const pagesSnap = await db().collection('pages').get();
  const selectedPageIds = new Set(config.selectedAccounts?.facebook || []);
  const targetDates = followerTargetDates(config);
  const firstRange = getFollowerDateRanges(config)[0];

  for (const pageDoc of pagesSnap.docs) {
    const page = { id: pageDoc.id, ...pageDoc.data() };
    if (selectedPageIds.size && !selectedPageIds.has(String(page.id))) continue;
    if (!page.access_token) continue;

    try {
      const data = await fbGet(page.id, page.access_token, {
        fields: 'name,followers_count,fan_count',
      });
      const followers = nullableNumber(data?.followers_count) ?? nullableNumber(data?.fan_count);
      const followerCountsByDate = {};
      await Promise.all(targetDates.map(async (targetDate) => {
        try {
          const insight = await getFacebookFollowerCountForDate(
            page.id,
            page.access_token,
            targetDate,
            config.timezone,
          );
          if (insight?.followers !== null && insight?.followers !== undefined) {
            followerCountsByDate[targetDate] = {
              followers: insight.followers,
              sourceDate: insight.date || '',
            };
          }
        } catch (insightError) {
          errors.push({
            platform: 'facebook',
            accountId: page.id,
            message: `Facebook follower insights unavailable for ${targetDate}: ${insightError.message}`,
          });
        }
      }));

      if (followers !== null) {
        const startInsight = followerCountsByDate[firstRange?.startDate] || null;
        const endInsight = followerCountsByDate[firstRange?.endDate] || null;
        accounts.push({
          platform: 'Facebook',
          platformKey: 'facebook',
          accountId: String(page.id),
          accountName: data?.name || page.name || page.id,
          followers,
          startFollowers: startInsight?.followers ?? null,
          startFollowersSourceDate: startInsight?.sourceDate || '',
          startFollowersTargetDate: firstRange?.startDate || '',
          endFollowers: endInsight?.followers ?? null,
          endFollowersSourceDate: endInsight?.sourceDate || '',
          endFollowersTargetDate: firstRange?.endDate || '',
          followerCountsByDate,
        });
      }
    } catch (error) {
      errors.push({ platform: 'facebook', accountId: page.id, message: error.message });
    }
  }

  return { accounts, errors };
}

async function getInstagramFollowerAccounts(config) {
  if (!config.enabledPlatforms?.instagram) return { accounts: [], errors: [] };

  const discovered = await discoverInstagramAccounts(config);
  const accounts = discovered.accounts
    .filter((account) => nullableNumber(account.followers) !== null)
    .map((account) => ({
      platform: 'Instagram',
      platformKey: 'instagram',
      accountId: String(account.accountId),
      accountName: account.displayName || account.username || account.accountId,
      followers: nullableNumber(account.followers),
    }));

  return {
    accounts,
    errors: discovered.errors,
  };
}

async function getYouTubeSubscriberAccounts(configId, config) {
  if (!config.enabledPlatforms?.youtube) return { accounts: [], errors: [] };

  const errors = [];
  const accounts = [];
  const channelsSnap = await db().collection('youtube_channels').get();
  const selectedChannelIds = new Set(config.selectedAccounts?.youtube || []);
  const targetDates = followerTargetDates(config);
  const firstRange = getFollowerDateRanges(config)[0];

  for (const channelDoc of channelsSnap.docs) {
    const channel = { id: channelDoc.id, ...channelDoc.data() };
    if (selectedChannelIds.size && !selectedChannelIds.has(String(channel.id))) continue;
    try {
      const resolvedId = await resolveYouTubeChannel(configId, channel.id);
      const oauthAccountId = channel.oauthAccountId || `youtube_${sanitizeDocId(resolvedId)}`;
      const accessToken = await getYouTubeAccessToken(configId, oauthAccountId);
      const data = await youtubeDataApiWithToken(accessToken, 'channels', {
        part: 'snippet,statistics',
        id: resolvedId,
      });
      const connectedChannel = data?.items?.[0];
      const subscribers = nullableNumber(connectedChannel?.statistics?.subscriberCount);
      if (subscribers !== null) {
        const followerCountsByDate = {};
        await Promise.all(targetDates.map(async (targetDate) => {
          try {
            const estimate = await estimateYouTubeSubscribersOnDate(
              accessToken,
              connectedChannel.id,
              subscribers,
              targetDate,
              config.timezone,
            );
            if (estimate?.followers !== null && estimate?.followers !== undefined) {
              followerCountsByDate[targetDate] = {
                followers: estimate.followers,
                sourceDate: estimate.sourceDate || targetDate,
              };
            }
          } catch (estimateError) {
            errors.push({
              platform: 'youtube',
              accountId: channel.id,
              message: `YouTube subscriber estimate unavailable for ${targetDate}: ${estimateError.message}`,
            });
          }
        }));
        const startSubscribers = followerCountsByDate[firstRange?.startDate] || null;
        const endSubscribers = followerCountsByDate[firstRange?.endDate] || null;
        accounts.push({
          platform: 'YouTube',
          platformKey: 'youtube',
          accountId: String(connectedChannel.id || resolvedId),
          accountName: connectedChannel?.snippet?.title || channel.name || channel.id,
          followers: subscribers,
          startFollowers: startSubscribers?.followers ?? null,
          startFollowersSourceDate: startSubscribers?.sourceDate || '',
          startFollowersTargetDate: firstRange?.startDate || '',
          endFollowers: endSubscribers?.followers ?? null,
          endFollowersSourceDate: endSubscribers?.sourceDate || '',
          endFollowersTargetDate: firstRange?.endDate || '',
          followerCountsByDate,
        });
      }
    } catch (error) {
      errors.push({ platform: 'youtube', accountId: channel.id, message: error.message });
    }
  }

  return { accounts, errors };
}

async function tiktokUserInfo(accessToken) {
  const fields = 'open_id,display_name,follower_count,following_count,likes_count,video_count';
  const response = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error?.code && data.error.code !== 'ok') {
    throw new Error(data?.error?.message || `TikTok user info error ${response.status}`);
  }
  return data?.data?.user || {};
}

async function getTikTokFollowerAccounts(configId, config) {
  if (!config.enabledPlatforms?.tiktok) return { accounts: [], errors: [] };

  const errors = [];
  const accounts = [];
  const selectedAccountIds = new Set(config.selectedAccounts?.tiktok || []);
  const accountsSnap = await db()
    .collection('social_accounts')
    .where('platform', '==', 'tiktok')
    .get();

  for (const accountDoc of accountsSnap.docs) {
    const account = { id: accountDoc.id, ...accountDoc.data() };
    if (selectedAccountIds.size && !selectedAccountIds.has(String(account.id))) continue;
    try {
      const accessToken = await getTikTokAccessToken(configId, account.id);
      const user = await tiktokUserInfo(accessToken);
      const followers = nullableNumber(user?.follower_count);
      if (followers !== null) {
        accounts.push({
          platform: 'TikTok',
          platformKey: 'tiktok',
          accountId: String(user?.open_id || account.accountId || account.id),
          accountName: user?.display_name || account.displayName || account.accountId || account.id,
          followers,
        });
      }
      await db().collection('social_accounts').doc(account.id).set({
        displayName: user?.display_name || account.displayName || account.accountId || account.id,
        latestFollowerCount: followers,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      errors.push({ platform: 'tiktok', accountId: account.id, message: error.message });
    }
  }

  return { accounts, errors };
}

async function discoverFollowerAccounts(configId, config) {
  const [facebook, instagram, tiktok, youtube] = await Promise.all([
    getFacebookFollowerAccounts(config),
    getInstagramFollowerAccounts(config),
    getTikTokFollowerAccounts(configId, config),
    getYouTubeSubscriberAccounts(configId, config),
  ]);

  return {
    accounts: [
      ...facebook.accounts,
      ...instagram.accounts,
      ...tiktok.accounts,
      ...youtube.accounts,
    ].sort((a, b) => (
      a.platform.localeCompare(b.platform)
        || a.accountName.localeCompare(b.accountName)
        || a.accountId.localeCompare(b.accountId)
    )),
    errors: [
      ...facebook.errors,
      ...instagram.errors,
      ...tiktok.errors,
      ...youtube.errors,
    ],
  };
}

function formatFollowerDateRange(config) {
  const { start, end } = getSyncWindow(config);
  const startLabel = formatSheetDate(start, config.timezone);
  const endLabel = formatSheetDate(end, config.timezone);
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function followerGrowth(now, before) {
  if (nullableNumber(now) === null || nullableNumber(before) === null) return '-';
  return Number(now) - Number(before);
}

function observationDocId(configId, key, date) {
  return sanitizeDocId(`${configId}:${date}:${key}`);
}

async function saveFollowerObservations(configId, config, accounts) {
  const observationDate = localDateString(new Date(), config.timezone);
  const seenDocIds = new Set();
  const writes = [];
  for (const account of accounts) {
    const key = followerAccountKey(account.platformKey, account.accountId);
    const docId = observationDocId(configId, key, observationDate);
    if (seenDocIds.has(docId)) continue;
    seenDocIds.add(docId);
    const snapshotRef = db().collection('follower_observations')
      .doc(docId);
    writes.push({
      snapshotRef,
      payload: {
        configId,
        key,
        observationDate,
        platform: account.platform,
        platformKey: account.platformKey,
        accountId: account.accountId,
        accountName: account.accountName,
        followers: account.followers,
        currentFollowers: account.followers,
        observedOnDate: observationDate,
        observedAt: FieldValue.serverTimestamp(),
      },
    });
  }
  await commitSnapshotWrites(writes);
}

async function getFollowerObservationRecords(configId, accountKeys, config = {}) {
  const snap = await db().collection('follower_observations')
    .where('configId', '==', configId)
    .get();
  const observations = snap.docs
    .map((snapshot) => {
      const data = snapshot.data();
      const date = data.observationDate || data.observedOnDate || '';
      const observedOnDate = data.observedOnDate || timestampToLocalDate(data.observedAt, config.timezone);
      return {
        key: data.key || followerAccountKey(data.platformKey, data.accountId),
        date,
        observedOnDate,
        followers: nullableNumber(data.followers ?? data.currentFollowers),
      };
    })
    .filter((item) => (
      accountKeys.has(item.key)
      && item.date
      && (!item.observedOnDate || item.observedOnDate <= item.date)
      && item.followers !== null
    ));

  return observations;
}

function closestObservationOnOrBefore(records, key, date) {
  return records
    .filter((item) => item.key === key && item.date && item.date <= date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
}

async function followerDateValues(configId, config, accounts) {
  const accountKeys = new Set(accounts.map((account) => (
    followerAccountKey(account.platformKey, account.accountId)
  )));
  const records = await getFollowerObservationRecords(configId, accountKeys, config);
  const result = {};
  for (const account of accounts) {
    const key = followerAccountKey(account.platformKey, account.accountId);
    const startObservation = closestObservationOnOrBefore(records, key, config.startDate);
    const endObservation = closestObservationOnOrBefore(records, key, config.endDate);
    const currentFollowers = nullableNumber(account.followers);
    const directStart = account.followerCountsByDate?.[config.startDate];
    const directEnd = account.followerCountsByDate?.[config.endDate];
    const accountStartFollowers = directStart
      ? nullableNumber(directStart.followers)
      : account.startFollowersTargetDate === config.startDate
        ? nullableNumber(account.startFollowers)
        : null;
    const accountEndFollowers = directEnd
      ? nullableNumber(directEnd.followers)
      : account.endFollowersTargetDate === config.endDate
        ? nullableNumber(account.endFollowers)
        : null;
    const startIsCurrent = isCurrentLocalDate(config.startDate, config.timezone);
    const endIsCurrent = isCurrentLocalDate(config.endDate, config.timezone);
    result[key] = {
      start: accountStartFollowers
        ?? (startIsCurrent
        ? currentFollowers
        : startObservation?.followers ?? null),
      startSourceDate: directStart?.sourceDate
        || (account.startFollowersTargetDate === config.startDate ? account.startFollowersSourceDate : '')
        || (startIsCurrent
        ? localDateString(new Date(), config.timezone)
        : startObservation?.date || ''),
      end: accountEndFollowers
        ?? (endIsCurrent
        ? currentFollowers
        : endObservation?.followers ?? null),
      endSourceDate: directEnd?.sourceDate
        || (account.endFollowersTargetDate === config.endDate ? account.endFollowersSourceDate : '')
        || (endIsCurrent
        ? localDateString(new Date(), config.timezone)
        : endObservation?.date || ''),
    };
  }
  return result;
}

function followerRows(config, accounts, dateValues = {}) {
  const dateRange = formatFollowerDateRange(config);
  return accounts.map((account) => {
    const key = followerAccountKey(account.platformKey, account.accountId);
    const startFollowers = nullableNumber(dateValues?.[key]?.start);
    const endFollowers = nullableNumber(dateValues?.[key]?.end);
    return {
      key,
      ...account,
      dateRange,
      startFollowers,
      endFollowers,
      startFollowersSourceDate: dateValues?.[key]?.startSourceDate || '',
      endFollowersSourceDate: dateValues?.[key]?.endSourceDate || '',
      currentFollowers: account.followers,
      row: [
        dateRange,
        account.platform,
        account.accountName,
        account.accountId,
        numberOrDash(startFollowers),
        numberOrDash(endFollowers),
        followerGrowth(endFollowers, startFollowers),
        numberOrDash(account.followers),
      ],
    };
  });
}

function followerAccountsMap(rows) {
  return Object.fromEntries(
    rows
      .map((item) => [item.key, nullableNumber(item.followers)])
      .filter(([, value]) => value !== null),
  );
}

async function rewriteFollowerSheetRows(configId, config, followerTab, rows) {
  const followerConfig = { ...config, sheetTab: followerTab };
  const startRow = Number(config.headerRow || 1) + 1;
  const sheetValues = await sheetsFetch(configId, followerConfig, 'GET', 'A:H');
  const clearEndRow = Math.max(
    sheetValues?.values?.length || 0,
    startRow + rows.length + 25,
  );

  await sheetsBatchClear(configId, config, [
    rangeForTab(followerTab, `A${startRow}:H${clearEndRow}`),
  ]);

  if (rows.length) {
    await sheetsBatchUpdate(configId, followerConfig, [{
      range: rangeForTab(followerTab, `A${startRow}:H${startRow + rows.length - 1}`),
      values: rows,
    }]);
  }
}

async function writeFollowerSheet(configId, config, rows) {
  const followerTab = config.followerSheetTab || 'Follower Growth';

  await saveFollowerObservations(configId, config, rows);
  await rewriteFollowerSheetRows(configId, config, followerTab, rows.map((item) => item.row));

  await db().collection('sync_configs').doc(configId).set({
    lastFollowerAccounts: followerAccountsMap(rows),
    lastFollowerSyncedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { appended: rows.length, updated: 0, deleted: 0 };
}

async function syncFollowerSheet(configId, config, preview = false) {
  const discovered = await discoverFollowerAccounts(configId, config);
  const rows = [];
  for (const range of getFollowerDateRanges(config)) {
    const rangeConfig = {
      ...config,
      startDate: range.startDate,
      endDate: range.endDate,
    };
    const dateValues = await followerDateValues(configId, rangeConfig, discovered.accounts);
    rows.push(...followerRows(rangeConfig, discovered.accounts, dateValues));
  }

  if (preview) {
    return {
      appended: 0,
      updated: 0,
      previewRows: rows.map((item) => item.row),
      accounts: discovered.accounts,
      errors: discovered.errors,
    };
  }

  await ensureFollowerSheetHeaders(configId, config);
  const writeResult = await writeFollowerSheet(configId, config, rows);
  return {
    ...writeResult,
    previewRows: rows.map((item) => item.row),
    accounts: discovered.accounts,
    errors: discovered.errors,
  };
}

async function discoverRows(configId, config) {
  const tasks = [];
  if (config.enabledPlatforms?.facebook) tasks.push(discoverFacebookRows(config));
  if (config.enabledPlatforms?.instagram) tasks.push(discoverInstagramRows(config));
  if (config.enabledPlatforms?.youtube) tasks.push(discoverYouTubeRows(configId, config));
  if (config.enabledPlatforms?.tiktok) tasks.push(discoverTikTokRows(configId, config));

  const settled = await Promise.allSettled(tasks);
  const rows = [];
  const errors = [];
  const warnings = [];
  const instagramDebug = [];
  for (const item of settled) {
    if (item.status === 'fulfilled') {
      rows.push(...item.value.rows);
      errors.push(...item.value.errors);
      if (Array.isArray(item.value.warnings)) warnings.push(...item.value.warnings);
      if (Array.isArray(item.value.debug)) instagramDebug.push(...item.value.debug);
    } else {
      errors.push({ platform: 'system', message: item.reason?.message || String(item.reason) });
    }
  }
  return { rows, errors, warnings, instagramDebug };
}

async function applyRowsToSheet(configId, config, normalizedRows, preview = false) {
  const results = { appended: 0, updated: 0, previewRows: [] };
  const sortedRows = normalizedRows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  for (const item of sortedRows) {
    if (preview) {
      results.previewRows.push({ action: 'rewrite', key: item.key, row: item.row });
    }
  }

  if (preview) return results;

  const rewriteResult = await rewriteContentSheetRows(configId, config, sortedRows);
  return {
    ...results,
    appended: rewriteResult.appended,
    updated: rewriteResult.updated,
  };
}

function sheetRowForFirestore(row) {
  return Object.fromEntries(
    (Array.isArray(row) ? row : [])
      .map((value, index) => [`c${index + 1}`, value == null ? '' : value]),
  );
}

function contentPreviewRowsForFirestore(rows = []) {
  return rows.slice(0, 50).map((item, index) => ({
    index,
    action: String(item?.action || ''),
    key: String(item?.key || ''),
    row: sheetRowForFirestore(item?.row),
  }));
}

function followerPreviewRowsForFirestore(rows = []) {
  return rows.slice(0, 50).map((row, index) => ({
    index,
    row: sheetRowForFirestore(row),
  }));
}

async function runSync({
  configId = DEFAULT_CONFIG_ID,
  preview = false,
  source = 'manual',
  configOverride = null,
  target = 'both',
} = {}) {
  const configSnap = await db().collection('sync_configs').doc(configId).get();
  if (!configSnap.exists && !configOverride) throw new Error('Sync config has not been saved yet');
  const config = normalizeConfig(configOverride || configSnap.data());
  assertValidConfig(config);
  const syncTarget = normalizeRunTarget(target);
  const contentConfig = configForDateScope(config, 'content');
  const followerConfig = configForDateScope(config, 'followers');
  const shouldRunContent = targetIncludesContent(syncTarget);
  const shouldRunFollowers = targetIncludesFollowers(syncTarget);

  const runRef = db().collection('sync_runs').doc();
  await runRef.set({
    configId,
    source,
    target: syncTarget,
    preview,
    status: 'running',
    startedAt: FieldValue.serverTimestamp(),
  });

  try {
    if (!preview && shouldRunContent) await ensureSheetHeaders(configId, contentConfig);
    const discovered = shouldRunContent
      ? await discoverRows(configId, contentConfig)
      : { rows: [], errors: [], warnings: [], instagramDebug: [] };
    const writeResult = shouldRunContent
      ? await applyRowsToSheet(configId, contentConfig, discovered.rows, preview)
      : { appended: 0, updated: 0, previewRows: [] };
    const followerResult = shouldRunFollowers
      ? await syncFollowerSheet(configId, followerConfig, preview)
      : { appended: 0, updated: 0, previewRows: [], accounts: [], errors: [] };
    const allErrors = [
      ...discovered.errors,
      ...followerResult.errors,
    ];
    const allWarnings = [
      ...(discovered.warnings || []),
      ...(followerResult.warnings || []),
    ];
    const status = allErrors.length ? 'partial_success' : 'success';

    await runRef.set({
      status,
      finishedAt: FieldValue.serverTimestamp(),
      target: syncTarget,
      discovered: discovered.rows.length,
      rowsAppended: writeResult.appended,
      rowsUpdated: writeResult.updated,
      followerRowsAppended: followerResult.appended,
      followerRowsUpdated: followerResult.updated,
      followerAccounts: followerResult.accounts,
      errors: allErrors,
      warnings: allWarnings,
      previewRows: preview ? contentPreviewRowsForFirestore(writeResult.previewRows) : [],
      followerPreviewRows: preview ? followerPreviewRowsForFirestore(followerResult.previewRows) : [],
    }, { merge: true });

    if (!preview && status !== 'failed') {
      await db().collection('sync_configs').doc(configId).set({
        lastSuccessfulAt: FieldValue.serverTimestamp(),
        lastRunId: runRef.id,
        lastRunStatus: status,
      }, { merge: true });
    }

    return {
      ok: true,
      runId: runRef.id,
      status,
      target: syncTarget,
      discovered: discovered.rows.length,
      rowsAppended: writeResult.appended,
      rowsUpdated: writeResult.updated,
      followerRowsAppended: followerResult.appended,
      followerRowsUpdated: followerResult.updated,
      followerAccounts: followerResult.accounts,
      errors: allErrors,
      warnings: allWarnings,
      previewRows: preview ? writeResult.previewRows.slice(0, 50) : undefined,
      followerPreviewRows: preview ? followerResult.previewRows.slice(0, 50) : undefined,
      instagramDebug: discovered.instagramDebug || [],
    };
  } catch (error) {
    await runRef.set({
      status: 'failed',
      finishedAt: FieldValue.serverTimestamp(),
      errors: [{ platform: 'system', message: error.message }],
    }, { merge: true });
    throw error;
  }
}

export const saveSyncConfig = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    const user = await requireFirebaseUser(req);
    const configId = req.body?.configId || DEFAULT_CONFIG_ID;
    const config = normalizeConfig(req.body?.config || {});
    assertValidConfig(config);

    await db().collection('sync_configs').doc(configId).set({
      ...config,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: user.uid,
    }, { merge: true });
    await saveSecretPatch(configId, req.body?.secrets || {});

    res.status(200).json({ ok: true, configId });
  } catch (error) {
    jsonError(res, 400, error.message);
  }
});

export const testSheetConnection = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    await requireFirebaseUser(req);
    const configId = req.body?.configId || DEFAULT_CONFIG_ID;
    const configSnap = await db().collection('sync_configs').doc(configId).get();
    if (!configSnap.exists) throw new Error('Sync config has not been saved yet');
    const config = normalizeConfig(configSnap.data());
    assertValidConfig(config);
    await ensureSheetHeaders(configId, config);
    await ensureFollowerSheetHeaders(configId, config);
    res.status(200).json({ ok: true, message: 'Sheet connection works and both tabs are ready.' });
  } catch (error) {
    jsonError(res, 400, error.message);
  }
});

export const getSyncSecretStatus = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    await requireFirebaseUser(req);
    const configId = req.body?.configId || DEFAULT_CONFIG_ID;
    const includeValues = req.body?.reveal === true;
    const secrets = await getSecretDoc(configId);
    const fields = buildSecretStatus(secrets, { includeValues });
    res.status(200).json({
      ok: true,
      configId,
      revealed: includeValues,
      updatedAt: timestampToIso(secrets?.updatedAt),
      configuredCount: fields.filter((field) => field.configured).length,
      totalCount: fields.length,
      fields,
    });
  } catch (error) {
    jsonError(res, 400, error.message);
  }
});

export const runSheetSync = onRequest({ cors: true, timeoutSeconds: 540, maxInstances: 3 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    const user = await requireFirebaseUser(req);
    const configId = req.body?.configId || DEFAULT_CONFIG_ID;
    let configOverride = null;
    if (req.body?.config) {
      configOverride = normalizeConfig(req.body.config);
      assertValidConfig(configOverride);
      await db().collection('sync_configs').doc(configId).set({
        ...configOverride,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: user.uid,
      }, { merge: true });
    }
    const result = await runSync({
      configId,
      preview: Boolean(req.body?.preview),
      source: req.body?.preview ? 'preview' : 'manual',
      configOverride,
      target: req.body?.target,
    });
    res.status(200).json(result);
  } catch (error) {
    jsonError(res, 500, error.message);
  }
});

export const debugYouTubeDataApi = onRequest({ cors: true, timeoutSeconds: 180, maxInstances: 3 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    await requireFirebaseUser(req);
    const configId = req.body?.configId || DEFAULT_CONFIG_ID;
    let config;
    if (req.body?.config) {
      config = normalizeConfig(req.body.config);
      assertValidConfig(config);
    } else {
      const configSnap = await db().collection('sync_configs').doc(configId).get();
      if (!configSnap.exists) throw new Error('Sync config has not been saved yet');
      config = normalizeConfig(configSnap.data());
      assertValidConfig(config);
    }
    const result = await buildYouTubeDataDebug(configId, config, {
      maxVideos: req.body?.maxVideos,
    });
    res.status(200).json(result);
  } catch (error) {
    jsonError(res, 500, error.message);
  }
});

export const startInstagramOAuth = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    const user = await requireFirebaseUser(req);
    const configId = req.body?.configId || DEFAULT_CONFIG_ID;
    const { clientId, redirectUri } = await getInstagramOAuthConfig(configId);
    const state = crypto.randomBytes(24).toString('hex');
    await db().collection('oauth_states').doc(state).set({
      provider: 'instagram',
      configId,
      uid: user.uid,
      userEmail: user.email || '',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      force_reauth: 'true',
      enable_fb_login: 'false',
      scope: INSTAGRAM_DIRECT_SCOPES.join(','),
      state,
    });
    res.status(200).json({
      ok: true,
      authUrl: `https://www.instagram.com/oauth/authorize?${params.toString()}`,
      redirectUri,
      scopes: INSTAGRAM_DIRECT_SCOPES,
    });
  } catch (error) {
    jsonError(res, 400, error.message);
  }
});

export const oauthCallbackInstagram = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed. Use GET.');

  try {
    const { code, state, error, error_description: errorDescription } = req.query || {};
    if (error) throw new Error(errorDescription || error);
    if (!code || !state) throw new Error('Missing Instagram code or state');

    const stateRef = db().collection('oauth_states').doc(String(state));
    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) throw new Error('Invalid or expired OAuth state');
    const stateData = stateSnap.data();
    if (stateData.provider !== 'instagram') throw new Error('OAuth state is not for Instagram');
    if (stateData.expiresAt?.toDate?.() < new Date()) throw new Error('OAuth state expired');

    const { clientId, clientSecret, redirectUri } = await getInstagramOAuthConfig(stateData.configId);
    const shortLivedToken = await instagramOAuthTokenRequest({
      client_id: clientId,
      client_secret: clientSecret,
      code: String(code),
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    const oauthUserId = String(shortLivedToken.user_id || '').trim();
    const usableToken = await getUsableInstagramToken(shortLivedToken.access_token, clientSecret)
      .catch((error) => ({
        access_token: shortLivedToken.access_token,
        token_type: 'bearer',
        expires_in: Number(shortLivedToken.expires_in || 3600),
        isLongLived: false,
        exchangeWarning: error.message,
      }));
    const profile = await getInstagramProfile(oauthUserId, usableToken.access_token)
      .catch((profileError) => fallbackInstagramProfile(oauthUserId, profileError.message));
    const instagramUserId = String(profile?.user_id || profile?.id || oauthUserId || '').trim();
    if (!instagramUserId) throw new Error('Instagram account ID was not returned');

    const accountId = instagramAccountDocId(instagramUserId);
    await saveInstagramTokenSecret(accountId, {
      ...usableToken,
      user_id: instagramUserId,
      oauth_user_id: oauthUserId,
      app_scoped_user_id: profile?.appScopedId || '',
      requested_scopes: INSTAGRAM_DIRECT_SCOPES.join(','),
      granted_scopes: shortLivedToken.permissions || shortLivedToken.scope || '',
    });

    const displayName = profile?.username || profile?.name || instagramUserId;
    await db().collection('social_accounts').doc(accountId).set({
      platform: 'instagram',
      accountId: instagramUserId,
      displayName,
      username: profile?.username || '',
      name: profile?.name || '',
      accountType: profile?.account_type || '',
      appScopedId: profile?.appScopedId || '',
      oauthUserId,
      tokenSource: 'instagram',
      authSource: 'instagram',
      tokenType: usableToken.isLongLived ? 'long_lived' : 'short_lived',
      tokenExchangeWarning: usableToken.exchangeWarning || '',
      profileWarning: profile?.profileWarning || '',
      requestedScopes: INSTAGRAM_DIRECT_SCOPES,
      grantedScopes: shortLivedToken.permissions || shortLivedToken.scope || '',
      latestFollowerCount: nullableNumber(profile?.followers_count),
      mediaCount: nullableNumber(profile?.media_count),
      profilePictureUrl: profile?.profile_picture_url || '',
      connectedBy: stateData.uid,
      connectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await stateRef.delete();

    const warnings = [
      profile?.profileWarning ? `Profile lookup warning: ${profile.profileWarning}` : '',
      usableToken.exchangeWarning ? `Token exchange warning: ${usableToken.exchangeWarning}` : '',
    ].filter(Boolean);
    const warning = warnings.length
      ? `<p>Instagram token was saved, but Meta returned warnings:</p><ul>${warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><p>You can close this tab and run Preview Sync to see media/insights debug output.</p>`
      : '';
    res.status(200).send(`<html><body><h2>Instagram connected.</h2>${warning}<p>You can close this tab and return to the dashboard.</p></body></html>`);
  } catch (callbackError) {
    res.status(400).send(`<html><body><h2>Instagram connection failed</h2><p>${escapeHtml(callbackError.message)}</p></body></html>`);
  }
});

export const startYouTubeOAuth = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    const user = await requireFirebaseUser(req);
    const configId = req.body?.configId || DEFAULT_CONFIG_ID;
    const { clientId, redirectUri } = await getYouTubeOAuthConfig(configId);
    const state = crypto.randomBytes(24).toString('hex');
    await db().collection('oauth_states').doc(state).set({
      provider: 'youtube',
      configId,
      uid: user.uid,
      userEmail: user.email || '',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });
    res.status(200).json({
      ok: true,
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      redirectUri,
    });
  } catch (error) {
    jsonError(res, 400, error.message);
  }
});

export const oauthCallbackYouTube = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed. Use GET.');

  try {
    const { code, state, error, error_description: errorDescription } = req.query || {};
    if (error) throw new Error(errorDescription || error);
    if (!code || !state) throw new Error('Missing YouTube code or state');

    const stateRef = db().collection('oauth_states').doc(String(state));
    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) throw new Error('Invalid or expired OAuth state');
    const stateData = stateSnap.data();
    if (stateData.provider !== 'youtube') throw new Error('OAuth state is not for YouTube');
    if (stateData.expiresAt?.toDate?.() < new Date()) throw new Error('OAuth state expired');

    const { clientId, clientSecret, redirectUri } = await getYouTubeOAuthConfig(stateData.configId);
    const tokenData = await youtubeTokenRequest({
      client_id: clientId,
      client_secret: clientSecret,
      code: String(code),
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const userCredentialId = `youtube_user_${sanitizeDocId(stateData.uid)}`;
    await saveYouTubeTokenSecret(userCredentialId, tokenData);

    const channels = await youtubeDataApiWithToken(tokenData.access_token, 'channels', {
      part: 'snippet,statistics',
      mine: 'true',
      maxResults: '1',
    });
    const channel = channels?.items?.[0];

    await db().collection('social_accounts').doc(userCredentialId).set({
      platform: 'youtube_credential',
      accountId: userCredentialId,
      displayName: 'YouTube OAuth connection',
      connectedBy: stateData.uid,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (channel?.id) {
      const accountId = `youtube_${sanitizeDocId(channel.id)}`;
      await saveYouTubeTokenSecret(accountId, tokenData);
      const channelPayload = {
        name: channel?.snippet?.title || channel.id,
        channelId: channel.id,
        oauthAccountId: accountId,
        connectedBy: stateData.uid,
        connectedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await db().collection('youtube_channels').doc(channel.id).set(channelPayload, { merge: true });
      await db().collection('social_accounts').doc(accountId).set({
        platform: 'youtube',
        accountId: channel.id,
        resolvedChannelId: channel.id,
        displayName: channelPayload.name,
        latestFollowerCount: nullableNumber(channel?.statistics?.subscriberCount),
        connectedBy: stateData.uid,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await stateRef.delete();

    res.status(200).send('<html><body><h2>YouTube connected.</h2><p>You can close this tab and return to the dashboard. If the editor channel is not listed, add it by Channel ID in Sheet Sync.</p></body></html>');
  } catch (callbackError) {
    res.status(400).send(`<html><body><h2>YouTube connection failed</h2><p>${callbackError.message}</p></body></html>`);
  }
});

export const startTikTokOAuth = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    const user = await requireFirebaseUser(req);
    const configId = req.body?.configId || DEFAULT_CONFIG_ID;
    const { clientKey, redirectUri } = await getTikTokClientConfig(configId);
    const state = crypto.randomBytes(24).toString('hex');
    await db().collection('oauth_states').doc(state).set({
      provider: 'tiktok',
      configId,
      uid: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    });
    const params = new URLSearchParams({
      client_key: clientKey,
      response_type: 'code',
      scope: 'user.info.basic,user.info.stats,video.list',
      redirect_uri: redirectUri,
      state,
    });
    res.status(200).json({
      ok: true,
      authUrl: `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`,
      redirectUri,
    });
  } catch (error) {
    jsonError(res, 400, error.message);
  }
});

export const oauthCallbackTikTok = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed. Use GET.');

  try {
    const { code, state, error, error_description: errorDescription } = req.query || {};
    if (error) throw new Error(errorDescription || error);
    if (!code || !state) throw new Error('Missing TikTok code or state');

    const stateRef = db().collection('oauth_states').doc(String(state));
    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) throw new Error('Invalid or expired OAuth state');
    const stateData = stateSnap.data();
    if (stateData.expiresAt?.toDate?.() < new Date()) throw new Error('OAuth state expired');

    const { clientKey, clientSecret, redirectUri } = await getTikTokClientConfig(stateData.configId);
    const tokenData = await tiktokTokenRequest({
      client_key: clientKey,
      client_secret: clientSecret,
      code: String(code),
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    const accountId = `tiktok_${sanitizeDocId(tokenData.open_id)}`;
    await saveTikTokTokenSecret(accountId, tokenData);
    await db().collection('social_accounts').doc(accountId).set({
      platform: 'tiktok',
      accountId: tokenData.open_id,
      displayName: tokenData.open_id,
      connectedBy: stateData.uid,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await stateRef.delete();

    res.status(200).send('<html><body><h2>TikTok connected.</h2><p>You can close this tab and return to the dashboard.</p></body></html>');
  } catch (callbackError) {
    res.status(400).send(`<html><body><h2>TikTok connection failed</h2><p>${callbackError.message}</p></body></html>`);
  }
});

async function refreshYouTubeReachCachesForConfig({
  configId = DEFAULT_CONFIG_ID,
  forceRefresh = true,
  source = 'schedule',
} = {}) {
  const configSnap = await db().collection('sync_configs').doc(configId).get();
  if (!configSnap.exists) {
    return {
      ok: true,
      skipped: true,
      reason: 'Sync config has not been saved yet',
      channels: 0,
      videos: 0,
      updatedRows: 0,
      warnings: [],
      errors: [],
    };
  }

  const config = normalizeConfig(configSnap.data());
  if (config.enabledPlatforms?.youtube === false) {
    return {
      ok: true,
      skipped: true,
      reason: 'YouTube sync is disabled',
      channels: 0,
      videos: 0,
      updatedRows: 0,
      warnings: [],
      errors: [],
    };
  }

  const contentConfig = configForDateScope(config, 'content');
  const { start, end } = getSyncWindow(contentConfig);
  const sinceIso = start.toISOString();
  const untilIso = end.toISOString();
  const channelsSnap = await db().collection('youtube_channels').get();
  const selectedChannelIds = new Set(contentConfig.selectedAccounts?.youtube || []);
  const warnings = [];
  const errors = [];
  const refreshedChannels = [];
  let channelCount = 0;
  let videoCount = 0;
  let updatedRows = 0;

  for (const channelDoc of channelsSnap.docs) {
    const channel = { id: channelDoc.id, ...channelDoc.data() };
    if (selectedChannelIds.size && !selectedChannelIds.has(String(channel.id))) continue;
    try {
      const actualChannelId = await resolveYouTubeChannel(configId, channel.id);
      const oauthAccountId = channel.oauthAccountId || `youtube_${sanitizeDocId(actualChannelId)}`;
      const accessToken = await getYouTubeAccessToken(configId, oauthAccountId);
      const channelProfile = await getYouTubeChannelProfile(accessToken, actualChannelId);
      const videoIds = await listYouTubeUploadVideoIds(
        accessToken,
        channelProfile.uploadsPlaylistId,
        sinceIso,
        untilIso,
      );
      channelCount += 1;
      videoCount += videoIds.length;
      if (!videoIds.length) {
        refreshedChannels.push({
          channelId: channelProfile.channelId,
          accountId: channel.id,
          videos: 0,
          updatedRows: 0,
        });
        continue;
      }

      const result = await refreshYouTubeReachCache(accessToken, channelProfile.channelId, videoIds, {
        ...contentConfig,
        scope: 'lifetime',
      }, {
        force: forceRefresh,
      });
      updatedRows += Number(result.updatedRows || 0);
      for (const warning of result.warnings || []) {
        warnings.push({
          platform: 'youtube',
          accountId: channel.id,
          message: warning,
        });
      }
      refreshedChannels.push({
        channelId: channelProfile.channelId,
        accountId: channel.id,
        videos: videoIds.length,
        updatedRows: Number(result.updatedRows || 0),
        reportCount: Number(result.reportCount || 0),
        skipped: Boolean(result.skipped),
      });
    } catch (error) {
      errors.push({ platform: 'youtube', accountId: channel.id, message: error.message });
    }
  }

  const summary = {
    ok: !errors.length,
    skipped: false,
    source,
    configId,
    startDate: contentConfig.startDate,
    endDate: contentConfig.endDate,
    channels: channelCount,
    videos: videoCount,
    updatedRows,
    warnings,
    errors,
    refreshedChannels,
  };

  await db().collection('youtube_reach_cache_runs').add({
    ...summary,
    createdAt: FieldValue.serverTimestamp(),
  });

  return summary;
}

export const scheduledYouTubeReachCacheRefresh = onSchedule({
  schedule: 'every 2 hours',
  timeZone: 'UTC',
  timeoutSeconds: 540,
  maxInstances: 1,
}, async () => {
  await refreshYouTubeReachCachesForConfig({
    configId: DEFAULT_CONFIG_ID,
    forceRefresh: true,
    source: 'schedule',
  });
});

export const scheduledSheetSync = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: 'UTC',
  timeoutSeconds: 540,
}, async () => {
  const configSnap = await db().collection('sync_configs').doc(DEFAULT_CONFIG_ID).get();
  if (!configSnap.exists) return;
  const config = normalizeConfig(configSnap.data());
  if (!config.scheduleEnabled) return;

  const now = new Date();
  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone || DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const part = (type) => localParts.find((item) => item.type === type)?.value;
  const localDate = `${part('year')}-${part('month')}-${part('day')}`;
  const localTime = `${part('hour')}:${part('minute')}`;
  const alreadyRanToday = configSnap.data()?.lastScheduledRunDate === localDate;
  if (alreadyRanToday || localTime < config.scheduleTime) return;

  await db().collection('sync_configs').doc(DEFAULT_CONFIG_ID).set({
    lastScheduledRunDate: localDate,
  }, { merge: true });
  await runSync({ configId: DEFAULT_CONFIG_ID, preview: false, source: 'schedule' });
});
