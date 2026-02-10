const fs = require('fs');
const path = require('path');

const root = process.cwd();
const miniFront = path.join(root, 'mini-front');
const publicDir = path.join(root, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const indexHtmlPath = path.join(miniFront, 'index.html');
const stylesPath = path.join(miniFront, 'styles.css');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// For Vercel we want the front to call the same origin /api/chat
const indexForVercel = indexHtml.replace(
  /const API_BASE_URL = "[^"]*";/,
  'const API_BASE_URL = "/api";',
);

fs.writeFileSync(path.join(publicDir, 'index.html'), indexForVercel, 'utf8');
fs.copyFileSync(stylesPath, path.join(publicDir, 'styles.css'));

