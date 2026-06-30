<template>
  <main class="legal-page">
    <section class="legal-shell">
      <header class="legal-hero">
        <p class="eyebrow">Game Cast Network</p>
        <h1>Privacy Policy</h1>
        <p class="effective-date">Effective Date: June 30, 2026</p>
        <p>
          This Privacy Policy explains how Game Cast Network uses authorized social platform,
          Google Sheets, live viewer count, and analytics data in the Live Dashboard, Live Viewer
          Count, and Sheet Sync tools.
        </p>
        <div class="legal-actions">
          <RouterLink to="/terms_of_service">Terms of Service</RouterLink>
          <a href="#data-deletion">Data deletion instructions</a>
        </div>
      </header>

      <section class="legal-card">
        <h2>1. What Our App Does</h2>
        <p>
          Our app helps authorized users view live viewer counts, live stream performance, and
          post-performance metrics from Facebook, Instagram, YouTube, and TikTok, then sync selected
          reporting data into a Google Sheet chosen by the user.
        </p>
        <p>
          We also operate a live viewer count collection feature for authorized live events. That
          feature periodically collects live viewer count snapshots from Facebook Live videos and
          YouTube live broadcasts that you connect, select, or authorize for monitoring.
        </p>
        <p>
          We only access accounts, pages, channels, profiles, media, videos, insights, and Sheets
          that you connect or authorize through the relevant platform login or service account flow.
        </p>
      </section>

      <section class="legal-card">
        <h2>2. Information We Collect</h2>
        <p>Depending on the accounts and permissions you connect, we may collect or process:</p>
        <ul>
          <li>Account identifiers, display names, usernames, page names, channel names, profile links, and account connection status.</li>
          <li>OAuth access tokens, refresh tokens, token expiry information, selected account IDs, and backend configuration needed to call authorized APIs.</li>
          <li>Google Sheet configuration such as Sheet ID, tab names, date ranges, schedule time, timezone, selected platforms, and selected accounts.</li>
          <li>Facebook Page, post, and live video data, including post IDs, live video IDs, message or caption text, media type, permalink, created time, live status, live viewer count snapshots, reach, impressions, video views, reactions, comments, and shares where available from the Meta Graph API.</li>
          <li>Instagram Business or Creator media data, including media IDs, caption, media type, permalink, timestamp, like count, comment count, reach, views, total interactions, saved, shares, replies, and other insight metrics where available from the Instagram API.</li>
          <li>YouTube channel, video, and live broadcast data, including channel ID, video ID, live broadcast ID where available, title, published date, scheduled or actual live time, URL, live viewer count snapshots, video statistics, and authorized YouTube Analytics metrics such as views, likes, comments, shares, thumbnail impressions, and thumbnail click-through rate where available.</li>
          <li>TikTok account and video data, including open ID, display name, avatar URL, video ID, title, URL, create time, view count, like count, comment count, share count, and other metrics returned by authorized TikTok APIs.</li>
          <li>Operational logs, live collection timestamps, sync run summaries, API error messages, and optional raw API responses shown in debug tools when you request troubleshooting.</li>
        </ul>
      </section>

      <section class="legal-card">
        <h2>3. How We Use Information</h2>
        <p>We use connected account data only to provide the app features you request:</p>
        <ul>
          <li>Authenticate your connected social, YouTube, TikTok, Instagram, Facebook, and Google Sheets accounts.</li>
          <li>Fetch live, recent, or date-range content and performance metrics for accounts you are authorized to manage.</li>
          <li>Collect live viewer count snapshots for authorized Facebook Live videos and YouTube live broadcasts during live events.</li>
          <li>Display live viewer counts in dashboards and preserve collection history for event reporting and troubleshooting.</li>
          <li>Calculate reporting rows such as content date, platform, content type, link, reach, impressions, interactions, video views, and CTR.</li>
          <li>Write or update those reporting rows in the Google Sheet and tabs you configure.</li>
          <li>Refresh cached metric snapshots and scheduled sync runs so reports stay reasonably up to date while respecting platform API limits.</li>
          <li>Debug failed syncs, permission issues, missing metrics, and platform API errors.</li>
        </ul>
        <p>
          We do not sell, rent, broker, or trade platform data. We do not use platform data for
          unrelated advertising, profiling, surveillance, or data brokerage.
        </p>
      </section>

      <section class="legal-card">
        <h2>4. Google and YouTube Data</h2>
        <p>
          If you connect Google Sheets or YouTube, the app uses Google APIs only to provide the
          requested Sheet Sync, YouTube reporting, and YouTube live viewer count collection features.
          Our use and transfer to any other app of information received from Google APIs will adhere to the
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>,
          including the Limited Use requirements.
        </p>
        <p>
          YouTube data is accessed through YouTube API Services. By using YouTube-connected
          features, you also agree to the
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>
          and acknowledge the
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
          You can revoke this app's access from your
          <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer">Google security permissions</a>.
        </p>
      </section>

      <section class="legal-card">
        <h2>5. Sharing and Disclosure</h2>
        <p>We share or transfer information only as needed to operate the service:</p>
        <ul>
          <li>To the social, Google, YouTube, TikTok, Facebook, Instagram, and Meta APIs you authorize us to call.</li>
          <li>To the Google Sheet you configure, because the purpose of Sheet Sync is to write reporting data into that Sheet.</li>
          <li>To cloud hosting, database, logging, and serverless infrastructure providers that help us run the app securely.</li>
          <li>To authorized members of our team only when needed for support, security, troubleshooting, or compliance.</li>
          <li>When required by law, legal process, or to protect the rights, safety, and security of users, platforms, or our service.</li>
        </ul>
      </section>

      <section class="legal-card">
        <h2>6. Storage, Retention, and Security</h2>
        <p>
          We store configuration, connected account references, tokens, cached metrics, sync history,
          and operational logs in cloud services used to run the app. Secrets and tokens are treated
          as confidential service data and are not displayed publicly.
        </p>
        <p>
          We retain data only for as long as needed to provide the service, maintain reporting
          history, comply with platform rules, troubleshoot sync issues, and meet legal obligations.
          If you disconnect an account or request deletion, we will delete or de-identify data we no
          longer need, subject to backups, security logs, legal requirements, and platform rules.
        </p>
        <p>
          We use reasonable administrative, technical, and organizational safeguards to protect data
          against unauthorized access, loss, misuse, or disclosure. No internet service can guarantee
          perfect security.
        </p>
      </section>

      <section id="data-deletion" class="legal-card">
        <h2>7. Data Deletion and Revocation</h2>
        <p>You can request deletion of your app data at any time.</p>
        <ol>
          <li>Email <a href="mailto:yonefang@gamecastnetwork.com">yonefang@gamecastnetwork.com</a> with the subject "Data Deletion Request".</li>
          <li>Include the connected account email or username, platform name, and the Google Sheet or workspace you want removed.</li>
          <li>We will verify the request and delete or de-identify applicable data within a reasonable period, unless retention is required by law, security, or platform obligations.</li>
        </ol>
        <p>
          For YouTube Authorized Data, after you revoke access or request deletion, we will delete
          stored YouTube Authorized Data as soon as possible and within the time required by
          YouTube API Services policies.
        </p>
        <p>You can also revoke platform access directly:</p>
        <ul>
          <li>For Facebook and Instagram, remove the app from your Facebook or Meta Business settings.</li>
          <li>For Google and YouTube, remove access in <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer">Google security permissions</a>.</li>
          <li>For TikTok, remove access from your TikTok authorized apps or account settings.</li>
        </ul>
      </section>

      <section class="legal-card">
        <h2>8. Your Choices and Rights</h2>
        <p>
          You may request access, correction, export, or deletion of your personal information where
          required by applicable law. You may also disconnect accounts, stop scheduled sync, remove
          selected accounts, or stop using the app at any time.
        </p>
      </section>

      <section class="legal-card">
        <h2>9. Children</h2>
        <p>
          The app is intended for business and creator reporting. It is not directed to children
          under 13, and we do not knowingly collect personal information from children under 13.
        </p>
      </section>

      <section class="legal-card">
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page
          with an updated effective date. Continued use of the app after changes means you accept
          the updated policy.
        </p>
      </section>

      <section class="legal-card">
        <h2>11. Contact</h2>
        <p>
          For privacy questions, platform review questions, or deletion requests, contact
          <a href="mailto:yonefang@gamecastnetwork.com">yonefang@gamecastnetwork.com</a>.
        </p>
      </section>
    </section>
  </main>
