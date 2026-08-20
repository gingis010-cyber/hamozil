#!/usr/bin/env node
/**
 * בונה גרסה עצמאית לחלוטין של הדף לפרסום כקישור לשיתוף.
 *
 * למה זה צריך להתקיים: סביבת הפרסום חוסמת בקשות לשרתים חיצוניים,
 * ולכן הקישור ל-Google Fonts נכשל שם בשקט והעיצוב מתקלקל.
 * הסקריפט מחליף אותו בגופנים מוטמעים (base64) מתוך תיקיית fonts/.
 *
 * שימוש:  node build-artifact.js  →  יוצר artifact.html
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const src = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

const embed = (file) =>
  fs.readFileSync(path.join(dir, 'fonts', file)).toString('base64');

const fontCss = `
  /* גופנים עבריים מוטמעים — ללא תלות בשרת חיצוני */
  @font-face{
    font-family:'Assistant'; font-style:normal; font-weight:100 900; font-display:swap;
    src:url(data:font/woff2;base64,${embed('assistant-he.woff2')}) format('woff2');
  }
  @font-face{
    font-family:'Frank Ruhl Libre'; font-style:normal; font-weight:100 900; font-display:swap;
    src:url(data:font/woff2;base64,${embed('frank-he.woff2')}) format('woff2');
  }
`;

let out = src
  // הסרת הקישורים החיצוניים לגופנים
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
  // הזרקת הגופנים המוטמעים בראש גיליון הסגנון
  .replace('<style>', '<style>' + fontCss)
  // שם קצר לגלריית הפרסום
  .replace(/<title>[^<]*<\/title>/, '<title>קבוצת המוזיל</title>')
  // תמונת השיתוף היא קובץ נפרד ולא קיימת בגרסה של קובץ בודד
  .replace(/^.*(og:image|twitter:image).*$\n?/gm, '');

fs.writeFileSync(path.join(dir, 'artifact.html'), out, 'utf8');

const kb = (n) => Math.round(n / 1024) + 'KB';
console.log(`✓ artifact.html נוצר — ${kb(Buffer.byteLength(out))}`);
console.log(`  גופנים מוטמעים: ${out.includes('data:font/woff2') ? 'כן' : 'לא ❌'}`);
console.log(`  נותרו קישורים חיצוניים: ${/https:\/\/fonts\./.test(out) ? 'כן ❌' : 'לא'}`);
