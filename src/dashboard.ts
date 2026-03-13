import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load template once at startup
const template = readFileSync(join(__dirname, "dashboard.html"), "utf8")

export interface DashboardData {
  connected: boolean
  userEmail?: string
  tokenExpiresAt?: number
  apiKey?: string
  publicUrl: string
}

function fill(html: string, key: string, value: string): string {
  return html.replaceAll(`{{${key}}}`, value)
}

export function renderDashboard(data: DashboardData): string {
  const { connected, userEmail, tokenExpiresAt, apiKey, publicUrl } = data

  const mcpUrl = `${publicUrl}/mcp`
  const keyPlaceholder = apiKey ?? "<YOUR_API_KEY>"
  const authHeader = `Authorization: Bearer ${keyPlaceholder}`

  const claudeCodeCmd =
    `claude mcp add --transport http mstodo ${mcpUrl} \\\n  --header "${authHeader}"`

  const cursorConfig = JSON.stringify(
    { mcpServers: { mstodo: { url: mcpUrl, headers: { Authorization: `Bearer ${keyPlaceholder}` } } } },
    null, 2,
  )

  const desktopConfig = JSON.stringify(
    { mcpServers: { mstodo: { url: mcpUrl, headers: { Authorization: `Bearer ${keyPlaceholder}` } } } },
    null, 2,
  )

  const expiryText = tokenExpiresAt ? new Date(tokenExpiresAt).toLocaleString() : "—"

  const statusBadge = connected
    ? `<span class="badge badge-green">● Connected</span>`
    : `<span class="badge badge-red">● Not connected</span>`

  const userEmailRow = connected && userEmail
    ? `<div class="status-detail">Account: <span>${userEmail}</span></div>`
    : ""

  const tokenExpiryRow = connected && tokenExpiresAt
    ? `<div class="status-detail">Token expires: <span>${expiryText}</span></div>`
    : ""

  const authButton = connected
    ? `<a href="/auth" class="btn btn-outline">Re-authenticate</a>`
    : `<a href="/auth" class="btn btn-blue">Connect Microsoft Account</a>`

  let setupSection: string

  if (connected && apiKey) {
    setupSection = `
    <!-- API Key Card -->
    <div class="card">
      <div class="card-title">API Key</div>
      <p class="info-box">Use this key to authenticate your MCP clients.</p>
      <div class="apikey-box">
        <code id="apikey-text">${apiKey}</code>
        <button onclick="copyText('apikey-text', this)">Copy</button>
      </div>
    </div>

    <!-- Quick Add Card -->
    <div class="card">
      <div class="card-title">Add to your AI client</div>
      <div class="tabs">
        <button class="tab active" onclick="switchTab(event, 'tab-claude')">Claude Code</button>
        <button class="tab" onclick="switchTab(event, 'tab-cursor')">Cursor</button>
        <button class="tab" onclick="switchTab(event, 'tab-desktop')">Claude Desktop</button>
      </div>
      <div id="tab-claude" class="tab-content active">
        <p class="section-label">Run this in your terminal:</p>
        <div class="code-block" id="claude-cmd">${claudeCodeCmd}<button class="copy-btn" onclick="copyText('claude-cmd', this)">Copy</button></div>
      </div>
      <div id="tab-cursor" class="tab-content">
        <p class="section-label">Add to <code style="color:#aaa">~/.cursor/mcp.json</code>:</p>
        <div class="code-block" id="cursor-cfg">${cursorConfig}<button class="copy-btn" onclick="copyText('cursor-cfg', this)">Copy</button></div>
      </div>
      <div id="tab-desktop" class="tab-content">
        <p class="section-label">Add to <code style="color:#aaa">claude_desktop_config.json</code>:</p>
        <div class="code-block" id="desktop-cfg">${desktopConfig}<button class="copy-btn" onclick="copyText('desktop-cfg', this)">Copy</button></div>
      </div>
    </div>`
  } else if (!connected) {
    setupSection = `
    <div class="card">
      <div class="card-title">Setup</div>
      <p class="info-box">Connect your Microsoft account above to get started. Once connected, your API key and quick-add commands will appear here.</p>
    </div>`
  } else {
    setupSection = `
    <div class="card">
      <div class="card-title">Setup</div>
      <p class="info-box">Set the <code style="color:#aaa">MCP_API_KEY</code> environment variable and restart the server to see your quick-add commands.</p>
    </div>`
  }

  return fill(fill(fill(fill(fill(fill(template,
    "STATUS_BADGE",    statusBadge),
    "USER_EMAIL_ROW",  userEmailRow),
    "TOKEN_EXPIRY_ROW", tokenExpiryRow),
    "AUTH_BUTTON",     authButton),
    "SETUP_SECTION",   setupSection),
    "MCP_URL",         mcpUrl)
}
