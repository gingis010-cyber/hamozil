# המוזיל — דף נחיתה

מיזם חברתי-עסקי שמאגד עסקים קטנים לכוח קנייה קבוצתי.
קטגוריה ראשונה: **עמלות סליקה**.

## קבצים

| קובץ | מה זה |
|---|---|
| `index.html` | הדף כולו — קובץ אחד עצמאי, כולל CSS, JS ומחשבון. אין תלות בבנייה או בשרת |
| `og-source.html` | המקור של תמונת השיתוף. עורכים אותו ומצלמים מחדש כדי לעדכן |
| `og-image.png` | 1200×630 — התצוגה של הקישור בוואטסאפ ובפייסבוק |

## המודל העסקי כפי שהוא מופיע בדף

- אין דמי הצטרפות, אין דמי מנוי, אין דמי טיפול.
- לא חסכנו — לא גובים כלום.
- חסכנו והעסק עבר: **10% מהחיסכון אלינו, 90% נשארים אצל העסק.**

## מה חייב עדכון לפני פרסום

1. **`WHATSAPP`** ב-`index.html` (בתוך ה-`<script>`) — כרגע `972500000000`, מספר דמה.
   פורמט בינלאומי בלי `+` ובלי אפס מוביל. לדוגמה `0501234567` → `972501234567`.
2. **תגיות `og:image` ו-`og:url`** ב-`<head>` — כרגע נתיבים יחסיים.
   אחרי העלייה לאוויר להחליף לכתובות מלאות, כי וואטסאפ לא תמיד פותר נתיב יחסי.

## החלפת קטגוריה (חשמל / שליחויות / ביטוח)

האובייקט `CATEGORY` בתחתית `index.html` מרכז את מספרי הקטגוריה:

```js
const CATEGORY = {
  name: 'סליקה',
  typicalRate: 0.9,        // מה שעסק בודד מקבל היום
  steps: [0.1, 0.2, 0.3],  // תרחישי ההורדה במחשבון
  ourCut: 0.10             // חלקנו מתוך החיסכון
};
```

בנוסף צריך לעדכן את הטקסטים בגוף ה-HTML שמדברים על סליקה.

## עדכון תמונת השיתוף

```bash
cd "C:/Users/Admin/.claude/skills/see-web"
node -e "const{chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:630}});await p.goto('file:///D:/hamozil/og-source.html',{waitUntil:'networkidle'});await p.waitForTimeout(1500);await p.locator('.card').screenshot({path:'D:/hamozil/og-image.png'});await b.close()})()"
```

## צילום ובדיקה ויזואלית

```bash
cd "C:/Users/Admin/.claude/skills/see-web" && node see.js "D:/hamozil/index.html" --name mozil
```

הוסיפו `--mobile` לתצוגת טלפון, `--sections` לפריסה לפרוסות.
