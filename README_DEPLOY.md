# Felipe Training OS — iPhone / GitHub Pages

## Recommended deployment

Upload the contents of this folder to any HTTPS static host.

### GitHub Pages
1. Create a folder such as `training-os` in your Pages repository.
2. Upload: `index.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png`.
3. Commit/push.
4. Open the resulting HTTPS URL in Safari on the iPhone.
5. Safari → Share → Add to Home Screen → enable “Open as Web App”.

After the first successful load, the service worker caches the app shell for offline use.

## Important
- Training data stays in browser/Web App local storage for that HTTPS origin.
- Export JSON backups periodically.
- Moving to another domain/path may create a different storage origin.
- iOS may suspend normal JavaScript in background. The timestamp-based timer stays correct when the app resumes; a guaranteed background alarm needs push/native notification architecture.
