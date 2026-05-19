const { ipcMain, app, shell } = require('electron');
const https = require('https');

const GITHUB_REPO = 'proclame/electron-pos';

function compareVersions(a, b) {
  const pa = String(a)
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  const pb = String(b)
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          // GitHub rejects API requests without a User-Agent.
          'User-Agent': 'electron-pos',
          Accept: 'application/vnd.github+json',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`GitHub API returned ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error('GitHub API request timed out'));
    });
  });
}

function registerAppHandlers() {
  ipcMain.handle('app:check-for-update', async () => {
    const currentVersion = app.getVersion();
    const release = await fetchLatestRelease();
    const latestVersion = String(release.tag_name || '').replace(/^v/i, '');
    const updateAvailable = Boolean(latestVersion) && compareVersions(latestVersion, currentVersion) > 0;

    const exeAsset = (release.assets || []).find((asset) => asset.name && asset.name.toLowerCase().endsWith('.exe'));
    const downloadUrl = exeAsset ? exeAsset.browser_download_url : release.html_url;

    return { currentVersion, latestVersion, updateAvailable, downloadUrl };
  });

  ipcMain.handle('app:open-external', async (event, url) => {
    await shell.openExternal(url);
    return { ok: true };
  });
}

module.exports = registerAppHandlers;
