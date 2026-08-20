#!/usr/bin/env node
/**
 * בונה גרסה עצמאית לחלוטין של הדף לפרסום כקישור לשיתוף.
 *
 * למה זה צריך להתקיים: סביבת הפרסום חוסמת בקשות לשרתים חיצוניים,
 * ולכן הקישור ל-Google Fonts נכשל שם בשקט והעיצוב מתקלקל, וקובץ
 * סרגל הנגישות הנפרד לא נטען כלל. הסקריפט מטמיע את שניהם בקובץ אחד.
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

/* הרכיב קורא את הגדרותיו מ-document.currentScript.dataset. בהטמעה ישירה
   בגוף הדף אין תגית סקריפט חיצונית, ולכן ההגדרות מוזרקות לפניו כאובייקט. */
const inlineWidget = (attrs) => {
  const js = fs.readFileSync(path.join(dir, 'a11y-widget.js'), 'utf8');
  const cfg = {};
  attrs.replace(/data-([a-z]+)="([^"]*)"/g, (_, k, v) => { cfg[k] = v.replace(/&quot;/g, '"'); });
  // המפרש סוגר בלוק סקריפט על כל "</script>" שהוא פוגש, גם בתוך הערה.
  // הערת ההסבר שבראש הרכיב מכילה דוגמת הטמעה כזו, ולכן היא נחצית.
  const safe = js.replace(/<\/script>/gi, '<\\/script>');
  return '<script>\nwindow.__a11ywCfg = ' + JSON.stringify(cfg) + ';\n' + safe + '\n</script>';
};

let out = src
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
  .replace('<style>', '<style>' + fontCss)
  .replace(/<title>[^<]*<\/title>/, '<title>קבוצת המוזיל</title>')
  // תמונת השיתוף היא קובץ נפרד ולא קיימת בגרסה של קובץ בודד
  .replace(/^.*(og:image|twitter:image).*$\r?\n?/gm, '')
  .replace(/<script src="a11y-widget\.js"([^>]*)><\/script>/, (m, attrs) => inlineWidget(attrs));

fs.writeFileSync(path.join(dir, 'artifact.html'), out, 'utf8');

const kb = (n) => Math.round(n / 1024) + 'KB';
const ok = (c) => (c ? 'כן' : 'לא ❌');
console.log(`✓ artifact.html נוצר — ${kb(Buffer.byteLength(out))}`);
console.log(`  גופנים מוטמעים: ${ok(out.includes('data:font/woff2'))}`);
console.log(`  סרגל הנגישות מוטמע: ${ok(out.includes('__a11yWidget'))}`);
// הערות הקוד מוסרות לפני הבדיקה: הערת ההסבר שבראש קובץ הרכיב מכילה
// דוגמת הטמעה עם src, והיא הייתה נספרת בטעות כקישור חיצוני אמיתי
const stripped = out.replace(/\/\*[\s\S]*?\*\//g, '');
const external = /https:\/\/fonts\./.test(stripped) || /<script[^>]+src=/.test(stripped);
console.log(`  נותרו קישורים חיצוניים: ${external ? 'כן ❌' : 'לא'}`);