</template>

<style lang="css" scoped>
.legal-page {
  background: #0f1727;
  color: #dbe7f5;
  min-height: 100vh;
  padding: 32px 18px 56px;
}

.legal-shell {
  margin: 0 auto;
  max-width: 980px;
}

.legal-hero,
.legal-card {
  background: #172239;
  border: 1px solid #31415f;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
}

.legal-hero {
  margin-bottom: 18px;
  padding: 34px;
}

.eyebrow {
  color: #38bdf8;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0;
  margin: 0 0 10px;
  text-transform: uppercase;
}

h1,
h2 {
  color: #ffffff;
  line-height: 1.2;
  margin: 0;
}

h1 {
  font-size: 2.4rem;
}

h2 {
  font-size: 1.16rem;
  margin-bottom: 12px;
}

.effective-date {
  color: #9fb0c8;
  font-weight: 700;
  margin: 12px 0 14px;
}

p,
li {
  color: #c3d0e2;
  line-height: 1.68;
}

p {
  margin: 0 0 12px;
}

ul,
ol {
  margin: 12px 0 0;
  padding-left: 22px;
}

li + li {
  margin-top: 8px;
}

a {
  color: #7dd3fc;
  font-weight: 800;
  text-decoration: none;
}

a:hover {
  color: #ffffff;
}

.legal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.legal-actions a {
  background: #22314a;
  border-radius: 8px;
  color: #dbe7f5;
  display: inline-flex;
  min-height: 42px;
  padding: 10px 14px;
}

.legal-card {
  margin-bottom: 14px;
  padding: 24px;
}

@media (max-width: 640px) {
  .legal-page {
    padding: 18px 12px 36px;
  }

  .legal-hero,
  .legal-card {
    padding: 20px;
  }

  h1 {
    font-size: 1.9rem;
  }
}
</style>
