import { defineConfig, devices } from '@playwright/test'

// E2E smoke + security checks. Uses the locally-installed Chrome (channel:
// 'chrome') so no separate browser download is needed. Builds + serves the
// production bundle via `vite preview` on the project's base path.
const PORT = 4188
const BASE = `http://localhost:${PORT}/elysian-studios-website/`

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    channel: 'chrome',
    headless: true,
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: BASE,
    timeout: 120000,
    reuseExistingServer: true,
  },
})
