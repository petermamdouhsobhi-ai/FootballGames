# ألعاب الكورة (Football Games Hub)

نسخة الموقع الكاملة، جاهزة للنشر على Vercel وربطها بقاعدة بيانات Firebase حقيقية.

## اللي جوه المشروع
- `src/App.jsx` — اللعبة كاملة (6 ألعاب + الداشبورد + اللغتين)، نفس الكود اللي كان شغال جوه Claude.ai
- `src/lib/storage.js` — نفس شكل `window.storage` بتاع Claude، بس بيوجّه:
  - `shared: true` (بيانات مشتركة بين اللاعبين، زي الغرف) → Firebase Realtime Database
  - `shared: false` (بيانات خاصة بالجهاز، زي الحساب المحفوظ) → localStorage بتاع المتصفح
- `src/firebaseConfig.js` — رابط قاعدة البيانات بتاعتك (متظبط بالفعل على مشروع Football-Game)
- `api/claude.js` — Serverless function على Vercel، بتنادي Anthropic API من السيرفر (مش من المتصفح) عشان الـ API key يفضل مخفي

## خطوات النشر على Vercel

### 1. ارفع المشروع على GitHub
```
git init
git add .
git commit -m "أول نسخة من ألعاب الكورة"
```
بعدين اعمل repository جديد على github.com واربطه:
```
git remote add origin https://github.com/USERNAME/football-games.git
git branch -M main
git push -u origin main
```

### 2. استورد المشروع في Vercel
- روح على vercel.com/new
- اختار "Continue with GitHub" (لو لسه مش داخل)
- اختار الـ repository اللي رفعته
- Framework Preset: Vite (بيتعرف تلقائي)
- دوس **Deploy**

### 3. ضيف مفتاح الذكاء الاصطناعي (اختياري بس موصى بيه)
من غيره، تعليق الماتش وأسئلة التريفيا هتتولّد محليًا بشكل أبسط بدل الذكاء الاصطناعي.
- في مشروعك على Vercel: **Settings → Environment Variables**
- ضيف متغير اسمه `ANTHROPIC_API_KEY` وقيمته مفتاحك من console.anthropic.com
- بعد ما تضيفه، اعمل **Redeploy** للمشروع من تاب "Deployments"

### 4. أمّن قاعدة بيانات Firebase (مهم قبل ما تنشرها لناس كتير)
دلوقتي الـ Database شغالة في "test mode" يعني أي حد يقدر يقرا/يكتب فيها. قبل ما توزّع اللينك على ناس كتير:
- روح Firebase Console → Realtime Database → **Rules**
- استبدل القواعد بـ:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
(دي بس تفعيل صريح، القيم الافتراضية في test mode بتخلص بعد 30 يوم — لو عايز حماية أقوى تربط Authentication، قول لكلود يظبطهالك لما تحتاجها)

## تشغيل محلي (على جهازك، قبل النشر)
```
npm install
npm run dev
```

## ملاحظات
- كل اللاعبين اللي بيدخلوا على اللينك بيشتركوا في نفس قاعدة البيانات (Firebase)، يعني أي حد معاه اللينك يقدر يلعب مع أي حد تاني.
- الـ Quick Match (لعب مع حد عشوائي من غير كود غرفة) لسه مش مضافة في النسخة دي — خطوة جاية.
