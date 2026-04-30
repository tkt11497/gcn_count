import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';
import fetch from 'node-fetch';

const DEFAULT_CONFIG_ID = 'default';
const DEFAULT_TIMEZONE = 'Asia/Rangoon';
const SHEET_HEADERS = [
  'Date',
  'Content',
  'Platform',
  'Type',
  'Link',
  'Reach',
  'Views / Impression',
  'Interactions',
  'Video View',
];
const FOLLOWER_HEADERS = [
  'Date Range',
  'Platform',
  'Account',
  'Account ID',
  'Followers Before',
  'Followers Now',
  'Growth',
];

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
  if (!Number.isFinite(seconds)) return new Date().toISOString();
  return new Date(seconds * 1000).toISOString();
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

function getSyncWindow(config) {
  const start = new Date(`${config.startDate || defaultStartDate()}T00:00:00.000Z`);
  const end = new Date(`${config.endDate || defaultEndDate()}T23:59:59.999Z`);
  return { start, end };
}

function normalizeConfig(input = {}) {
  const fallbackStartDate = input.startDate
    ? isoDateOnly(input.startDate)
    : new Date(
      Date.now() - Math.max(1, Math.min(90, Number(input.lookbackDays || 14))) * 24 * 60 * 60 * 1000,
    ).toISOString().slice(0, 10);
  const fallbackEndDate = isoDateOnly(input.endDate) || defaultEndDate();

  const normalized = {
    sheetId: String(input.sheetId || '').trim(),
    sheetTab: String(input.sheetTab || 'Sheet1').trim(),
    followerSheetTab: String(input.followerSheetTab || 'Follower Growth').trim(),
    headerRow: Math.max(1, Number(input.headerRow || 1)),
    timezone: String(input.timezone || DEFAULT_TIMEZONE).trim(),
    scheduleTime: String(input.scheduleTime || '09:00').trim(),
    scheduleEnabled: Boolean(input.scheduleEnabled),
    startDate: fallbackStartDate,
    endDate: fallbackEndDate,
    enabledPlatforms: {
      facebook: input.enabledPlatforms?.facebook !== false,
      youtube: input.enabledPlatforms?.youtube !== false,
      tiktok: input.enabledPlatforms?.tiktok !== false,
    },
    selectedAccounts: {
      facebook: Array.isArray(input.selectedAccounts?.facebook)
        ? input.selectedAccounts.facebook.map(String)
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

function assertValidConfig(config) {
  if (!config.sheetId) throw new Error('Google Sheet ID is required');
  if (!config.sheetTab) throw new Error('Worksheet/tab name is required');
  if (!config.followerSheetTab) throw new Error('Follower worksheet/tab name is required');
  if (!/^\d{2}:\d{2}$/.test(config.scheduleTime)) {
    throw new Error('Schedule time must use HH:mm format');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.startDate)) {
    throw new Error('Start date must use YYYY-MM-DD format');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.endDate)) {
    throw new Error('End date must use YYYY-MM-DD format');
  }
  const { start, end } = getSyncWindow(config);
  if (start > end) throw new Error('Start date must be before or equal to end date');
}

async function saveSecretPatch(configId, secrets = {}) {
  const patch = {};
  const fieldNames = [
    'googleServiceAccountJson',
    'youtubeApiKey',
    'tiktokClientKey',
    'tiktokClientSecret',
    'tiktokRedirectUri',
  ];

  for (const fieldName of fieldNames) {
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
  const current = await sheetsFetch(configId, config, 'GET', `A${row}:I${row}`);
  const existing = current?.values?.[0] || [];
  const missing = SHEET_HEADERS.some((header, index) => existing[index] !== header);
  if (missing) {
    await sheetsFetch(configId, config, 'PUT', `A${row}:I${row}`, { values: [SHEET_HEADERS] });
  }
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
    await sheetsFetch(configId, followerConfig, 'PUT', `A${row}:G${row}`, { values: [FOLLOWER_HEADERS] });
  }

  await sheetsBatchClear(configId, config, [rangeForTab(followerTab, 'H:Z')]);
}

async function writeSheetRowsAt(configId, config, startRow, rows) {
  if (!rows.length) return;
  await sheetsBatchUpdate(configId, config, [{
    range: rangeFor(config, `A${startRow}:I${startRow + rows.length - 1}`),
    values: rows,
  }]);
}

async function compactSheetRows(configId, config, snapshots, discoveredRows) {
  const allSnapshots = await snapshots.get();
  const existingSnapshots = new Map();
  let maxTrackedSheetRow = Number(config.headerRow || 1);

  for (const snap of allSnapshots.docs) {
    const data = snap.data();
    if (data.configId && data.configId !== configId) continue;
    const sheetRowNumber = Number(data.sheetRowNumber || 0);
    if (sheetRowNumber > maxTrackedSheetRow) maxTrackedSheetRow = sheetRowNumber;
    existingSnapshots.set(snap.id, { snapshotRef: snap.ref, data });
  }

  let appended = 0;
  let updated = 0;
  const compactItems = [];
  const discoveredDocIds = new Set();

  for (const item of discoveredRows) {
    const docId = sanitizeDocId(item.key);
    const snapshotRef = snapshots.doc(docId);
    const existed = existingSnapshots.has(docId);
    discoveredDocIds.add(docId);
    if (existed) updated += 1;
    else appended += 1;
    compactItems.push({
      snapshotRef,
      existed,
      rowPayload: {
        platform: item.platform,
        contentId: item.contentId,
        key: item.key,
        link: item.link,
        createdAt: item.createdAt,
        configId,
        row: item.row,
        metrics: item.metrics || {},
        lastSyncedAt: FieldValue.serverTimestamp(),
      },
    });
  }

  compactItems.sort((a, b) => {
      const dateDiff = new Date(a.rowPayload.createdAt) - new Date(b.rowPayload.createdAt);
      if (dateDiff) return dateDiff;
      return String(a.rowPayload.key || '').localeCompare(String(b.rowPayload.key || ''));
    });

  const startRow = Number(config.headerRow || 1) + 1;
  const sheetValues = await sheetsFetch(configId, config, 'GET', 'A:I');
  const lastValueRow = Math.max(Number(config.headerRow || 1), sheetValues?.values?.length || 0);
  const clearEndRow = Math.max(
    maxTrackedSheetRow,
    lastValueRow,
    startRow + compactItems.length + 25,
  );

  await sheetsBatchClear(configId, config, [
    rangeFor(config, `A${startRow}:I${clearEndRow}`),
  ]);

  if (compactItems.length) {
    await writeSheetRowsAt(
      configId,
      config,
      startRow,
      compactItems.map((item) => item.rowPayload.row),
    );
  }

  const snapshotWrites = compactItems.map((item, index) => ({
    snapshotRef: item.snapshotRef,
    payload: {
      ...item.rowPayload,
      configId,
      sheetRowNumber: startRow + index,
      lastSyncedAt: FieldValue.serverTimestamp(),
    },
  }));

  for (const [docId, existing] of existingSnapshots.entries()) {
    if (!discoveredDocIds.has(docId) && existing.data?.sheetRowNumber) {
      snapshotWrites.push({
        snapshotRef: existing.snapshotRef,
        payload: {
          sheetRowNumber: null,
          excludedFromLastSyncAt: FieldValue.serverTimestamp(),
        },
      });
    }
  }

  await commitSnapshotWrites(snapshotWrites);

  return { appended, updated };
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
    throw new Error(data?.error?.message || `Facebook API error on ${path}`);
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
  const postType = String(post?.type || '').toLowerCase();
  const permalink = String(post?.permalink_url || '').toLowerCase();
  const attachmentUrl = String(attachment.url || '').toLowerCase();
  const sourceHints = [
    post?.type,
    post?.video?.status,
    post?.live_status,
    attachment.type,
  ].map((value) => String(value || '').toLowerCase());
  const combinedHints = [
    mediaType,
    statusType,
    permalink,
    attachmentUrl,
    ...sourceHints,
  ].join(' ');

  if (
    statusType === 'live_video' ||
    statusType.includes('live') ||
    postType.includes('live') ||
    combinedHints.includes('live_video') ||
    combinedHints.includes('live video') ||
    combinedHints.includes('/live/') ||
    combinedHints.includes('/videos/live/')
  ) {
    return 'Live';
  }

  if (
    mediaType.includes('reel') ||
    mediaType.includes('short') ||
    permalink.includes('/reel/') ||
    permalink.includes('/reels/') ||
    attachmentUrl.includes('/reel/') ||
    attachmentUrl.includes('/reels/') ||
    combinedHints.includes('short_video')
  ) {
    return 'Reels';
  }

  if (
    mediaType.includes('video') ||
    postType.includes('video') ||
    statusType.includes('video') ||
    permalink.includes('/videos/') ||
    attachmentUrl.includes('/videos/') ||
    sourceHints.includes('video')
  ) {
    return 'Video';
  }

  return 'Static';
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
  const { start, end } = getSyncWindow(config);
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
      const postsResp = await fbGet(`${page.id}/posts`, page.access_token, {
        fields: 'id,created_time,message,story,permalink_url,attachments{media_type,type,url,target}',
        since: String(since),
        until: String(until),
        limit: '50',
      });

      for (const post of postsResp?.data || []) {
        const type = facebookContentType(post);
        const [reach, impressions, videoViews, interactions] = await Promise.all([
          tryFacebookMetric(post.id, page.access_token, [
            'post_impressions_unique',
            'post_total_media_view_unique',
          ]),
          tryFacebookMetric(post.id, page.access_token, [
            'post_impressions',
            'post_media_view',
          ]),
          type === 'Static'
            ? Promise.resolve(null)
            : tryFacebookMetric(post.id, page.access_token, [
              'post_video_views',
              'post_media_view',
            ]),
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
            type === 'Static' ? '-' : numberOrDash(videoViews),
          ],
          metrics: { reach, impressions, interactions, videoViews },
        });
      }
    } catch (error) {
      errors.push({ platform: 'facebook', accountId: page.id, message: error.message });
    }
  }

  return { rows, errors };
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

