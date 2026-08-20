/*! ============================================================================
 *  סרגל נגישות — קבוצת המוזיל / בקלות
 *  ----------------------------------------------------------------------------
 *  קובץ אחד, ללא תלויות, ללא קריאות רשת. מזריק בעצמו את העיצוב, את הכפתור,
 *  את הסרגל ואת כל הלוגיקה. ההטמעה באתר חדש היא שורה אחת:
 *
 *      <script src="a11y-widget.js" defer></script>
 *
 *  התאמה אישית (לא חובה) דרך data- על תגית הסקריפט:
 *      data-side="right|left"   — צד הכפתור (ברירת מחדל right)
 *      data-color="#0D6B54"     — צבע המותג (הכפתור עצמו כחול קבוע)
 *      data-statement="#..."    — סלקטור שלחיצה עליו פותחת את הצהרת הנגישות
 *      data-lang="he"
 *
 *  ההעדפות נשמרות ב-localStorage וחוזרות בביקור הבא.
 *  ============================================================================ */
(function () {
  'use strict';
  if (window.__a11yWidget) return;          // הגנה מפני הטמעה כפולה
  window.__a11yWidget = true;

  /* בהטמעה כקובץ חיצוני ההגדרות מגיעות מתגית הסקריפט; כשהרכיב מוטמע
     ישירות בגוף הדף אין currentScript.dataset, ואז הן מגיעות מהאובייקט
     שהוזרק לפניו על ידי סקריפט הבנייה. */
  var S   = document.currentScript || {};
  var D   = window.__a11ywCfg || (S.dataset || {});
  var SIDE  = D.side === 'left' ? 'left' : 'right';
  var BRAND = D.color || '#0D6B54';
  /* כפתור הנגישות כחול תמיד, בכל אתר ובלי תלות בצבע המותג. הכחול הוא
     הצבע המזוהה עם סמל הנגישות הבינלאומי, וגולש שמחפש את הסרגל מזהה
     אותו מיד. #005A9C נותן ניגודיות 7.14:1 מול הסמל הלבן — רמה AAA. */
  var A11Y_BLUE = '#005A9C';
  var STMT  = D.statement || '[data-doc="doc-a11y"]';
  var KEY   = 'a11y-widget-state';

  /* --------------------------------------------------------------------------
   *  1. מה הסרגל יודע לעשות
   *  ------------------------------------------------------------------------ */

  /* מצבים בינאריים — כל אחד הוא class על אלמנט השורש */
  var TOGGLES = [
    { id:'contrast',  label:'ניגודיות כהה',    ico:'◐', group:'color', off:['light','invert'] },
    { id:'light',     label:'ניגודיות בהירה',  ico:'☀', group:'color', off:['contrast','invert'] },
    { id:'invert',    label:'היפוך צבעים',     ico:'⧉', group:'color', off:['contrast','light'] },
    { id:'mono',      label:'גווני אפור',      ico:'◑', group:'color', off:['sat'] },
    { id:'sat',       label:'רוויה נמוכה',     ico:'◔', group:'color', off:['mono'] },

    { id:'readable',  label:'גופן קריא',       ico:'א', group:'text' },
    { id:'dyslexia',  label:'התאמה לדיסלקציה', ico:'ﬡ', group:'text' },
    { id:'space',     label:'ריווח שורות',     ico:'↕', group:'text' },
    { id:'letter',    label:'ריווח אותיות',    ico:'⇿', group:'text' },
    { id:'align',     label:'יישור לצד אחד',   ico:'≡', group:'text' },

    { id:'links',     label:'הדגשת קישורים',   ico:'🔗', group:'nav' },
    { id:'titles',    label:'הדגשת כותרות',    ico:'❏', group:'nav' },
    { id:'focus',     label:'סימון מיקוד',     ico:'⌨', group:'nav' },
    { id:'motion',    label:'עצירת אנימציות',  ico:'⏸', group:'nav' },
    { id:'cursorB',   label:'סמן גדול שחור',   ico:'➤', group:'nav', off:['cursorW'] },
    { id:'cursorW',   label:'סמן גדול לבן',    ico:'➢', group:'nav', off:['cursorB'] },

    { id:'guide',     label:'סרגל קריאה',      ico:'▬', group:'read' },
    { id:'mask',      label:'מסכת קריאה',      ico:'▤', group:'read' },
    { id:'speak',     label:'הקראת טקסט',      ico:'🔊', group:'read' },
  ];

  /* פרופילים — לחיצה אחת שמדליקה כמה מצבים יחד */
  var PROFILES = [
    { id:'vision',   label:'לקוי ראייה',        ico:'👁', font:3, modes:['contrast','links','titles','space'] },
    { id:'dyslexic', label:'דיסלקציה',          ico:'ﬡ',  font:1, modes:['dyslexia','space','letter','guide','align'] },
    { id:'adhd',     label:'קשב וריכוז',        ico:'◎',  font:0, modes:['mask','motion','links'] },
    { id:'blindish', label:'עיוורון צבעים',     ico:'◑',  font:0, modes:['mono','links','titles'] },
    { id:'keyboard', label:'ניווט מקלדת',       ico:'⌨',  font:0, modes:['focus','links','motion'] },
    { id:'epilepsy', label:'רגישות לפרכוסים',   ico:'⚡', font:0, modes:['motion','sat'] },
  ];

  var GROUPS = [
    { id:'color', title:'צבע וניגודיות' },
    { id:'text',  title:'טקסט וקריאות' },
    { id:'nav',   title:'ניווט והדגשה' },
    { id:'read',  title:'עזרי קריאה' },
  ];

  var FONT_STEPS = [1, 1.14, 1.28, 1.45];   // מכפילי גודל טקסט

  /* --------------------------------------------------------------------------
   *  2. העיצוב
   *  ------------------------------------------------------------------------ */
  /* שרשרת ההחרגה של הסרגל עצמו: בכל מצב צבע הוא חייב להישאר קריא,
     ולכן אף כלל גורף לא נוגע בו. */
  var EX = ':not(svg):not(path):not(rect):not(text)' +
           ':not(.a11yw-panel):not(.a11yw-panel *):not(.a11yw-btn):not(.a11yw-btn *)';

  var CSS = `
:root{--a11y-brand:${BRAND}; --a11y-blue:${A11Y_BLUE}}

/* ---------- הכפתור הצף ---------- */
.a11yw-btn{
  position:fixed; inset-block-end:var(--a11yw-offset,20px); ${SIDE}:20px; z-index:2147483000;
  width:56px; height:56px; border-radius:50%; border:2px solid #fff; padding:0; cursor:pointer;
  background:var(--a11y-blue); color:#fff; display:grid; place-items:center;
  box-shadow:0 4px 20px rgba(0,0,0,.3); font-family:inherit;
}
.a11yw-btn:hover{filter:brightness(1.12)}
.a11yw-btn:focus-visible{outline:3px solid #C08A1E; outline-offset:3px}
.a11yw-btn svg{width:32px; height:32px; display:block}

/* ---------- הסרגל ---------- */
.a11yw-panel{
  position:fixed; inset-block:0; ${SIDE}:0; z-index:2147483001; width:342px; max-width:92vw;
  background:#fff; color:#15201D; box-shadow:0 0 46px rgba(0,0,0,.3);
  display:flex; flex-direction:column; transform:translateX(${SIDE === 'right' ? '105%' : '-105%'});
  transition:transform .28s ease; font:400 15px/1.5 Assistant,Arial,Helvetica,sans-serif;
}
.a11yw-panel.is-open{transform:none}
.a11yw-panel *{box-sizing:border-box}
.a11yw-head{
  background:var(--a11y-blue); color:#fff; padding:16px 18px;
  display:flex; align-items:center; justify-content:space-between; gap:12px; flex:none;
}
.a11yw-head h2{margin:0; font-size:19px; font-weight:700; color:#fff}
.a11yw-head p{margin:2px 0 0; font-size:12.5px; opacity:.85}
.a11yw-x{
  width:36px; height:36px; flex:none; border-radius:9px; cursor:pointer;
  background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.5);
  color:#fff; font-size:18px; line-height:1; font-family:inherit;
}
.a11yw-x:hover{background:rgba(255,255,255,.3)}
.a11yw-x:focus-visible{outline:3px solid #FFD34D; outline-offset:2px}

.a11yw-body{overflow-y:auto; padding:14px; flex:1; -webkit-overflow-scrolling:touch}

/* ---------- מד גודל הטקסט ---------- */
.a11yw-size{
  display:flex; align-items:center; gap:10px; background:#F4F1EB;
  border:1px solid #E1DCD2; border-radius:12px; padding:10px 12px; margin-bottom:14px;
}
.a11yw-size .lbl{flex:1; font-weight:700; font-size:14px}
.a11yw-size .lvl{display:block; font-size:12.5px; color:#5D6B66; font-weight:700; margin-top:1px}
.a11yw-step{
  width:36px; height:36px; flex:none; border-radius:9px; cursor:pointer; font-family:inherit;
  border:2px solid #D6D0C4; background:#fff; font-size:17px; font-weight:700; color:#15201D;
}
.a11yw-step:hover{border-color:var(--a11y-brand)}
.a11yw-step:disabled{opacity:.35; cursor:not-allowed}
.a11yw-step:focus-visible{outline:3px solid #C08A1E; outline-offset:2px}

/* ---------- כותרות מקטע ---------- */
.a11yw-sec{
  font-size:11.5px; font-weight:700; letter-spacing:.09em; color:#5D6B66;
  margin:16px 2px 8px; text-transform:none;
}
.a11yw-sec:first-of-type{margin-top:0}

/* ---------- אריחים ---------- */
.a11yw-grid{display:grid; grid-template-columns:1fr 1fr; gap:8px}
.a11yw-opt{
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
  min-height:74px; padding:9px 6px; text-align:center; cursor:pointer; font-family:inherit;
  background:#F8F6F2; border:2px solid #E1DCD2; border-radius:12px;
  font-size:12.5px; font-weight:700; color:#15201D; line-height:1.25;
}
.a11yw-opt .i{font-size:19px; line-height:1}
.a11yw-opt:hover{border-color:var(--a11y-brand)}
.a11yw-opt:focus-visible{outline:3px solid #C08A1E; outline-offset:2px}
.a11yw-opt[aria-pressed="true"]{background:var(--a11y-brand); border-color:var(--a11y-brand); color:#fff}
.a11yw-prof[aria-pressed="true"]{box-shadow:inset 0 0 0 2px #fff}

/* ---------- תחתית ---------- */
.a11yw-foot{flex:none; border-top:1px solid #E1DCD2; padding:12px 14px; background:#FAF8F4}
.a11yw-reset{
  width:100%; padding:11px; border-radius:10px; cursor:pointer; font-family:inherit;
  border:2px dashed #D6D0C4; background:#fff; font-size:14px; font-weight:700; color:#5D6B66;
}
.a11yw-reset:hover{border-color:var(--a11y-brand); color:var(--a11y-brand)}
.a11yw-reset:focus-visible{outline:3px solid #C08A1E; outline-offset:2px}
.a11yw-stmt{
  display:block; width:100%; margin-top:9px; padding:0; border:0; background:none; cursor:pointer;
  font:inherit; font-size:13.5px; font-weight:700; color:var(--a11y-brand);
  text-decoration:underline; text-underline-offset:3px; text-align:center;
}
.a11yw-note{margin:9px 0 0; font-size:12px; color:#7A857F; text-align:center; line-height:1.5}

/* ---------- שכבת רקע ---------- */
.a11yw-veil{
  position:fixed; inset:0; z-index:2147482999; background:rgba(20,32,29,.42);
  opacity:0; visibility:hidden; transition:opacity .25s, visibility .25s;
}
.a11yw-veil.is-open{opacity:1; visibility:visible}

/* ---------- עזרי קריאה ---------- */
.a11yw-guide{
  position:fixed; ${SIDE === 'right' ? 'right' : 'left'}:0; left:0; right:0; height:14px; z-index:2147482998;
  background:rgba(13,107,84,.28); border-block:2px solid var(--a11y-brand);
  pointer-events:none; display:none;
}
html.a11y-guide .a11yw-guide{display:block}
.a11yw-mask{position:fixed; inset:0; z-index:2147482997; pointer-events:none; display:none}
html.a11y-mask .a11yw-mask{display:block}
.a11yw-mask i{position:absolute; left:0; right:0; background:rgba(0,0,0,.72); display:block}

@media (max-width:420px){
  .a11yw-panel{width:100%; max-width:100%}
  .a11yw-btn{width:50px; height:50px}
  .a11yw-btn svg{width:28px; height:28px}
}

/* ==========================================================================
   המצבים עצמם — כולם class על אלמנט השורש
   ========================================================================== */

/* גודל טקסט: כל גודל גופן בעמוד המארח נגזר מ---ts אם הוגדר כך;
   אחרת מוחל כאן מנגנון גיבוי שמגדיל את הטקסט בלי לגעת בפריסה. */
html.a11y-ts-1{--ts:1.14} html.a11y-ts-2{--ts:1.28} html.a11y-ts-3{--ts:1.45}
html.a11y-ts-fallback-1 body{font-size:114%}
html.a11y-ts-fallback-2 body{font-size:128%}
html.a11y-ts-fallback-3 body{font-size:145%}

html.a11y-readable *:not(.a11yw-panel):not(.a11yw-panel *){
  font-family:Arial,Helvetica,sans-serif !important; letter-spacing:normal !important;
}
html.a11y-dyslexia *:not(.a11yw-panel):not(.a11yw-panel *){
  font-family:"Comic Sans MS","Trebuchet MS",Verdana,Arial,sans-serif !important;
  font-weight:600 !important; word-spacing:.16em !important;
}
html.a11y-space p,html.a11y-space li,html.a11y-space td,html.a11y-space dd,
html.a11y-space .lead,html.a11y-space .doc{line-height:2.15 !important}
html.a11y-letter p,html.a11y-letter li,html.a11y-letter td,
html.a11y-letter .lead,html.a11y-letter .doc{letter-spacing:.075em !important; word-spacing:.16em !important}
html.a11y-align p,html.a11y-align li,html.a11y-align .lead,html.a11y-align .doc{text-align:start !important}

html.a11y-links a:not(.a11yw-btn):not(.a11yw-stmt){
  text-decoration:underline !important; text-underline-offset:3px !important; font-weight:700 !important;
}
html.a11y-titles h1,html.a11y-titles h2,html.a11y-titles h3,
html.a11y-titles h4,html.a11y-titles summary{
  outline:2px dashed var(--a11y-brand) !important; outline-offset:4px !important;
}
html.a11y-focus :focus{outline:4px solid #C08A1E !important; outline-offset:3px !important}
html.a11y-motion *,html.a11y-motion *::before,html.a11y-motion *::after{
  animation:none !important; transition:none !important; scroll-behavior:auto !important;
}
html.a11y-cursorB,html.a11y-cursorB *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M6 3 L6 35 L14 27 L19 40 L27 37 L21 24 L33 24 Z' fill='%23000' stroke='%23fff' stroke-width='2.5'/%3E%3C/svg%3E") 5 3,auto !important}
html.a11y-cursorW,html.a11y-cursorW *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M6 3 L6 35 L14 27 L19 40 L27 37 L21 24 L33 24 Z' fill='%23fff' stroke='%23000' stroke-width='2.5'/%3E%3C/svg%3E") 5 3,auto !important}

html.a11y-mono body{filter:grayscale(1)}
html.a11y-sat  body{filter:saturate(.45)}
html.a11y-invert body{filter:invert(1) hue-rotate(180deg)}
html.a11y-invert img,html.a11y-invert video,html.a11y-invert svg{filter:invert(1) hue-rotate(180deg)}
/* הסרגל עצמו חייב להישאר קריא בכל מצב צבע */
html.a11y-invert .a11yw-panel,html.a11y-invert .a11yw-btn{filter:invert(1) hue-rotate(180deg)}

/* ניגודיות כהה ובהירה.
   הכלל הצובע חייב להיות גורף, כי משטחים רבים בעמוד המארח צבועים ישירות
   ולא דרך משתנה. אבל אז גם כללי ההדגשה (כותרת צהובה, קישור צהוב) חייבים
   סגוליות גבוהה ממנו, אחרת הם נבלעים — ולכן שניהם נושאים את אותה שרשרת
   החרגה, ולכלל ההדגשה יש בורר :is נוסף שמכריע. הגוף מוחרג במפורש,
   שאחרת רקע השחור היה מתאפס והטקסט הלבן היה נעלם ברקע לבן. */
html.a11y-contrast *${EX}:not(body){
  background-color:transparent !important; color:#FFF !important;
  border-color:#FFF !important; box-shadow:none !important; text-shadow:none !important;
}
html.a11y-contrast,html.a11y-contrast body{background-color:#000 !important; color:#FFF !important}
html.a11y-contrast :is(a,b,strong,summary,h1,h2,h3,.btn)${EX}{color:#FFEB3B !important}
html.a11y-contrast :is(input,textarea,select,details,.btn)${EX}{
  background-color:#000 !important; border:2px solid #FFF !important;
}

html.a11y-light *${EX}:not(body){
  background-color:transparent !important; color:#000 !important;
  border-color:#000 !important; box-shadow:none !important;
}
html.a11y-light,html.a11y-light body{background-color:#FFF !important; color:#000 !important}
html.a11y-light :is(a,summary,.btn)${EX}{color:#00309E !important}
html.a11y-light :is(input,textarea,select,details,.btn)${EX}{
  background-color:#FFF !important; border:2px solid #000 !important;
}

/* קורא מסך בלבד */
.a11yw-sr{position:absolute!important; width:1px; height:1px; margin:-1px; padding:0;
  overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0}

@media (prefers-reduced-motion:reduce){
  .a11yw-panel,.a11yw-veil{transition:none}
}`;

  /* --------------------------------------------------------------------------
   *  3. בניית ה-DOM
   *  ------------------------------------------------------------------------ */
  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' +
    '<circle cx="12" cy="3.8" r="2"/>' +
    '<path d="M20.4 7.1a1.1 1.1 0 0 0-1.3-.8l-4.6 1a10.6 10.6 0 0 1-5 0l-4.6-1a1.1 1.1 0 1 0-.5 2.1l4.3 1v3.2l-2 6.9a1.1 1.1 0 0 0 2.1.6L12 15l3.2 5.1a1.1 1.1 0 0 0 2.1-.6l-2-6.9V9.4l4.3-1a1.1 1.1 0 0 0 .8-1.3z"/></svg>';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var style = el('style');
  style.textContent = CSS;

  var btn = el('button', 'a11yw-btn', ICON);
  btn.id = 'a11ywBtn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'פתיחת סרגל הנגישות');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'a11ywPanel');
  btn.title = 'נגישות';

  var veil  = el('div', 'a11yw-veil');
  var guide = el('div', 'a11yw-guide');
  var mask  = el('div', 'a11yw-mask', '<i class="top"></i><i class="bot"></i>');

  var panel = el('aside', 'a11yw-panel');
  panel.id = 'a11ywPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', 'סרגל נגישות');
  panel.setAttribute('dir', 'rtl');
  panel.hidden = true;

  var tile = function (cls, o) {
    return '<button type="button" class="a11yw-opt ' + cls + '" data-id="' + o.id +
           '" aria-pressed="false"><span class="i" aria-hidden="true">' + o.ico +
           '</span>' + o.label + '</button>';
  };

  var html =
    '<div class="a11yw-head">' +
      '<div><h2>נגישות</h2><p>הבחירה נשמרת לביקור הבא</p></div>' +
      '<button type="button" class="a11yw-x" aria-label="סגירת סרגל הנגישות">✕</button>' +
    '</div>' +
    '<div class="a11yw-body">' +
      '<div class="a11yw-size">' +
        '<button type="button" class="a11yw-step" data-step="-1" aria-label="הקטנת הטקסט">−</button>' +
        '<div class="lbl">גודל הטקסט<span class="lvl" id="a11ywLvl">רגיל</span></div>' +
        '<button type="button" class="a11yw-step" data-step="1" aria-label="הגדלת הטקסט">+</button>' +
      '</div>' +
      '<div class="a11yw-sec">התאמה מהירה לפי צורך</div>' +
      '<div class="a11yw-grid">' + PROFILES.map(function (p) { return tile('a11yw-prof', p); }).join('') + '</div>' +
      GROUPS.map(function (g) {
        return '<div class="a11yw-sec">' + g.title + '</div><div class="a11yw-grid">' +
          TOGGLES.filter(function (t) { return t.group === g.id; }).map(function (t) { return tile('a11yw-tog', t); }).join('') +
          '</div>';
      }).join('') +
    '</div>' +
    '<div class="a11yw-foot">' +
      '<button type="button" class="a11yw-reset">↺ איפוס כל ההגדרות</button>' +
      '<button type="button" class="a11yw-stmt" hidden>הצהרת הנגישות של האתר</button>' +
      '<p class="a11yw-note">נתקלתם ברכיב שאינו נגיש? נשמח שתעדכנו אותנו.</p>' +
    '</div>';
  panel.innerHTML = html;

  var live = el('div', 'a11yw-sr');
  live.setAttribute('aria-live', 'polite');

  function mount() {
    document.head.appendChild(style);
    [veil, guide, mask, btn, panel, live].forEach(function (n) { document.body.appendChild(n); });
    wire();
    apply();
  }

  /* --------------------------------------------------------------------------
   *  4. מצב ושמירה
   *  ------------------------------------------------------------------------ */
  var state = { font: 0, modes: [], profile: null };
  var ids = TOGGLES.map(function (t) { return t.id; });

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved && typeof saved === 'object') {
      state.font    = Math.min(FONT_STEPS.length - 1, Math.max(0, +saved.font || 0));
      state.modes   = Array.isArray(saved.modes) ? saved.modes.filter(function (m) { return ids.indexOf(m) > -1; }) : [];
      state.profile = typeof saved.profile === 'string' ? saved.profile : null;
    }
  } catch (e) { /* אחסון חסום (גלישה פרטית) — ממשיכים בברירת מחדל */ }

  /* האם העמוד המארח בנוי על המשתנה --ts? אם כן מגדילים דרכו, כי כך
     הפריסה נשמרת. אם לא — מנגנון הגיבוי מגדיל את גופן הבסיס. */
  var usesTs = false;
  try {
    usesTs = /var\(--ts/.test([].slice.call(document.styleSheets).map(function (sh) {
      try { return [].slice.call(sh.cssRules).map(function (r) { return r.cssText; }).join(''); }
      catch (e) { return ''; }
    }).join(''));
  } catch (e) {}

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function apply() {
    var root = document.documentElement;

    for (var i = 1; i < FONT_STEPS.length; i++) {
      root.classList.toggle('a11y-ts-' + i, usesTs && state.font === i);
      root.classList.toggle('a11y-ts-fallback-' + i, !usesTs && state.font === i);
    }
    ids.forEach(function (m) { root.classList.toggle('a11y-' + m, state.modes.indexOf(m) > -1); });

    panel.querySelectorAll('.a11yw-tog').forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.modes.indexOf(b.dataset.id) > -1));
    });
    panel.querySelectorAll('.a11yw-prof').forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.profile === b.dataset.id));
    });

    var names = ['רגיל', 'גדול', 'גדול יותר', 'הכי גדול'];
    panel.querySelector('#a11ywLvl').textContent = names[state.font];
    panel.querySelector('[data-step="-1"]').disabled = state.font === 0;
    panel.querySelector('[data-step="1"]').disabled  = state.font === FONT_STEPS.length - 1;

    if (state.modes.indexOf('speak') === -1 && window.speechSynthesis) speechSynthesis.cancel();

    save();
  }

  function toggle(id) {
    var def = TOGGLES.filter(function (t) { return t.id === id; })[0];
    var at  = state.modes.indexOf(id);
    if (at > -1) {
      state.modes.splice(at, 1);
    } else {
      /* מצבים סותרים מכבים זה את זה — אי אפשר גם כהה וגם בהיר */
      (def && def.off || []).forEach(function (o) {
        var j = state.modes.indexOf(o);
        if (j > -1) state.modes.splice(j, 1);
      });
      state.modes.push(id);
    }
    state.profile = null;
    apply();
    announce((def ? def.label : id) + (at > -1 ? ' כבוי' : ' דלוק'));
  }

  function announce(msg) { live.textContent = msg; }

  /* --------------------------------------------------------------------------
   *  5. חיווט
   *  ------------------------------------------------------------------------ */
  function open(on) {
    panel.hidden = !on;
    /* דחייה של פריים אחד — אחרת המעבר לא מצויר, כי הרכיב עבר
       מ-display:none ישירות למצב הפתוח באותה מסגרת ציור */
    requestAnimationFrame(function () {
      panel.classList.toggle('is-open', on);
      veil.classList.toggle('is-open', on);
    });
    btn.setAttribute('aria-expanded', String(on));
    btn.setAttribute('aria-label', (on ? 'סגירת' : 'פתיחת') + ' סרגל הנגישות');
    if (on) panel.querySelector('.a11yw-x').focus();
    else btn.focus();
  }

  function wire() {
    btn.addEventListener('click', function () { open(panel.hidden); });
    panel.querySelector('.a11yw-x').addEventListener('click', function () { open(false); });
    veil.addEventListener('click', function () { open(false); });

    panel.querySelectorAll('.a11yw-tog').forEach(function (b) {
      b.addEventListener('click', function () { toggle(b.dataset.id); });
    });

    panel.querySelectorAll('.a11yw-prof').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = PROFILES.filter(function (x) { return x.id === b.dataset.id; })[0];
        if (state.profile === p.id) { state = { font: 0, modes: [], profile: null }; }
        else { state = { font: p.font, modes: p.modes.slice(), profile: p.id }; }
        apply();
        announce(state.profile ? 'הופעל פרופיל ' + p.label : 'הפרופיל בוטל');
      });
    });

    panel.querySelectorAll('.a11yw-step').forEach(function (b) {
      b.addEventListener('click', function () {
        state.font = Math.min(FONT_STEPS.length - 1, Math.max(0, state.font + (+b.dataset.step)));
        state.profile = null;
        apply();
        announce('גודל הטקסט: ' + panel.querySelector('#a11ywLvl').textContent);
      });
    });

    panel.querySelector('.a11yw-reset').addEventListener('click', function () {
      state = { font: 0, modes: [], profile: null };
      apply();
      announce('כל הגדרות הנגישות אופסו');
    });

    /* הצהרת נגישות — מוצגת רק אם באמת קיימת בעמוד המארח */
    var link = document.querySelector(STMT);
    var sb = panel.querySelector('.a11yw-stmt');
    if (link) {
      sb.hidden = false;
      sb.addEventListener('click', function () { open(false); link.click(); });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) open(false);
    });

    /* --- סרגל קריאה ומסכת קריאה: עוקבים אחרי הסמן --- */
    document.addEventListener('mousemove', function (e) {
      if (state.modes.indexOf('guide') > -1) guide.style.top = (e.clientY - 7) + 'px';
      if (state.modes.indexOf('mask') > -1) {
        var h = 130;
        mask.querySelector('.top').style.cssText = 'top:0; height:' + Math.max(0, e.clientY - h / 2) + 'px';
        mask.querySelector('.bot').style.cssText = 'top:' + (e.clientY + h / 2) + 'px; bottom:0';
      }
    }, { passive: true });

    /* --- הקראת טקסט: לחיצה על פסקה מקריאה אותה --- */
    document.addEventListener('click', function (e) {
      if (state.modes.indexOf('speak') === -1) return;
      if (e.target.closest('.a11yw-panel, .a11yw-btn')) return;
      var node = e.target.closest('p, li, h1, h2, h3, h4, td, summary, .lead');
      if (!node || !window.speechSynthesis) return;
      e.preventDefault();
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(node.textContent.trim().slice(0, 900));
      u.lang = document.documentElement.lang || 'he-IL';
      u.rate = 0.95;
      speechSynthesis.speak(u);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
