<template>
  <main class="sheet-sync">
    <section class="sync-header">
      <div>
        <p class="eyebrow">Social metrics automation</p>
        <h1>Google Sheet Sync</h1>
        <p class="subtitle">
          Choose workbook tabs, date ranges, accounts, then run both sheet tabs.
        </p>
      </div>
      <div class="status-panel">
        <span class="status-label">Last run</span>
        <strong>{{ latestRunLabel }}</strong>
        <small>{{ latestRunDetails }}</small>
        <div class="mode-switch" role="tablist" aria-label="Sheet sync mode">
          <button
            type="button"
            class="mode-choice"
            :class="{ active: !showSettings }"
            @click="showSettings = false"
          >
            <span class="icon icon-basic" aria-hidden="true"></span>
            Basic
          </button>
          <button
            type="button"
            class="mode-choice"
            :class="{ active: showSettings }"
            @click="showSettings = true"
          >
            <span class="icon icon-sliders" aria-hidden="true"></span>
            Advanced
          </button>
        </div>
      </div>
    </section>

    <section v-if="!showSettings" class="quick-sync-shell">
      <form class="quick-sync-card" @submit.prevent="runSync('both')">
        <div class="quick-sync-top">
          <div>
            <p class="eyebrow">Basic sync</p>
            <h2>
              <span class="icon icon-sync" aria-hidden="true"></span>
              Sheet sync setup
            </h2>
          </div>
          <span class="quick-state" :class="{ busy: busy }">{{ runningLabel }}</span>
        </div>

        <div class="quick-sync-layout">
          <div class="quick-settings-pane">
            <div class="quick-section-heading">
              <h3>
                <span class="section-icon icon-sheet" aria-hidden="true"></span>
                Workbook
              </h3>
              <span>{{ contentWindowLabel }}</span>
            </div>

            <label class="quick-field quick-sheet-id">
              Google Sheet ID
              <input
                v-model.trim="form.sheetId"
                type="text"
                placeholder="1abcDEF..."
                autocomplete="off"
                required
              />
            </label>

            <div class="quick-tab-grid">
              <label class="quick-field">
                Content tab
                <input v-model.trim="form.sheetTab" type="text" placeholder="Content" required />
              </label>

              <label class="quick-field">
                Follower tab
                <input v-model.trim="form.followerSheetTab" type="text" placeholder="Follower Growth" required />
              </label>
            </div>

            <div class="quick-section-heading duration-heading">
              <h3>
                <span class="section-icon icon-calendar" aria-hidden="true"></span>
                Date duration
              </h3>
              <span>Content and follower windows</span>
            </div>

            <div class="quick-duration-list">
              <div class="quick-duration-row">
                <div class="quick-duration-label">
                  <strong>Content metrics</strong>
                  <small>{{ contentWindowLabel }}</small>
                </div>
                <label class="quick-field">
                  Start date
                  <input v-model="form.contentStartDate" type="date" required />
                </label>
                <label class="quick-field">
                  End date
                  <input v-model="form.contentEndDate" type="date" required />
                </label>
              </div>

              <div class="quick-follower-toolbar">
                <div class="quick-duration-label">
                  <strong>Follower growth</strong>
                  <small>{{ followerWindowLabel }}</small>
                </div>
                <button type="button" class="mini-btn add-range-btn" @click="addFollowerDateRange">
                  <span class="icon icon-plus" aria-hidden="true"></span>
                  Add duration
                </button>
              </div>

              <div
                v-for="(range, index) in form.followerDateRanges"
                :key="range.id || index"
                class="quick-duration-row quick-follower-row"
              >
                <div class="quick-duration-label">
                  <div class="quick-range-label-row">
                    <strong>Duration {{ index + 1 }}</strong>
                    <button
                      v-if="form.followerDateRanges.length > 1"
                      type="button"
                      class="mini-btn danger"
                      @click="removeFollowerDateRange(index)"
                    >
                      <span class="icon icon-x" aria-hidden="true"></span>
                      Remove
                    </button>
                  </div>
                  <small>{{ dateWindowLabel(range.startDate, range.endDate) }}</small>
                </div>
                <label class="quick-field">
                  Start date
                  <input v-model="range.startDate" type="date" required />
                </label>
                <label class="quick-field">
                  End date
                  <input v-model="range.endDate" type="date" required />
                </label>
              </div>
            </div>
          </div>

          <div class="quick-accounts-pane">
            <div class="quick-section-heading">
              <h3>
                <span class="section-icon icon-users" aria-hidden="true"></span>
                Connected accounts
              </h3>
              <span>{{ accountSummary }}</span>
            </div>

            <div class="basic-account-stack">
              <div
                v-for="group in basicAccountGroups"
                :key="group.key"
                class="basic-platform-row"
                :class="{ disabled: !form.enabledPlatforms[group.key] }"
              >
                <div class="basic-platform-head">
                  <label class="basic-platform-toggle">
                    <input v-model="form.enabledPlatforms[group.key]" type="checkbox" />
                    <span class="platform-mark" :class="group.iconClass" aria-hidden="true">
                      {{ group.shortLabel }}
                    </span>
                    <span>
                      <strong>{{ group.label }}</strong>
                      <small>{{ group.countLabel }}</small>
                    </span>
                  </label>
                  <button
                    type="button"
                    class="mini-btn"
                    :disabled="!group.accounts.length || !form.enabledPlatforms[group.key]"
                    @click="toggleAllAccounts(group.key)"
                  >
                    <span
                      class="icon"
                      :class="allSelected(group.key) ? 'icon-x' : 'icon-check-all'"
                      aria-hidden="true"
                    ></span>
                    {{ allSelected(group.key) ? 'Clear' : 'All' }}
                  </button>
                </div>

                <div v-if="group.accounts.length" class="basic-account-options">
                  <label
                    v-for="account in group.accounts"
                    :key="account.id"
                    class="basic-account-option"
                    :class="{ selected: form.selectedAccounts[group.key].includes(account.id) }"
                  >
                    <input
                      v-model="form.selectedAccounts[group.key]"
                      type="checkbox"
                      :value="account.id"
                      :disabled="!form.enabledPlatforms[group.key]"
                    />
                    <span>
                      {{ accountDisplayName(account, group.key) }}
                      <small>{{ accountDetailText(account, group.key) }}</small>
                    </span>
                  </label>
                </div>
                <p v-else class="empty-note">{{ group.emptyText }}</p>
              </div>
            </div>
          </div>
        </div>

        <p v-if="message" class="message quick-message" :class="{ error: messageType === 'error' }">
          {{ message }}
        </p>

        <div class="quick-sync-actions">
          <button type="submit" class="quick-run-button" :disabled="busy">
            <span class="icon icon-play" aria-hidden="true"></span>
            {{ busy && busyTarget ? 'Running...' : 'Run Sync' }}
          </button>
          <button type="button" class="ghost" @click="showSettings = true">
            <span class="icon icon-sliders" aria-hidden="true"></span>
            Advanced
          </button>
        </div>
      </form>
    </section>

    <section v-else class="advanced-grid">
      <form class="sync-panel advanced-panel" @submit.prevent="saveConfig">
        <div class="panel-title">
          <div>
            <h2>Advanced</h2>
            <small>Automation, platform filters, and account connections</small>
          </div>
          <button type="button" class="mini-btn" @click="showSettings = false">Basic</button>
        </div>

        <div class="advanced-sheet-grid">
          <label class="sheet-id-field">
            Google Sheet ID
            <input v-model.trim="form.sheetId" type="text" placeholder="1abcDEF..." autocomplete="off" />
          </label>
          <label>
            Content tab
            <input v-model.trim="form.sheetTab" type="text" placeholder="Sheet1" />
          </label>
          <label>
            Follower tab
            <input v-model.trim="form.followerSheetTab" type="text" placeholder="Follower Growth" />
          </label>
        </div>

        <div class="advanced-schedule-grid">
          <label>
            Timezone
            <input v-model.trim="form.timezone" type="text" placeholder="Asia/Rangoon" />
          </label>
          <label>
            Schedule time
            <input v-model="form.scheduleTime" type="time" />
          </label>
          <label class="switch-row schedule-toggle">
            <input v-model="form.scheduleEnabled" type="checkbox" />
            <span>Enable scheduled sync</span>
          </label>
        </div>

        <div class="tab-date-grid">
          <div class="date-group">
            <div class="date-group-title">
              <span>Content tab date duration</span>
              <strong>{{ contentWindowLabel }}</strong>
            </div>
            <div class="two-col">
              <label>
                Start date
                <input v-model="form.contentStartDate" type="date" />
              </label>
              <label>
                End date
                <input v-model="form.contentEndDate" type="date" />
              </label>
            </div>
          </div>

          <div class="date-group">
            <div class="date-group-title">
              <span>Follower tab date durations</span>
              <strong>{{ followerWindowLabel }}</strong>
            </div>
            <div class="follower-range-list">
              <div
                v-for="(range, index) in form.followerDateRanges"
                :key="range.id || index"
                class="follower-range-row"
              >
                <div class="follower-range-heading">
                  <span>Duration {{ index + 1 }}</span>
                  <button
                    v-if="form.followerDateRanges.length > 1"
                    type="button"
                    class="mini-btn danger"
                    @click="removeFollowerDateRange(index)"
                  >
                    Remove
                  </button>
                </div>
                <div class="two-col">
                  <label>
                    Start date
                    <input v-model="range.startDate" type="date" />
                  </label>
                  <label>
                    End date
                    <input v-model="range.endDate" type="date" />
                  </label>
                </div>
              </div>
            </div>
            <button type="button" class="mini-btn add-range-btn" @click="addFollowerDateRange">
              Add duration
            </button>
          </div>
        </div>

        <div class="platform-grid">
          <label class="switch-row">
            <input v-model="form.enabledPlatforms.facebook" type="checkbox" />
            <span>Facebook</span>
          </label>
          <label class="switch-row">
            <input v-model="form.enabledPlatforms.instagram" type="checkbox" />
            <span>Instagram</span>
          </label>
          <label class="switch-row">
            <input v-model="form.enabledPlatforms.youtube" type="checkbox" />
            <span>YouTube</span>
          </label>
          <label class="switch-row">
            <input v-model="form.enabledPlatforms.tiktok" type="checkbox" />
            <span>TikTok</span>
          </label>
        </div>

        <div class="actions">
          <button type="submit" :disabled="busy">Save Config</button>
          <button type="button" class="secondary" :disabled="busy" @click="testSheet">Test Sheet</button>
        </div>
      </form>

      <section class="sync-panel connections-panel">
        <div class="panel-title">
          <div>
            <h2>Connections</h2>
            <small>{{ accountPanelSummary }}</small>
          </div>
          <span>{{ secretStatusSummary }}</span>
        </div>
        <div class="actions oauth-actions inline-actions">
          <button class="secondary" :disabled="busy" @click="connectInstagram">Connect Instagram</button>
          <button class="secondary" :disabled="busy" @click="connectYouTube">Connect YouTube</button>
          <button class="secondary" :disabled="busy" @click="connectTikTok">Connect TikTok</button>
          <button class="ghost" :disabled="busy" @click="openSecretsModal">Backend Secrets</button>
        </div>
      </section>
    </section>

    <section v-if="showSettings" class="sync-panel accounts-panel">
      <div class="panel-title">
        <div>
          <h2>Available Accounts</h2>
          <small>{{ accountSummary }}</small>
        </div>
        <span>{{ connectedAccountCount }} connected</span>
      </div>

      <div class="accounts-grid">
        <div class="account-column">
          <div class="account-heading">
            <div>
              <strong>Facebook</strong>
              <small>{{ facebookPages.length }} page{{ facebookPages.length === 1 ? '' : 's' }}</small>
            </div>
            <button type="button" class="mini-btn" @click="toggleAllAccounts('facebook')">
              {{ allFacebookSelected ? 'Clear' : 'All' }}
            </button>
          </div>
          <label v-for="page in facebookPages" :key="page.id" class="account-option">
            <input v-model="form.selectedAccounts.facebook" type="checkbox" :value="page.id" />
            <span>
              {{ page.name || page.id }}
              <small>{{ page.id }}</small>
            </span>
          </label>
          <p v-if="!facebookPages.length" class="empty-note">No Facebook pages connected.</p>
        </div>

        <div class="account-column">
          <div class="account-heading">
            <div>
              <strong>Instagram</strong>
              <small>{{ instagramAccounts.length }} account{{ instagramAccounts.length === 1 ? '' : 's' }}</small>
            </div>
            <button type="button" class="mini-btn" @click="toggleAllAccounts('instagram')">
              {{ allInstagramSelected ? 'Clear' : 'All' }}
            </button>
          </div>
          <label v-for="account in instagramAccounts" :key="account.id" class="account-option">
            <input v-model="form.selectedAccounts.instagram" type="checkbox" :value="account.id" />
            <span>
              {{ account.displayName || account.username || account.accountId || account.id }}
              <small>{{ account.accountId || account.id }}</small>
            </span>
          </label>
          <p v-if="!instagramAccounts.length" class="empty-note">Connect an Instagram Business or Creator account.</p>
        </div>

        <div class="account-column">
          <div class="account-heading">
            <div>
              <strong>YouTube</strong>
              <small>{{ youtubeChannels.length }} channel{{ youtubeChannels.length === 1 ? '' : 's' }}</small>
            </div>
            <button type="button" class="mini-btn" @click="toggleAllAccounts('youtube')">
              {{ allYouTubeSelected ? 'Clear' : 'All' }}
            </button>
          </div>
          <label v-for="channel in youtubeChannels" :key="channel.id" class="account-option">
            <input v-model="form.selectedAccounts.youtube" type="checkbox" :value="channel.id" />
            <span>
              {{ channel.name || channel.id }}
              <small>{{ channel.id }}{{ channel.connectedAs ? ` - ${channel.connectedAs}` : '' }}</small>
            </span>
          </label>
          <p v-if="!youtubeChannels.length" class="empty-note">No YouTube channels connected.</p>
        </div>

        <div class="account-column">
          <div class="account-heading">
            <div>
              <strong>TikTok</strong>
              <small>{{ tiktokAccounts.length }} account{{ tiktokAccounts.length === 1 ? '' : 's' }}</small>
            </div>
            <button type="button" class="mini-btn" @click="toggleAllAccounts('tiktok')">
              {{ allTikTokSelected ? 'Clear' : 'All' }}
            </button>
          </div>
          <label v-for="account in tiktokAccounts" :key="account.id" class="account-option">
            <input v-model="form.selectedAccounts.tiktok" type="checkbox" :value="account.id" />
            <span>
              {{ account.displayName || account.accountId || account.id }}
              <small>{{ account.accountId || account.id }}</small>
            </span>
          </label>
          <p v-if="!tiktokAccounts.length" class="empty-note">No TikTok accounts connected.</p>
        </div>
      </div>

      <p class="hint">No selection means all connected accounts for that platform.</p>
    </section>

    <section v-if="showSettings" class="sync-panel controls-panel">
      <div class="panel-title">
        <h2>Run Controls</h2>
        <span>{{ runningLabel }}</span>
      </div>
      <div class="run-control-list">
        <div class="run-control-row">
          <div>
            <strong>{{ showSettings ? 'Both tabs' : 'Run sync' }}</strong>
            <small>Content: {{ contentWindowLabel }} | Followers: {{ followerWindowLabel }}</small>
          </div>
          <div class="actions">
            <button :disabled="busy || !form.sheetId" @click="previewSync('both')">{{ showSettings ? 'Preview Both' : 'Preview' }}</button>
            <button :disabled="busy || !form.sheetId" @click="runSync('both')">{{ showSettings ? 'Run Both' : 'Run Sync' }}</button>
          </div>
        </div>

        <div v-if="showSettings" class="run-control-row">
          <div>
            <strong>Content tab</strong>
            <small>{{ contentWindowLabel }}</small>
          </div>
          <div class="actions">
            <button class="secondary" :disabled="busy" @click="previewSync('content')">Preview Content</button>
            <button :disabled="busy" @click="runSync('content')">Run Content</button>
          </div>
        </div>

        <div v-if="showSettings" class="run-control-row">
          <div>
            <strong>Follower tab</strong>
            <small>{{ followerWindowLabel }}</small>
          </div>
          <div class="actions">
            <button class="secondary" :disabled="busy" @click="previewSync('followers')">Preview Followers</button>
            <button :disabled="busy" @click="runSync('followers')">Run Followers</button>
          </div>
        </div>
      </div>
      <p v-if="message" class="message" :class="{ error: messageType === 'error' }">{{ message }}</p>
    </section>

    <section v-if="showSettings && instagramDebugRows.length" class="sync-panel debug-panel">
      <div class="panel-title">
        <h2>Instagram Debug</h2>
        <span>{{ instagramDebugRows.length }} events</span>
      </div>
      <pre>{{ instagramDebugText }}</pre>
    </section>

    <section v-if="showSettings" class="sync-panel debug-panel">
      <div class="panel-title">
        <h2>YouTube Data API Raw Response</h2>
        <span>{{ youtubeAnalyticsDebugStatus }}</span>
      </div>
      <div class="debug-actions">
        <label class="debug-limit-field">
          Max videos
          <input v-model.number="youtubeAnalyticsDebugLimit" type="number" min="1" max="200" />
        </label>
        <button
          type="button"
          class="secondary"
          :disabled="youtubeAnalyticsDebugLoading || busy || !form.sheetId"
          @click="loadYouTubeAnalyticsDebug"
        >
          {{ youtubeAnalyticsDebugLoading ? 'Loading...' : 'Show Raw Data API Response' }}
        </button>
        <button
          v-if="youtubeRawResponseItems.length || youtubeAnalyticsDebugError"
          type="button"
          class="ghost"
          :disabled="youtubeAnalyticsDebugLoading"
          @click="clearYouTubeAnalyticsDebug"
        >
          Clear
        </button>
      </div>
      <p v-if="youtubeAnalyticsDebugError" class="message error">{{ youtubeAnalyticsDebugError }}</p>
      <div v-if="youtubeRawResponseItems.length" class="raw-response-list">
        <article v-for="(item, index) in youtubeRawResponseItems" :key="`${item.channelId || 'youtube'}-${index}`">
          <div class="raw-response-meta">
            <strong>Response {{ index + 1 }}</strong>
            <span>HTTP {{ item.status || 'unknown' }}</span>
            <span>{{ item.accountName || item.channelId || 'YouTube' }}</span>
          </div>
          <pre>{{ item.body }}</pre>
        </article>
      </div>
    </section>

    <section v-if="previewRows.length" class="sync-panel">
      <div class="panel-title">
        <h2>Preview Rows</h2>
        <span>{{ previewRows.length }} shown</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Date</th>
              <th>Content</th>
              <th>Platform</th>
              <th>Type</th>
              <th>Reach</th>
              <th>Impressions</th>
              <th>Interactions</th>
              <th>Video View</th>
              <th>CTR</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in previewRows" :key="item.key">
              <td>{{ item.action }}</td>
              <td>{{ item.row[0] }}</td>
              <td class="content-cell">{{ item.row[1] }}</td>
              <td>{{ item.row[2] }}</td>
              <td>{{ item.row[3] }}</td>
              <td>{{ item.row[5] }}</td>
              <td>{{ item.row[6] }}</td>
              <td>{{ item.row[7] }}</td>
              <td>{{ item.row[8] }}</td>
              <td>{{ formatPreviewCtr(item.row[9]) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="followerPreviewRows.length" class="sync-panel">
      <div class="panel-title">
        <h2>Follower Preview</h2>
        <span>{{ followerPreviewRows.length }} accounts</span>
      </div>
      <div class="table-wrap">
        <table class="follower-table">
          <thead>
            <tr>
              <th>Date Range</th>
              <th>Platform</th>
              <th>Account</th>
              <th>Account ID</th>
              <th>Start Followers</th>
              <th>End Followers</th>
              <th>Growth</th>
              <th>Current Followers</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in followerPreviewRows" :key="`${row[1]}-${row[3]}-${rowIndex}`">
              <td v-for="(value, index) in row" :key="index">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="showSettings" class="sync-panel">
      <div class="panel-title">
        <h2>Recent Runs</h2>
        <span>{{ runs.length }} loaded</span>
      </div>
      <div class="run-list">
        <article v-for="run in runs" :key="run.id" class="run-card">
          <div>
            <strong>{{ run.status || 'unknown' }}</strong>
            <small>{{ formatTimestamp(run.startedAt) }} - {{ run.source || 'manual' }} - {{ runTargetLabel(run.target) }}</small>
          </div>
          <div class="run-metrics">
            <span>{{ run.discovered || 0 }} found</span>
            <span>{{ run.rowsAppended || 0 }} appended</span>
            <span>{{ run.rowsUpdated || 0 }} updated</span>
            <span>{{ run.followerRowsUpdated || run.followerRowsAppended || 0 }} follower rows</span>
          </div>
          <p v-if="run.errors && run.errors.length" class="run-errors">
            {{ run.errors.map((err) => err.message).join(' | ') }}
          </p>
          <p v-if="run.warnings && run.warnings.length" class="run-warnings">
            {{ run.warnings.map((warning) => warning.message || warning).join(' | ') }}
          </p>
        </article>
      </div>
    </section>

    <div v-if="showIssuePopup" class="modal-backdrop issue-backdrop" @click.self="closeIssuePopup">
      <section class="issue-modal" role="dialog" aria-modal="true" aria-labelledby="sync-issues-title">
        <div class="modal-header issue-header">
          <div>
            <p class="eyebrow">Sync needs attention</p>
            <h2 id="sync-issues-title">{{ issuePopupTitle }}</h2>
          </div>
          <button type="button" class="ghost close-btn" @click="closeIssuePopup">Close</button>
        </div>

        <div class="modal-body">
          <div class="issue-summary">
            <span>{{ syncIssues.length }} issue{{ syncIssues.length === 1 ? '' : 's' }}</span>
            <span v-if="tokenIssueCount">{{ tokenIssueCount }} token/auth</span>
            <span v-if="secretIssueCount">{{ secretIssueCount }} setup</span>
          </div>

          <div class="issue-list">
            <article
              v-for="issue in syncIssues"
              :key="issue.id"
              class="issue-card"
              :class="{
                token: issue.isTokenIssue,
                warning: issue.kind === 'warning'
              }"
            >
              <div class="issue-card-head">
                <span class="issue-badge">{{ platformIssueLabel(issue.platform) }}</span>
                <span v-if="issue.isTokenIssue" class="issue-token-badge">Token/auth</span>
                <span v-if="issue.isSecretIssue" class="issue-secret-badge">Setup</span>
              </div>
              <strong>{{ issueTitle(issue) }}</strong>
              <p>{{ issue.message }}</p>
              <small v-if="issue.accountId">Account ID: {{ issue.accountId }}</small>
              <div v-if="canActOnIssue(issue)" class="actions issue-actions">
                <button
                  v-if="canReconnectIssue(issue)"
                  type="button"
                  class="ghost"
                  @click="reconnectIssue(issue)"
                >
                  {{ reconnectLabel(issue.platform) }}
                </button>
                <button
                  v-if="issue.isSecretIssue"
                  type="button"
                  class="ghost"
                  @click="openSecretsFromIssue"
                >
                  Backend Secrets
                </button>
              </div>
            </article>
          </div>

          <div class="actions modal-actions">
            <button type="button" class="ghost" @click="closeIssuePopup">Dismiss</button>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showSecretsModal" class="modal-backdrop" @click.self="closeSecretsModal">
      <section class="secret-modal" role="dialog" aria-modal="true" aria-labelledby="backend-secrets-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Settings</p>
            <h2 id="backend-secrets-title">Backend Secrets</h2>
          </div>
          <button type="button" class="ghost close-btn" @click="closeSecretsModal">Close</button>
        </div>

        <div class="modal-body">
          <div class="actions reveal-actions top">
            <button
              v-if="!showExistingSecrets"
              type="button"
              class="ghost"
              @click="showExistingSecrets = true"
            >
              Show Existing Secrets
            </button>
            <button
              v-else
              type="button"
              class="ghost"
              @click="hideExistingSecrets"
            >
              Hide Existing Secrets
            </button>
          </div>

          <section v-if="showExistingSecrets" class="existing-secrets">
            <div class="panel-title">
              <h2>Existing Secrets</h2>
              <span>{{ secretStatusSummary }}</span>
            </div>
            <div class="secret-status-list">
              <article
                v-for="item in secretStatusItems"
                :key="`modal-${item.name}`"
                class="secret-status-item"
                :class="{ configured: item.configured }"
              >
                <span class="status-dot"></span>
                <div>
                  <strong>{{ item.label }}</strong>
                  <small>{{ secretStatusText(item) }}</small>
                </div>
              </article>
            </div>
            <p v-if="secretStatusUpdatedAt" class="hint">
              Last saved secret update: {{ formatTimestamp(secretStatusUpdatedAt) }}
            </p>
            <div class="actions reveal-actions">
              <button
                v-if="!secretsRevealed"
                type="button"
                class="secondary"
                :disabled="secretRevealLoading"
                @click="revealBackendSecrets"
              >
                {{ secretRevealLoading ? 'Revealing...' : 'Reveal Secrets' }}
              </button>
              <button
                v-else
                type="button"
                class="ghost"
                @click="hideRevealedSecrets"
              >
                Hide Secrets
              </button>
            </div>
          </section>

          <form class="secrets-form" @submit.prevent="saveBackendSecrets">
            <label>
              Service account JSON
              <textarea
                v-model="secrets.googleServiceAccountJson"
                rows="6"
                placeholder="Paste the full downloaded Google service account JSON here"
              ></textarea>
            </label>

            <div class="two-col">
              <label>
                YouTube API key
                <input v-model.trim="secrets.youtubeApiKey" :type="secretsRevealed ? 'text' : 'password'" autocomplete="new-password" />
              </label>
              <label>
                Google OAuth client ID
                <input v-model.trim="secrets.googleOAuthClientId" :type="secretsRevealed ? 'text' : 'password'" autocomplete="new-password" />
              </label>
            </div>

            <div class="two-col">
              <label>
                Google OAuth client secret
                <input v-model.trim="secrets.googleOAuthClientSecret" :type="secretsRevealed ? 'text' : 'password'" autocomplete="new-password" />
              </label>
              <label>
                YouTube redirect URI
                <input v-model.trim="secrets.youtubeRedirectUri" type="text" :placeholder="YOUTUBE_REDIRECT_URI" />
              </label>
            </div>

            <div class="two-col">
              <label>
                Instagram client ID
                <input v-model.trim="secrets.instagramClientId" :type="secretsRevealed ? 'text' : 'password'" autocomplete="new-password" />
              </label>
              <label>
                Instagram client secret
                <input v-model.trim="secrets.instagramClientSecret" :type="secretsRevealed ? 'text' : 'password'" autocomplete="new-password" />
              </label>
            </div>

            <label>
              Instagram redirect URI
              <input v-model.trim="secrets.instagramRedirectUri" type="text" :placeholder="INSTAGRAM_REDIRECT_URI" />
            </label>

            <div class="two-col">
              <label>
                TikTok client key
                <input v-model.trim="secrets.tiktokClientKey" :type="secretsRevealed ? 'text' : 'password'" autocomplete="new-password" />
              </label>
              <label>
                TikTok client secret
                <input v-model.trim="secrets.tiktokClientSecret" :type="secretsRevealed ? 'text' : 'password'" autocomplete="new-password" />
              </label>
            </div>

            <label>
              TikTok redirect URI
              <input v-model.trim="secrets.tiktokRedirectUri" type="text" :placeholder="TIKTOK_REDIRECT_URI" />
            </label>

            <p class="hint">
              Create a Google Cloud service account, download its JSON key, share the target Sheet with its client_email, then paste the full JSON here.
            </p>
            <p v-if="secretsMessage" class="message" :class="{ error: secretsMessageType === 'error' }">
              {{ secretsMessage }}
            </p>

            <div class="actions modal-actions">
              <button type="submit" :disabled="secretsBusy">
                {{ secretsBusy ? 'Saving...' : 'Save Backend Secrets' }}
              </button>
              <button type="button" class="secondary" :disabled="secretsBusy" @click="closeSecretsModal">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/js/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore'

const CONFIG_ID = 'default'
const router = useRouter()
const CLOUD_FUNCTION_BASE_URL = 'https://us-central1-gcc-live-count.cloudfunctions.net'
const TIKTOK_REDIRECT_URI = `${CLOUD_FUNCTION_BASE_URL}/oauthCallbackTikTok`
const YOUTUBE_REDIRECT_URI = `${CLOUD_FUNCTION_BASE_URL}/oauthCallbackYouTube`
const INSTAGRAM_REDIRECT_URI = `${CLOUD_FUNCTION_BASE_URL}/oauthCallbackInstagram`
const FUNCTION_ENDPOINTS = {
  saveConfig: `${CLOUD_FUNCTION_BASE_URL}/saveSyncConfig`,
  secretStatus: `${CLOUD_FUNCTION_BASE_URL}/getSyncSecretStatus`,
  testSheet: `${CLOUD_FUNCTION_BASE_URL}/testSheetConnection`,
  runSync: `${CLOUD_FUNCTION_BASE_URL}/runSheetSync`,
  youtubeDataDebug: `${CLOUD_FUNCTION_BASE_URL}/debugYouTubeDataApi`,
  startInstagram: `${CLOUD_FUNCTION_BASE_URL}/startInstagramOAuth`,
  startYouTube: `${CLOUD_FUNCTION_BASE_URL}/startYouTubeOAuth`,
  startTikTok: `${CLOUD_FUNCTION_BASE_URL}/startTikTokOAuth`
}
const SECRET_FIELDS = [
  { name: 'googleServiceAccountJson', label: 'Service account JSON' },
  { name: 'youtubeApiKey', label: 'YouTube API key' },
  { name: 'googleOAuthClientId', label: 'Google OAuth client ID' },
  { name: 'googleOAuthClientSecret', label: 'Google OAuth client secret' },
  { name: 'youtubeRedirectUri', label: 'YouTube redirect URI' },
  { name: 'instagramClientId', label: 'Instagram client ID' },
  { name: 'instagramClientSecret', label: 'Instagram client secret' },
  { name: 'instagramRedirectUri', label: 'Instagram redirect URI' },
  { name: 'tiktokClientKey', label: 'TikTok client key' },
  { name: 'tiktokClientSecret', label: 'TikTok client secret' },
  { name: 'tiktokRedirectUri', label: 'TikTok redirect URI' }
]

const busy = ref(false)
const busyTarget = ref('')
const message = ref('')
const messageType = ref('info')
const showSettings = ref(false)
const showSecretsModal = ref(false)
const showExistingSecrets = ref(false)
const secretsBusy = ref(false)
const secretsRevealed = ref(false)
const secretRevealLoading = ref(false)
const secretsMessage = ref('')
const secretsMessageType = ref('info')
const secretStatusFields = ref([])
const secretStatusLoading = ref(false)
const secretStatusError = ref('')
const secretStatusUpdatedAt = ref(null)
const previewRows = ref([])
const followerPreviewRows = ref([])
const instagramDebugRows = ref([])
const showIssuePopup = ref(false)
const syncIssues = ref([])
const youtubeAnalyticsDebug = ref(null)
const youtubeAnalyticsDebugError = ref('')
const youtubeAnalyticsDebugLimit = ref(50)
const youtubeAnalyticsDebugLoading = ref(false)
const runs = ref([])
const facebookPages = ref([])
const instagramAccounts = ref([])
const youtubeChannels = ref([])
const tiktokAccounts = ref([])

function dateInputValue(date) {
  return date.toISOString().slice(0, 10)
}

function defaultStartDate() {
  return dateInputValue(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
}

function defaultEndDate() {
  return dateInputValue(new Date())
}

let followerRangeId = 0

function makeFollowerDateRange(startDate = defaultStartDate(), endDate = defaultEndDate()) {
  followerRangeId += 1
  return {
    id: `follower-range-${followerRangeId}`,
    startDate,
    endDate
  }
}

const form = reactive({
  sheetId: '',
  sheetTab: 'Sheet1',
  followerSheetTab: 'Follower Growth',
  headerRow: 1,
  timezone: 'Asia/Rangoon',
  scheduleTime: '09:00',
  scheduleEnabled: false,
  startDate: defaultStartDate(),
  endDate: defaultEndDate(),
  contentStartDate: defaultStartDate(),
  contentEndDate: defaultEndDate(),
  followerStartDate: defaultStartDate(),
  followerEndDate: defaultEndDate(),
  followerDateRanges: [makeFollowerDateRange()],
  enabledPlatforms: {
    facebook: true,
    instagram: true,
    youtube: true,
    tiktok: true
  },
  selectedAccounts: {
    facebook: [],
    instagram: [],
    youtube: [],
    tiktok: []
  }
})

const secrets = reactive({
  googleServiceAccountJson: '',
  youtubeApiKey: '',
  googleOAuthClientId: '',
  googleOAuthClientSecret: '',
  youtubeRedirectUri: YOUTUBE_REDIRECT_URI,
  instagramClientId: '',
  instagramClientSecret: '',
  instagramRedirectUri: INSTAGRAM_REDIRECT_URI,
  tiktokClientKey: '',
  tiktokClientSecret: '',
  tiktokRedirectUri: TIKTOK_REDIRECT_URI
})

const latestRun = computed(() => runs.value[0] || null)
const latestRunLabel = computed(() => latestRun.value?.status || 'No runs yet')
const latestRunDetails = computed(() => {
  if (!latestRun.value) return 'No sync runs recorded.'
  return `${latestRun.value.rowsAppended || 0} appended, ${latestRun.value.rowsUpdated || 0} updated`
})
const runningLabel = computed(() => busy.value ? `Working ${busyTarget.value || ''}`.trim() : 'Ready')
const allFacebookSelected = computed(() => allSelected('facebook'))
const allInstagramSelected = computed(() => allSelected('instagram'))
const allYouTubeSelected = computed(() => allSelected('youtube'))
const allTikTokSelected = computed(() => allSelected('tiktok'))
const instagramDebugText = computed(() => JSON.stringify(instagramDebugRows.value, null, 2))
const youtubeRawResponseItems = computed(() => (
  Array.isArray(youtubeAnalyticsDebug.value?.rawResponses)
    ? youtubeAnalyticsDebug.value.rawResponses
    : []
))
const youtubeAnalyticsDebugStatus = computed(() => {
  if (youtubeAnalyticsDebugLoading.value) return 'Loading'
  const responses = youtubeRawResponseItems.value.length
  if (youtubeAnalyticsDebug.value) return `${responses} raw response${responses === 1 ? '' : 's'}`
  if (youtubeAnalyticsDebugError.value) return 'Error'
  return 'Not loaded'
})
const secretStatusItems = computed(() => {
  const statusByName = Object.fromEntries(
    secretStatusFields.value.map((item) => [item.name, item])
  )
  return SECRET_FIELDS.map((field) => {
    const status = statusByName[field.name] || {}
    return {
      ...field,
      configured: Boolean(status.configured),
      source: status.source || '',
      info: status.info || ''
    }
  })
})
const configuredSecretCount = computed(() => (
  secretStatusItems.value.filter((item) => item.configured).length
))
const secretStatusSummary = computed(() => {
  if (secretStatusLoading.value) return 'Checking secrets'
  if (secretStatusError.value) return 'Status unavailable'
  return `${configuredSecretCount.value}/${SECRET_FIELDS.length} configured`
})
const accountSummary = computed(() => {
  const total = form.selectedAccounts.facebook.length
    + form.selectedAccounts.instagram.length
    + form.selectedAccounts.youtube.length
    + form.selectedAccounts.tiktok.length
  return total ? `${total} selected` : 'All connected accounts'
})
const connectedAccountCount = computed(() => (
  facebookPages.value.length
  + instagramAccounts.value.length
  + youtubeChannels.value.length
  + tiktokAccounts.value.length
))
const accountPanelSummary = computed(() => (
  `${connectedAccountCount.value} connected, ${accountSummary.value.toLowerCase()}`
))
const contentWindowLabel = computed(() => dateWindowLabel(form.contentStartDate, form.contentEndDate))
const followerWindowLabel = computed(() => {
  const count = normalizedFollowerDateRanges().length
  if (count === 1) {
    const range = normalizedFollowerDateRanges()[0]
    return dateWindowLabel(range.startDate, range.endDate)
  }
  return `${count} durations`
})
const basicAccountGroups = computed(() => [
  {
    key: 'facebook',
    label: 'Facebook',
    shortLabel: 'F',
    iconClass: 'facebook',
    countLabel: `${facebookPages.value.length} page${facebookPages.value.length === 1 ? '' : 's'}`,
    accounts: facebookPages.value,
    emptyText: 'No Facebook pages connected.'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    shortLabel: 'I',
    iconClass: 'instagram',
    countLabel: `${instagramAccounts.value.length} account${instagramAccounts.value.length === 1 ? '' : 's'}`,
    accounts: instagramAccounts.value,
    emptyText: 'No Instagram accounts connected.'
  },
  {
    key: 'youtube',
    label: 'YouTube',
    shortLabel: 'YT',
    iconClass: 'youtube',
    countLabel: `${youtubeChannels.value.length} channel${youtubeChannels.value.length === 1 ? '' : 's'}`,
    accounts: youtubeChannels.value,
    emptyText: 'No YouTube channels connected.'
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    shortLabel: 'T',
    iconClass: 'tiktok',
    countLabel: `${tiktokAccounts.value.length} account${tiktokAccounts.value.length === 1 ? '' : 's'}`,
    accounts: tiktokAccounts.value,
    emptyText: 'No TikTok accounts connected.'
  }
])
const tokenIssueCount = computed(() => syncIssues.value.filter((issue) => issue.isTokenIssue).length)
const secretIssueCount = computed(() => syncIssues.value.filter((issue) => issue.isSecretIssue).length)
const issuePopupTitle = computed(() => {
  if (tokenIssueCount.value) return 'Reconnect Accounts'
  if (secretIssueCount.value) return 'Backend Setup Required'
  return 'Sync Issues'
})

async function authHeaders() {
  const user = auth.currentUser
  if (!user) throw new Error('Please log in first.')
  const token = await user.getIdToken()
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

function setMessage(text, type = 'info') {
  message.value = text
  messageType.value = type
}

function setSecretsMessage(text, type = 'info') {
  secretsMessage.value = text
  secretsMessageType.value = type
}

function secretStatusText(item) {
  if (!item.configured) return 'Not configured'
  const source = item.source ? `${item.source}: ` : ''
  return item.info ? `${source}${item.info}` : `${source}Configured`
}

function existingSecretInfo(name) {
  const item = secretStatusFields.value.find((field) => field.name === name)
  return item?.configured ? item.info || '' : ''
}

function resetSecretFields() {
  secretsRevealed.value = false
  Object.assign(secrets, {
    googleServiceAccountJson: '',
    youtubeApiKey: '',
    googleOAuthClientId: '',
    googleOAuthClientSecret: '',
    youtubeRedirectUri: existingSecretInfo('youtubeRedirectUri') || YOUTUBE_REDIRECT_URI,
    instagramClientId: '',
    instagramClientSecret: '',
    instagramRedirectUri: existingSecretInfo('instagramRedirectUri') || INSTAGRAM_REDIRECT_URI,
    tiktokClientKey: '',
    tiktokClientSecret: '',
    tiktokRedirectUri: existingSecretInfo('tiktokRedirectUri') || TIKTOK_REDIRECT_URI
  })
}

function valueFromSecretFields(fields, name) {
  const item = fields.find((field) => field.name === name)
  return item?.value || ''
}

function applyRevealedSecrets(fields = []) {
  Object.assign(secrets, {
    googleServiceAccountJson: valueFromSecretFields(fields, 'googleServiceAccountJson'),
    youtubeApiKey: valueFromSecretFields(fields, 'youtubeApiKey'),
    googleOAuthClientId: valueFromSecretFields(fields, 'googleOAuthClientId'),
    googleOAuthClientSecret: valueFromSecretFields(fields, 'googleOAuthClientSecret'),
    youtubeRedirectUri: valueFromSecretFields(fields, 'youtubeRedirectUri') || existingSecretInfo('youtubeRedirectUri') || YOUTUBE_REDIRECT_URI,
    instagramClientId: valueFromSecretFields(fields, 'instagramClientId'),
    instagramClientSecret: valueFromSecretFields(fields, 'instagramClientSecret'),
    instagramRedirectUri: valueFromSecretFields(fields, 'instagramRedirectUri') || existingSecretInfo('instagramRedirectUri') || INSTAGRAM_REDIRECT_URI,
    tiktokClientKey: valueFromSecretFields(fields, 'tiktokClientKey'),
    tiktokClientSecret: valueFromSecretFields(fields, 'tiktokClientSecret'),
    tiktokRedirectUri: valueFromSecretFields(fields, 'tiktokRedirectUri') || existingSecretInfo('tiktokRedirectUri') || TIKTOK_REDIRECT_URI
  })
}

async function openSecretsModal() {
  showSecretsModal.value = true
  setSecretsMessage('')
  if (!secretStatusFields.value.length) {
    await loadSecretStatus()
  }
  resetSecretFields()
}

function closeSecretsModal() {
  showSecretsModal.value = false
  showExistingSecrets.value = false
  setSecretsMessage('')
  resetSecretFields()
}

function hideExistingSecrets() {
  showExistingSecrets.value = false
  hideRevealedSecrets()
}

async function revealBackendSecrets() {
  secretRevealLoading.value = true
  setSecretsMessage('')
  try {
    const fields = await loadSecretStatus({ reveal: true })
    applyRevealedSecrets(fields)
    secretsRevealed.value = true
    setSecretsMessage('Secrets revealed in the form. Hide or close this popup when finished.')
  } catch (error) {
    setSecretsMessage(error.message, 'error')
  } finally {
    secretRevealLoading.value = false
  }
}

function hideRevealedSecrets() {
  resetSecretFields()
  setSecretsMessage('Secrets hidden.')
}

function dateWindowLabel(startDate, endDate) {
  if (!startDate || !endDate) return 'Choose start and end date'
  return `${startDate} to ${endDate}`
}

function followerDateRangePayload() {
  const ranges = (Array.isArray(form.followerDateRanges) ? form.followerDateRanges : [])
    .map((range) => ({
      startDate: range.startDate || '',
      endDate: range.endDate || ''
    }))
  return ranges.length ? ranges : [{
    startDate: form.followerStartDate || defaultStartDate(),
    endDate: form.followerEndDate || defaultEndDate()
  }]
}

function normalizedFollowerDateRanges() {
  const ranges = followerDateRangePayload()
    .filter((range) => range.startDate && range.endDate)
  return ranges.length ? ranges : [{
    startDate: form.followerStartDate || defaultStartDate(),
    endDate: form.followerEndDate || defaultEndDate()
  }]
}

function syncLegacyFollowerDates() {
  const firstRange = normalizedFollowerDateRanges()[0]
  form.followerStartDate = firstRange.startDate
  form.followerEndDate = firstRange.endDate
}

function addFollowerDateRange() {
  const ranges = normalizedFollowerDateRanges()
  const lastRange = ranges[ranges.length - 1] || {}
  form.followerDateRanges.push(makeFollowerDateRange(
    lastRange.startDate || defaultStartDate(),
    lastRange.endDate || defaultEndDate()
  ))
  syncLegacyFollowerDates()
}

function removeFollowerDateRange(index) {
  if (form.followerDateRanges.length <= 1) return
  form.followerDateRanges.splice(index, 1)
  syncLegacyFollowerDates()
}

function normalizeTarget(target = 'both') {
  if (target === 'content') return 'content'
  if (target === 'followers' || target === 'follower') return 'followers'
  return 'both'
}

function targetIncludesContent(target) {
  const normalized = normalizeTarget(target)
  return normalized === 'both' || normalized === 'content'
}

function targetIncludesFollowers(target) {
  const normalized = normalizeTarget(target)
  return normalized === 'both' || normalized === 'followers'
}

function runTargetLabel(target = 'both') {
  const normalized = normalizeTarget(target)
  if (normalized === 'content') return 'content tab'
  if (normalized === 'followers') return 'follower tab'
  return 'both tabs'
}

function syncErrorText(errors = []) {
  if (!Array.isArray(errors) || !errors.length) return ''
  return errors
    .slice(0, 3)
    .map((error) => `${error.platform || 'sync'}: ${error.message || error}`)
    .join(' | ')
}

function syncWarningText(warnings = []) {
  if (!Array.isArray(warnings) || !warnings.length) return ''
  return warnings
    .slice(0, 3)
    .map((warning) => `${warning.platform || 'sync'}: ${warning.message || warning}`)
    .join(' | ')
}

function syncNoticeSuffix(result = {}) {
  const errors = syncErrorText(result.errors)
  const warnings = syncWarningText(result.warnings)
  return [
    errors ? `Errors: ${errors}` : '',
    warnings ? `Warnings: ${warnings}` : ''
  ].filter(Boolean).join(' ')
}

let syncIssueId = 0

function normalizeIssuePlatform(platform, message = '') {
  const value = String(platform || '').toLowerCase()
  const text = `${value} ${String(message || '').toLowerCase()}`
  if (text.includes('facebook')) return 'facebook'
  if (text.includes('instagram')) return 'instagram'
  if (text.includes('youtube') || text.includes('google oauth')) return 'youtube'
  if (text.includes('tiktok') || text.includes('tik tok')) return 'tiktok'
  if (text.includes('sheet') || text.includes('service account') || text.includes('google sheets')) return 'sheets'
  return value || 'sync'
}

function platformIssueLabel(platform) {
  return {
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    sheets: 'Google Sheets',
    system: 'System',
    sync: 'Sync'
  }[platform] || String(platform || 'Sync')
}

function isTokenIssueMessage(message = '') {
  const text = String(message || '').toLowerCase()
  return [
    'access token',
    'authorization',
    'expired',
    'invalid_grant',
    'invalid oauth',
    'invalid token',
    'missing instagram oauth token',
    'missing tiktok token',
    'missing youtube oauth token',
    'oauth',
    'permission',
    'reconnect',
    'refresh token',
    'revoked',
    'session',
    'unauthorized'
  ].some((pattern) => text.includes(pattern))
}

function isSecretIssueMessage(message = '') {
  const text = String(message || '').toLowerCase()
  return [
    'api key',
    'client id',
    'client key',
    'client secret',
    'credentials',
    'not configured',
    'service account'
  ].some((pattern) => text.includes(pattern))
}

function createSyncIssue(rawIssue = {}, kind = 'error') {
  const message = rawIssue?.message || rawIssue?.error || String(rawIssue || 'Unknown sync issue')
  const platform = normalizeIssuePlatform(rawIssue?.platform, message)
  const isTokenIssue = isTokenIssueMessage(message)
  return {
    id: `sync-issue-${++syncIssueId}`,
    kind,
    platform,
    accountId: rawIssue?.accountId || rawIssue?.account_id || '',
    message,
    isTokenIssue,
    isSecretIssue: isSecretIssueMessage(message)
  }
}

function issueDedupeKey(issue) {
  if (issue.isTokenIssue) {
    return [
      'token',
      issue.platform
    ].join(':')
  }
  if (issue.isSecretIssue) {
    return ['setup', issue.platform, issue.message.toLowerCase().replace(/\s+/g, ' ').slice(0, 80)].join(':')
  }
  return ['sync', issue.platform, issue.accountId, issue.message.toLowerCase().replace(/\s+/g, ' ').slice(0, 120)].join(':')
}

function dedupeIssues(issues = []) {
  const byKey = new Map()
  for (const issue of issues) {
    const key = issueDedupeKey(issue)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, issue)
      continue
    }
    const existingScore = existing.message.length + (existing.accountId ? 20 : 0)
    const issueScore = issue.message.length + (issue.accountId ? 20 : 0)
    if (issueScore > existingScore) {
      byKey.set(key, {
        ...issue,
        id: existing.id
      })
    }
  }
  return Array.from(byKey.values())
}

function issuesFromResult(result = {}) {
  const errors = Array.isArray(result.errors) ? result.errors : []
  const warnings = Array.isArray(result.warnings) ? result.warnings : []
  return dedupeIssues([
    ...errors.map((item) => createSyncIssue(item, 'error')),
    ...warnings
      .filter((item) => {
        const message = item?.message || item
        return isTokenIssueMessage(message) || isSecretIssueMessage(message)
      })
      .map((item) => createSyncIssue(item, 'warning'))
  ])
}

function showIssues(issues = []) {
  syncIssues.value = issues
  showIssuePopup.value = issues.length > 0
}

function maybeOpenIssuePopup(result = {}) {
  const issues = issuesFromResult(result)
  if (issues.length) showIssues(issues)
}

function openIssuePopupFromError(error, platform = 'sync') {
  showIssues([createSyncIssue({
    platform,
    message: error?.message || String(error || 'Request failed')
  })])
}

function closeIssuePopup() {
  showIssuePopup.value = false
}

function issueTitle(issue) {
  if (issue.isSecretIssue) return `${platformIssueLabel(issue.platform)} setup issue`
  if (issue.isTokenIssue) return `${platformIssueLabel(issue.platform)} connection issue`
  return `${platformIssueLabel(issue.platform)} sync issue`
}

function canReconnectIssue(issue) {
  return issue.isTokenIssue
    && !issue.isSecretIssue
    && ['facebook', 'instagram', 'youtube', 'tiktok'].includes(issue.platform)
}

function canActOnIssue(issue) {
  return canReconnectIssue(issue) || issue.isSecretIssue
}

function reconnectLabel(platform) {
  if (platform === 'facebook') return 'Reconnect Facebook'
  if (platform === 'instagram') return 'Reconnect Instagram'
  if (platform === 'youtube') return 'Reconnect YouTube'
  if (platform === 'tiktok') return 'Reconnect TikTok'
  return 'Reconnect'
}

async function reconnectIssue(issue) {
  if (issue.platform === 'facebook') {
    closeIssuePopup()
    router.push('/register_gcn_sub_stream')
    return
  }
  if (issue.platform === 'instagram') await connectInstagram()
  if (issue.platform === 'youtube') await connectYouTube()
  if (issue.platform === 'tiktok') await connectTikTok()
}

async function openSecretsFromIssue() {
  closeIssuePopup()
  await openSecretsModal()
}

function cleanSecretsPayload() {
  return Object.fromEntries(
    Object.entries(secrets).filter(([, value]) => String(value || '').trim())
  )
}

function configPayload() {
  const followerDateRanges = followerDateRangePayload()
  const firstFollowerRange = followerDateRanges[0]
  return {
    ...form,
    headerRow: 1,
    startDate: form.contentStartDate,
    endDate: form.contentEndDate,
    followerStartDate: firstFollowerRange.startDate,
    followerEndDate: firstFollowerRange.endDate,
    followerDateRanges
  }
}

async function postJson(url, body = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`)
  }
  return data
}

function normalizedYouTubeDebugLimit() {
  const value = Number(youtubeAnalyticsDebugLimit.value || 50)
  if (!Number.isFinite(value)) return 50
  return Math.max(1, Math.min(200, Math.floor(value)))
}

function clearYouTubeAnalyticsDebug() {
  youtubeAnalyticsDebug.value = null
  youtubeAnalyticsDebugError.value = ''
}

async function loadYouTubeAnalyticsDebug() {
  youtubeAnalyticsDebugLoading.value = true
  youtubeAnalyticsDebugError.value = ''
  youtubeAnalyticsDebug.value = null
  youtubeAnalyticsDebugLimit.value = normalizedYouTubeDebugLimit()
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.youtubeDataDebug, {
      configId: CONFIG_ID,
      config: configPayload(),
      maxVideos: youtubeAnalyticsDebugLimit.value
    })
    youtubeAnalyticsDebug.value = result
    const errors = syncErrorText(result.errors)
    const responses = Array.isArray(result.rawResponses) ? result.rawResponses.length : 0
    setMessage(
      `Raw YouTube Data API response loaded: ${responses} response(s), ${youtubeAnalyticsDebugLimit.value} max video(s).${errors ? ` Errors: ${errors}` : ''}`,
      errors ? 'error' : 'info'
    )
  } catch (error) {
    youtubeAnalyticsDebugError.value = error.message
    setMessage(error.message, 'error')
  } finally {
    youtubeAnalyticsDebugLoading.value = false
  }
}

async function loadSecretStatus({ reveal = false } = {}) {
  secretStatusLoading.value = true
  secretStatusError.value = ''
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.secretStatus, { configId: CONFIG_ID, reveal })
    const fields = Array.isArray(result.fields) ? result.fields : []
    secretStatusFields.value = fields.map(({ value, ...field }) => field)
    secretStatusUpdatedAt.value = result.updatedAt || null
    if (!reveal && !secretsRevealed.value) {
      resetSecretFields()
    }
    return fields
  } catch (error) {
    secretStatusError.value = error.message
    if (reveal) throw error
    return []
  } finally {
    secretStatusLoading.value = false
  }
}

async function loadConfig() {
  const snap = await getDoc(doc(db, 'sync_configs', CONFIG_ID))
  if (!snap.exists()) return
  const data = snap.data()
  const contentStartDate = data.contentStartDate || data.startDate || fallbackStartDate(data.lookbackDays)
  const contentEndDate = data.contentEndDate || data.endDate || defaultEndDate()
  const followerStartDate = data.followerStartDate || data.startDate || contentStartDate
  const followerEndDate = data.followerEndDate || data.endDate || contentEndDate
  const savedFollowerRanges = Array.isArray(data.followerDateRanges)
    ? data.followerDateRanges
      .map((range) => ({
        startDate: range?.startDate || '',
        endDate: range?.endDate || ''
      }))
      .filter((range) => range.startDate && range.endDate)
    : []
  const followerDateRanges = (savedFollowerRanges.length
    ? savedFollowerRanges
    : [{ startDate: followerStartDate, endDate: followerEndDate }]
  ).map((range) => makeFollowerDateRange(range.startDate, range.endDate))
  const firstFollowerRange = followerDateRanges[0] || makeFollowerDateRange(followerStartDate, followerEndDate)
  Object.assign(form, {
    sheetId: data.sheetId || '',
    sheetTab: data.sheetTab || 'Sheet1',
    followerSheetTab: data.followerSheetTab || 'Follower Growth',
    headerRow: Number(data.headerRow || 1),
    timezone: data.timezone || 'Asia/Rangoon',
    scheduleTime: data.scheduleTime || '09:00',
    scheduleEnabled: Boolean(data.scheduleEnabled),
    startDate: contentStartDate,
    endDate: contentEndDate,
    contentStartDate,
    contentEndDate,
    followerStartDate: firstFollowerRange.startDate,
    followerEndDate: firstFollowerRange.endDate,
    followerDateRanges,
    enabledPlatforms: {
      facebook: data.enabledPlatforms?.facebook !== false,
      instagram: data.enabledPlatforms?.instagram !== false,
      youtube: data.enabledPlatforms?.youtube !== false,
      tiktok: data.enabledPlatforms?.tiktok !== false
    },
    selectedAccounts: {
      facebook: Array.isArray(data.selectedAccounts?.facebook) ? data.selectedAccounts.facebook : [],
      instagram: Array.isArray(data.selectedAccounts?.instagram) ? data.selectedAccounts.instagram : [],
      youtube: Array.isArray(data.selectedAccounts?.youtube) ? data.selectedAccounts.youtube : [],
      tiktok: Array.isArray(data.selectedAccounts?.tiktok) ? data.selectedAccounts.tiktok : []
    }
  })
}

function fallbackStartDate(lookbackDays = 14) {
  const days = Math.max(1, Math.min(90, Number(lookbackDays || 14)))
  return dateInputValue(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
}

async function loadAccounts() {
  const [pagesSnap, instagramSnap, channelsSnap, tiktokSnap] = await Promise.all([
    getDocs(collection(db, 'pages')),
    getDocs(query(collection(db, 'social_accounts'), where('platform', '==', 'instagram'))),
    getDocs(collection(db, 'youtube_channels')),
    getDocs(query(collection(db, 'social_accounts'), where('platform', '==', 'tiktok')))
  ])

  facebookPages.value = pagesSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))

  instagramAccounts.value = instagramSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => item.tokenSource === 'instagram' || item.authSource === 'instagram')
    .sort((a, b) => String(a.displayName || a.username || a.accountId || a.id).localeCompare(String(b.displayName || b.username || b.accountId || b.id)))

  youtubeChannels.value = channelsSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))

  tiktokAccounts.value = tiktokSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => String(a.displayName || a.accountId || a.id).localeCompare(String(b.displayName || b.accountId || b.id)))
}

function accountIds(platform) {
  if (platform === 'facebook') return facebookPages.value.map((item) => item.id)
  if (platform === 'instagram') return instagramAccounts.value.map((item) => item.id)
  if (platform === 'youtube') return youtubeChannels.value.map((item) => item.id)
  return tiktokAccounts.value.map((item) => item.id)
}

function accountDisplayName(account, platform) {
  if (platform === 'instagram') return account.displayName || account.username || account.accountId || account.id
  if (platform === 'tiktok') return account.displayName || account.accountId || account.id
  return account.name || account.id
}

function accountDetailText(account, platform) {
  if (platform === 'youtube') {
    return `${account.id}${account.connectedAs ? ` - ${account.connectedAs}` : ''}`
  }
  return account.accountId || account.id
}

function allSelected(platform) {
  const ids = accountIds(platform)
  const selected = form.selectedAccounts[platform] || []
  return ids.length > 0 && ids.every((id) => selected.includes(id))
}

function toggleAllAccounts(platform) {
  const ids = accountIds(platform)
  form.selectedAccounts[platform] = allSelected(platform) ? [] : ids
}

async function loadRuns() {
  const runsQuery = query(
    collection(db, 'sync_runs'),
    orderBy('startedAt', 'desc'),
    limit(10)
  )
  const snap = await getDocs(runsQuery)
  runs.value = snap.docs.map((runDoc) => ({ id: runDoc.id, ...runDoc.data() }))
}

async function saveConfig() {
  busy.value = true
  setMessage('')
  try {
    await postJson(FUNCTION_ENDPOINTS.saveConfig, {
      configId: CONFIG_ID,
      config: configPayload()
    })
    setMessage('Sync config saved. Backend secrets were not changed.')
    await loadConfig()
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function saveBackendSecrets() {
  secretsBusy.value = true
  setSecretsMessage('')
  try {
    const secretsPayload = cleanSecretsPayload()
    if (!Object.keys(secretsPayload).length) {
      throw new Error('Enter at least one backend secret to update.')
    }
    await postJson(FUNCTION_ENDPOINTS.saveConfig, {
      configId: CONFIG_ID,
      config: configPayload(),
      secrets: secretsPayload
    })
    await Promise.all([loadConfig(), loadSecretStatus()])
    resetSecretFields()
    setSecretsMessage('Backend secrets saved.')
    setMessage('Backend secrets saved. Sync config was kept up to date.')
  } catch (error) {
    setSecretsMessage(error.message, 'error')
  } finally {
    secretsBusy.value = false
  }
}

async function testSheet() {
  busy.value = true
  setMessage('')
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.testSheet, { configId: CONFIG_ID })
    setMessage(result.message || 'Sheet connection works.')
  } catch (error) {
    setMessage(error.message, 'error')
    openIssuePopupFromError(error, 'sheets')
  } finally {
    busy.value = false
  }
}

function previewMessage(result, target) {
  const parts = []
  if (targetIncludesContent(target)) {
    parts.push(`${result.discovered || 0} content rows discovered`)
  }
  if (targetIncludesFollowers(target)) {
    parts.push(`${followerPreviewRows.value.length} follower rows ready`)
  }
  return parts.join(', ')
}

function runMessage(result, target) {
  const parts = []
  if (targetIncludesContent(target)) {
    parts.push(`${result.rowsAppended || 0} appended`)
    parts.push(`${result.rowsUpdated || 0} updated`)
  }
  if (targetIncludesFollowers(target)) {
    const followerRows = (result.followerRowsAppended || 0) + (result.followerRowsUpdated || 0)
    parts.push(`${followerRows} follower rows saved`)
  }
  return parts.join(', ')
}

async function previewSync(target = 'both') {
  const normalizedTarget = normalizeTarget(target)
  busy.value = true
  busyTarget.value = runTargetLabel(normalizedTarget)
  setMessage('')
  previewRows.value = []
  followerPreviewRows.value = []
  instagramDebugRows.value = []
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.runSync, {
      configId: CONFIG_ID,
      preview: true,
      target: normalizedTarget,
      config: configPayload()
    })
    previewRows.value = result.previewRows || []
    followerPreviewRows.value = result.followerPreviewRows || []
    instagramDebugRows.value = result.instagramDebug || []
    const notices = syncNoticeSuffix(result)
    const errors = syncErrorText(result.errors)
    setMessage(`Preview ${runTargetLabel(normalizedTarget)} complete: ${previewMessage(result, normalizedTarget)}.${notices ? ` ${notices}` : ''}`, errors ? 'error' : 'info')
    maybeOpenIssuePopup(result)
    await Promise.all([loadRuns(), loadAccounts()])
  } catch (error) {
    setMessage(error.message, 'error')
    openIssuePopupFromError(error, normalizedTarget)
  } finally {
    busy.value = false
    busyTarget.value = ''
  }
}

async function runSync(target = 'both') {
  const normalizedTarget = normalizeTarget(target)
  busy.value = true
  busyTarget.value = runTargetLabel(normalizedTarget)
  setMessage('')
  instagramDebugRows.value = []
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.runSync, {
      configId: CONFIG_ID,
      target: normalizedTarget,
      config: configPayload()
    })
    instagramDebugRows.value = result.instagramDebug || []
    const notices = syncNoticeSuffix(result)
    const errors = syncErrorText(result.errors)
    setMessage(`Sync ${runTargetLabel(normalizedTarget)} complete: ${runMessage(result, normalizedTarget)}.${notices ? ` ${notices}` : ''}`, errors ? 'error' : 'info')
    maybeOpenIssuePopup(result)
    previewRows.value = []
    followerPreviewRows.value = []
    await Promise.all([loadRuns(), loadAccounts()])
  } catch (error) {
    setMessage(error.message, 'error')
    openIssuePopupFromError(error, normalizedTarget)
  } finally {
    busy.value = false
    busyTarget.value = ''
  }
}

async function connectTikTok() {
  busy.value = true
  setMessage('')
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.startTikTok, { configId: CONFIG_ID })
    window.open(result.authUrl, '_blank', 'noopener,noreferrer')
    setMessage(`TikTok authorization opened. Redirect URI: ${result.redirectUri || TIKTOK_REDIRECT_URI}`)
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function connectInstagram() {
  busy.value = true
  setMessage('')
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.startInstagram, { configId: CONFIG_ID })
    window.open(result.authUrl, '_blank', 'noopener,noreferrer')
    setMessage(`Instagram authorization opened. Redirect URI: ${result.redirectUri || INSTAGRAM_REDIRECT_URI}`)
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function connectYouTube() {
  busy.value = true
  setMessage('')
  try {
    const result = await postJson(FUNCTION_ENDPOINTS.startYouTube, { configId: CONFIG_ID })
    window.open(result.authUrl, '_blank', 'noopener,noreferrer')
    setMessage(`YouTube authorization opened. Redirect URI: ${result.redirectUri || YOUTUBE_REDIRECT_URI}`)
  } catch (error) {
    setMessage(error.message, 'error')
  } finally {
    busy.value = false
  }
}

function formatTimestamp(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString()
}

function formatPreviewCtr(value) {
  if (value === '-' || value === '' || value == null) return '-'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  const percent = Math.abs(numeric) <= 1 ? numeric * 100 : numeric
  return `${Number(percent.toFixed(2))}%`
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadRuns(), loadAccounts(), loadSecretStatus()])
})
</script>

<style scoped>
.sheet-sync {
  min-height: 100vh;
  background:
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(24, 36, 61, 0.96)),
    linear-gradient(90deg, #132319, #273444);
  color: #f8fafc;
  padding: 28px;
  scrollbar-color: rgba(56, 189, 248, 0.7) rgba(15, 23, 39, 0.7);
  scrollbar-width: thin;
}

.sheet-sync * {
  scrollbar-color: rgba(56, 189, 248, 0.72) rgba(15, 23, 39, 0.62);
  scrollbar-width: thin;
}

.sheet-sync *::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}

.sheet-sync *::-webkit-scrollbar-track {
  background: rgba(15, 23, 39, 0.72);
  border-radius: 999px;
}

.sheet-sync *::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #38bdf8, #22c55e);
  border: 2px solid rgba(15, 23, 39, 0.88);
  border-radius: 999px;
}

.sheet-sync *::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #7dd3fc, #4ade80);
}

.sync-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
  align-items: stretch;
  margin: 0 auto 22px;
  max-width: 1280px;
}

.eyebrow {
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 8px;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 2.1rem;
  line-height: 1.1;
}

h2 {
  font-size: 1.05rem;
}

.subtitle {
  color: #b6c2d2;
  margin-top: 10px;
  max-width: 780px;
}

.status-panel,
.sync-panel {
  background: #172033;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
}

.status-panel {
  align-items: flex-end;
  background: transparent;
  border: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0;
  text-align: right;
}

.status-label,
.panel-title span,
.hint,
.run-card small {
  color: #99a8bc;
  font-size: 0.82rem;
}

.status-panel strong {
  font-size: 1.3rem;
  margin: 6px 0;
  text-transform: capitalize;
}

.mode-switch {
  background: rgba(15, 23, 39, 0.72);
  border: 1px solid #2b3a55;
  border-radius: 8px;
  display: grid;
  gap: 4px;
  grid-template-columns: 1fr 1fr;
  margin-top: 14px;
  max-width: 240px;
  padding: 4px;
  width: 100%;
}

.mode-choice {
  background: transparent;
  align-items: center;
  color: #cbd5e1;
  display: inline-flex;
  gap: 8px;
  justify-content: center;
  min-height: 34px;
  padding: 8px 10px;
}

.mode-choice.active {
  background: #38bdf8;
  color: #06121b;
}

.mode-choice:hover:not(:disabled) {
  box-shadow: none;
  transform: none;
}

.advanced-grid,
.sync-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  margin: 0 auto 18px;
  max-width: 1280px;
}

.quick-sync-shell {
  margin: 0 auto 18px;
  max-width: 1280px;
}

.sync-panel {
  margin: 0 auto 18px;
  max-width: 1280px;
  padding: 20px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #2b3a55;
  margin-bottom: 18px;
  padding-bottom: 12px;
}

.panel-title > div {
  display: grid;
  gap: 4px;
}

.panel-title small {
  color: #99a8bc;
  font-size: 0.82rem;
  font-weight: 500;
}

label {
  color: #dbe7f5;
  display: grid;
  font-size: 0.9rem;
  font-weight: 700;
  gap: 7px;
  margin-bottom: 14px;
}

input,
textarea {
  background: #0f1727;
  border: 1px solid #34445f;
  border-radius: 8px;
  color: #f8fafc;
  font: inherit;
  min-height: 42px;
  outline: none;
  padding: 10px 12px;
  width: 100%;
}

input:hover,
textarea:hover {
  border-color: #4a5f7e;
}

input[type='date']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(84%) sepia(21%) saturate(639%) hue-rotate(176deg) brightness(98%);
  opacity: 0.8;
}

input[type='checkbox'] {
  appearance: none;
  background: #0b1220;
  border: 1px solid #516784;
  border-radius: 5px;
  display: inline-grid;
  flex: 0 0 auto;
  height: 18px;
  min-height: unset;
  padding: 0;
  place-items: center;
  transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
  width: 18px;
}

input[type='checkbox']::after {
  border-bottom: 2px solid #04111f;
  border-left: 2px solid #04111f;
  content: '';
  height: 5px;
  margin-top: -2px;
  transform: rotate(-45deg) scale(0);
  transition: transform 0.14s ease;
  width: 9px;
}

input[type='checkbox']:checked {
  background: linear-gradient(135deg, #38bdf8, #22c55e);
  border-color: transparent;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
}

input[type='checkbox']:checked::after {
  transform: rotate(-45deg) scale(1);
}

input[type='checkbox']:disabled {
  opacity: 0.5;
}

textarea {
  min-height: 140px;
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

.two-col {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
}

.schedule-toggle {
  min-height: 42px;
  white-space: nowrap;
}

.quick-sheet-id input,
.sheet-id-field input {
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
}

.tab-date-grid {
  display: grid;
  gap: 14px;
  margin-bottom: 14px;
}

.date-group {
  border: 1px solid #34445f;
  border-radius: 8px;
  padding: 14px 14px 0;
}

.date-group-title {
  align-items: baseline;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.date-group-title span,
.run-control-row small {
  color: #99a8bc;
  font-size: 0.82rem;
}

.date-group-title strong,
.run-control-row strong {
  color: #dbe7f5;
}

.follower-range-list {
  display: grid;
  gap: 12px;
}

.follower-range-row {
  background: #0f1727;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  padding: 12px 12px 0;
}

.follower-range-heading {
  align-items: center;
  color: #99a8bc;
  display: flex;
  font-size: 0.82rem;
  font-weight: 700;
  justify-content: space-between;
  margin-bottom: 10px;
}

.add-range-btn {
  margin-top: 12px;
}

.quick-follower-toolbar .add-range-btn {
  margin-top: 0;
}

.mini-btn.danger {
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

.mini-btn.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.28);
}

.switch-row {
  align-items: center;
  display: flex;
  gap: 10px;
  margin-bottom: 0;
  min-height: 42px;
}

.advanced-schedule-grid,
.advanced-sheet-grid,
.platform-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.advanced-schedule-grid,
.advanced-sheet-grid {
  grid-template-columns: minmax(280px, 1.4fr) minmax(160px, 0.8fr) minmax(180px, 0.8fr);
}

.advanced-sheet-grid {
  margin-bottom: 14px;
}

.advanced-schedule-grid {
  align-items: end;
  margin-bottom: 14px;
}

.advanced-schedule-grid label,
.advanced-sheet-grid label,
.platform-grid label {
  margin-bottom: 0;
}

.platform-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 18px;
  margin-top: 4px;
}

.switch-row input {
  accent-color: #38bdf8;
  height: 18px;
  min-height: unset;
  width: 18px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  background: #22c55e;
  border: 0;
  border-radius: 8px;
  align-items: center;
  color: #07130b;
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  font-weight: 800;
  justify-content: center;
  min-height: 42px;
  padding: 10px 16px;
  transition: background 0.16s ease, box-shadow 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

button:hover:not(:disabled) {
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.22);
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button.secondary {
  background: #38bdf8;
  color: #06121b;
}

button.ghost {
  background: #22314a;
  color: #dbe7f5;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.icon,
.section-icon {
  display: inline-block;
  flex: 0 0 auto;
  height: 16px;
  position: relative;
  width: 16px;
}

.section-icon {
  height: 18px;
  width: 18px;
}

.icon-plus::before,
.icon-plus::after {
  background: currentColor;
  border-radius: 999px;
  content: '';
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.icon-plus::before {
  height: 2px;
  width: 12px;
}

.icon-plus::after {
  height: 12px;
  width: 2px;
}

.icon-x::before,
.icon-x::after {
  background: currentColor;
  border-radius: 999px;
  content: '';
  height: 2px;
  left: 2px;
  position: absolute;
  top: 7px;
  width: 12px;
}

.icon-x::before {
  transform: rotate(45deg);
}

.icon-x::after {
  transform: rotate(-45deg);
}

.icon-play::before {
  border-bottom: 6px solid transparent;
  border-left: 10px solid currentColor;
  border-top: 6px solid transparent;
  content: '';
  left: 4px;
  position: absolute;
  top: 2px;
}

.icon-check-all::before {
  border-bottom: 2px solid currentColor;
  border-left: 2px solid currentColor;
  content: '';
  height: 5px;
  left: 2px;
  position: absolute;
  top: 5px;
  transform: rotate(-45deg);
  width: 9px;
}

.icon-check-all::after {
  border-bottom: 2px solid currentColor;
  border-left: 2px solid currentColor;
  content: '';
  height: 4px;
  left: 8px;
  opacity: 0.55;
  position: absolute;
  top: 4px;
  transform: rotate(-45deg);
  width: 7px;
}

.icon-basic {
  border: 2px solid currentColor;
  border-radius: 4px;
  box-shadow: inset 6px 0 0 transparent;
}

.icon-basic::before,
.icon-basic::after {
  background: currentColor;
  content: '';
  position: absolute;
}

.icon-basic::before {
  height: 100%;
  left: 6px;
  top: 0;
  width: 2px;
}

.icon-basic::after {
  height: 2px;
  left: 0;
  top: 6px;
  width: 100%;
}

.icon-sliders::before,
.icon-sliders::after {
  background: currentColor;
  border-radius: 999px;
  box-shadow: 0 5px 0 currentColor, 0 10px 0 currentColor;
  content: '';
  height: 2px;
  left: 1px;
  position: absolute;
  top: 2px;
  width: 14px;
}

.icon-sliders::after {
  background: #172033;
  box-shadow: 7px 5px 0 #172033, 3px 10px 0 #172033;
  height: 4px;
  left: 4px;
  top: 1px;
  width: 4px;
}

.icon-sync {
  border: 2px solid currentColor;
  border-left-color: transparent;
  border-radius: 999px;
}

.icon-sync::after {
  border-left: 5px solid currentColor;
  border-top: 5px solid transparent;
  content: '';
  position: absolute;
  right: -2px;
  top: 0;
}

.icon-sheet {
  border: 2px solid currentColor;
  border-radius: 4px;
}

.icon-sheet::before {
  background: currentColor;
  box-shadow: 0 5px 0 currentColor;
  content: '';
  height: 2px;
  left: 3px;
  opacity: 0.72;
  position: absolute;
  top: 5px;
  width: 8px;
}

.icon-calendar {
  border: 2px solid currentColor;
  border-radius: 4px;
}

.icon-calendar::before {
  background: currentColor;
  content: '';
  height: 2px;
  left: 0;
  position: absolute;
  top: 4px;
  width: 100%;
}

.icon-calendar::after {
  background: currentColor;
  box-shadow: 5px 0 0 currentColor, 10px 0 0 currentColor;
  content: '';
  height: 2px;
  left: 3px;
  position: absolute;
  top: 10px;
  width: 2px;
}

.icon-users::before,
.icon-users::after {
  background: currentColor;
  border-radius: 999px;
  content: '';
  position: absolute;
}

.icon-users::before {
  height: 7px;
  left: 5px;
  top: 2px;
  width: 7px;
}

.icon-users::after {
  border-radius: 8px 8px 4px 4px;
  height: 7px;
  left: 2px;
  top: 10px;
  width: 14px;
}

.quick-sync-card {
  color: #f8fafc;
  display: grid;
  gap: 0;
  background:
    linear-gradient(180deg, rgba(23, 32, 51, 0.68), rgba(15, 23, 39, 0.42));
  border: 1px solid rgba(71, 85, 105, 0.45);
  border-radius: 8px;
  box-shadow: 0 24px 64px rgba(2, 6, 23, 0.22);
  padding: 22px 28px;
}

.quick-sync-top {
  align-items: center;
  border-bottom: 1px solid rgba(71, 85, 105, 0.58);
  display: flex;
  gap: 18px;
  justify-content: space-between;
  margin-bottom: 0;
  padding: 0 0 18px;
}

.quick-sync-top h2 {
  align-items: center;
  color: #f8fafc;
  display: inline-flex;
  font-size: 1.25rem;
  gap: 10px;
}

.quick-sync-top h2 .icon {
  color: #7dd3fc;
}

.quick-state {
  align-items: center;
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(125, 211, 252, 0.34);
  border-radius: 999px;
  color: #bae6fd;
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 7px;
  padding: 7px 11px;
  white-space: nowrap;
}

.quick-state::before {
  background: #38bdf8;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12);
  content: '';
  height: 7px;
  width: 7px;
}

.quick-state.busy {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(134, 239, 172, 0.42);
  color: #bbf7d0;
}

.quick-state.busy::before {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
}

.quick-sync-layout {
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
}

.quick-settings-pane,
.quick-accounts-pane {
  padding-top: 20px;
}

.quick-accounts-pane {
  border-left: 1px solid rgba(71, 85, 105, 0.58);
  padding-left: 28px;
}

.quick-section-heading {
  align-items: baseline;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 14px;
}

.quick-section-heading h3 {
  align-items: center;
  color: #f8fafc;
  display: inline-flex;
  font-size: 0.98rem;
  gap: 8px;
  margin: 0;
}

.quick-section-heading h3 .section-icon {
  color: #7dd3fc;
}

.quick-section-heading span {
  color: #99a8bc;
  font-size: 0.82rem;
  text-align: right;
}

.quick-tab-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 14px;
}

.duration-heading {
  border-top: 1px solid rgba(71, 85, 105, 0.58);
  margin-top: 22px;
  padding-top: 18px;
}

.quick-duration-list {
  display: grid;
  gap: 0;
}

.quick-duration-row {
  align-items: end;
  border-top: 1px solid rgba(43, 58, 85, 0.72);
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(160px, 0.8fr) repeat(2, minmax(150px, 1fr));
  padding: 14px 0;
}

.quick-duration-row:first-child {
  border-top: 0;
  padding-top: 0;
}

.quick-follower-toolbar {
  align-items: center;
  border-top: 1px solid rgba(43, 58, 85, 0.72);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 14px 0;
}

.quick-follower-row {
  border-left: 2px solid rgba(56, 189, 248, 0.24);
  padding-left: 14px;
}

.quick-duration-label {
  display: grid;
  gap: 4px;
  padding-bottom: 5px;
}

.quick-follower-toolbar .quick-duration-label {
  padding-bottom: 0;
}

.quick-range-label-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

.quick-duration-label strong {
  color: #f8fafc;
  font-size: 0.92rem;
}

.quick-duration-label small {
  color: #99a8bc;
  font-size: 0.78rem;
}

.quick-field {
  color: #dbe7f5;
  margin-bottom: 0;
}

.quick-field input {
  background: #0f1727;
  border-color: #34445f;
  color: #f8fafc;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.quick-field input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.14);
}

.basic-account-stack {
  border-top: 1px solid rgba(71, 85, 105, 0.58);
  display: grid;
  gap: 0;
  max-height: 540px;
  overflow: auto;
  padding-right: 10px;
  scrollbar-gutter: stable;
}

.basic-account-stack::-webkit-scrollbar {
  width: 12px;
}

.basic-account-stack::-webkit-scrollbar-track {
  background: rgba(10, 16, 28, 0.92);
  border-left: 1px solid rgba(71, 85, 105, 0.34);
  border-radius: 999px;
}

.basic-account-stack::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #38bdf8, #22c55e);
  border: 3px solid rgba(10, 16, 28, 0.92);
  border-radius: 999px;
}

.basic-account-stack::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #7dd3fc, #4ade80);
}

.basic-platform-row {
  border-bottom: 1px solid rgba(71, 85, 105, 0.45);
  border-radius: 8px;
  padding: 14px 8px;
  transition: background 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
}

.basic-platform-row:hover {
  background: rgba(56, 189, 248, 0.045);
}

.basic-platform-row.disabled {
  opacity: 0.62;
}

.basic-platform-head {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.basic-platform-toggle {
  align-items: center;
  display: flex;
  gap: 10px;
  margin-bottom: 0;
  min-width: 0;
}

.platform-mark {
  align-items: center;
  border-radius: 8px;
  color: #f8fafc;
  display: inline-flex;
  font-size: 0.68rem;
  font-weight: 900;
  height: 28px;
  justify-content: center;
  letter-spacing: 0;
  width: 28px;
}

.platform-mark.facebook {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
}

.platform-mark.instagram {
  background: linear-gradient(135deg, #f97316, #ec4899);
}

.platform-mark.youtube {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
}

.platform-mark.tiktok {
  background: linear-gradient(135deg, #14b8a6, #475569);
}

.basic-platform-toggle input,
.basic-account-option input {
  accent-color: #38bdf8;
  height: 18px;
  min-height: unset;
  width: 18px;
}

.basic-platform-toggle span,
.basic-account-option span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.basic-platform-toggle strong {
  color: #f8fafc;
}

.basic-platform-toggle small,
.basic-account-option small {
  color: #99a8bc;
  font-size: 0.76rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.basic-account-options {
  display: grid;
  gap: 0;
  margin-top: 10px;
}

.basic-account-option {
  align-items: flex-start;
  border-top: 1px solid rgba(71, 85, 105, 0.34);
  border-radius: 6px;
  display: flex;
  gap: 9px;
  margin-bottom: 0;
  padding: 9px 8px;
  transition: background 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.basic-account-option:hover {
  background: rgba(148, 163, 184, 0.055);
}

.basic-account-option.selected {
  background: rgba(56, 189, 248, 0.08);
  border-top-color: rgba(56, 189, 248, 0.16);
  box-shadow: inset 3px 0 0 #38bdf8;
}

.quick-sync-actions {
  align-items: center;
  border-top: 1px solid #2b3a55;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  margin-top: 20px;
  padding-top: 18px;
}

.quick-run-button {
  background: #22c55e;
  color: #07130b;
  min-width: 150px;
  box-shadow: 0 14px 30px rgba(34, 197, 94, 0.18);
}

.quick-run-button:hover:not(:disabled) {
  background: #4ade80;
}

.quick-sync-actions .ghost {
  background: #22314a;
  color: #dbe7f5;
}

.quick-sync-actions .ghost:hover:not(:disabled),
.mini-btn:hover:not(:disabled) {
  background: #2a3b58;
}

.quick-message {
  margin-top: 18px;
}

.secret-status-list {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.secret-status-list.compact {
  grid-template-columns: 1fr;
  max-height: 410px;
  overflow: auto;
  padding-right: 2px;
}

.secret-status-item {
  align-items: flex-start;
  background: #0f1727;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  display: grid;
  gap: 10px;
  grid-template-columns: auto minmax(0, 1fr);
  padding: 11px 12px;
}

.secret-status-item.configured {
  border-color: rgba(34, 197, 94, 0.42);
}

.secret-status-item strong {
  color: #dbe7f5;
  display: block;
  font-size: 0.9rem;
  margin-bottom: 3px;
}

.secret-status-item small {
  color: #99a8bc;
  display: block;
  font-size: 0.78rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.status-dot {
  background: #64748b;
  border-radius: 999px;
  display: inline-block;
  height: 10px;
  margin-top: 5px;
  width: 10px;
}

.secret-status-item.configured .status-dot {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.controls-panel {
  display: block;
}

.run-control-list {
  display: grid;
  gap: 0;
  margin-bottom: 16px;
}

.run-control-row {
  align-items: center;
  border-bottom: 1px solid #2b3a55;
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 12px 0;
}

.run-control-row:first-child {
  padding-top: 0;
}

.run-control-row:last-child {
  border-bottom: 0;
}

.run-control-row > div:first-child {
  display: grid;
  gap: 4px;
}

.oauth-actions {
  border-top: 1px solid #2b3a55;
  padding-top: 16px;
}

.inline-actions {
  border-top: 0;
  padding-top: 0;
}

.accounts-panel {
  display: block;
}

.accounts-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.account-column {
  background: #0f1727;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  min-height: 140px;
  padding: 14px;
}

.account-heading {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.account-heading > div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.account-heading small {
  color: #99a8bc;
  font-size: 0.78rem;
}

.mini-btn {
  background: #22314a;
  color: #dbe7f5;
  font-size: 0.78rem;
  min-height: 30px;
  padding: 6px 10px;
}

.account-option {
  align-items: flex-start;
  background: #172033;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  display: flex;
  gap: 9px;
  margin: 0 0 8px;
  padding: 10px;
}

.account-option input {
  accent-color: #38bdf8;
  height: 18px;
  margin-top: 2px;
  min-height: unset;
  width: 18px;
}

.account-option span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.account-option small {
  color: #99a8bc;
  font-family: monospace;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-note {
  color: #99a8bc;
  font-size: 0.86rem;
}

.message {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 8px;
  color: #bbf7d0;
  margin-top: 14px;
  padding: 12px;
}

.message.error {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.38);
  color: #fecaca;
}

.table-wrap {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  min-width: 980px;
  width: 100%;
}

.follower-table {
  min-width: 900px;
}

th,
td {
  border-bottom: 1px solid #2b3a55;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

th {
  color: #93c5fd;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.content-cell {
  max-width: 300px;
}

.run-list {
  display: grid;
  gap: 12px;
}

.run-card {
  background: #0f1727;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  display: grid;
  gap: 10px;
  padding: 14px;
}

.run-card strong {
  display: block;
  margin-bottom: 3px;
  text-transform: capitalize;
}

.run-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.run-metrics span {
  background: #172033;
  border-radius: 999px;
  color: #cbd5e1;
  font-size: 0.82rem;
  padding: 6px 10px;
}

.run-errors {
  color: #fecaca;
  font-size: 0.86rem;
}

.run-warnings {
  color: #fde68a;
  font-size: 0.86rem;
}

.debug-actions {
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.debug-limit-field {
  max-width: 150px;
}

.raw-response-list {
  display: grid;
  gap: 14px;
}

.raw-response-meta {
  align-items: center;
  color: #9fb1c7;
  display: flex;
  flex-wrap: wrap;
  font-size: 0.82rem;
  gap: 10px;
  margin-bottom: 8px;
}

.raw-response-meta strong {
  color: #f8fafc;
}

.debug-panel pre {
  background: #050914;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 0.78rem;
  line-height: 1.45;
  max-height: 520px;
  overflow: auto;
  padding: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.modal-backdrop {
  align-items: center;
  background: rgba(2, 6, 23, 0.74);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 22px;
  position: fixed;
  z-index: 50;
}

.secret-modal {
  background: #172033;
  border: 1px solid #34445f;
  border-radius: 8px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
  color: #f8fafc;
  max-height: min(900px, calc(100vh - 44px));
  max-width: 980px;
  overflow: hidden;
  width: min(980px, 100%);
}

.issue-modal {
  background: #172033;
  border: 1px solid #475569;
  border-radius: 8px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
  color: #f8fafc;
  max-height: min(820px, calc(100vh - 44px));
  max-width: 860px;
  overflow: hidden;
  width: min(860px, 100%);
}

.issue-header {
  background: linear-gradient(90deg, rgba(127, 29, 29, 0.32), rgba(15, 23, 42, 0));
}

.issue-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.issue-summary span,
.issue-badge,
.issue-token-badge,
.issue-secret-badge {
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 6px 10px;
}

.issue-summary span {
  background: #0f1727;
  color: #cbd5e1;
}

.issue-list {
  display: grid;
  gap: 12px;
}

.issue-card {
  background: #0f1727;
  border: 1px solid rgba(248, 113, 113, 0.42);
  border-radius: 8px;
  display: grid;
  gap: 9px;
  padding: 14px;
}

.issue-card.warning {
  border-color: rgba(250, 204, 21, 0.42);
}

.issue-card-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.issue-badge {
  background: #22314a;
  color: #dbe7f5;
}

.issue-token-badge {
  background: rgba(56, 189, 248, 0.16);
  color: #bae6fd;
}

.issue-secret-badge {
  background: rgba(250, 204, 21, 0.16);
  color: #fef3c7;
}

.issue-card strong {
  color: #f8fafc;
}

.issue-card p {
  color: #cbd5e1;
  line-height: 1.45;
}

.issue-card small {
  color: #99a8bc;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  overflow-wrap: anywhere;
}

.issue-actions {
  margin-top: 2px;
}

.modal-header {
  align-items: center;
  border-bottom: 1px solid #2b3a55;
  display: flex;
  justify-content: space-between;
  padding: 18px 20px;
}

.close-btn {
  min-height: 36px;
}

.modal-body {
  display: grid;
  gap: 18px;
  max-height: calc(100vh - 150px);
  overflow: auto;
  padding: 20px;
}

.existing-secrets {
  background: #0f1727;
  border: 1px solid #2b3a55;
  border-radius: 8px;
  padding: 16px;
}

.existing-secrets .panel-title {
  margin-bottom: 14px;
}

.existing-secrets .secret-status-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.reveal-actions {
  border-top: 1px solid #2b3a55;
  margin-top: 14px;
  padding-top: 14px;
}

.reveal-actions.top {
  border-top: 0;
  margin-top: 0;
  padding-top: 0;
}

.secrets-form {
  display: grid;
}

.modal-actions {
  border-top: 1px solid #2b3a55;
  padding-top: 14px;
}

@media (max-width: 900px) {
  .sheet-sync {
    padding: 18px;
  }

  .sync-header,
  .sync-grid,
  .quick-sync-layout,
  .quick-tab-grid,
  .quick-duration-row,
  .advanced-schedule-grid,
  .advanced-sheet-grid,
  .platform-grid,
  .accounts-grid,
  .run-control-row,
  .two-col,
  .existing-secrets .secret-status-list {
    grid-template-columns: 1fr;
  }

  .status-panel {
    align-items: stretch;
    text-align: left;
  }

  .mode-switch {
    max-width: none;
  }

  .quick-accounts-pane {
    border-left: 0;
    border-top: 1px solid #2b3a55;
    padding-left: 0;
  }

  .quick-sync-top,
  .quick-sync-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .quick-sync-actions button {
    width: 100%;
  }

  .modal-backdrop {
    align-items: stretch;
    padding: 12px;
  }

  .secret-modal {
    max-height: calc(100vh - 24px);
  }

  .issue-modal {
    max-height: calc(100vh - 24px);
  }
}
</style>