async function resolveYouTubeChannel(configId, channelIdOrHandle) {
  if (String(channelIdOrHandle).startsWith('UC')) return channelIdOrHandle;
  const handle = String(channelIdOrHandle).replace(/^@/, '');
  const data = await youtubeApi(configId, 'channels', {
    part: 'id',
    forHandle: handle,
  });
  return data?.items?.[0]?.id || channelIdOrHandle;
}

async function discoverYouTubeRows(configId, config) {
  const rows = [];
  const errors = [];
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
      await db().collection('social_accounts').doc(`youtube_${sanitizeDocId(channel.id)}`).set({
        platform: 'youtube',
        accountId: channel.id,
        resolvedChannelId: actualChannelId,
        displayName: channel.name || channel.id,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      const search = await youtubeApi(configId, 'search', {
        part: 'id,snippet',
        channelId: actualChannelId,
        type: 'video',
        order: 'date',
        maxResults: '20',
        publishedAfter: sinceIso,
        publishedBefore: untilIso,
      });
      const videoIds = (search?.items || []).map((item) => item?.id?.videoId).filter(Boolean);
      if (!videoIds.length) continue;

      const videos = await youtubeApi(configId, 'videos', {
        part: 'snippet,statistics,liveStreamingDetails',
        id: videoIds.join(','),
      });

      for (const video of videos?.items || []) {
        const stats = video.statistics || {};
        const views = toNumber(stats.viewCount);
        const interactions = toNumber(stats.likeCount) + toNumber(stats.commentCount);
        const type = video.liveStreamingDetails ? 'Live' : 'Video';
        const createdAt = video?.snippet?.publishedAt || new Date().toISOString();
        const link = `https://www.youtube.com/watch?v=${video.id}`;

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
            '-',
            numberOrDash(views),
            numberOrDash(interactions),
            numberOrDash(views),
          ],
          metrics: { views, interactions },
        });
      }
    } catch (error) {
      errors.push({ platform: 'youtube', accountId: channel.id, message: error.message });
    }
  }

  return { rows, errors };
}

