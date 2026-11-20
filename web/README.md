# Folderly Web

React + Vite dashboard for Folderly. **Full documentation: see the [root README](../README.md).**

```bash
npm install
npm run dev       # http://localhost:3000  (needs the API on :5000)
npm run build     # production build -> dist/
```
Docker/nginx: `Dockerfile`, `nginx.conf`, `security-headers.conf`. Build-time env: `VITE_API_URL` (leave empty for same-origin).
