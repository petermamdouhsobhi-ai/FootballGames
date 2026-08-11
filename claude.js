// اختياري بس - مش لازم عشان اللعبة تشتغل.
// من غيره، تعليق المباراة هيتولّد محليًا (localCommentary جوه App.jsx) بدل الذكاء الاصطناعي.
//
// لو عايز تعليق حقيقي من Claude، وعايز تستضيف الموقع على Vercel (مش GitHub Pages العادي):
// 1) سمّي الملف ده api/claude.js (احذف .example)
// 2) في Vercel، ضيف Environment Variable اسمها ANTHROPIC_API_KEY بمفتاحك من console.anthropic.com
// 3) ده بيشتغل كـ serverless function تلقائي على Vercel، ومفتاحك بيفضل مخفي وماينزلش للمتصفح

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.status(response.status).json(data);
}