async function getTikTokClientConfig(configId) {
  const [clientKey, clientSecret, redirectUri] = await Promise.all([
    getSecretValue(configId, 'tiktokClientKey', ['TIKTOK_CLIENT_KEY']),
    getSecretValue(configId, 'tiktokClientSecret', ['TIKTOK_CLIENT_SECRET']),
    getSecretValue(configId, 'tiktokRedirectUri', ['TIKTOK_REDIRECT_URI']),
  ]);
  if (!clientKey || !clientSecret) {
    throw new Error('TikTok client key/secret are not configured');
  }
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
          const createdAtMs = new Date(createdAt).getTime();
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

async function getFacebookFollowerAccounts(config) {
  if (!config.enabledPlatforms?.facebook) return { accounts: [], errors: [] };

  const errors = [];
  const accounts = [];
  const pagesSnap = await db().collection('pages').get();
  const selectedPageIds = new Set(config.selectedAccounts?.facebook || []);

  for (const pageDoc of pagesSnap.docs) {
    const page = { id: pageDoc.id, ...pageDoc.data() };
    if (selectedPageIds.size && !selectedPageIds.has(String(page.id))) continue;
    if (!page.access_token) continue;

    try {
      const data = await fbGet(page.id, page.access_token, {
        fields: 'name,followers_count,fan_count',
      });
      const followers = nullableNumber(data?.followers_count) ?? nullableNumber(data?.fan_count);
      if (followers !== null) {
        accounts.push({
          platform: 'Facebook',
          platformKey: 'facebook',
          accountId: String(page.id),
          accountName: data?.name || page.name || page.id,
          followers,
        });
      }
    } catch (error) {
      errors.push({ platform: 'facebook', accountId: page.id, message: error.message });
    }
  }

  return { accounts, errors };
}

async function getYouTubeSubscriberAccounts(configId, config) {
  if (!config.enabledPlatforms?.youtube) return { accounts: [], errors: [] };

  const errors = [];
  const accounts = [];
  const channelsSnap = await db().collection('youtube_channels').get();
  const selectedChannelIds = new Set(config.selectedAccounts?.youtube || []);
  const channelRequests = [];

  for (const channelDoc of channelsSnap.docs) {
    const channel = { id: channelDoc.id, ...channelDoc.data() };
    if (selectedChannelIds.size && !selectedChannelIds.has(String(channel.id))) continue;
    try {
      channelRequests.push({
        originalId: String(channel.id),
        name: channel.name || channel.id,
        resolvedId: await resolveYouTubeChannel(configId, channel.id),
      });
    } catch (error) {
      errors.push({ platform: 'youtube', accountId: channel.id, message: error.message });
    }
  }

  for (let index = 0; index < channelRequests.length; index += 50) {
    const chunk = channelRequests.slice(index, index + 50);
    const ids = chunk.map((channel) => channel.resolvedId).filter(Boolean);
    if (!ids.length) continue;
    try {
      const data = await youtubeApi(configId, 'channels', {
        part: 'snippet,statistics',
        id: ids.join(','),
        maxResults: '50',
      });
      for (const channel of data?.items || []) {
        const subscribers = nullableNumber(channel?.statistics?.subscriberCount);
        if (subscribers !== null) {
          const fallback = chunk.find((item) => item.resolvedId === channel.id);
          accounts.push({
            platform: 'YouTube',
            platformKey: 'youtube',
            accountId: String(channel.id || fallback?.originalId || ''),
            accountName: channel?.snippet?.title || fallback?.name || channel.id,
            followers: subscribers,
          });
        }
      }
    } catch (error) {
      errors.push({ platform: 'youtube', accountId: ids.join(','), message: error.message });
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
  const [facebook, tiktok, youtube] = await Promise.all([
    getFacebookFollowerAccounts(config),
    getTikTokFollowerAccounts(configId, config),
    getYouTubeSubscriberAccounts(configId, config),
  ]);

  return {
    accounts: [
      ...facebook.accounts,
      ...tiktok.accounts,
      ...youtube.accounts,
    ].sort((a, b) => (
      a.platform.localeCompare(b.platform)
        || a.accountName.localeCompare(b.accountName)
        || a.accountId.localeCompare(b.accountId)
    )),
    errors: [
      ...facebook.errors,
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

function followerRows(config, accounts, previousAccounts) {
  const dateRange = formatFollowerDateRange(config);
  return accounts.map((account) => {
    const key = followerAccountKey(account.platformKey, account.accountId);
    const before = nullableNumber(previousAccounts?.[key]);
    return {
      key,
      ...account,
      dateRange,
      row: [
        dateRange,
        account.platform,
        account.accountName,
        account.accountId,
        numberOrDash(before),
        numberOrDash(account.followers),
        followerGrowth(account.followers, before),
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

function previousFollowerRecord(records, current) {
  return records
    .filter((item) => (
      item.key === current.key
      && item.endDate
      && current.startDate
      && item.endDate < current.startDate
    ))
    .sort((a, b) => String(b.endDate).localeCompare(String(a.endDate)))[0] || null;
}

async function previousFollowerAccounts(configId, config, accounts) {
  const accountKeys = new Set(accounts.map((account) => (
    followerAccountKey(account.platformKey, account.accountId)
  )));
  const snap = await db().collection('follower_snapshots')
    .where('configId', '==', configId)
    .get();
  const records = snap.docs
    .map((snapshot) => {
      const data = snapshot.data();
      const key = followerAccountKey(data.platformKey, data.accountId);
      return {
        key,
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        followers: nullableNumber(data.followers),
      };
    })
    .filter((item) => accountKeys.has(item.key) && item.followers !== null);

  const result = {};
  for (const account of accounts) {
    const key = followerAccountKey(account.platformKey, account.accountId);
    const previous = previousFollowerRecord(records, {
      key,
      startDate: config.startDate,
    });
    if (previous?.followers !== null && previous?.followers !== undefined) {
      result[key] = previous.followers;
    }
  }
  return result;
}

function followerSnapshotToRecord(snapshot) {
  const data = snapshot.data();
  const platformKey = data.platformKey || String(data.platform || '').toLowerCase();
  const accountId = String(data.accountId || '');
  return {
    snapshotRef: snapshot.ref,
    key: followerAccountKey(platformKey, accountId),
    dateRange: data.dateRange || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    platform: data.platform || '',
    platformKey,
    accountId,
    accountName: data.accountName || accountId,
    followers: nullableNumber(data.followers),
  };
}

function followerRecordRow(records, record) {
  const previous = previousFollowerRecord(records, record);
  const before = nullableNumber(previous?.followers);
  return [
    record.dateRange,
    record.platform,
    record.accountName,
    record.accountId,
    numberOrDash(before),
    numberOrDash(record.followers),
    followerGrowth(record.followers, before),
  ];
}

async function rewriteFollowerSheetFromSnapshots(configId, config, followerTab) {
  const followerConfig = { ...config, sheetTab: followerTab };
  const startRow = Number(config.headerRow || 1) + 1;
  const snap = await db().collection('follower_snapshots')
    .where('configId', '==', configId)
    .get();
  const records = snap.docs
    .map(followerSnapshotToRecord)
    .filter((record) => (
      record.followers !== null
      && record.startDate
      && record.endDate
      && record.platform
      && record.accountId
    ))
    .sort((a, b) => (
      String(a.startDate).localeCompare(String(b.startDate))
        || String(a.endDate).localeCompare(String(b.endDate))
        || a.platform.localeCompare(b.platform)
        || a.accountName.localeCompare(b.accountName)
        || a.accountId.localeCompare(b.accountId)
    ));

  const sheetValues = await sheetsFetch(configId, followerConfig, 'GET', 'A:G');
  const clearEndRow = Math.max(
    sheetValues?.values?.length || 0,
    startRow + records.length + 25,
  );

  await sheetsBatchClear(configId, config, [
    rangeForTab(followerTab, `A${startRow}:G${clearEndRow}`),
  ]);

  const rows = records.map((record) => followerRecordRow(records, record));
  if (rows.length) {
    await sheetsBatchUpdate(configId, followerConfig, [{
      range: rangeForTab(followerTab, `A${startRow}:G${startRow + rows.length - 1}`),
      values: rows,
    }]);
  }

  await commitSnapshotWrites(records.map((record, index) => ({
    snapshotRef: record.snapshotRef,
    payload: {
      sheetRowNumber: startRow + index,
      row: rows[index],
      lastSheetRewriteAt: FieldValue.serverTimestamp(),
    },
  })));
}

async function writeFollowerSheet(configId, config, rows) {
  const followerTab = config.followerSheetTab || 'Follower Growth';
  const snapshots = db().collection('follower_snapshots');
  let appended = 0;
  let updated = 0;
  const snapshotWrites = [];

  for (const item of rows) {
    const docId = sanitizeDocId(`${configId}:${config.startDate}:${config.endDate}:${item.key}`);
    const snapshotRef = snapshots.doc(docId);
    const snapshot = await snapshotRef.get();

    if (snapshot.exists) updated += 1;
    else appended += 1;

    snapshotWrites.push({
      snapshotRef,
      payload: {
        configId,
        dateRange: item.dateRange,
        startDate: config.startDate,
        endDate: config.endDate,
        platform: item.platform,
        platformKey: item.platformKey,
        accountId: item.accountId,
        accountName: item.accountName,
        followers: item.followers,
        sheetTab: followerTab,
        row: item.row,
        lastSyncedAt: FieldValue.serverTimestamp(),
      },
    });
  }

  await commitSnapshotWrites(snapshotWrites);
  await rewriteFollowerSheetFromSnapshots(configId, config, followerTab);

  await db().collection('sync_configs').doc(configId).set({
    lastFollowerAccounts: followerAccountsMap(rows),
    lastFollowerSyncedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { appended, updated };
}

async function syncFollowerSheet(configId, config, preview = false) {
  const discovered = await discoverFollowerAccounts(configId, config);
  const previousAccounts = await previousFollowerAccounts(configId, config, discovered.accounts);
  const rows = followerRows(config, discovered.accounts, previousAccounts);

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
  if (config.enabledPlatforms?.youtube) tasks.push(discoverYouTubeRows(configId, config));
  if (config.enabledPlatforms?.tiktok) tasks.push(discoverTikTokRows(configId, config));

  const settled = await Promise.allSettled(tasks);
  const rows = [];
  const errors = [];
  for (const item of settled) {
    if (item.status === 'fulfilled') {
      rows.push(...item.value.rows);
      errors.push(...item.value.errors);
    } else {
      errors.push({ platform: 'system', message: item.reason?.message || String(item.reason) });
    }
  }
  return { rows, errors };
}

async function applyRowsToSheet(configId, config, normalizedRows, preview = false) {
  const results = { appended: 0, updated: 0, previewRows: [] };
  const snapshots = db().collection('content_snapshots');

  const sortedRows = normalizedRows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  for (const item of sortedRows) {
    const docId = sanitizeDocId(item.key);

    if (preview) {
      const snapshot = await snapshots.doc(docId).get();
      results.previewRows.push({ action: snapshot.exists ? 'update' : 'append', key: item.key, row: item.row });
    }
  }

  if (preview) return results;

  const compactResult = await compactSheetRows(configId, config, snapshots, sortedRows);
  return {
    ...results,
    appended: compactResult.appended,
    updated: compactResult.updated,
  };
}

async function runSync({ configId = DEFAULT_CONFIG_ID, preview = false, source = 'manual' } = {}) {
  const configSnap = await db().collection('sync_configs').doc(configId).get();
  if (!configSnap.exists) throw new Error('Sync config has not been saved yet');
  const config = normalizeConfig(configSnap.data());
  assertValidConfig(config);

  const runRef = db().collection('sync_runs').doc();
  await runRef.set({
    configId,
    source,
    preview,
    status: 'running',
    startedAt: FieldValue.serverTimestamp(),
  });

  try {
    if (!preview) await ensureSheetHeaders(configId, config);
    const discovered = await discoverRows(configId, config);
    const writeResult = await applyRowsToSheet(configId, config, discovered.rows, preview);
    const followerResult = await syncFollowerSheet(configId, config, preview);
    const allErrors = [
      ...discovered.errors,
      ...followerResult.errors,
    ];
    const status = allErrors.length ? 'partial_success' : 'success';

    await runRef.set({
      status,
      finishedAt: FieldValue.serverTimestamp(),
      discovered: discovered.rows.length,
      rowsAppended: writeResult.appended,
      rowsUpdated: writeResult.updated,
      followerRowsAppended: followerResult.appended,
      followerRowsUpdated: followerResult.updated,
      followerAccounts: followerResult.accounts,
      errors: allErrors,
      previewRows: preview ? writeResult.previewRows.slice(0, 50) : [],
      followerPreviewRows: preview ? followerResult.previewRows.slice(0, 50) : [],
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
      discovered: discovered.rows.length,
      rowsAppended: writeResult.appended,
      rowsUpdated: writeResult.updated,
      followerRowsAppended: followerResult.appended,
      followerRowsUpdated: followerResult.updated,
      followerAccounts: followerResult.accounts,
      errors: allErrors,
      previewRows: preview ? writeResult.previewRows.slice(0, 50) : undefined,
      followerPreviewRows: preview ? followerResult.previewRows.slice(0, 50) : undefined,
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

export const runSheetSync = onRequest({ cors: true, timeoutSeconds: 540, maxInstances: 3 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed. Use POST.');

  try {
    await requireFirebaseUser(req);
    const result = await runSync({
      configId: req.body?.configId || DEFAULT_CONFIG_ID,
      preview: Boolean(req.body?.preview),
      source: req.body?.preview ? 'preview' : 'manual',
    });
    res.status(200).json(result);
  } catch (error) {
    jsonError(res, 500, error.message);
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
