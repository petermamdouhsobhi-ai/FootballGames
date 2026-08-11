import React, { useState, useEffect, useRef, useCallback, useContext, createContext } from "react";

// ---------- Language (auto-detected from device, English default) ----------
const LangContext = createContext({ lang: "en" });
function useLang() {
  const { lang } = useContext(LangContext);
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  return { lang, dir: lang === "ar" ? "rtl" : "ltr", tr };
}
function detectLang() {
  try {
    const nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return nav.startsWith("ar") ? "ar" : "en";
  } catch { return "en"; }
}

// ---------- Player pool ----------
const RAW_POOL = [
  ["تير شتيجن", "Ter Stegen", "GK", 86], ["أليسون", "Alisson", "GK", 87], ["كورتوا", "Courtois", "GK", 88], ["بونو", "Bounou", "GK", 85],
  ["الشناوي", "El Shenawy", "GK", 80], ["أونانا", "Onana", "GK", 84], ["إيديرسون", "Ederson", "GK", 86], ["نوير", "Neuer", "GK", 87], ["دوناروما", "Donnarumma", "GK", 87],
  ["فان دايك", "Van Dijk", "DEF", 88], ["حكيمي", "Hakimi", "DEF", 87], ["روديجر", "Rüdiger", "DEF", 84], ["ماركينيوس", "Marquinhos", "DEF", 85], ["ميليتاو", "Militão", "DEF", 83],
  ["ألابا", "Alaba", "DEF", 84], ["دياس", "Dias", "DEF", 87], ["سالبا", "Saliba", "DEF", 85], ["أراوخو", "Araújo", "DEF", 85], ["تيو هيرنانديز", "Theo Hernández", "DEF", 86],
  ["تريبير", "Trippier", "DEF", 83], ["كانسيلو", "Cancelo", "DEF", 85], ["كونات", "Konaté", "DEF", 84], ["أوباميكانو", "Upamecano", "DEF", 83], ["جفارديول", "Gvardiol", "DEF", 85],
  ["ووكر", "Walker", "DEF", 83], ["ألكسندر أرنولد", "Alexander-Arnold", "DEF", 86],
  ["دي بروين", "De Bruyne", "MID", 90], ["مودريتش", "Modrić", "MID", 85], ["كروس", "Kroos", "MID", 84], ["رودري", "Rodri", "MID", 90], ["بيدري", "Pedri", "MID", 87],
  ["بيلينجهام", "Bellingham", "MID", 91], ["محرز", "Mahrez", "MID", 84], ["زياش", "Ziyech", "MID", 82], ["إمام عاشور", "Emam Ashour", "MID", 76],
  ["فالفيردي", "Valverde", "MID", 87], ["كامافينجا", "Camavinga", "MID", 84], ["جوندوجان", "Gündoğan", "MID", 85],
  ["مبابي", "Mbappé", "FWD", 95], ["هالاند", "Haaland", "FWD", 94], ["فينيسيوس", "Vinícius Jr.", "FWD", 92], ["ميسي", "Messi", "FWD", 90], ["محمد صلاح", "Mohamed Salah", "FWD", 90],
  ["كين", "Kane", "FWD", 89], ["ليفاندوفسكي", "Lewandowski", "FWD", 88], ["نيمار", "Neymar", "FWD", 87], ["جريزمان", "Griezmann", "FWD", 86], ["بنزيما", "Benzema", "FWD", 87],
  ["أوسيمين", "Osimhen", "FWD", 86], ["كفاراتسخيليا", "Kvaratskhelia", "FWD", 87], ["فودين", "Foden", "FWD", 88], ["ساكا", "Saka", "FWD", 87], ["موسيالا", "Musiala", "FWD", 87],
  ["ساديو ماني", "Sadio Mané", "FWD", 86], ["عمر مرموش", "Omar Marmoush", "FWD", 84], ["تريزيجيه", "Trezeguet", "FWD", 78],
];
const POOL = RAW_POOL.map(([name, nameEn, pos, rating], i) => ({
  id: "p" + i, name, nameEn, pos, rating,
  base: Math.round(((rating - 60) * 6) / 5) * 5,
}));
function pname(p, lang) { return !p ? "" : lang === "ar" ? p.name : (p.nameEn || p.name); }
const POS_LABEL = { GK: "حارس", DEF: "مدافع", MID: "وسط", FWD: "مهاجم" };
const POS_LABEL_EN = { GK: "GK", DEF: "DEF", MID: "MID", FWD: "FWD" };
const POS_COLOR = { GK: "#FFD447", DEF: "#2E8FFF", MID: "#A855F7", FWD: "#FF3B5C" };



// ---------- Coaches pool ----------
const RAW_COACHES = [
  ["جوارديولا", "Guardiola", "هجومي واستحواذي", "Attacking, possession-based", 8],
  ["أنشيلوتي", "Ancelotti", "متزن وخبرة كبيرة", "Balanced, vastly experienced", 8],
  ["كلوب", "Klopp", "ضغط عالي وسرعة", "High press, fast tempo", 7],
  ["سيميوني", "Simeone", "دفاعي صارم", "Strict, defensive", 6],
  ["مورينيو", "Mourinho", "براجماتي ومحكم", "Pragmatic and well-organized", 7],
  ["توخيل", "Tuchel", "منظم تكتيكيًا", "Tactically disciplined", 6],
  ["ناجلسمان", "Nagelsmann", "شبابي وجريء", "Youthful and bold", 6],
  ["ديشامب", "Deschamps", "متوازن", "Balanced", 6],
  ["ساوثجيت", "Southgate", "حذر ومنضبط", "Cautious and disciplined", 5],
  ["تيتي", "Tite", "هجومي برازيلي", "Brazilian attacking flair", 6],
  ["حسين عموتة", "Hussein Ammouta", "خبرة عربية ومرونة تكتيكية", "Arab experience, tactical flexibility", 5],
  ["مارسيل كولر", "Marcel Koller", "دفاعي منظم", "Organized defense", 5],
  ["روي فيتوريا", "Rui Vitória", "هجومي متوسطي", "Mediterranean attacking style", 5],
  ["كوكا", "Cuca", "حماس وضغط", "Passion and pressing", 5],
  ["باتريس بومال", "Patrice Beaumelle", "تكتيكي هادئ", "Calm tactician", 4],
];
const COACHES = RAW_COACHES.map(([name, nameEn, style, styleEn, bonus], i) => ({ id: "c" + i, name, nameEn, style, styleEn, bonus }));
function coachById(id) { return COACHES.find((c) => c.id === id) || null; }
function cname(c, lang) { return !c ? "" : lang === "ar" ? c.name : c.nameEn; }
function cstyle(c, lang) { return !c ? "" : lang === "ar" ? c.style : c.styleEn; }

// ---------- helpers ----------
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id" + Math.random().toString(36).slice(2));
const roomKey = (code) => "ffroom:" + code;
const genCode = () => Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const poisson = (lambda) => { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; };

// بيصحّح أي لاعب ببيانات ناقصة (زي غرف قديمة من نسخ سابقة من الموقع) قبل ما أي كود يستخدمها،
// عشان أي حقل ناقص (squad/coachId/budget) ميوقّعش الكود بدل ما نلاقيه في كل مكان لوحده
function normalizeRoomPlayers(r) {
  if (r && Array.isArray(r.players)) {
    r.players = r.players.map((p) => ({
      squad: [], coachId: null, captainId: null, ready: false, total: 0, budget: r.budget || 0,
      ...p,
      squad: Array.isArray(p.squad) ? p.squad : [],
    }));
  }
  return r;
}
async function getRoom(code) {
  try { const r = await window.storage.get(roomKey(code), true); return r ? normalizeRoomPlayers(JSON.parse(r.value)) : null; }
  catch { return null; }
}
async function setRoom(code, room) {
  await window.storage.set(roomKey(code), JSON.stringify(room), true);
  return room;
}

// ---------- Accounts & scores (shared across every game in the app) ----------
const usersKey = (username) => "users:" + username;
async function getUser(username) {
  try { const r = await window.storage.get(usersKey(username), true); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function setUser(username, data) {
  await window.storage.set(usersKey(username), JSON.stringify(data), true);
  return data;
}
async function addScore(username, delta, label) {
  if (!username || !delta) return;
  const u = await getUser(username);
  if (!u) return;
  u.score = (u.score || 0) + delta;
  u.gamesPlayed = (u.gamesPlayed || 0) + 1;
  u.history = [{ delta, label, at: Date.now() }, ...(u.history || [])].slice(0, 15);
  await setUser(username, u);
}
async function listLeaderboard() {
  try {
    const res = await window.storage.list("users:", true);
    if (!res || !res.keys) return [];
    const users = await Promise.all(res.keys.map(async (k) => {
      try { const r = await window.storage.get(k, true); return r ? JSON.parse(r.value) : null; } catch { return null; }
    }));
    return users.filter(Boolean).sort((a, b) => (b.score || 0) - (a.score || 0));
  } catch { return []; }
}

// ---------- Formation drafting ----------
const FORMATIONS = {
  "4-3-3": { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  "4-4-2": { GK: 1, DEF: 4, MID: 4, FWD: 2 },
};
const PRICE_SCALE = 400; // بيحوّل سعر اللاعب الأساسي (0-210) لرقم واقعي زي رسوم انتقال حقيقية

function neededPositions(quota, squad) {
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  squad.forEach((s) => { if (counts[s.pos] !== undefined) counts[s.pos]++; });
  const needed = Object.keys(quota).filter((pos) => counts[pos] < quota[pos]);
  return needed.length ? needed : Object.keys(quota); // fallback: كل المراكز لو مفيش حاجة محددة ناقصة
}
function pickForPositions(availableIds, positions) {
  const candidates = availableIds.filter((id) => positions.includes(playerById(id)?.pos));
  const pool = candidates.length ? candidates : availableIds;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function newRoom(code, budget, formation, hostId, hostName) {
  return {
    code, budget, formation: FORMATIONS[formation] ? formation : "4-3-3", squadSize: 11, phase: "lobby", stage: "players",
    players: [{ id: hostId, name: hostName, budget, squad: [], coachId: null }],
    availableIds: POOL.map((p) => p.id),
    pool: null,
    poolIndex: 0,
    turnIndex: 0,
    coachPool: null,
    auction: null,
    matches: [],
    createdAt: Date.now(),
  };
}

function playerById(id) { return POOL.find((p) => p.id === id); }

// ---------- Curated real-world data for "خمّن اللاعب" alt modes ----------
// (ids follow RAW_POOL order above: p2 كورتوا، p4 فان دايك، p5 حكيمي، p9 دي بروين، p10 مودريتش، p11 كروس،
//  p15 محرز، p19 مبابي، p20 هالاند، p21 فينيسيوس، p22 ميسي، p23 محمد صلاح، p24 كين، p25 ليفاندوفسكي، p26 نيمار، p27 جريزمان، p28 بنزيما)
const TRANSFERS = {
  p2: [{ club: "خنت", clubEn: "Genk", year: 2009 }, { club: "أتلتيكو مدريد (إعارة)", clubEn: "Atlético Madrid (loan)", year: 2011 }, { club: "تشيلسي", clubEn: "Chelsea", year: 2014 }, { club: "ريال مدريد", clubEn: "Real Madrid", year: 2018 }],
  p4: [{ club: "جرونينجن", clubEn: "Groningen", year: 2011 }, { club: "سيلتيك", clubEn: "Celtic", year: 2013 }, { club: "ساوثهامبتون", clubEn: "Southampton", year: 2015 }, { club: "ليفربول", clubEn: "Liverpool", year: 2018 }],
  p5: [{ club: "ريال مدريد (الأكاديمية)", clubEn: "Real Madrid (academy)", year: 2017 }, { club: "بوروسيا دورتموند (إعارة)", clubEn: "Borussia Dortmund (loan)", year: 2018 }, { club: "إنتر ميلان", clubEn: "Inter Milan", year: 2020 }, { club: "باريس سان جيرمان", clubEn: "Paris Saint-Germain", year: 2021 }],
  p9: [{ club: "جينك", clubEn: "Genk", year: 2012 }, { club: "تشيلسي", clubEn: "Chelsea", year: 2012 }, { club: "فولفسبورج", clubEn: "Wolfsburg", year: 2014 }, { club: "مانشستر سيتي", clubEn: "Manchester City", year: 2015 }],
  p10: [{ club: "دينامو زغرب", clubEn: "Dinamo Zagreb", year: 2005 }, { club: "توتنهام", clubEn: "Tottenham", year: 2008 }, { club: "ريال مدريد", clubEn: "Real Madrid", year: 2012 }],
  p11: [{ club: "بايرن ميونخ", clubEn: "Bayern Munich", year: 2007 }, { club: "ريال مدريد", clubEn: "Real Madrid", year: 2014 }],
  p15: [{ club: "لوهافر", clubEn: "Le Havre", year: 2011 }, { club: "لستر سيتي", clubEn: "Leicester City", year: 2014 }, { club: "مانشستر سيتي", clubEn: "Manchester City", year: 2018 }, { club: "الأهلي السعودي", clubEn: "Al-Ahli Saudi", year: 2023 }],
  p19: [{ club: "موناكو", clubEn: "Monaco", year: 2015 }, { club: "باريس سان جيرمان", clubEn: "Paris Saint-Germain", year: 2017 }, { club: "ريال مدريد", clubEn: "Real Madrid", year: 2024 }],
  p20: [{ club: "مولده النرويجي", clubEn: "Molde (Norway)", year: 2016 }, { club: "ريد بول سالزبورج", clubEn: "Red Bull Salzburg", year: 2019 }, { club: "بوروسيا دورتموند", clubEn: "Borussia Dortmund", year: 2020 }, { club: "مانشستر سيتي", clubEn: "Manchester City", year: 2022 }],
  p21: [{ club: "فلامنجو", clubEn: "Flamengo", year: 2017 }, { club: "ريال مدريد", clubEn: "Real Madrid", year: 2018 }],
  p22: [{ club: "برشلونة", clubEn: "Barcelona", year: 2004 }, { club: "باريس سان جيرمان", clubEn: "Paris Saint-Germain", year: 2021 }, { club: "إنتر ميامي", clubEn: "Inter Miami", year: 2023 }],
  p23: [{ club: "المقاولون العرب", clubEn: "Al Mokawloon", year: 2010 }, { club: "بازل", clubEn: "Basel", year: 2012 }, { club: "تشيلسي", clubEn: "Chelsea", year: 2014 }, { club: "روما (إعارة)", clubEn: "Roma (loan)", year: 2015 }, { club: "ليفربول", clubEn: "Liverpool", year: 2017 }],
  p24: [{ club: "توتنهام", clubEn: "Tottenham", year: 2011 }, { club: "بايرن ميونخ", clubEn: "Bayern Munich", year: 2023 }],
  p25: [{ club: "بروسيا دورتموند", clubEn: "Borussia Dortmund", year: 2010 }, { club: "بايرن ميونخ", clubEn: "Bayern Munich", year: 2014 }, { club: "برشلونة", clubEn: "Barcelona", year: 2022 }],
  p26: [{ club: "سانتوس", clubEn: "Santos", year: 2009 }, { club: "برشلونة", clubEn: "Barcelona", year: 2013 }, { club: "باريس سان جيرمان", clubEn: "Paris Saint-Germain", year: 2017 }, { club: "الهلال", clubEn: "Al Hilal", year: 2023 }],
  p27: [{ club: "ريال سوسيداد", clubEn: "Real Sociedad", year: 2009 }, { club: "أتلتيكو مدريد", clubEn: "Atlético Madrid", year: 2014 }, { club: "برشلونة", clubEn: "Barcelona", year: 2019 }, { club: "أتلتيكو مدريد", clubEn: "Atlético Madrid", year: 2021 }],
  p28: [{ club: "ليون", clubEn: "Lyon", year: 2004 }, { club: "ريال مدريد", clubEn: "Real Madrid", year: 2009 }, { club: "الاتحاد السعودي", clubEn: "Al-Ittihad", year: 2023 }],
};
const AWARDS = [
  { playerId: "p22", award: "الكرة الذهبية", awardEn: "Ballon d'Or", year: 2021 },
  { playerId: "p22", award: "الكرة الذهبية", awardEn: "Ballon d'Or", year: 2023 },
  { playerId: "p10", award: "الكرة الذهبية", awardEn: "Ballon d'Or", year: 2018 },
  { playerId: "p28", award: "الكرة الذهبية", awardEn: "Ballon d'Or", year: 2022 },
  { playerId: "p19", award: "الحذاء الذهبي - كأس العالم", awardEn: "World Cup Golden Boot", year: 2022 },
  { playerId: "p23", award: "الحذاء الذهبي الإنجليزي", awardEn: "Premier League Golden Boot", year: 2018 },
  { playerId: "p23", award: "الحذاء الذهبي الإنجليزي", awardEn: "Premier League Golden Boot", year: 2022 },
  { playerId: "p24", award: "هداف الدوري الإنجليزي", awardEn: "Premier League Top Scorer", year: 2017 },
  { playerId: "p24", award: "هداف الدوري الإنجليزي", awardEn: "Premier League Top Scorer", year: 2023 },
  { playerId: "p20", award: "هداف الدوري الإنجليزي", awardEn: "Premier League Top Scorer", year: 2023 },
  { playerId: "p25", award: "The Best - أفضل لاعب في العالم (فيفا)", awardEn: "FIFA The Best Men's Player", year: 2020 },
  { playerId: "p9", award: "أفضل لاعب في الدوري الإنجليزي (PFA)", awardEn: "PFA Players' Player of the Year", year: 2020 },
];
function awardText(a, lang) { return lang === "ar" ? a.award : a.awardEn; }
function clubText(t, lang) { return lang === "ar" ? t.club : t.clubEn; }

// ---------- League Fantasy: per-competition player pools ----------
// Approximate 2026-27 squads for the most recognizable stars per competition.
// Real-world squads shift every transfer window, so these lists are illustrative,
// not official — good enough to draft a fantasy XI and log gameweek stats against.
function mkCompPlayers(prefix, raw) {
  return raw.map(([name, nameEn, pos], i) => ({ id: prefix + i, name, nameEn, pos }));
}
const COMPETITIONS = {
  champions: {
    id: "champions", name: "دوري أبطال أوروبا", nameEn: "Champions League", short: "نخبة نجوم أوروبا", shortEn: "Europe's elite stars",
    players: POOL.map((p) => ({ id: p.id, name: p.name, nameEn: p.nameEn, pos: p.pos })),
  },
  english: {
    id: "english", name: "الدوري الإنجليزي", nameEn: "Premier League", short: "أرسنال، مان سيتي، ليفربول وغيرهم", shortEn: "Arsenal, Man City, Liverpool & more",
    players: mkCompPlayers("PL", [
      ["هالاند", "Haaland", "FWD"], ["ساكا", "Saka", "FWD"], ["كول بالمر", "Cole Palmer", "MID"], ["إيزاك", "Isak", "FWD"], ["برونو فيرنانديز", "Bruno Fernandes", "MID"],
      ["ديكلان رايس", "Declan Rice", "MID"], ["أوديجارد", "Ødegaard", "MID"], ["فان دايك", "Van Dijk", "DEF"], ["ساليبا", "Saliba", "DEF"], ["فودين", "Foden", "FWD"],
      ["رودري", "Rodri", "MID"], ["أليسون", "Alisson", "GK"], ["دايفيد رايا", "David Raya", "GK"], ["محمد صلاح", "Mohamed Salah", "FWD"],
    ]),
  },
  egyptian: {
    id: "egyptian", name: "الدوري المصري", nameEn: "Egyptian League", short: "الأهلي، الزمالك، بيراميدز وغيرهم", shortEn: "Al Ahly, Zamalek, Pyramids & more",
    players: mkCompPlayers("EG", [
      ["تريزيجيه", "Trezeguet", "FWD"], ["أحمد سيد زيزو", "Ahmed Sayed Zizo", "MID"], ["إمام عاشور", "Emam Ashour", "MID"], ["مروان عطية", "Marwan Attia", "MID"],
      ["مهند لاشين", "Mohanad Lashin", "MID"], ["عبدالله السعيد", "Abdallah El Said", "MID"], ["خوان بيزيرا", "Juan Bizerra", "FWD"], ["صلاح محسن", "Salah Mohsen", "FWD"],
      ["عبدالرحيم دغموم", "Abdelrahim Dagmoum", "MID"], ["إبراهيم مايلي", "Ibrahim Mayele", "FWD"], ["محمد الشناوي", "Mohamed El Shenawy", "GK"], ["أحمد فتوح", "Ahmed Fatouh", "DEF"],
      ["محمد شريف", "Mohamed Sherif", "FWD"], ["نبيل عماد دونجا", "Nabil Emad Donga", "MID"],
    ]),
  },
  saudi: {
    id: "saudi", name: "الدوري السعودي", nameEn: "Saudi League", short: "الهلال، النصر، الاتحاد وغيرهم", shortEn: "Al Hilal, Al Nassr, Al Ittihad & more",
    players: mkCompPlayers("SA", [
      ["كريستيانو رونالدو", "Cristiano Ronaldo", "FWD"], ["بنزيما", "Benzema", "FWD"], ["ساديو ماني", "Sadio Mané", "FWD"], ["محرز", "Mahrez", "MID"],
      ["سالم الدوسري", "Salem Al-Dawsari", "MID"], ["ياسين بونو", "Yassine Bounou", "GK"], ["كانتي", "Kanté", "MID"], ["ميتروفيتش", "Mitrović", "FWD"],
      ["بروزوفيتش", "Brozović", "MID"], ["كوليبالي", "Koulibaly", "DEF"], ["روبن نيفيش", "Rúben Neves", "MID"],
    ]),
  },
  spanish: {
    id: "spanish", name: "الدوري الإسباني", nameEn: "La Liga", short: "ريال مدريد، برشلونة، أتلتيكو وغيرهم", shortEn: "Real Madrid, Barcelona, Atlético & more",
    players: mkCompPlayers("ES", [
      ["مبابي", "Mbappé", "FWD"], ["فينيسيوس", "Vinícius Jr.", "FWD"], ["بيلينجهام", "Bellingham", "MID"], ["كورتوا", "Courtois", "GK"],
      ["ليفاندوفسكي", "Lewandowski", "FWD"], ["بيدري", "Pedri", "MID"], ["رافينيا", "Raphinha", "FWD"], ["دي يونج", "De Jong", "MID"],
      ["جريزمان", "Griezmann", "FWD"], ["خوليان ألفاريز", "Julián Álvarez", "FWD"],
    ]),
  },
  italian: {
    id: "italian", name: "الدوري الإيطالي", nameEn: "Serie A", short: "إنتر، ميلان، يوفنتوس ونابولي", shortEn: "Inter, Milan, Juventus & Napoli",
    players: mkCompPlayers("IT", [
      ["لاوتارو مارتينيز", "Lautaro Martínez", "FWD"], ["باريلا", "Barella", "MID"], ["رافاييل لياو", "Rafael Leão", "FWD"], ["مايجنان", "Maignan", "GK"],
      ["فلاهوفيتش", "Vlahović", "FWD"], ["ثيو هيرنانديز", "Theo Hernández", "DEF"], ["باستوني", "Bastoni", "DEF"], ["لوكاكو", "Lukaku", "FWD"],
      ["ماكتوميناي", "McTominay", "MID"], ["زيلينسكي", "Zieliński", "MID"],
    ]),
  },
};
const ALL_COMP_PLAYERS = {};
Object.values(COMPETITIONS).forEach((c) => c.players.forEach((p) => { ALL_COMP_PLAYERS[p.id] = p; }));
function compPlayerById(id) { return ALL_COMP_PLAYERS[id]; }
function cpname(p, lang) { return !p ? "" : lang === "ar" ? p.name : (p.nameEn || p.name); }
function compName(c, lang) { return !c ? "" : lang === "ar" ? c.name : c.nameEn; }
function compShort(c, lang) { return !c ? "" : lang === "ar" ? c.short : c.shortEn; }

function goalPoints(pid) {
  const p = compPlayerById(pid);
  if (!p) return 4;
  if (p.pos === "DEF" || p.pos === "GK") return 6;
  if (p.pos === "MID") return 5;
  return 4;
}
function cleanSheetPoints(pid) {
  const p = compPlayerById(pid);
  if (!p) return 0;
  if (p.pos === "DEF" || p.pos === "GK") return 4;
  if (p.pos === "MID") return 1;
  return 0;
}
function computeGwPoints(squadIds, captainId, events) {
  let total = 0;
  squadIds.forEach((pid) => {
    const ev = events.find((e) => e.playerId === pid);
    let pts = 2; // participation
    if (ev) {
      pts += (ev.goals || 0) * goalPoints(pid);
      pts += (ev.assists || 0) * 3;
      if (ev.cleanSheet) pts += cleanSheetPoints(pid);
    }
    if (pid === captainId) pts *= 2;
    total += pts;
  });
  return total;
}

// Simulates one round of real-world-style results across the competition,
// since we're not wired to a live match-data feed.
function simulateGwEvents(comp) {
  const events = [];
  comp.players.forEach((p) => {
    const goalChance = p.pos === "FWD" ? 0.35 : p.pos === "MID" ? 0.2 : 0.05;
    const goals = Math.random() < goalChance ? (Math.random() < 0.2 ? 2 : 1) : 0;
    const assistChance = p.pos === "MID" ? 0.25 : p.pos === "FWD" ? 0.15 : 0.1;
    const assists = Math.random() < assistChance ? 1 : 0;
    const cleanSheet = (p.pos === "DEF" || p.pos === "GK") && Math.random() < 0.35;
    if (goals || assists || cleanSheet) events.push({ playerId: p.id, goals, assists, cleanSheet });
  });
  return events;
}

function localGwSummary(comp, events, gwNum, lang) {
  const scorers = events.filter((e) => e.goals > 0).map((e) => `${cpname(compPlayerById(e.playerId), lang)} (${e.goals})`);
  if (!scorers.length) return lang === "ar" ? `الجولة ${gwNum}: جولة هادية من غير أهداف كتير، لكن كذا مدافع حافظ على نظافة شباكه.` : `Gameweek ${gwNum}: a quiet round without many goals, though a few defenders kept clean sheets.`;
  return lang === "ar" ? `الجولة ${gwNum}: أبرز الهدافين ${scorers.slice(0, 5).join("، ")}.` : `Gameweek ${gwNum}: top scorers were ${scorers.slice(0, 5).join(", ")}.`;
}
async function generateGwSummary(comp, events, gwNum, lang) {
  const scorers = events.filter((e) => e.goals > 0).map((e) => lang === "ar" ? `${cpname(compPlayerById(e.playerId), lang)} سجّل ${e.goals}` : `${cpname(compPlayerById(e.playerId), lang)} scored ${e.goals}`);
  if (!scorers.length) return localGwSummary(comp, events, gwNum, lang);
  const prompt = lang === "ar"
    ? `أنت معلّق رياضي. اكتب جملتين بالعامية المصرية تلخّص أبرز أحداث الجولة ${gwNum} في ${comp.name} الفانتازي، بناءً على: ${scorers.join("، ")}. من غير أي مقدمة أو markdown، نص عادي بس.`
    : `You are a sports commentator. Write two sentences summarizing the highlights of gameweek ${gwNum} in ${comp.nameEn} Fantasy, based on: ${scorers.join(", ")}. No preamble or markdown, plain text only.`;
  try {
    const response = await fetch("/api/claude", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 250, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    return text.trim() || localGwSummary(comp, events, gwNum, lang);
  } catch {
    return localGwSummary(comp, events, gwNum, lang);
  }
}

const lgKey = (code) => "lgroom:" + code;
function normalizeLgPlayers(r) {
  if (r && Array.isArray(r.players)) {
    r.players = r.players.map((p) => ({ squad: [], captainId: null, ready: false, total: 0, ...p, squad: Array.isArray(p.squad) ? p.squad : [] }));
  }
  return r;
}
async function getLgRoom(code) {
  try { const r = await window.storage.get(lgKey(code), true); return r ? normalizeLgPlayers(JSON.parse(r.value)) : null; }
  catch { return null; }
}
async function setLgRoom(code, room) {
  await window.storage.set(lgKey(code), JSON.stringify(room), true);
  return room;
}
function newLgRoom(code, compId, hostId, hostName) {
  return {
    code, compId, phase: "lobby", // lobby | draft | playing
    players: [{ id: hostId, name: hostName, squad: [], captainId: null, ready: false, total: 0 }],
    gameweeks: [],
  };
}

function avgBaseForPos(pos) {
  const list = POOL.filter((p) => p.pos === pos);
  if (!list.length) return 50;
  return Math.round((list.reduce((s, p) => s + p.base, 0) / list.length / 5)) * 5;
}
function makeSlotSequence(totalSlots) {
  const weighted = [];
  POOL.forEach((p) => weighted.push(p.pos));
  const seq = [];
  for (let i = 0; i < totalSlots; i++) seq.push(weighted[Math.floor(Math.random() * weighted.length)]);
  return seq;
}

// ---------- Anthropic call ----------
async function generateMatch(teamA, teamB, scoreA, scoreB, coachA, coachB, lang) {
  const namesA = teamA.squad.map((s) => s.name).join("، ");
  const namesB = teamB.squad.map((s) => s.name).join("، ");
  const isAr = lang !== "en";
  const coachLine = (coachA || coachB)
    ? (isAr
      ? `\nمدرب ${teamA.name}: ${coachA ? coachA.name + " (" + coachA.style + ")" : "بدون مدرب"}. مدرب ${teamB.name}: ${coachB ? coachB.name + " (" + coachB.style + ")" : "بدون مدرب"}. اذكرهم بإيجاز في التقرير لو مناسب.`
      : `\n${teamA.name} coach: ${coachA ? coachA.nameEn + " (" + coachA.styleEn + ")" : "none"}. ${teamB.name} coach: ${coachB ? coachB.nameEn + " (" + coachB.styleEn + ")" : "none"}. Mention them briefly if relevant.`)
    : "";
  const prompt = isAr
    ? `أنت معلّق رياضي محترف. اكتب تقرير مباراة كرة قدم خيالية بالعامية المصرية الحماسية، بين فريق "${teamA.name}" (لاعبوه: ${namesA}) وفريق "${teamB.name}" (لاعبوه: ${namesB}).${coachLine}
النتيجة النهائية يجب أن تكون بالضبط ${scoreA}-${scoreB} لصالح ${scoreA >= scoreB ? teamA.name : teamB.name}.
اختر هدافين من نفس عدد الأهداف من أسماء اللاعبين المذكورين فقط (لا تخترع أسماء جديدة).
رد بصيغة JSON فقط بدون أي نص أو ماركداون قبله أو بعده، بالشكل التالي بالضبط:
{"commentary": "فقرة من 100-150 كلمة تصف أحداث المباراة", "scorers": [{"team":"${teamA.name}","player":"اسم من القائمة","minute":23}], "motm": "اسم لاعب من أحد الفريقين"}`
    : `You are a professional sports commentator. Write an exciting fictional football match report between "${teamA.name}" (squad: ${namesA}) and "${teamB.name}" (squad: ${namesB}).${coachLine}
The final score must be exactly ${scoreA}-${scoreB} in favor of ${scoreA >= scoreB ? teamA.name : teamB.name}.
Pick scorers matching that exact goal count, using only the player names listed (don't invent new names).
Reply with JSON only, no extra text or markdown, in exactly this shape:
{"commentary": "a 100-150 word paragraph describing the match", "scorers": [{"team":"${teamA.name}","player":"name from the list","minute":23}], "motm": "a player name from either squad"}`;

  const fallback = {
    commentary: isAr
      ? `مباراة قوية بين ${teamA.name} و${teamB.name} انتهت ${scoreA}-${scoreB}. (تعذر توليد تعليق الذكاء الاصطناعي هذه المرة)`
      : `A tight match between ${teamA.name} and ${teamB.name} ended ${scoreA}-${scoreB}. (AI commentary unavailable this time)`,
    scorers: [], motm: "",
  };
  try {
    const response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    try { return { ...fallback, ...JSON.parse(clean) }; }
    catch { return text ? { ...fallback, commentary: text } : fallback; }
  } catch {
    return fallback;
  }
}

// ---------- Guess Who (football edition) ----------
const gwKey = (code) => "gwroom:" + code;
function normalizeGwPlayers(r) {
  if (r && Array.isArray(r.players)) {
    r.players = r.players.map((p) => ({ secretId: null, ...p }));
  }
  return r;
}
async function getGwRoom(code) {
  try { const r = await window.storage.get(gwKey(code), true); return r ? normalizeGwPlayers(JSON.parse(r.value)) : null; }
  catch { return null; }
}
async function setGwRoom(code, room) {
  await window.storage.set(gwKey(code), JSON.stringify(room), true);
  return room;
}
function newGwRoom(code, hostId, hostName) {
  return {
    code, phase: "lobby", // lobby | playing | finished
    players: [{ id: hostId, name: hostName, secretId: null }],
    turnPlayerId: null,
    pendingQuestion: null, // { text, askerId }
    log: [],
    winnerId: null,
  };
}

// ---------- Trivia ----------
function fallbackTrivia(lang) {
  const posLabel = lang === "ar" ? POS_LABEL : POS_LABEL_EN;
  return shuffle(POOL).slice(0, 8).map((p) => {
    const wrong = shuffle(POOL.filter((x) => x.id !== p.id)).slice(0, 3);
    const options = shuffle([p, ...wrong]).map((x) => pname(x, lang));
    const correctName = pname(p, lang);
    return {
      q: lang === "ar" ? `مين من دول مركزه ${posLabel[p.pos]} وتقييمه ${p.rating}؟` : `Who here plays ${posLabel[p.pos]} and is rated ${p.rating}?`,
      options, answer: options.indexOf(correctName),
    };
  });
}
async function generateTrivia(lang) {
  const prompt = lang === "ar"
    ? `اكتب 8 أسئلة تريفيا متنوعة عن كرة القدم (عالمية وعربي)، كل سؤال له 4 اختيارات واختيار واحد صح بس.
رد بصيغة JSON فقط بدون أي نص إضافي، array بالشكل:
[{"q":"نص السؤال","options":["أ","ب","ج","د"],"answer":0}]
حيث answer هو index الإجابة الصحيحة في options (من 0 لـ 3).`
    : `Write 8 varied football (soccer) trivia questions covering global and Arab football, each with 4 options and exactly one correct answer.
Reply with JSON only, no extra text, as an array shaped like:
[{"q":"question text","options":["a","b","c","d"],"answer":0}]
where answer is the correct option's index (0 to 3).`;
  try {
    const response = await fetch("/api/claude", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    const arr = JSON.parse(clean);
    if (Array.isArray(arr) && arr.length) return arr;
    throw new Error("empty");
  } catch {
    return fallbackTrivia(lang);
  }
}

// ---------- Dream Team ----------
const dtKey = (code) => "dtroom:" + code;
function normalizeDtPlayers(r) {
  if (r && Array.isArray(r.players)) {
    r.players = r.players.map((p) => ({ squad: [], coachId: null, ready: false, ...p, squad: Array.isArray(p.squad) ? p.squad : [] }));
  }
  return r;
}
async function getDtRoom(code) {
  try { const r = await window.storage.get(dtKey(code), true); return r ? normalizeDtPlayers(JSON.parse(r.value)) : null; }
  catch { return null; }
}
async function setDtRoom(code, room) {
  await window.storage.set(dtKey(code), JSON.stringify(room), true);
  return room;
}
function newDtRoom(code, hostId, hostName) {
  return { code, phase: "lobby", players: [{ id: hostId, name: hostName, squad: [], coachId: null, ready: false }], results: null };
}
function localTeamStyle(squad, lang) {
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  squad.forEach((p) => counts[p.pos]++);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const map = lang === "ar"
    ? { GK: "دفاع صخري وحراسة قوية", DEF: "فريق دفاعي متين بيصعب اختراقه", MID: "تحكم كامل في وسط الملعب", FWD: "هجوم ناري وأهداف من كل حتة" }
    : { GK: "Rock-solid defense and strong goalkeeping", DEF: "A tight defensive team, hard to break down", MID: "Total control of the midfield", FWD: "Explosive attack, goals from everywhere" };
  return map[top];
}
async function generateTeamStyles(teams, lang) {
  const desc = teams.map((t) => `${t.name}: ${t.squad.map((s) => `${pname(s, lang)}(${s.pos})`).join("، ")}${t.coach ? ` — ${lang === "ar" ? "المدرب" : "Coach"}: ${cname(t.coach, lang)} (${cstyle(t.coach, lang)})` : ""}`).join("\n");
  const prompt = lang === "ar"
    ? `عندك ${teams.length} تشكيلات كورة حلم لاعبين مختلفين:\n${desc}\nاكتب لكل تشكيلة جملة وصفية قصيرة بالعامية المصرية عن أسلوب لعبها (خد أسلوب المدرب في الاعتبار لو موجود)، من غير تكرار نفس الوصف لأكتر من فريق. رد JSON فقط: [{"team":"اسم الفريق","style":"الوصف"}]`
    : `Here are ${teams.length} dream-team squads from different players:\n${desc}\nWrite a short descriptive sentence for each squad about its playing style (factor in the coach's style if present), without repeating the same description for more than one team. Reply with JSON only: [{"team":"team name","style":"the description"}]`;
  try {
    const response = await fetch("/api/claude", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    const arr = JSON.parse(clean);
    if (Array.isArray(arr)) return arr;
    throw new Error("empty");
  } catch {
    return teams.map((t) => ({ team: t.name, style: localTeamStyle(t.squad, lang) }));
  }
}

// ---------- UI atoms ----------
const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Cairo:wght@400;600;700;800&display=swap');
.ff-display { font-family: 'Teko', 'Cairo', sans-serif; letter-spacing: 0.02em; }
.ff-body { font-family: 'Cairo', sans-serif; }
.ff-glow { text-shadow: 0 0 18px currentColor, 0 0 40px currentColor; }
@keyframes ff-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
.ff-pulse { animation: ff-pulse 2.4s ease-in-out infinite; }

/* ---------- entrance / life animations ---------- */
@keyframes ff-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ff-pop-in { from { opacity: 0; transform: scale(0.75) rotate(-4deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
@keyframes ff-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes ff-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes ff-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ff-confetti-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(540deg); opacity: 0.2; } }
@keyframes ff-goal-flash { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ff-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }

.ff-fade-up { animation: ff-fade-up 0.45s cubic-bezier(.2,.8,.2,1) both; }
.ff-pop-in { animation: ff-pop-in 0.4s cubic-bezier(.34,1.56,.64,1) both; }
.ff-float { animation: ff-float 3.2s ease-in-out infinite; }
.ff-shake { animation: ff-shake 0.5s ease-in-out; }
.ff-hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.ff-hover-lift:hover { transform: translateY(-3px) scale(1.02); }
.ff-shimmer-bg {
  background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: ff-shimmer 2.2s ease-in-out infinite;
}

/* ---------- stadium atmosphere ---------- */
@keyframes ff-sweep { 0% { transform: translateX(-30%) rotate(8deg); opacity: 0; } 15% { opacity: 0.5; } 85% { opacity: 0.5; } 100% { transform: translateX(130%) rotate(8deg); opacity: 0; } }
@keyframes ff-crowd-flicker { 0%,100% { opacity: 0.35; } 50% { opacity: 0.6; } }
.ff-stadium-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.ff-floodlight { position: absolute; top: -10%; width: 55%; height: 140%; background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 70%); animation: ff-sweep 9s ease-in-out infinite; }
.ff-crowd-dots {
  position: absolute; left: 0; right: 0; top: 0; height: 130px;
  background-image: radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1.4px);
  background-size: 7px 7px; opacity: 0.35; animation: ff-crowd-flicker 3.5s ease-in-out infinite;
  -webkit-mask-image: linear-gradient(180deg, black 0%, transparent 100%);
  mask-image: linear-gradient(180deg, black 0%, transparent 100%);
}
.ff-pitch-lines {
  position: absolute; left: 0; right: 0; bottom: 0; height: 220px;
  background:
    repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 90px),
    linear-gradient(180deg, transparent 0%, rgba(57,255,136,0.05) 100%);
  -webkit-mask-image: linear-gradient(0deg, black 0%, transparent 100%);
  mask-image: linear-gradient(0deg, black 0%, transparent 100%);
}

/* ---------- card flip reveal (used when a player joins a squad) ---------- */
@keyframes ff-flip-in { 0% { transform: rotateY(90deg) scale(0.9); opacity: 0; } 60% { transform: rotateY(-12deg); } 100% { transform: rotateY(0deg) scale(1); opacity: 1; } }
.ff-flip-in { animation: ff-flip-in 0.5s cubic-bezier(.2,.7,.3,1) both; transform-style: preserve-3d; }
`;

function Chip({ children, color }) {
  return <span className="ff-body text-xs font-bold px-2 py-0.5 rounded ff-pop-in" style={{ background: color + "22", color }}>{children}</span>;
}

function StadiumBackground() {
  return (
    <div className="ff-stadium-bg">
      <div className="ff-crowd-dots" />
      <div className="ff-floodlight" style={{ left: "-10%" }} />
      <div className="ff-floodlight" style={{ left: "55%", animationDelay: "4.5s" }} />
      <div className="ff-pitch-lines" />
    </div>
  );
}

// ---------- Confetti burst (pure CSS, no dependencies) ----------
function Confetti({ count = 60 }) {
  const colors = ["#39FF88", "#00D9FF", "#FFD447", "#FF3B5C", "#A855F7", "#EEF1FF"];
  const pieces = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.6,
    size: 6 + Math.random() * 7,
    color: colors[i % colors.length],
    round: Math.random() > 0.5,
  })), [count]);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60, overflow: "hidden" }}>
      {pieces.map((p) => (
        <div key={p.id} style={{
          position: "absolute", top: 0, left: `${p.left}%`, width: p.size, height: p.size * 1.4,
          background: p.color, borderRadius: p.round ? "999px" : "2px",
          animation: `ff-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", className = "" }) {
  const base = "ff-body font-bold px-4 py-2 rounded-lg transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:active:scale-100 hover:-translate-y-0.5";
  const styles = {
    primary: "text-white",
    ghost: "bg-transparent border",
  };
  const bg = variant === "primary"
    ? { background: disabled ? "#00D9FF55" : "#39FF88", color: "#0A0E27", boxShadow: disabled ? "none" : "0 4px 14px #39FF8855" }
    : { borderColor: "#EEF1FF55", color: "#EEF1FF" };
  return <button onClick={onClick} disabled={disabled} className={base + " " + styles[variant] + " " + className} style={bg}>{children}</button>;
}

// ---------- Player jersey-card avatar (used instead of plain names wherever players are picked) ----------
function jerseyNumber(id) {
  if (!id) return 1;
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 99) + 1;
}
const CARD_SIZES = {
  sm: { w: 44, h: 56, num: 18, pos: 7, r: 8 },
  md: { w: 60, h: 76, num: 24, pos: 8, r: 10 },
  lg: { w: 96, h: 122, num: 38, pos: 12, r: 14 },
};

// شكل قميص رياضي مرسوم بالكود (SVG) — بدل صور حقيقية لأي لاعب، رقم القميص ولون المركز بس
function JerseyIcon({ color, size, number }) {
  const gid = "jg" + color.replace("#", "");
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M32,14 L14,26 L24,47 L31,42 L31,89 L69,89 L69,42 L76,47 L86,26 L68,14 L59,19 L54,14 L46,14 L41,19 Z"
        fill={`url(#${gid})`} stroke="#0A0E27" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M45,14.5 L50,24 L55,14.5" fill="none" stroke="#0A0E27" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="50" y="70" textAnchor="middle" fontFamily="Teko, sans-serif" fontSize="36" fontWeight="700" fill="#0A0E2799">{number}</text>
    </svg>
  );
}

function PlayerCard({ player, lang, size = "md", selected, justWon }) {
  if (!player) return null;
  const color = POS_COLOR[player.pos] || "#39FF88";
  const num = jerseyNumber(player.id);
  const d = CARD_SIZES[size];
  const posLabel = (lang === "ar" ? POS_LABEL : POS_LABEL_EN)[player.pos];
  const avatarSize = Math.round(d.w * 0.8);
  return (
    <div className={"ff-hover-lift " + (justWon ? "ff-flip-in" : "ff-pop-in")} style={{
      width: d.w, height: d.h, borderRadius: d.r, flexShrink: 0,
      background: `linear-gradient(160deg, ${color}40 0%, #0A0E27E6 65%)`,
      border: `1.5px solid ${selected ? color : color + "55"}`,
      boxShadow: selected ? `0 0 14px ${color}AA` : "none",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
    }}>
      {selected && <div className="ff-shimmer-bg" style={{ position: "absolute", inset: 0 }} />}
      <div style={{ position: "absolute", top: 4, insetInlineStart: 4, width: 7, height: 7, borderRadius: 999, background: color, zIndex: 2 }} />
      <div style={{ width: avatarSize, height: avatarSize, marginBottom: size === "sm" ? 0 : 1, zIndex: 1 }}>
        <JerseyIcon color={color} size={avatarSize} number={num} />
      </div>
      <div className="ff-body" style={{ fontSize: d.pos, color, fontWeight: 700, zIndex: 1 }}>{posLabel}</div>
    </div>
  );
}
function PlayerTile({ player, lang, selected, onClick, disabled, trailing }) {
  return (
    <button onClick={onClick} disabled={disabled} type="button"
      className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg transition active:scale-95 disabled:active:scale-100"
      style={{ background: selected ? (POS_COLOR[player.pos] + "22") : "transparent" }}>
      <PlayerCard player={player} lang={lang} size="sm" selected={selected} />
      <span className="ff-body text-center leading-tight" style={{ fontSize: 9, color: selected ? "#EEF1FF" : "#EEF1FFAA", maxWidth: 62 }}>{pname(player, lang)}</span>
      {trailing}
    </button>
  );
}

// ---------- Main App ----------
function AppInner() {
  const { tr, lang } = useLang();
  const [splashDone, setSplashDone] = useState(false);
  const [account, setAccount] = useState(null); // {username}
  const [accountBooted, setAccountBooted] = useState(false);
  const [game, setGame] = useState(null); // null | 'auction' | 'dond'
  const [booted, setBooted] = useState(false);
  const [screen, setScreen] = useState("home"); // home | lobby | auction | teams
  const [myId, setMyId] = useState(null);
  const [myName, setMyName] = useState("");
  const [code, setCode] = useState("");
  const [room, setRoomState] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const pollRef = useRef(null);
  const auctionAwardRef = useRef(null);

  // restore account (username+pin login, shared across every game/device)
  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get("ff-account", false);
        if (s) setAccount(JSON.parse(s.value));
      } catch {}
      setAccountBooted(true);
    })();
  }, []);

  async function loginOrRegister(username, pin) {
    const uname = username.trim();
    if (!uname || !pin.trim()) return { error: tr("اكتب اسم ورقم سري", "Enter a name and PIN") };
    let u = await getUser(uname);
    if (u) {
      if (u.pin !== pin) return { error: tr("الرقم السري غلط", "Wrong PIN") };
    } else {
      u = { username: uname, pin, score: 0, gamesPlayed: 0, history: [], createdAt: Date.now() };
      await setUser(uname, u);
    }
    try { await window.storage.set("ff-account", JSON.stringify({ username: uname }), false); } catch {}
    setAccount({ username: uname });
    return { ok: true };
  }

  async function logoutAccount() {
    try { await window.storage.delete("ff-account", false); } catch {}
    setAccount(null); setGame(null);
  }

  // auto-award points for reaching the "teams" stage in the auction game
  useEffect(() => {
    if (room && room.phase === "teams" && account && auctionAwardRef.current !== code) {
      auctionAwardRef.current = code;
      addScore(account.username, 10, tr("أكملت تشكيلة المزاد", "Completed auction squad"));
    }
    // eslint-disable-next-line
  }, [room && room.phase]);

  // restore session
  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get("my-session", false);
        if (s) {
          const sess = JSON.parse(s.value);
          const r = await getRoom(sess.roomCode);
          if (r && r.players.some((p) => p.id === sess.myId)) {
            setMyId(sess.myId); setMyName(sess.name); setCode(sess.roomCode);
            setRoomState(r); setGame("auction"); setScreen(r.phase === "lobby" ? "lobby" : r.phase);
            startPolling(sess.roomCode);
            setBooted(true);
            return;
          }
        }
      } catch {}
      setBooted(true);
    })();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startPolling = useCallback((c) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const r = await getRoom(c);
      if (r) setRoomState(r);
    }, 3000);
  }, []);

  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  async function saveSession(id, name, roomCode) {
    try { await window.storage.set("my-session", JSON.stringify({ myId: id, name, roomCode }), false); } catch {}
  }

  // ---------- Actions ----------
  async function createRoom(name, budget, formation) {
    setError("");
    const id = uid();
    const c = genCode();
    const r = newRoom(c, Number(budget), formation, id, name);
    await setRoom(c, r);
    setMyId(id); setMyName(name); setCode(c); setRoomState(r); setScreen("lobby");
    saveSession(id, name, c); startPolling(c);
  }

  async function joinRoom(name, joinCode) {
    setError("");
    const c = joinCode.trim().toUpperCase();
    const r = await getRoom(c);
    if (!r || !Array.isArray(r.players)) { setError(tr("الغرفة دي معادتش شغالة، جرب كود تاني أو اعمل غرفة جديدة.", "This room is no longer valid — try a different code or create a new one.")); return; }
    if (r.phase !== "lobby") { setError(tr("المزاد بدأ خلاص في الغرفة دي.", "The auction already started in this room.")); return; }
    const id = uid();
    r.players.push({ id, name, budget: r.budget, squad: [], coachId: null });
    await setRoom(c, r);
    setMyId(id); setMyName(name); setCode(c); setRoomState(r); setScreen("lobby");
    saveSession(id, name, c); startPolling(c);
  }

  async function leaveRoom() {
    try { await window.storage.delete("my-session", false); } catch {}
    if (pollRef.current) clearInterval(pollRef.current);
    setMyId(null); setRoomState(null); setCode(""); setScreen("home"); setGame(null);
  }

  async function startAuction() {
    const r = await getRoom(code);
    if (!r || r.phase !== "lobby") return;
    r.phase = "auction"; r.stage = "players"; r.turnIndex = 0;
    nextRound(r);
    setRoomState(await setRoom(code, r));
  }

  // بيحدد مين المركز اللي هيتباع دلوقتي (بيدور على أول لاعب لسه محتاج حاجة)، وبيحط لاعب/مدرب
  // من نفس النوع للمزايدة عليه من الكل. مفيش "دور" حصري — أي حد لسه محتاج المركز ده يقدر يزايد
  function nextRound(r) {
    const quota = FORMATIONS[r.formation] || FORMATIONS["4-3-3"];
    const total = Object.values(quota).reduce((a, b) => a + b, 0);
    const stillNeedSquad = (p) => p.squad.length < total;

    if (r.stage === "players" && !r.players.some(stillNeedSquad)) {
      r.stage = "coach"; r.turnIndex = 0;
    }

    if (r.stage === "coach") {
      const stillNeedCoach = (p) => !p.coachId;
      if (!r.players.some(stillNeedCoach)) {
        r.phase = "teams"; r.auction = null;
        return;
      }
      const claimed = new Set(r.players.map((p) => p.coachId).filter(Boolean));
      const leftover = COACHES.map((c) => c.id).filter((id) => !claimed.has(id));
      if (!leftover.length) {
        // مفيش مدربين متبقين (نادر) — كمّل بمدرب عشوائي من الكل
        r.players.forEach((p) => { if (!p.coachId) p.coachId = COACHES[Math.floor(Math.random() * COACHES.length)].id; });
        r.phase = "teams"; r.auction = null;
        return;
      }
      const coachId = leftover[Math.floor(Math.random() * leftover.length)];
      r.auction = { coachId, currentBid: 0, bidderId: null, passed: {}, deadline: Date.now() + 15000, kind: "coach" };
      return;
    }

    // stage === "players": بندوّر على مركز محتاج من أي لاعب (بالدور، بس بس عشان نحدد المركز، مش عشان نحصر المزايدة)
    for (let i = 0; i < r.players.length; i++) {
      const idx = (r.turnIndex + i) % r.players.length;
      if (stillNeedSquad(r.players[idx])) { r.turnIndex = idx; break; }
    }
    const anchor = r.players[r.turnIndex];
    const pos = neededPositions(quota, anchor.squad)[0];
    const offeredId = pickForPositions(r.availableIds, [pos]);
    if (!offeredId) { r.auction = null; r.turnIndex = (r.turnIndex + 1) % r.players.length; nextRound(r); return; }
    r.auction = { pos, playerId: offeredId, currentBid: 0, bidderId: null, passed: {}, deadline: Date.now() + 15000, kind: "player" };
  }

  function canPlayerBidNow(r, p) {
    const quota = FORMATIONS[r.formation] || FORMATIONS["4-3-3"];
    const total = Object.values(quota).reduce((a, b) => a + b, 0);
    return r.auction.kind === "coach" ? !p.coachId : ((p.squad?.length || 0) < total && neededPositions(quota, p.squad || []).includes(r.auction.pos));
  }

  async function placeBid(amount) {
    const r = await getRoom(code);
    if (!r || !r.auction) return;
    const me = r.players.find((p) => p.id === myId);
    if (!me || !canPlayerBidNow(r, me)) return;
    const next = Number(amount);
    if (!next || next <= r.auction.currentBid || next > me.budget || r.auction.bidderId === myId) return;
    r.auction.currentBid = next;
    r.auction.bidderId = myId;
    if (r.auction.passed) delete r.auction.passed[myId]; // زوّد تاني بعد ما كان ماشي؟ رجّعه للمنافسة
    r.auction.deadline = Date.now() + 15000;
    setRoomState(await setRoom(code, r));
  }

  // اللاعب بيقول "مش هزايد" على الجولة دي؛ لو كل اللي لسه محتاجين نفس المركز عملوا كده
  // (أو هما أصلاً صاحب أعلى عرض)، الجولة تتحسم فورًا من غير استنى الوقت
  async function passRound() {
    const r = await getRoom(code);
    if (!r || !r.auction) return;
    const me = r.players.find((p) => p.id === myId);
    if (!me || !canPlayerBidNow(r, me) || r.auction.bidderId === myId) return;
    r.auction.passed = r.auction.passed || {};
    r.auction.passed[myId] = true;
    const eligible = r.players.filter((p) => canPlayerBidNow(r, p));
    const allDone = eligible.every((p) => p.id === r.auction.bidderId || r.auction.passed[p.id]);
    if (allDone) settleRound(r);
    setRoomState(await setRoom(code, r));
  }

  function settleRound(r) {
    const quota = FORMATIONS[r.formation] || FORMATIONS["4-3-3"];
    const total = Object.values(quota).reduce((a, b) => a + b, 0);
    const winnerId = r.auction.bidderId;
    const winner = winnerId ? r.players.find((p) => p.id === winnerId) : null;

    if (r.auction.kind === "coach") {
      if (winner) {
        winner.coachId = r.auction.coachId; winner.budget = (winner.budget || 0) - r.auction.currentBid;
      }
      const claimed = new Set(r.players.map((p) => p.coachId).filter(Boolean));
      let leftover = COACHES.map((c) => c.id).filter((id) => !claimed.has(id));
      r.players.forEach((p) => {
        if (p.coachId || p.id === winnerId || !leftover.length) return;
        const idx2 = Math.floor(Math.random() * leftover.length);
        p.coachId = leftover.splice(idx2, 1)[0];
      });
    } else {
      const pl = playerById(r.auction.playerId);
      if (winner && pl) {
        winner.squad = Array.isArray(winner.squad) ? winner.squad : [];
        winner.squad.push({ id: pl.id, name: pl.name, pos: pl.pos, rating: pl.rating, price: r.auction.currentBid });
        winner.budget = (winner.budget || 0) - r.auction.currentBid;
        r.availableIds = (r.availableIds || []).filter((id) => id !== pl.id);
      }
      // اللي ماخدوش يبقوا لسه محتاجين نفس المركز، ياخدوا لاعب تاني عشوائي بنفس المركز ببلاش
      r.players.forEach((p) => {
        if (p.id === winnerId) return;
        p.squad = Array.isArray(p.squad) ? p.squad : [];
        const stillNeed = p.squad.length < total && neededPositions(quota, p.squad).includes(r.auction.pos);
        if (!stillNeed) return;
        const freeId = pickForPositions(r.availableIds || [], [r.auction.pos]);
        if (freeId) {
          const flp = playerById(freeId);
          p.squad.push({ id: flp.id, name: flp.name, pos: flp.pos, rating: flp.rating, price: 0 });
          r.availableIds = r.availableIds.filter((id) => id !== freeId);
        }
      });
    }
    r.turnIndex = (r.turnIndex + 1) % r.players.length;
    nextRound(r);
  }

  async function resolveRoundIfExpired() {
    const r = await getRoom(code);
    if (!r || !r.auction || !Array.isArray(r.players)) return;
    if (Date.now() < r.auction.deadline) return;
    settleRound(r);
    setRoomState(await setRoom(code, r));
  }

  // local timer-driven resolution
  useEffect(() => {
    if (!room || room.phase !== "auction" || !room.auction) return;
    if (now >= room.auction.deadline) resolveRoundIfExpired().catch((e) => console.error("resolveRoundIfExpired failed:", e));
    // eslint-disable-next-line
  }, [now]);

  useEffect(() => { if (room) setScreen(room.phase); }, [room && room.phase]);

  async function runMatch(teamAId, teamBId) {
    const r = await getRoom(code);
    if (!r) return;
    const teamA = r.players.find((p) => p.id === teamAId);
    const teamB = r.players.find((p) => p.id === teamBId);
    if (!teamA || !teamB) return;
    const coachA = coachById(teamA.coachId);
    const coachB = coachById(teamB.coachId);
    const squadA = Array.isArray(teamA.squad) ? teamA.squad : [];
    const squadB = Array.isArray(teamB.squad) ? teamB.squad : [];
    const strA = squadA.reduce((s, p) => s + p.rating, 0) / Math.max(1, squadA.length) + (coachA?.bonus || 0);
    const strB = squadB.reduce((s, p) => s + p.rating, 0) / Math.max(1, squadB.length) + (coachB?.bonus || 0);
    const lamA = Math.max(0.4, 1.4 + (strA - strB) / 12);
    const lamB = Math.max(0.4, 1.4 + (strB - strA) / 12);
    const scoreA = Math.min(6, poisson(lamA));
    const scoreB = Math.min(6, poisson(lamB));
    const match = { teamA: teamA.name, teamB: teamB.name, scoreA, scoreB, loading: true };
    r.matches.push(match);
    setRoomState(await setRoom(code, r));
    try {
      const ai = await generateMatch({ ...teamA, squad: squadA }, { ...teamB, squad: squadB }, scoreA, scoreB, coachA, coachB, lang);
      const r2 = await getRoom(code);
      const m = r2?.matches?.[r2.matches.length - 1];
      if (m) { m.loading = false; m.commentary = ai.commentary; m.scorers = ai.scorers || []; m.motm = ai.motm || ""; }
      if (r2) setRoomState(await setRoom(code, r2));
    } catch (e) {
      console.error("runMatch AI step failed:", e);
      // حتى لو الذكاء الاصطناعي فشل تمامًا، بلّغ المباراة بدل ما تفضل "جاري التحميل" للأبد
      const r3 = await getRoom(code);
      const m3 = r3?.matches?.[r3.matches.length - 1];
      if (m3) { m3.loading = false; m3.commentary = tr("انتهت المباراة، بس الذكاء الاصطناعي معملش تعليق النهاردة.", "Match finished, but AI commentary wasn't available this time."); m3.scorers = []; m3.motm = ""; }
      if (r3) setRoomState(await setRoom(code, r3));
    }
    if (account) addScore(account.username, 5, "شغّلت ماتش");
  }

  async function runTournament() {
    const r = await getRoom(code);
    if (!r || r.players.length < 3) return;
    r.matches = [];
    setRoomState(await setRoom(code, r));
    const ids = r.players.map((p) => p.id);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        await runMatch(ids[i], ids[j]);
      }
    }
    const r3 = await getRoom(code);
    const standings = computeStandings(r3.players, r3.matches);
    if (account && standings[0] && standings[0].name === account.username) {
      addScore(account.username, 25, "بطل البطولة الكاملة");
    }
  }

  // ---------- Render ----------
  if (!splashDone) return <Splash onStart={() => setSplashDone(true)} />;
  if (!accountBooted) {
    return <LoadingScreen />;
  }
  if (!account) return <AccountGate onSubmit={loginOrRegister} />;
  if (!booted) {
    return <LoadingScreen />;
  }
  if (!game) return <Hub onPick={setGame} account={account} />;
  if (game === "dashboard") return <Dashboard account={account} onExit={() => setGame(null)} onLogout={logoutAccount} />;
  if (game === "league") return <LeagueGame onExit={() => setGame(null)} account={account} />;
  if (game === "guess-menu") return <GuessHub onPick={setGame} onBack={() => setGame(null)} />;
  if (game === "guess-qa") return <GuessWho onExit={() => setGame("guess-menu")} account={account} />;
  if (game === "guess-transfers") return <TransferPath onExit={() => setGame("guess-menu")} account={account} />;
  if (game === "guess-awards") return <AwardYearQuiz onExit={() => setGame("guess-menu")} account={account} />;
  if (game === "dream") return <DreamTeam onExit={() => setGame(null)} account={account} />;
  if (game === "trivia") return <Trivia onExit={() => setGame(null)} account={account} />;

  if (screen === "home") return <Home onCreate={createRoom} onJoin={joinRoom} error={error} onBack={() => setGame(null)} account={account} />;
  if (!room) return <LoadingScreen room />;

  if (screen === "lobby") return <Lobby room={room} myId={myId} onStart={startAuction} onLeave={leaveRoom} />;
  if (screen === "auction") return <Auction room={room} myId={myId} now={now} onBid={placeBid} onPass={passRound} onLeave={leaveRoom} />;
  if (screen === "teams") return <Teams room={room} myId={myId} onRunMatch={runMatch} onRunTournament={runTournament} onLeave={leaveRoom} />;
  return null;
}

function Splash({ onStart }) {
  const { tr, lang } = useLang();
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 20% 10%, #39FF8833 0%, transparent 45%), radial-gradient(circle at 85% 85%, #00D9FF33 0%, transparent 45%), radial-gradient(circle at 50% 100%, #A855F733 0%, transparent 55%), linear-gradient(160deg,#050712 0%,#0A0E27 50%,#0A0E27 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <style>{FONT_STYLE}</style>
      <div className="max-w-md w-full px-6 text-center">
        <div className="ff-float" style={{ fontSize: 54, marginBottom: 4 }}>⚽</div>
        <div className="ff-body text-xs font-bold tracking-widest mb-3 ff-fade-up" style={{ color: "#00D9FF", animationDelay: "0.1s" }}>FOOTBALL GAMES HUB</div>
        <div className="ff-display font-bold ff-glow ff-pulse ff-pop-in" style={{ fontSize: lang === "ar" ? 50 : 64, lineHeight: 1, color: "#39FF88", animationDelay: "0.15s" }}>
          {tr("ألعاب الكورة", "FOOTBALL")}
        </div>
        {lang !== "ar" && (
          <div className="ff-display font-bold" style={{ fontSize: 40, lineHeight: 1.1, color: "#EEF1FF", marginTop: -4 }}>GAMES</div>
        )}
        <div className="my-6 h-px w-24 mx-auto" style={{ background: "linear-gradient(90deg, transparent, #39FF88, #00D9FF, transparent)" }} />
        <p className="ff-display font-bold text-2xl" style={{ color: "#EEF1FF" }}>{tr("ابني إمبراطوريتك", "Build Your Empire")}</p>
        <p className="ff-body text-sm mt-2" style={{ color: "#EEF1FFAA" }}>
          {tr("هنا بيتولدوا الأساطير", "This is where legends are made")}
        </p>
        <button onClick={onStart}
          className="ff-display font-bold text-2xl mt-8 px-10 py-3 rounded-full transition active:scale-95"
          style={{ background: "linear-gradient(90deg,#39FF88,#00D9FF)", color: "#0A0E27", boxShadow: "0 0 24px #39FF8866" }}>
          {tr("ابدأ ⚡", "KICK OFF ⚡")}
        </button>
      </div>
    </div>
  );
}

function AccountGate({ onSubmit }) {
  const { tr } = useLang();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setError("");
    const res = await onSubmit(username, pin);
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <Shell>
      <div className="text-center mb-8">
        <div className="ff-display text-5xl font-bold" style={{ color: "#39FF88" }}>{tr("ألعاب الكورة", "Football Games")}</div>
        <p className="ff-body text-sm mt-1" style={{ color: "#EEF1FFAA" }}>{tr("اكتب اسمك ورقم سري بسيط عشان سكورك يتسجل ويفضل معاك في كل الألعاب", "Pick a name and a simple PIN so your score is saved and follows you across every game")}</p>
      </div>
      {error && <div className="ff-body text-sm mb-3 px-3 py-2 rounded" style={{ background: "#FF3B5C33", color: "#EEF1FF" }}>{error}</div>}
      <div className="space-y-3">
        <input className="ff-body w-full rounded-lg px-3 py-2.5 outline-none" style={{ background: "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}
          placeholder={tr("اسمك", "Your name")} value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" inputMode="numeric" className="ff-body w-full rounded-lg px-3 py-2.5 outline-none" style={{ background: "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}
          placeholder={tr("رقم سري (أي أرقام تفتكرها)", "A PIN (any numbers you'll remember)")} value={pin} onChange={(e) => setPin(e.target.value)} />
        <Btn className="w-full" disabled={loading || !username.trim() || !pin.trim()} onClick={submit}>{loading ? "..." : tr("دخول / تسجيل", "Log in / Sign up")}</Btn>
      </div>
      <p className="ff-body text-xs text-center mt-6" style={{ color: "#EEF1FF55" }}>{tr("ده مش تسجيل دخول آمن زي الإيميل، بس بيفرّق بينك وبين أصحابك عشان السكور يتسجل صح. لو نسيت رقمك السري، مينفعش تسترجعه واحتاج تعمل اسم جديد.", "This isn't secure login like email — it just tells you and your friends apart so scores save correctly. If you forget your PIN, it can't be recovered; you'd need a new name.")}</p>
    </Shell>
  );
}

function Dashboard({ account, onExit, onLogout }) {
  const { tr } = useLang();
  const [board, setBoard] = useState(null);
  useEffect(() => { (async () => setBoard(await listLeaderboard()))(); }, []);
  const mine = board?.find((u) => u.username === account.username);

  return (
    <Shell>
      <Header title={tr("لوحة المتصدرين", "Leaderboard")} sub={tr(`أهلاً ${account.username}`, `Hi ${account.username}`)} onLeave={onExit} />
      {mine && (
        <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "#141B3D", border: "1px solid #39FF8855" }}>
          <div className="ff-body text-xs" style={{ color: "#EEF1FFAA" }}>{tr("سكورك", "Your score")}</div>
          <div className="ff-display text-4xl font-bold" style={{ color: "#39FF88" }}>{mine.score || 0}</div>
          <div className="ff-body text-xs" style={{ color: "#EEF1FFAA" }}>{tr(`سجّلت نشاط ${mine.gamesPlayed || 0} مرة`, `${mine.gamesPlayed || 0} scoring activities`)}</div>
        </div>
      )}
      {!board ? (
        <div className="ff-body text-center text-sm py-10" style={{ color: "#EEF1FFAA" }}>{tr("بيجهز الترتيب...", "Loading standings...")}</div>
      ) : board.length === 0 ? (
        <div className="ff-body text-center text-sm py-10" style={{ color: "#EEF1FFAA" }}>{tr("لسه محدش لعب", "Nobody has played yet")}</div>
      ) : (
        <div className="space-y-2 mb-4">
          {board.slice(0, 20).map((u, i) => (
            <div key={u.username} className="flex justify-between items-center px-3 py-2 rounded-lg ff-fade-up ff-hover-lift" style={{ background: u.username === account.username ? "#39FF8822" : "#141B3D", animationDelay: `${i * 0.04}s` }}>
              <span className="ff-body" style={{ color: "#EEF1FF" }}>{i + 1}. {u.username}</span>
              <span className="ff-body font-bold" style={{ color: "#39FF88" }}>{u.score || 0}</span>
            </div>
          ))}
        </div>
      )}
      <Btn variant="ghost" className="w-full" onClick={onLogout}>{tr("تسجيل خروج", "Log out")}</Btn>
    </Shell>
  );
}

function Hub({ onPick, account }) {
  const { tr } = useLang();
  return (
    <Shell>
      <div className="text-center mb-8">
        <div className="ff-display text-4xl font-bold" style={{ color: "#39FF88" }}>{tr("ألعاب الكورة", "Football Games")}</div>
        <p className="ff-body text-sm mt-1" style={{ color: "#EEF1FFAA" }}>{tr(`أهلاً ${account?.username} — اختار اللعبة اللي عايز تلعبها`, `Hi ${account?.username} — pick a game to play`)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <GameCard layout="grid" index={0} color="#FFD447" icon={<IconTrophy color="#FFD447" />} title={tr("لوحة المتصدرين", "Leaderboard")} desc={tr("سكورك بين كل اللاعبين", "Your rank overall")} onClick={() => onPick("dashboard")} />
        <GameCard layout="grid" index={1} color="#00D9FF" icon={<IconCup color="#00D9FF" />} title={tr("الدوري الفانتازي", "Fantasy League")} desc={tr("ادرافت تشكيلتك", "Draft your XI")} onClick={() => onPick("league")} />
        <GameCard layout="grid" index={2} color="#39FF88" icon={<IconGavel color="#39FF88" />} title={tr("مزاد الفانتازي", "Fantasy Auction")} desc={tr("كوّن فريقك بالمزاد", "Build in a live auction")} onClick={() => onPick("auction")} />
        <GameCard layout="grid" index={3} color="#A855F7" icon={<IconSearch color="#A855F7" />} title={tr("خمّن اللاعب", "Guess the Player")} desc={tr("3 أشكال مختلفة", "3 modes")} onClick={() => onPick("guess-menu")} />
        <GameCard layout="grid" index={4} color="#FF3B5C" icon={<IconShirt color="#FF3B5C" />} title={tr("تشكيلة الأحلام", "Dream Team")} desc={tr("اختار أفضل 11", "Draft your best XI")} onClick={() => onPick("dream")} />
        <GameCard layout="grid" index={5} color="#2E8FFF" icon={<IconQuiz color="#2E8FFF" />} title={tr("تريفيا الكورة", "Football Trivia")} desc={tr("اختبر معلوماتك", "Test your knowledge")} onClick={() => onPick("trivia")} />
      </div>
    </Shell>
  );
}

// ---------- Game icons (inline SVG, no external images needed — crisp at any size) ----------
function IconTrophy({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a2 2 0 0 0 0 4h1M17 6h3a2 2 0 0 1 0 4h-1" />
    </svg>
  );
}
function IconCup({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h14l-1 9a6 6 0 0 1-12 0L5 3Z" />
      <path d="M9 21h6M12 17v4" />
    </svg>
  );
}
function IconGavel({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14.5 4.5 5 5L15 14l-5-5 4.5-4.5Z" />
      <path d="m9 10-6.5 6.5M13 14l6.5 6.5M3 21h6" />
    </svg>
  );
}
function IconSearch({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconShirt({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3 4 6l1 3 2-1v11h10V8l2 1 1-3-4-3-2 2h-2L8 3Z" />
    </svg>
  );
}
function IconQuiz({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2 1.7-2.3 3.3" /><circle cx="12" cy="16.5" r="0.6" fill={color} />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconBall({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.5 15.5 11l-1.3 4H9.8l-1.3-4L12 8.5Z" />
      <path d="M12 8.5V4.5M15.5 11l3.6-1.2M14.2 15l2.2 3.3M9.8 15l-2.2 3.3M8.5 11 4.9 9.8" />
    </svg>
  );
}

function GameCard({ title, desc, onClick, index = 0, icon, color = "#39FF88", layout = "row" }) {
  const { dir } = useLang();
  if (layout === "grid") {
    return (
      <button onClick={onClick} className="ff-fade-up ff-hover-lift rounded-xl p-4 transition active:scale-95 flex flex-col items-center text-center"
        style={{ background: "#141B3D", border: "1px solid #39FF8833", animationDelay: `${index * 0.06}s` }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8,
          background: `linear-gradient(150deg, ${color}33 0%, ${color}11 100%)`, border: `1px solid ${color}55`,
        }}>
          {icon || <IconBall color={color} />}
        </div>
        <div className="ff-body font-bold text-sm leading-tight" style={{ color: "#EEF1FF" }}>{title}</div>
        <div className="ff-body text-[11px] mt-1 leading-snug" style={{ color: "#EEF1FF77" }}>{desc}</div>
      </button>
    );
  }
  return (
    <button onClick={onClick} className="ff-fade-up ff-hover-lift w-full rounded-xl p-4 transition active:scale-95 flex items-center gap-3"
      style={{ background: "#141B3D", border: "1px solid #39FF8833", textAlign: dir === "rtl" ? "right" : "left", animationDelay: `${index * 0.07}s` }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(150deg, ${color}33 0%, ${color}11 100%)`, border: `1px solid ${color}55`,
      }}>
        {icon || <IconBall color={color} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ff-body font-bold text-base" style={{ color: "#EEF1FF" }}>{title}</div>
        <div className="ff-body text-xs mt-0.5 leading-snug" style={{ color: "#EEF1FF88" }}>{desc}</div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, transform: dir === "rtl" ? "rotate(180deg)" : "none" }}>
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  );
}

function Shell({ children }) {
  const { dir } = useLang();
  return (
    <div dir={dir} style={{
      background: "radial-gradient(circle at 15% 0%, #1B0F3D66 0%, transparent 45%), radial-gradient(circle at 100% 25%, #00D9FF22 0%, transparent 40%), linear-gradient(160deg,#080B1F 0%,#0A0E27 45%,#141B3D 100%)",
      minHeight: "100vh", position: "relative",
    }}>
      <style>{FONT_STYLE}</style>
      <StadiumBackground />
      <div className="max-w-md mx-auto px-4 py-6 ff-fade-up" style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function LoadingScreen({ room }) {
  const { tr } = useLang();
  return <Shell><div className="ff-body text-center py-20" style={{ color: "#EEF1FF" }}>{room ? tr("جاري الاتصال بالغرفة...", "Connecting to room...") : tr("جاري التحميل...", "Loading...")}</div></Shell>;
}

function Header({ title, sub, onLeave }) {
  const { tr } = useLang();
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="ff-display text-3xl font-bold" style={{ color: "#39FF88" }}>{title}</h1>
        {sub && <p className="ff-body text-sm" style={{ color: "#EEF1FFAA" }}>{sub}</p>}
      </div>
      {onLeave && <button onClick={onLeave} className="ff-body text-xs px-3 py-1.5 rounded border" style={{ color: "#EEF1FF", borderColor: "#EEF1FF33" }}>{tr("خروج", "Exit")}</button>}
    </div>
  );
}

// ---------- Home ----------
function Home({ onCreate, onJoin, error, onBack, account }) {
  const { tr } = useLang();
  const [tab, setTab] = useState("create");
  const [budget, setBudget] = useState(1000000);
  const [formation, setFormation] = useState("4-3-3");
  const [joinCode, setJoinCode] = useState("");
  const name = account?.username || "";

  const inputCls = "ff-body w-full rounded-lg px-3 py-2.5 outline-none";
  const inputStyle = { background: "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" };

  return (
    <Shell>
      {onBack && (
        <button onClick={onBack} className="ff-body text-xs mb-4" style={{ color: "#EEF1FFAA" }}>{tr("‹ رجوع لقائمة الألعاب", "‹ Back to games")}</button>
      )}
      <div className="text-center mb-8">
        <div className="ff-display text-5xl font-bold" style={{ color: "#39FF88" }}>{tr("مزاد الفانتازي", "Fantasy Auction")}</div>
        <p className="ff-body text-sm mt-1" style={{ color: "#EEF1FFAA" }}>{tr(`هتلعب باسم ${name} — كوّن تشكيلتك الكاملة بميزانية محددة، وخلّي الذكاء الاصطناعي يعلّق على المباراة`, `Playing as ${name} — draft a full formation on a set budget, then let AI commentate the match`)}</p>
      </div>

      <div className="flex rounded-lg overflow-hidden mb-5" style={{ border: "1px solid #EEF1FF33" }}>
        {["create", "join"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className="ff-body flex-1 py-2.5 font-bold text-sm"
            style={{ background: tab === t ? "#39FF88" : "transparent", color: tab === t ? "#0A0E27" : "#EEF1FF" }}>
            {t === "create" ? tr("إنشاء غرفة", "Create room") : tr("الانضمام لغرفة", "Join room")}
          </button>
        ))}
      </div>

      {error && <div className="ff-body text-sm mb-3 px-3 py-2 rounded" style={{ background: "#FF3B5C33", color: "#EEF1FF" }}>{error}</div>}

      {tab === "create" ? (
        <div className="space-y-3">
          <div>
            <label className="ff-body text-xs" style={{ color: "#EEF1FFAA" }}>{tr("الميزانية الكلية لكل لاعب (جنيه)", "Total budget per player (EGP)")}</label>
            <input type="number" className={inputCls} style={inputStyle} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div>
            <label className="ff-body text-xs block mb-1" style={{ color: "#EEF1FFAA" }}>{tr("التشكيلة", "Formation")}</label>
            <div className="flex gap-2">
              {Object.keys(FORMATIONS).map((f) => (
                <button key={f} onClick={() => setFormation(f)} className="ff-body flex-1 py-2 rounded-lg text-sm font-bold"
                  style={{ background: formation === f ? "#00D9FF" : "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <p className="ff-body text-xs" style={{ color: "#EEF1FF55" }}>{tr("كل جولة، لاعب واحد بيتعرضله لاعب يقرر يشتريه من ميزانيته ولا يسيبه، والباقي ياخدوا لاعب عشوائي ببلاش في نفس الوقت. التشكيلة بتتبني تلقائي (حراسة، دفاع، وسط، هجوم) لحد ما تكتمل.", "Each round, one player is offered a player to buy from their budget (or skip), while everyone else automatically gets a free random player. The formation fills up (GK, DEF, MID, FWD) until complete.")}</p>
          <Btn className="w-full" onClick={() => onCreate(name, budget, formation)}>{tr("إنشاء الغرفة", "Create room")}</Btn>
        </div>
      ) : (
        <div className="space-y-3">
          <input className={inputCls} style={inputStyle} placeholder={tr("كود الغرفة", "Room code")} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
          <Btn className="w-full" disabled={!joinCode.trim()} onClick={() => onJoin(name, joinCode)}>{tr("انضمام", "Join")}</Btn>
        </div>
      )}
      <p className="ff-body text-xs text-center mt-6" style={{ color: "#EEF1FF55" }}>{tr("شارك لينك اللعبة نفسه مع أصحابك عشان يدخلوا بنفس الكود.", "Share this same game link with your friends so they can join with the code.")}</p>
    </Shell>
  );
}

// ---------- Lobby ----------
function Lobby({ room, myId, onStart, onLeave }) {
  const { tr, lang } = useLang();
  if (!room || !Array.isArray(room.players)) return <RoomBroken onLeave={onLeave} />;
  const isHost = room.players[0]?.id === myId;
  return (
    <Shell>
      <Header title={tr("غرفة الانتظار", "Waiting Room")} sub={tr(`التشكيلة ${room.formation} · ميزانية ${(room.budget || 0).toLocaleString()} جنيه`, `Formation ${room.formation} · Budget ${(room.budget || 0).toLocaleString()} EGP`)} onLeave={onLeave} />
      <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "#141B3D", border: "1px dashed #39FF8888" }}>
        <div className="ff-body text-xs" style={{ color: "#EEF1FFAA" }}>{tr("كود الغرفة", "Room code")}</div>
        <div className="ff-display text-4xl font-bold tracking-widest" style={{ color: "#39FF88" }}>{room.code}</div>
      </div>
      <div className="ff-body text-sm font-bold mb-2" style={{ color: "#EEF1FF" }}>{tr(`اللاعبون (${room.players.length})`, `Players (${room.players.length})`)}</div>
      <div className="space-y-2 mb-6">
        {room.players.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#141B3D" }}>
            <span className="ff-body" style={{ color: "#EEF1FF" }}>{p.name}{p.id === room.players[0].id && <Chip color="#39FF88"> {tr("الهوست", "Host")} </Chip>}</span>
            {p.id === myId && <Chip color="#2E8FFF">{tr("أنت", "You")}</Chip>}
          </div>
        ))}
      </div>
      {isHost ? (
        <Btn className="w-full" disabled={room.players.length < 2} onClick={onStart}>
          {room.players.length < 2 ? tr("محتاج لاعب واحد على الأقل كمان", "Need at least one more player") : tr("ابدأ المزاد", "Start auction")}
        </Btn>
      ) : (
        <div className="ff-body text-center text-sm" style={{ color: "#EEF1FFAA" }}>{tr("في انتظار الهوست يبدأ المزاد...", "Waiting for the host to start the auction...")}</div>
      )}
    </Shell>
  );
}

// ---------- Auction ----------
function Auction({ room, myId, now, onBid, onPass, onLeave }) {
  const { tr, lang } = useLang();
  if (!room || !Array.isArray(room.players)) return <RoomBroken onLeave={onLeave} />;
  const a = room.auction;
  if (!a) return <Shell><div className="ff-body text-center py-10" style={{ color: "#EEF1FF" }}>{tr("جاري التحضير...", "Getting ready...")}</div></Shell>;
  const isCoachRound = a.kind === "coach";
  const pl = isCoachRound ? null : playerById(a.playerId);
  const coach = isCoachRound ? coachById(a.coachId) : null;
  if (isCoachRound ? !coach : !pl) return <RoomBroken onLeave={onLeave} />;
  const secsLeft = Math.max(0, Math.ceil((a.deadline - now) / 1000));
  const posLabel = lang === "ar" ? POS_LABEL : POS_LABEL_EN;
  const cardColor = isCoachRound ? "#39FF88" : POS_COLOR[pl.pos];
  const me = room.players.find((p) => p.id === myId);
  const quota = FORMATIONS[room.formation] || FORMATIONS["4-3-3"];
  const totalSlots = Object.values(quota).reduce((s, n) => s + n, 0);
  const canBid = me && (isCoachRound ? !me.coachId : (me.squad?.length || 0) < totalSlots && neededPositions(quota, me.squad || []).includes(a.pos));
  const iAmTop = a.bidderId === myId;
  const iPassed = !!a.passed?.[myId];

  const filledCount = room.players.reduce((s, p) => s + (p.squad?.length || 0), 0);
  const totalTarget = totalSlots * room.players.length;
  const coachesLeft = room.players.filter((p) => !p.coachId).length;
  const topBidder = a.bidderId ? room.players.find((p) => p.id === a.bidderId) : null;
  const eligibleOthers = room.players.filter((p) => p.id !== myId && (isCoachRound ? !p.coachId : (p.squad?.length || 0) < totalSlots && neededPositions(quota, p.squad || []).includes(a.pos)));
  const passedCount = eligibleOthers.filter((p) => a.passed?.[p.id] || p.id === a.bidderId).length;

  return (
    <Shell>
      <Header title={isCoachRound ? tr("مزاد المدربين", "Coach auction") : tr("المزاد جارٍ", "Auction in progress")}
        sub={isCoachRound ? tr(`باقي ${coachesLeft} محتاجين مدرب`, `${coachesLeft} still need a coach`) : tr(`اكتملت ${filledCount} من ${totalTarget} أماكن · التشكيلة ${room.formation}`, `${filledCount} of ${totalTarget} slots filled · Formation ${room.formation}`)}
        onLeave={onLeave} />

      <div className="rounded-xl p-5 mb-4 text-center" style={{ background: "#141B3D", border: `2px solid ${cardColor}55` }}>
        {isCoachRound ? (
          <div style={{ fontSize: 40 }}>🧑‍💼</div>
        ) : (
          <div className="flex justify-center mb-2">
            <PlayerCard key={a.playerId} player={pl} lang={lang} size="lg" selected justWon />
          </div>
        )}
        {!isCoachRound && <Chip color={cardColor}>{posLabel[pl.pos]}</Chip>}
        <div className="ff-display text-4xl font-bold mt-1" style={{ color: "#EEF1FF" }}>{isCoachRound ? cname(coach, lang) : pname(pl, lang)}</div>
        <div className="ff-body text-sm" style={{ color: "#EEF1FFAA" }}>{isCoachRound ? cstyle(coach, lang) : tr(`تقييم ${pl.rating}`, `Rating ${pl.rating}`)}</div>
        <div className="ff-display text-2xl font-bold mt-3" style={{ color: "#FF3B5C" }}>{secsLeft}s</div>
      </div>

      <div className="text-center mb-4">
        <div className="ff-body text-sm" style={{ color: "#EEF1FFAA" }}>{tr("أعلى عرض حاليًا", "Current top bid")}</div>
        <div key={a.currentBid} className="ff-display text-3xl font-bold ff-pop-in" style={{ color: "#39FF88" }}>{a.currentBid.toLocaleString()} {tr("جنيه", "EGP")}</div>
        <div className="ff-body text-sm mb-4" style={{ color: "#EEF1FF" }}>{topBidder ? topBidder.name : tr("لسه محدش زايد — يا إنت يا هما", "No bids yet — it's between whoever needs this spot")}</div>

        {canBid ? (
          <>
            <LiveBidInput currentBid={a.currentBid} budget={me.budget} isTop={iAmTop} onBid={onBid} />
            {!iAmTop && (
              <button onClick={onPass} disabled={iPassed} className="ff-body text-xs mt-2 underline" style={{ color: iPassed ? "#EEF1FF55" : "#EEF1FFAA" }}>
                {iPassed ? tr("قلت مش هزايد — مستني الباقي", "You passed — waiting on the rest") : tr("مش هزايد على ده", "I won't bid on this")}
              </button>
            )}
            {eligibleOthers.length > 0 && (
              <div className="ff-body text-xs mt-1" style={{ color: "#EEF1FF55" }}>{tr(`${passedCount}/${eligibleOthers.length} خلصوا قرارهم`, `${passedCount}/${eligibleOthers.length} have decided`)}</div>
            )}
          </>
        ) : (
          <div className="ff-body text-sm" style={{ color: "#EEF1FFAA" }}>
            {me ? tr("مش محتاج المركز ده دلوقتي", "You don't need this spot right now") : tr("مش في اللعبة دي", "Not in this game")}
          </div>
        )}
        <p className="ff-body text-xs mt-3" style={{ color: "#EEF1FF55" }}>{tr("اللي يكسبه يدفع ويكسبه، والباقي اللي لسه محتاجين نفس المركز ياخدوا واحد تاني عشوائي ببلاش.", "Whoever wins pays and takes them — everyone else who still needs this spot gets a different random one for free.")}</p>
      </div>

      <FormationBoard room={room} myId={myId} />
    </Shell>
  );
}

// ---------- كارت التشكيلة: يعرض كل فريق كخط حراسة/دفاع/وسط/هجوم بيتبني تدريجيًا ----------
function LiveBidInput({ currentBid, budget, isTop, onBid }) {
  const { tr } = useLang();
  const [amt, setAmt] = useState("");
  const invalid = !amt || Number(amt) <= currentBid || Number(amt) > budget;
  if (isTop) {
    return <div className="ff-body text-sm font-bold" style={{ color: "#39FF88" }}>{tr("إنت أعلى عرض دلوقتي 🔥", "You're the top bid right now 🔥")}</div>;
  }
  return (
    <div className="flex gap-2">
      <input type="number" className="ff-body flex-1 rounded-lg px-3 py-2.5 outline-none text-center"
        style={{ background: "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}
        placeholder={tr(`اكتب عرضك (أكتر من ${currentBid.toLocaleString()})`, `Your bid (more than ${currentBid.toLocaleString()})`)}
        value={amt} onChange={(e) => setAmt(e.target.value)} />
      <Btn disabled={invalid} onClick={() => { onBid(Number(amt)); setAmt(""); }}>{tr("زايد", "Bid")}</Btn>
    </div>
  );
}

function FormationBoard({ room, myId }) {
  const { tr, lang } = useLang();
  const posLabel = lang === "ar" ? POS_LABEL : POS_LABEL_EN;
  const quota = FORMATIONS[room.formation] || FORMATIONS["4-3-3"];
  const rows = [["FWD", quota.FWD], ["MID", quota.MID], ["DEF", quota.DEF], ["GK", quota.GK]];
  return (
    <div>
      <div className="ff-body text-sm font-bold mb-2" style={{ color: "#EEF1FF" }}>{tr("التشكيلات حتى الآن", "Formations so far")}</div>
      <div className="space-y-4">
        {(room.players || []).map((p) => {
          const squad = Array.isArray(p.squad) ? p.squad : [];
          const coach = coachById(p.coachId);
          return (
            <div key={p.id} className="rounded-xl p-3" style={{ background: "#141B3D" }}>
              <div className="flex justify-between ff-body text-sm mb-2">
                <span style={{ color: "#EEF1FF" }} className="font-bold">{p.name}{p.id === myId ? tr(" (أنت)", " (you)") : ""}</span>
                <span style={{ color: "#39FF88" }}>{tr(`${(p.budget || 0).toLocaleString()} جنيه متبقي`, `${(p.budget || 0).toLocaleString()} EGP left`)}</span>
              </div>
              {coach && <div className="ff-body text-xs mb-1.5" style={{ color: "#39FF88AA" }}>{tr(`🧑‍💼 المدرب: ${cname(coach, lang)}`, `🧑‍💼 Coach: ${cname(coach, lang)}`)}</div>}
              <div className="rounded-lg p-2" style={{ background: "linear-gradient(180deg, #0F3D22 0%, #0A2E1A 100%)" }}>
                {rows.map(([pos, count]) => {
                  const filled = squad.filter((s) => s.pos === pos);
                  const slots = Array.from({ length: count }, (_, i) => filled[i] || null);
                  return (
                    <div key={pos} className="flex justify-center gap-1.5 mb-1.5">
                      {slots.map((s, i) => (
                        <div key={i} className="ff-body text-center" style={{
                          width: 46, minHeight: 32, borderRadius: 6, fontSize: 8, lineHeight: 1.15, padding: "3px 2px",
                          background: s ? (s.price === 0 ? "#00D9FF33" : "#39FF8833") : "#FFFFFF14",
                          border: `1px solid ${s ? (s.price === 0 ? "#00D9FF88" : "#39FF8888") : "#FFFFFF22"}`,
                          color: s ? "#EEF1FF" : "#EEF1FF55",
                        }}>
                          {s ? pname(playerById(s.id) || s, lang) : posLabel[pos]}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Teams / Match ----------
function Teams({ room, myId, onRunMatch, onRunTournament, onLeave }) {
  const { tr, lang } = useLang();
  const [a, setA] = useState(room?.players?.[0]?.id);
  const [b, setB] = useState(room?.players?.[1]?.id || room?.players?.[0]?.id);
  if (!room || !room.players || !room.matches) return <RoomBroken onLeave={onLeave} />;
  const isHost = room.players[0]?.id === myId;
  const lastMatch = room.matches[room.matches.length - 1];
  const standings = computeStandings(room.players, room.matches);
  const anyLoading = room.matches.some((m) => m.loading);

  return (
    <Shell>
      <Header title={tr("الفرق جاهزة", "Squads are ready")} sub={tr("المزاد خلص، وقت المباراة", "Auction's done, time for the match")} onLeave={onLeave} />
      <div className="space-y-3 mb-6">
        {room.players.map((p) => {
          const coach = coachById(p.coachId);
          return (
            <div key={p.id} className="rounded-xl p-3" style={{ background: "#141B3D" }}>
              <div className="flex justify-between items-center mb-2">
                <span className="ff-body font-bold" style={{ color: "#EEF1FF" }}>{p.name}</span>
                <Chip color="#39FF88">{tr(`${p.budget} متبقي`, `${p.budget} left`)}</Chip>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {p.squad.map((s) => (
                  <span key={s.id} className="ff-body text-xs px-2 py-1 rounded" style={{ background: POS_COLOR[s.pos] + "22", color: POS_COLOR[s.pos] }}>
                    {pname(playerById(s.id) || s, lang)} · {s.rating}{s.price === 0 && tr(" (عشوائي)", " (random)")}
                  </span>
                ))}
              </div>
              <div className="ff-body text-xs" style={{ color: "#EEF1FFAA" }}>
                {tr("المدرب:", "Coach:")} {coach ? `${cname(coach, lang)} (${cstyle(coach, lang)})` : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {room.players.length >= 2 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "#141B3D" }}>
          <div className="ff-body text-sm font-bold mb-2" style={{ color: "#EEF1FF" }}>{tr("اختر المواجهة", "Choose the matchup")}</div>
          <div className="flex gap-2 mb-3">
            <select value={a} onChange={(e) => setA(e.target.value)} className="ff-body flex-1 rounded-lg px-2 py-2" style={{ background: "#0A0E27", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}>
              {room.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="ff-display text-xl" style={{ color: "#39FF88" }}>{tr("ضد", "vs")}</span>
            <select value={b} onChange={(e) => setB(e.target.value)} className="ff-body flex-1 rounded-lg px-2 py-2" style={{ background: "#0A0E27", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}>
              {room.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <Btn className="w-full" disabled={a === b} onClick={() => onRunMatch(a, b)}>{tr("ابدأ المباراة بالذكاء الاصطناعي", "Start the match with AI")}</Btn>
        </div>
      )}

      {room.players.length >= 3 && isHost && (
        <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "#141B3D", border: "1px dashed #39FF8855" }}>
          <p className="ff-body text-xs mb-2" style={{ color: "#EEF1FFAA" }}>{tr(`كل الفرق (${room.players.length}) تلعب ضد بعض دور واحد، وتطلع جدول ترتيب`, `All ${room.players.length} squads play each other once, then you get a standings table`)}</p>
          <Btn className="w-full" disabled={anyLoading} onClick={onRunTournament}>
            {anyLoading ? tr("البطولة جارية...", "Tournament running...") : tr("شغّل بطولة كاملة (الكل ضد الكل)", "Run a full tournament (round robin)")}
          </Btn>
        </div>
      )}

      {standings.length > 0 && standings.some((s) => s.played > 0) && (
        <div className="rounded-xl p-3 mb-4 overflow-x-auto" style={{ background: "#141B3D" }}>
          <div className="ff-body text-sm font-bold mb-2" style={{ color: "#EEF1FF" }}>{tr("جدول الترتيب", "Standings")}</div>
          <table className="w-full ff-body text-xs" style={{ color: "#EEF1FF" }}>
            <thead>
              <tr style={{ color: "#EEF1FFAA" }}>
                <th className="text-right pb-1">{tr("الفريق", "Team")}</th>
                <th className="pb-1">{tr("لعب", "P")}</th>
                <th className="pb-1">{tr("ف", "W")}</th>
                <th className="pb-1">{tr("ت", "D")}</th>
                <th className="pb-1">{tr("خ", "L")}</th>
                <th className="pb-1">+/-</th>
                <th className="pb-1">{tr("نقاط", "Pts")}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.name} style={{ background: i === 0 ? "#39FF8822" : "transparent" }}>
                  <td className="text-right py-1 font-bold">{i === 0 ? "🏆 " : ""}{s.name}</td>
                  <td className="text-center">{s.played}</td>
                  <td className="text-center">{s.win}</td>
                  <td className="text-center">{s.draw}</td>
                  <td className="text-center">{s.loss}</td>
                  <td className="text-center">{s.gf - s.ga}</td>
                  <td className="text-center font-bold" style={{ color: "#39FF88" }}>{s.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastMatch && <MatchCard m={lastMatch} />}
    </Shell>
  );
}

function computeStandings(players, matches) {
  const table = {};
  players.forEach((p) => { table[p.name] = { name: p.name, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, pts: 0 }; });
  matches.forEach((m) => {
    if (m.loading) return;
    const a = table[m.teamA], b = table[m.teamB];
    if (!a || !b) return;
    a.played++; b.played++;
    a.gf += m.scoreA; a.ga += m.scoreB;
    b.gf += m.scoreB; b.ga += m.scoreA;
    if (m.scoreA > m.scoreB) { a.win++; a.pts += 3; b.loss++; }
    else if (m.scoreA < m.scoreB) { b.win++; b.pts += 3; a.loss++; }
    else { a.draw++; b.draw++; a.pts += 1; b.pts += 1; }
  });
  return Object.values(table).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga));
}

function MatchCard({ m }) {
  const { tr } = useLang();
  return (
    <div className="rounded-xl p-4" style={{ background: "#141B3D", border: "1px solid #39FF8855" }}>
      <div className="flex items-center justify-center gap-4 mb-3">
        <span className="ff-body font-bold" style={{ color: "#EEF1FF" }}>{m.teamA}</span>
        <span className="ff-display text-4xl font-bold" style={{ color: "#39FF88" }}>{m.scoreA} - {m.scoreB}</span>
        <span className="ff-body font-bold" style={{ color: "#EEF1FF" }}>{m.teamB}</span>
      </div>
      {m.loading ? (
        <div className="ff-body text-center text-sm" style={{ color: "#EEF1FFAA" }}>{tr("الذكاء الاصطناعي بيكتب تقرير المباراة...", "AI is writing the match report...")}</div>
      ) : (
        <>
          <p className="ff-body text-sm leading-relaxed mb-3" style={{ color: "#EEF1FF" }}>{m.commentary}</p>
          {m.scorers?.length > 0 && (
            <div className="ff-body text-xs mb-2" style={{ color: "#EEF1FFAA" }}>
              {tr("الأهداف:", "Goals:")} {m.scorers.map((s, i) => `${s.player} (${s.minute}')`).join(tr("، ", ", "))}
            </div>
          )}
          {m.motm && <Chip color="#39FF88">⭐ {tr("لاعب المباراة:", "Player of the match:")} {m.motm}</Chip>}
        </>
      )}
    </div>
  );
}

// ---------- Guess Who ----------
function GuessWho({ onExit, account }) {
  const { tr, lang } = useLang();
  const [screen, setScreen] = useState("boot"); // boot | home | lobby | play
  const [myId, setMyId] = useState(null);
  const [code, setCode] = useState("");
  const [room, setRoomState] = useState(null);
  const [error, setError] = useState("");
  const [eliminated, setEliminated] = useState({});
  const pollRef = useRef(null);
  const awardRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get("gw-session", false);
        if (s) {
          const sess = JSON.parse(s.value);
          const r = await getGwRoom(sess.roomCode);
          if (r && r.players.some((p) => p.id === sess.myId)) {
            setMyId(sess.myId); setCode(sess.roomCode);
            setRoomState(r); setScreen(r.phase === "lobby" ? "lobby" : "play");
            startPolling(sess.roomCode);
            return;
          }
        }
      } catch {}
      setScreen("home");
    })();
  }, []);

  const startPolling = useCallback((c) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => { const r = await getGwRoom(c); if (r) setRoomState(r); }, 3000);
  }, []);
  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  async function saveSession(id, name, roomCode) {
    try { await window.storage.set("gw-session", JSON.stringify({ myId: id, name, roomCode }), false); } catch {}
  }

  async function createRoom(name) {
    setError("");
    const id = uid(); const c = genCode();
    const r = newGwRoom(c, id, name);
    await setGwRoom(c, r);
    setMyId(id); setCode(c); setRoomState(r); setScreen("lobby");
    saveSession(id, name, c); startPolling(c);
  }

  async function joinRoom(name, joinCode) {
    setError("");
    const c = joinCode.trim().toUpperCase();
    const r = await getGwRoom(c);
    if (!r || !Array.isArray(r.players)) { setError(tr("الغرفة دي معادتش شغالة، جرب كود تاني أو اعمل غرفة جديدة.", "This room is no longer valid — try a different code or create a new one.")); return; }
    if (r.players.length >= 2) { setError(tr("الغرفة مكتملة (لعبة لشخصين بس).", "Room is full (2-player game only).")); return; }
    if (r.phase !== "lobby") { setError(tr("اللعبة بدأت خلاص.", "The game already started.")); return; }
    const id = uid();
    r.players.push({ id, name, secretId: null });
    await setGwRoom(c, r);
    setMyId(id); setCode(c); setRoomState(r); setScreen("lobby");
    saveSession(id, name, c); startPolling(c);
  }

  async function leaveRoom() {
    try { await window.storage.delete("gw-session", false); } catch {}
    if (pollRef.current) clearInterval(pollRef.current);
    setMyId(null); setRoomState(null); setCode("");
    onExit();
  }

  async function startGame() {
    const r = await getGwRoom(code);
    if (!r || r.players.length !== 2) return;
    const secrets = shuffle(POOL).slice(0, 2);
    r.players[0].secretId = secrets[0].id;
    r.players[1].secretId = secrets[1].id;
    r.turnPlayerId = r.players[0].id;
    r.phase = "playing"; r.log = []; r.pendingQuestion = null; r.winnerId = null;
    setRoomState(await setGwRoom(code, r)); setScreen("play");
  }

  async function askQuestion(text) {
    const r = await getGwRoom(code);
    if (!r || r.turnPlayerId !== myId || r.pendingQuestion) return;
    r.pendingQuestion = { text, askerId: myId };
    setRoomState(await setGwRoom(code, r));
  }

  async function answerQuestion(ans) {
    const r = await getGwRoom(code);
    if (!r || !r.pendingQuestion || r.pendingQuestion.askerId === myId) return;
    const asker = r.players.find((p) => p.id === r.pendingQuestion.askerId);
    r.log.push({ type: "qa", askerName: asker.name, question: r.pendingQuestion.text, answer: ans });
    r.pendingQuestion = null;
    r.turnPlayerId = myId;
    setRoomState(await setGwRoom(code, r));
  }

  async function makeGuess(guessedId) {
    const r = await getGwRoom(code);
    if (!r || r.turnPlayerId !== myId || r.pendingQuestion) return;
    const me = r.players.find((p) => p.id === myId);
    const opp = r.players.find((p) => p.id !== myId);
    const correct = opp.secretId === guessedId;
    r.log.push({ type: "guess", askerName: me.name, question: tr(`خمّن إن اللاعب هو ${pname(playerById(guessedId), lang)}`, `Guessed the player is ${pname(playerById(guessedId), lang)}`), answer: correct ? "correct" : "wrong" });
    if (correct) { r.phase = "finished"; r.winnerId = myId; }
    else { r.turnPlayerId = opp.id; }
    setRoomState(await setGwRoom(code, r));
  }

  async function rematch() {
    const r = await getGwRoom(code);
    if (!r || r.players.length !== 2) return;
    const secrets = shuffle(POOL).slice(0, 2);
    r.players[0].secretId = secrets[0].id;
    r.players[1].secretId = secrets[1].id;
    r.turnPlayerId = r.players[0].id;
    r.phase = "playing"; r.log = []; r.pendingQuestion = null; r.winnerId = null;
    setEliminated({});
    awardRef.current = null;
    setRoomState(await setGwRoom(code, r));
  }

  useEffect(() => { if (room) setScreen(room.phase === "lobby" ? "lobby" : "play"); }, [room && room.phase]);

  useEffect(() => {
    if (room && room.phase === "finished" && room.winnerId === myId && account && awardRef.current !== code) {
      awardRef.current = code;
      addScore(account.username, 15, tr("فزت في خمّن اللاعب", "Won Guess the Player"));
    }
    // eslint-disable-next-line
  }, [room && room.phase]);

  if (screen === "boot") return <LoadingScreen />;
  if (screen === "home") return <GwHome onCreate={createRoom} onJoin={joinRoom} error={error} onBack={onExit} account={account} />;
  if (!room) return <LoadingScreen room />;
  if (screen === "lobby") return <GwLobby room={room} myId={myId} onStart={startGame} onLeave={leaveRoom} />;
  return <GwPlay room={room} myId={myId} onAsk={askQuestion} onAnswer={answerQuestion} onGuess={makeGuess} onRematch={rematch} onLeave={leaveRoom} eliminated={eliminated} setEliminated={setEliminated} />;
}

function GwHome({ onCreate, onJoin, error, onBack, account }) {
  const { tr } = useLang();
  const [tab, setTab] = useState("create");
  const [joinCode, setJoinCode] = useState("");
  const name = account?.username || "";
  const inputCls = "ff-body w-full rounded-lg px-3 py-2.5 outline-none";
  const inputStyle = { background: "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" };
  return (
    <Shell>
      <button onClick={onBack} className="ff-body text-xs mb-4" style={{ color: "#EEF1FFAA" }}>{tr("‹ رجوع لقائمة الألعاب", "‹ Back to games")}</button>
      <div className="text-center mb-8">
        <div className="ff-display text-5xl font-bold" style={{ color: "#39FF88" }}>{tr("خمّن اللاعب", "Guess the Player")}</div>
        <p className="ff-body text-sm mt-1" style={{ color: "#EEF1FFAA" }}>{tr(`هتلعب باسم ${name} — اسألوا بعض أسئلة بنعم ولأ لحد ما تكتشفوا لاعب خصمك السرّي`, `Playing as ${name} — ask each other yes/no questions until you figure out your opponent's secret player`)}</p>
      </div>
      <div className="flex rounded-lg overflow-hidden mb-5" style={{ border: "1px solid #EEF1FF33" }}>
        {["create", "join"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className="ff-body flex-1 py-2.5 font-bold text-sm"
            style={{ background: tab === t ? "#39FF88" : "transparent", color: tab === t ? "#0A0E27" : "#EEF1FF" }}>
            {t === "create" ? tr("إنشاء غرفة", "Create room") : tr("الانضمام لغرفة", "Join room")}
          </button>
        ))}
      </div>
      {error && <div className="ff-body text-sm mb-3 px-3 py-2 rounded" style={{ background: "#FF3B5C33", color: "#EEF1FF" }}>{error}</div>}
      {tab === "create" ? (
        <Btn className="w-full" onClick={() => onCreate(name)}>{tr("إنشاء الغرفة", "Create room")}</Btn>
      ) : (
        <div className="space-y-3">
          <input className={inputCls} style={inputStyle} placeholder={tr("كود الغرفة", "Room code")} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
          <Btn className="w-full" disabled={!joinCode.trim()} onClick={() => onJoin(name, joinCode)}>{tr("انضمام", "Join")}</Btn>
        </div>
      )}
      <p className="ff-body text-xs text-center mt-6" style={{ color: "#EEF1FF55" }}>{tr("اللعبة لشخصين بس. شارك اللينك والكود مع صاحبك.", "2 players only. Share the link and code with your friend.")}</p>
    </Shell>
  );
}

function GwLobby({ room, myId, onStart, onLeave }) {
  const { tr } = useLang();
  if (!room || !Array.isArray(room.players)) return <RoomBroken onLeave={onLeave} />;
  const isHost = room.players[0]?.id === myId;
  return (
    <Shell>
      <Header title={tr("غرفة الانتظار", "Waiting Room")} sub={tr("لعبة لشخصين", "A 2-player game")} onLeave={onLeave} />
      <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "#141B3D", border: "1px dashed #39FF8888" }}>
        <div className="ff-body text-xs" style={{ color: "#EEF1FFAA" }}>{tr("كود الغرفة", "Room code")}</div>
        <div className="ff-display text-4xl font-bold tracking-widest" style={{ color: "#39FF88" }}>{room.code}</div>
      </div>
      <div className="space-y-2 mb-6">
        {room.players.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#141B3D" }}>
            <span className="ff-body" style={{ color: "#EEF1FF" }}>{p.name}</span>
            {p.id === myId && <Chip color="#2E8FFF">{tr("أنت", "You")}</Chip>}
          </div>
        ))}
      </div>
      {isHost ? (
        <Btn className="w-full" disabled={room.players.length < 2} onClick={onStart}>
          {room.players.length < 2 ? tr("في انتظار صاحبك ينضم", "Waiting for your friend to join") : tr("ابدأ اللعبة", "Start game")}
        </Btn>
      ) : (
        <div className="ff-body text-center text-sm" style={{ color: "#EEF1FFAA" }}>{tr("في انتظار الهوست يبدأ اللعبة...", "Waiting for the host to start...")}</div>
      )}
    </Shell>
  );
}

function GwPlay({ room, myId, onAsk, onAnswer, onGuess, onRematch, onLeave, eliminated, setEliminated }) {
  const { tr, lang } = useLang();
  const [qText, setQText] = useState("");
  const [guessId, setGuessId] = useState("");
  if (!room || !room.players) return <RoomBroken onLeave={onLeave} />;
  const me = room.players.find((p) => p.id === myId);
  const opp = room.players.find((p) => p.id !== myId);
  const mySecret = me ? playerById(me.secretId) : null;
  const myTurn = room.turnPlayerId === myId;
  const pending = room.pendingQuestion;
  const iAmAnswering = pending && pending.askerId !== myId;
  const iAmWaiting = pending && pending.askerId === myId;

  if (room.phase === "finished") {
    const won = room.winnerId === myId;
    return (
      <Shell>
        {won && <Confetti />}
        <Header title={tr("خلصت اللعبة", "Game over")} onLeave={onLeave} />
        <div className={"rounded-xl p-5 mb-5 text-center " + (won ? "ff-pop-in" : "ff-fade-up")} style={{ background: "#141B3D", border: "1px solid #39FF8855" }}>
          <div className={"ff-display text-3xl font-bold mb-2 " + (won ? "ff-float" : "")} style={{ color: "#39FF88" }}>{won ? tr("🎉 كسبت!", "🎉 You won!") : tr(`${room.players.find((p) => p.id === room.winnerId)?.name} كسب`, `${room.players.find((p) => p.id === room.winnerId)?.name} won`)}</div>
          <div className="ff-body text-sm" style={{ color: "#EEF1FFAA" }}>
            {tr(`لاعبك كان: ${pname(mySecret, lang)} · لاعب ${opp?.name} كان: ${pname(playerById(opp?.secretId), lang)}`, `Your player was: ${pname(mySecret, lang)} · ${opp?.name}'s player was: ${pname(playerById(opp?.secretId), lang)}`)}
          </div>
          <div className="flex gap-2 mt-4">
            {room.players[0]?.id === myId && <Btn className="flex-1" onClick={onRematch}>{tr("العب تاني", "Play again")}</Btn>}
            <Btn variant="ghost" className="flex-1" onClick={onLeave}>{tr("قائمة الألعاب", "Games menu")}</Btn>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header title={tr("خمّن اللاعب", "Guess the Player")} sub={tr(`لاعبك السرّي: ${mySecret ? pname(mySecret, lang) : "..."}`, `Your secret player: ${mySecret ? pname(mySecret, lang) : "..."}`)} onLeave={onLeave} />

      <div className="rounded-xl p-3 mb-4 text-center" style={{ background: myTurn ? "#00D9FF" : "#141B3D", border: "1px solid #EEF1FF33" }}>
        <span className="ff-body text-sm font-bold" style={{ color: "#EEF1FF" }}>
          {iAmAnswering ? tr(`${opp?.name} بيسألك:`, `${opp?.name} is asking you:`) : iAmWaiting ? tr(`في انتظار رد ${opp?.name}...`, `Waiting for ${opp?.name} to answer...`) : myTurn ? tr("دورك تسأل أو تخمن", "Your turn to ask or guess") : tr(`دور ${opp?.name}`, `${opp?.name}'s turn`)}
        </span>
      </div>

      {iAmAnswering && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "#141B3D" }}>
          <p className="ff-body text-center mb-3" style={{ color: "#EEF1FF" }}>{pending.text}</p>
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => onAnswer("yes")}>{tr("آه", "Yes")}</Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => onAnswer("no")}>{tr("لأ", "No")}</Btn>
          </div>
        </div>
      )}

      {myTurn && !pending && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "#141B3D" }}>
          <input className="ff-body w-full rounded-lg px-3 py-2.5 mb-2 outline-none" style={{ background: "#0A0E27", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}
            placeholder={tr("مثلاً: لاعبك مهاجم؟", "e.g. Is your player a forward?")} value={qText} onChange={(e) => setQText(e.target.value)} />
          <Btn className="w-full mb-3" disabled={!qText.trim()} onClick={() => { onAsk(qText.trim()); setQText(""); }}>{tr("اسأل", "Ask")}</Btn>

          <div className="ff-body text-xs mb-1" style={{ color: "#EEF1FFAA" }}>{tr("ولا خمّن اللاعب على طول", "Or guess the player right away")}</div>
          <div className="flex gap-2">
            <select value={guessId} onChange={(e) => setGuessId(e.target.value)} className="ff-body flex-1 rounded-lg px-2 py-2" style={{ background: "#0A0E27", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}>
              <option value="">{tr("اختار لاعب", "Pick a player")}</option>
              {POOL.map((p) => <option key={p.id} value={p.id}>{pname(p, lang)}</option>)}
            </select>
            <Btn disabled={!guessId} onClick={() => { onGuess(guessId); setGuessId(""); }}>{tr("خمّن", "Guess")}</Btn>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="ff-body text-sm font-bold mb-2" style={{ color: "#EEF1FF" }}>{tr("سجل الأسئلة", "Question log")}</div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {room.log.length === 0 && <div className="ff-body text-xs" style={{ color: "#EEF1FF55" }}>{tr("لسه معملتوش أسئلة", "No questions yet")}</div>}
          {[...room.log].reverse().map((l, i) => (
            <div key={i} className="ff-body text-xs px-2 py-1.5 rounded" style={{ background: "#141B3D", color: "#EEF1FF" }}>
              <span style={{ color: "#39FF88" }}>{l.askerName}:</span> {l.question}
              {l.type === "qa" && <span style={{ color: l.answer === "yes" ? "#2E8FFF" : "#FF3B5C" }}> — {tr(l.answer === "yes" ? "آه" : "لأ", l.answer === "yes" ? "Yes" : "No")}</span>}
              {l.type === "guess" && <span style={{ color: l.answer === "correct" ? "#2E8FFF" : "#FF3B5C" }}> — {tr(l.answer === "correct" ? "صح!" : "غلط", l.answer === "correct" ? "Correct!" : "Wrong")}</span>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="ff-body text-sm font-bold mb-2" style={{ color: "#EEF1FF" }}>{tr("قائمة اللاعبين (دوس عشان تستبعد)", "Player list (tap to rule out)")}</div>
        <div className="grid grid-cols-4 gap-1">
          {POOL.map((p) => {
            const off = eliminated[p.id];
            return (
              <button key={p.id} onClick={() => setEliminated((e) => ({ ...e, [p.id]: !e[p.id] }))}
                className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg transition active:scale-95" style={{ opacity: off ? 0.35 : 1 }}>
                <PlayerCard player={p} lang={lang} size="sm" />
                <span className="ff-body text-center leading-tight" style={{ fontSize: 9, color: "#EEF1FFAA", maxWidth: 62, textDecoration: off ? "line-through" : "none" }}>{pname(p, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

// ---------- Trivia game ----------
function Trivia({ onExit, account }) {
  const { tr, lang } = useLang();
  const [phase, setPhase] = useState("loading"); // loading | quiz | done
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);

  async function loadNew() {
    setPhase("loading"); setIdx(0); setScore(0); setPicked(null);
    const q = await generateTrivia(lang);
    setQs(q); setPhase("quiz");
  }
  useEffect(() => { loadNew(); }, []);

  function pick(i) {
    if (picked !== null) return;
    setPicked(i);
    let finalScore = score;
    if (i === qs[idx].answer) { finalScore = score + 1; setScore(finalScore); }
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 < qs.length) setIdx((n) => n + 1);
      else {
        setPhase("done");
        if (account) addScore(account.username, finalScore * 2, tr("تريفيا الكورة", "Football Trivia"));
      }
    }, 900);
  }

  if (phase === "loading") {
    return <Shell><Header title={tr("تريفيا الكورة", "Football Trivia")} onLeave={onExit} /><div className="ff-body text-center py-16" style={{ color: "#EEF1FFAA" }}>{tr("بيجهز الأسئلة...", "Preparing questions...")}</div></Shell>;
  }

  if (phase === "done") {
    return (
      <Shell>
        {score === qs.length && <Confetti />}
        <Header title={tr("خلصت التريفيا", "Trivia complete")} onLeave={onExit} />
        <div className="rounded-xl p-6 text-center ff-pop-in" style={{ background: "#141B3D", border: "1px solid #39FF8855" }}>
          <div className={"ff-display text-5xl font-bold mb-2 " + (score === qs.length ? "ff-float" : "")} style={{ color: "#39FF88" }}>{score}/{qs.length}</div>
          <p className="ff-body text-sm" style={{ color: "#EEF1FFAA" }}>
            {score === qs.length ? tr("ممتاز! معلوماتك في الكورة جامدة 🔥", "Perfect! Your football knowledge is elite 🔥") : score >= qs.length / 2 ? tr("مش وحش خالص!", "Not bad at all!") : tr("محتاج تراجع كورة شوية 😅", "Might want to brush up a bit 😅")}
          </p>
          <Btn className="mt-4 w-full" onClick={loadNew}>{tr("أسئلة جديدة", "New questions")}</Btn>
        </div>
      </Shell>
    );
  }

  const cur = qs[idx];
  return (
    <Shell>
      <Header title={tr("تريفيا الكورة", "Football Trivia")} sub={tr(`سؤال ${idx + 1} من ${qs.length} · نقاطك ${score}`, `Question ${idx + 1} of ${qs.length} · Score ${score}`)} onLeave={onExit} />
      <div className="rounded-xl p-4 mb-4" style={{ background: "#141B3D" }}>
        <p className="ff-body font-bold text-lg mb-4 text-center" style={{ color: "#EEF1FF" }}>{cur.q}</p>
        <div className="space-y-2">
          {cur.options.map((opt, i) => {
            let bg = "#0A0E27";
            if (picked !== null) {
              if (i === cur.answer) bg = "#00D9FF";
              else if (i === picked) bg = "#FF3B5C";
            }
            return (
              <button key={i} onClick={() => pick(i)} disabled={picked !== null}
                className="ff-body w-full text-right px-4 py-3 rounded-lg" style={{ background: bg, color: "#EEF1FF", border: "1px solid #EEF1FF33" }}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

// ---------- Dream Team game ----------
function DreamTeam({ onExit, account }) {
  const { tr, lang } = useLang();
  const [screen, setScreen] = useState("boot"); // boot | home | lobby | pick | results
  const [myId, setMyId] = useState(null);
  const [code, setCode] = useState("");
  const [room, setRoomState] = useState(null);
  const [error, setError] = useState("");
  const pollRef = useRef(null);
  const awardRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get("dt-session", false);
        if (s) {
          const sess = JSON.parse(s.value);
          const r = await getDtRoom(sess.roomCode);
          if (r && r.players.some((p) => p.id === sess.myId)) {
            setMyId(sess.myId); setCode(sess.roomCode);
            setRoomState(r); setScreen(screenFor(r));
            startPolling(sess.roomCode);
            return;
          }
        }
      } catch {}
      setScreen("home");
    })();
  }, []);

  function screenFor(r) {
    if (r.phase === "lobby") return "lobby";
    if (r.phase === "results") return "results";
    return "pick";
  }

  const startPolling = useCallback((c) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => { const r = await getDtRoom(c); if (r) setRoomState(r); }, 3000);
  }, []);
  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  async function saveSession(id, name, roomCode) {
    try { await window.storage.set("dt-session", JSON.stringify({ myId: id, name, roomCode }), false); } catch {}
  }

  async function createRoom(name) {
    setError("");
    const id = uid(); const c = genCode();
    const r = newDtRoom(c, id, name);
    await setDtRoom(c, r);
    setMyId(id); setCode(c); setRoomState(r); setScreen("lobby");
    saveSession(id, name, c); startPolling(c);
  }

  async function joinRoom(name, joinCode) {
    setError("");
    const c = joinCode.trim().toUpperCase();
    const r = await getDtRoom(c);
    if (!r || !Array.isArray(r.players)) { setError(tr("الغرفة دي معادتش شغالة، جرب كود تاني أو اعمل غرفة جديدة.", "This room is no longer valid — try a different code or create a new one.")); return; }
    if (r.phase !== "lobby") { setError(tr("اللعبة بدأت خلاص.", "The game already started.")); return; }
    const id = uid();
    r.players.push({ id, name, squad: [], coachId: null, ready: false });
    await setDtRoom(c, r);
    setMyId(id); setCode(c); setRoomState(r); setScreen("lobby");
    saveSession(id, name, c); startPolling(c);
  }

  async function leaveRoom() {
    try { await window.storage.delete("dt-session", false); } catch {}
    if (pollRef.current) clearInterval(pollRef.current);
    setMyId(null); setRoomState(null); setCode("");
    onExit();
  }

  async function startPicking() {
    const r = await getDtRoom(code);
    if (!r || r.players.length < 2) return;
    r.phase = "picking";
    setRoomState(await setDtRoom(code, r)); setScreen("pick");
  }

  async function togglePlayer(playerId) {
    const r = await getDtRoom(code);
    if (!r) return;
    const me = r.players.find((p) => p.id === myId);
    if (!me || me.ready) return;
    const has = me.squad.includes(playerId);
    if (has) me.squad = me.squad.filter((id) => id !== playerId);
    else if (me.squad.length < 11) me.squad.push(playerId);
    setRoomState(await setDtRoom(code, r));
  }

  async function pickCoach(coachId) {
    const r = await getDtRoom(code);
    if (!r) return;
    const me = r.players.find((p) => p.id === myId);
    if (!me || me.ready) return;
    me.coachId = coachId;
    setRoomState(await setDtRoom(code, r));
  }

  async function markReady() {
    const r = await getDtRoom(code);
    if (!r) return;
    const me = r.players.find((p) => p.id === myId);
    if (!me || me.squad.length !== 11 || !me.coachId) return;
    me.ready = true;
    setRoomState(await setDtRoom(code, r));
  }

  async function computeResults() {
    const r = await getDtRoom(code);
    if (!r) return;
    r.phase = "computing";
    setRoomState(await setDtRoom(code, r));
    const teams = r.players.map((p) => ({ name: p.name, squad: p.squad.map((id) => playerById(id)), coach: coachById(p.coachId) }));
    const styles = await generateTeamStyles(teams, lang);
    const r2 = await getDtRoom(code);
    r2.results = r2.players.map((p) => {
      const squad = p.squad.map((id) => playerById(id));
      const coach = coachById(p.coachId);
      const total = squad.reduce((s, x) => s + x.rating, 0) + (coach?.bonus || 0);
      const styleObj = styles.find((s) => s.team === p.name);
      return { name: p.name, total, avg: Math.round((total / 11) * 10) / 10, squad, coach, style: styleObj?.style || localTeamStyle(squad, lang) };
    }).sort((a, b) => b.total - a.total);
    r2.phase = "results";
    setRoomState(await setDtRoom(code, r2)); setScreen("results");
  }

  useEffect(() => { if (room) setScreen(screenFor(room)); }, [room && room.phase]);

  useEffect(() => {
    if (room && room.phase === "results" && room.results?.[0] && account && room.results[0].name === account.username && awardRef.current !== code) {
      awardRef.current = code;
      addScore(account.username, 20, tr("أفضل تشكيلة أحلام", "Best Dream Team"));
    }
    // eslint-disable-next-line
  }, [room && room.phase]);

  if (screen === "boot") return <LoadingScreen />;
  if (screen === "home") return <DtHome onCreate={createRoom} onJoin={joinRoom} error={error} onBack={onExit} account={account} />;
  if (!room) return <LoadingScreen room />;
  if (screen === "lobby") return <DtLobby room={room} myId={myId} onStart={startPicking} onLeave={leaveRoom} />;
  if (screen === "results") return <DtResults room={room} myId={myId} onLeave={leaveRoom} />;
  if (room.phase === "computing") return <Shell><Header title={tr("تشكيلة الأحلام", "Dream Team")} onLeave={leaveRoom} /><div className="ff-body text-center py-16" style={{ color: "#EEF1FFAA" }}>{tr("بنحسب النتايج...", "Crunching the results...")}</div></Shell>;
  return <DtPick room={room} myId={myId} onToggle={togglePlayer} onPickCoach={pickCoach} onReady={markReady} onCompute={computeResults} onLeave={leaveRoom} />;
}

function DtHome({ onCreate, onJoin, error, onBack, account }) {
  const { tr } = useLang();
  const [tab, setTab] = useState("create");
  const [joinCode, setJoinCode] = useState("");
  const name = account?.username || "";
  const inputCls = "ff-body w-full rounded-lg px-3 py-2.5 outline-none";
  const inputStyle = { background: "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" };
  return (
    <Shell>
      <button onClick={onBack} className="ff-body text-xs mb-4" style={{ color: "#EEF1FFAA" }}>{tr("‹ رجوع لقائمة الألعاب", "‹ Back to games")}</button>
      <div className="text-center mb-8">
        <div className="ff-display text-5xl font-bold" style={{ color: "#39FF88" }}>{tr("تشكيلة الأحلام", "Dream Team")}</div>
        <p className="ff-body text-sm mt-1" style={{ color: "#EEF1FFAA" }}>{tr(`هتلعب باسم ${name} — كل واحد يختار أفضل 11 لاعب حسب رأيه، وتتقارنوا بالتقييم`, `Playing as ${name} — everyone drafts their best XI, then squads are compared by rating`)}</p>
      </div>
      <div className="flex rounded-lg overflow-hidden mb-5" style={{ border: "1px solid #EEF1FF33" }}>
        {["create", "join"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className="ff-body flex-1 py-2.5 font-bold text-sm"
            style={{ background: tab === t ? "#39FF88" : "transparent", color: tab === t ? "#0A0E27" : "#EEF1FF" }}>
            {t === "create" ? tr("إنشاء غرفة", "Create room") : tr("الانضمام لغرفة", "Join room")}
          </button>
        ))}
      </div>
      {error && <div className="ff-body text-sm mb-3 px-3 py-2 rounded" style={{ background: "#FF3B5C33", color: "#EEF1FF" }}>{error}</div>}
      {tab === "create" ? (
        <Btn className="w-full" onClick={() => onCreate(name)}>{tr("إنشاء الغرفة", "Create room")}</Btn>
      ) : (
        <div className="space-y-3">
          <input className={inputCls} style={inputStyle} placeholder={tr("كود الغرفة", "Room code")} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
          <Btn className="w-full" disabled={!joinCode.trim()} onClick={() => onJoin(name, joinCode)}>{tr("انضمام", "Join")}</Btn>
        </div>
      )}
      <p className="ff-body text-xs text-center mt-6" style={{ color: "#EEF1FF55" }}>{tr("من 2 لـ 6 لاعبين. شارك الكود مع أصحابك.", "2 to 6 players. Share the code with your friends.")}</p>
    </Shell>
  );
}

function DtLobby({ room, myId, onStart, onLeave }) {
  const { tr } = useLang();
  if (!room || !Array.isArray(room.players)) return <RoomBroken onLeave={onLeave} />;
  const isHost = room.players[0]?.id === myId;
  return (
    <Shell>
      <Header title={tr("غرفة الانتظار", "Waiting Room")} sub={tr("تشكيلة الأحلام", "Dream Team")} onLeave={onLeave} />
      <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "#141B3D", border: "1px dashed #39FF8888" }}>
        <div className="ff-body text-xs" style={{ color: "#EEF1FFAA" }}>{tr("كود الغرفة", "Room code")}</div>
        <div className="ff-display text-4xl font-bold tracking-widest" style={{ color: "#39FF88" }}>{room.code}</div>
      </div>
      <div className="space-y-2 mb-6">
        {room.players.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#141B3D" }}>
            <span className="ff-body" style={{ color: "#EEF1FF" }}>{p.name}</span>
            {p.id === myId && <Chip color="#2E8FFF">{tr("أنت", "You")}</Chip>}
          </div>
        ))}
      </div>
      {isHost ? (
        <Btn className="w-full" disabled={room.players.length < 2} onClick={onStart}>
          {room.players.length < 2 ? tr("في انتظار لاعبين تانيين", "Waiting for more players") : tr("ابدأ اختيار التشكيلات", "Start drafting squads")}
        </Btn>
      ) : (
        <div className="ff-body text-center text-sm" style={{ color: "#EEF1FFAA" }}>{tr("في انتظار الهوست يبدأ اللعبة...", "Waiting for the host to start...")}</div>
      )}
    </Shell>
  );
}

function DtPick({ room, myId, onToggle, onPickCoach, onReady, onCompute, onLeave }) {
  const { tr, lang } = useLang();
  if (!room || !room.players) return <RoomBroken onLeave={onLeave} />;
  const me = room.players.find((p) => p.id === myId);
  const isHost = room.players[0]?.id === myId;
  const allReady = room.players.every((p) => p.ready);
  if (!me) return null;
  if (me.ready) {
    return (
      <Shell>
        <Header title={tr("تشكيلة الأحلام", "Dream Team")} sub={tr("تشكيلتك جاهزة", "Your squad is ready")} onLeave={onLeave} />
        <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "#141B3D" }}>
          <div className="ff-body text-sm mb-2" style={{ color: "#EEF1FF" }}>{tr(`في انتظار باقي اللاعبين (${room.players.filter((p) => p.ready).length}/${room.players.length})`, `Waiting for the rest (${room.players.filter((p) => p.ready).length}/${room.players.length})`)}</div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {room.players.map((p) => <Chip key={p.id} color={p.ready ? "#00D9FF" : "#EEF1FF55"}>{p.name} {p.ready ? "✓" : "..."}</Chip>)}
          </div>
        </div>
        {isHost && <Btn className="w-full" disabled={!allReady} onClick={onCompute}>{allReady ? tr("احسب النتيجة", "Compute results") : tr("لسه مش كله جاهز", "Not everyone's ready yet")}</Btn>}
      </Shell>
    );
  }
  return (
    <Shell>
      <Header title={tr("اختار تشكيلتك", "Draft your squad")} sub={tr(`${me.squad.length}/11 لاعب`, `${me.squad.length}/11 players`)} onLeave={onLeave} />
      <div className="grid grid-cols-4 gap-1 mb-4">
        {POOL.map((p) => (
          <PlayerTile key={p.id} player={p} lang={lang} selected={me.squad.includes(p.id)} onClick={() => onToggle(p.id)} />
        ))}
      </div>

      <div className="mb-4">
        <div className="ff-body text-sm font-bold mb-2" style={{ color: "#EEF1FF" }}>{tr("اختار مدربك", "Pick your coach")}</div>
        <select value={me.coachId || ""} onChange={(e) => onPickCoach(e.target.value || null)}
          className="ff-body w-full rounded-lg px-2 py-2.5" style={{ background: "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}>
          <option value="">{tr("بدون مدرب", "No coach")}</option>
          {COACHES.map((c) => <option key={c.id} value={c.id}>{cname(c, lang)} — {cstyle(c, lang)}</option>)}
        </select>
      </div>

      <Btn className="w-full" disabled={me.squad.length !== 11 || !me.coachId} onClick={onReady}>
        {me.squad.length !== 11 ? tr(`اختار ${11 - me.squad.length} لاعب كمان`, `Pick ${11 - me.squad.length} more player(s)`) : !me.coachId ? tr("اختار مدرب الأول", "Pick a coach first") : tr("تمام، أنا جاهز", "Ready to go")}
      </Btn>
    </Shell>
  );
}

function DtResults({ room, myId, onLeave }) {
  const { tr, lang } = useLang();
  if (!room || !room.players) return <RoomBroken onLeave={onLeave} />;
  return (
    <Shell>
      <Header title={tr("النتيجة", "Results")} sub={tr("تشكيلة الأحلام", "Dream Team")} onLeave={onLeave} />
      <div className="space-y-3">
        {room.results.map((r, i) => (
          <div key={r.name} className="rounded-xl p-4" style={{ background: "#141B3D", border: i === 0 ? "1px solid #39FF8888" : "1px solid #EEF1FF33" }}>
            <div className="flex justify-between items-center mb-1">
              <span className="ff-body font-bold" style={{ color: "#EEF1FF" }}>{i === 0 ? "🏆 " : `${i + 1}. `}{r.name}</span>
              <Chip color="#39FF88">{tr(`إجمالي ${r.total}`, `Total ${r.total}`)}</Chip>
            </div>
            <p className="ff-body text-xs mb-1" style={{ color: "#EEF1FFAA" }}>{r.style} · {tr(`متوسط التقييم ${r.avg}`, `Avg rating ${r.avg}`)}</p>
            {r.coach && <p className="ff-body text-xs mb-2" style={{ color: "#39FF88AA" }}>{tr(`المدرب: ${cname(r.coach, lang)}`, `Coach: ${cname(r.coach, lang)}`)}</p>}
            <div className="flex flex-wrap gap-1">
              {r.squad.map((s) => (
                <span key={s.id} className="ff-body text-xs px-1.5 py-0.5 rounded" style={{ background: POS_COLOR[s.pos] + "22", color: POS_COLOR[s.pos] }}>{pname(s, lang)}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ---------- Guess sub-menu ----------
function GuessHub({ onPick, onBack }) {
  const { tr } = useLang();
  return (
    <Shell>
      <button onClick={onBack} className="ff-body text-xs mb-4" style={{ color: "#EEF1FFAA" }}>{tr("‹ رجوع لقائمة الألعاب", "‹ Back to games")}</button>
      <div className="text-center mb-8">
        <div className="ff-display text-5xl font-bold" style={{ color: "#39FF88" }}>{tr("خمّن اللاعب", "Guess the Player")}</div>
        <p className="ff-body text-sm mt-1" style={{ color: "#EEF1FFAA" }}>{tr("اختار الطريقة اللي عايز تلعب بيها", "Pick how you want to play")}</p>
      </div>
      <div className="space-y-4">
        <GameCard index={0} color="#2E8FFF" icon={<IconQuiz color="#2E8FFF" />} title={tr("أسئلة (لشخصين)", "Q&A (2 players)")} desc={tr("كل واحد معاه لاعب سرّي، اسألوا بعض بنعم ولأ لحد ما تكتشفوا لاعب خصمكم", "Each of you has a secret player — ask yes/no questions until you figure out your opponent's")} onClick={() => onPick("guess-qa")} />
        <GameCard index={1} color="#A855F7" icon={<IconSearch color="#A855F7" />} title={tr("مسار الانتقالات", "Transfer Path")} desc={tr("بنوريك أندية اللاعب بالترتيب واحد واحد، وكل ما تخمن بعروض أقل تاخد نقط أكتر", "We reveal a player's clubs one by one — the fewer reveals you need, the more points you get")} onClick={() => onPick("guess-transfers")} />
        <GameCard index={2} color="#FFD447" icon={<IconTrophy color="#FFD447" />} title={tr("جايزة في سنة", "Award in a Year")} desc={tr("بنقولك جايزة وسنة معينة، وانت تخمن مين اللاعب اللي كسبها", "We name an award and a year — you guess who won it")} onClick={() => onPick("guess-awards")} />
      </div>
    </Shell>
  );
}

// ---------- Transfer path mode ----------
function TransferPath({ onExit, account }) {
  const { tr, lang } = useLang();
  const eligibleIds = Object.keys(TRANSFERS);
  const pickTarget = () => eligibleIds[Math.floor(Math.random() * eligibleIds.length)];
  const [targetId, setTargetId] = useState(pickTarget);
  const [revealCount, setRevealCount] = useState(1);
  const [guessId, setGuessId] = useState("");
  const [wrong, setWrong] = useState(false);
  const [result, setResult] = useState(null); // null | { score }

  const target = playerById(targetId);
  const path = TRANSFERS[targetId];

  function reveal() { setRevealCount((c) => Math.min(path.length, c + 1)); }

  function guess() {
    if (!guessId) return;
    if (guessId === targetId) {
      const pts = Math.max(20, 100 - (revealCount - 1) * 20);
      setResult({ score: pts });
      if (account) addScore(account.username, Math.round(pts / 5), tr("مسار الانتقالات", "Transfer Path"));
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 900);
    }
  }

  function next() {
    setTargetId(pickTarget()); setRevealCount(1); setGuessId(""); setWrong(false); setResult(null);
  }

  if (result) {
    return (
      <Shell>
        {result.score >= path.length && <Confetti count={40} />}
        <Header title={tr("مسار الانتقالات", "Transfer Path")} onLeave={onExit} />
        <div className="rounded-xl p-6 text-center ff-pop-in" style={{ background: "#141B3D", border: "1px solid #39FF8855" }}>
          <div className="ff-display text-4xl font-bold mb-2 ff-float" style={{ color: "#39FF88" }}>🎉 {pname(target, lang)}</div>
          <p className="ff-body text-sm mb-3" style={{ color: "#EEF1FFAA" }}>{tr(`كسبت ${result.score} نقطة (خمّنت بـ ${revealCount} من ${path.length} نادي)`, `You scored ${result.score} points (guessed with ${revealCount} of ${path.length} clubs shown)`)}</p>
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {path.map((t, i) => <Chip key={i} color="#00D9FF">{clubText(t, lang)} · {t.year}</Chip>)}
          </div>
          <Btn className="w-full" onClick={next}>{tr("لاعب تاني", "Another player")}</Btn>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header title={tr("مسار الانتقالات", "Transfer Path")} sub={tr(`ظاهر ${revealCount} من ${path.length} نادي`, `Showing ${revealCount} of ${path.length} clubs`)} onLeave={onExit} />
      <div className="rounded-xl p-4 mb-4" style={{ background: "#141B3D" }}>
        <div className="space-y-2 mb-4">
          {path.slice(0, revealCount).map((t, i) => (
            <div key={i} className="ff-body flex justify-between px-3 py-2 rounded-lg" style={{ background: "#0A0E27", color: "#EEF1FF" }}>
              <span>{i + 1}. {clubText(t, lang)}</span>
              <span style={{ color: "#EEF1FFAA" }}>{t.year}</span>
            </div>
          ))}
        </div>
        {revealCount < path.length && (
          <Btn variant="ghost" className="w-full mb-3" onClick={reveal}>{tr("اظهر نادي كمان (-20 نقطة)", "Reveal another club (-20 pts)")}</Btn>
        )}
        {wrong && <div className="ff-body text-center text-sm mb-2" style={{ color: "#FF3B5C" }}>{tr("غلط، جرب تاني", "Wrong, try again")}</div>}
        <div className="flex gap-2">
          <select value={guessId} onChange={(e) => setGuessId(e.target.value)} className="ff-body flex-1 rounded-lg px-2 py-2" style={{ background: "#0A0E27", color: "#EEF1FF", border: "1px solid #EEF1FF33" }}>
            <option value="">{tr("اختار لاعب", "Pick a player")}</option>
            {POOL.map((p) => <option key={p.id} value={p.id}>{pname(p, lang)}</option>)}
          </select>
          <Btn disabled={!guessId} onClick={guess}>{tr("خمّن", "Guess")}</Btn>
        </div>
      </div>
    </Shell>
  );
}

// ---------- Award year quiz mode ----------
function buildAwardQuestions(lang) {
  return shuffle(AWARDS).slice(0, 8).map((it) => {
    const correctPlayer = playerById(it.playerId);
    const wrongPool = shuffle(POOL.filter((p) => p.id !== it.playerId)).slice(0, 3);
    const options = shuffle([correctPlayer, ...wrongPool]).map((p) => pname(p, lang));
    const correctName = pname(correctPlayer, lang);
    return {
      q: lang === "ar" ? `مين اللي كسب "${it.award}" سنة ${it.year}؟` : `Who won "${it.awardEn}" in ${it.year}?`,
      options, answer: options.indexOf(correctName),
    };
  });
}

function AwardYearQuiz({ onExit, account }) {
  const { tr, lang } = useLang();
  const [qs, setQs] = useState(() => buildAwardQuestions(lang));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [phase, setPhase] = useState("quiz");

  function pick(i) {
    if (picked !== null) return;
    setPicked(i);
    let finalScore = score;
    if (i === qs[idx].answer) { finalScore = score + 1; setScore(finalScore); }
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 < qs.length) setIdx((n) => n + 1);
      else {
        setPhase("done");
        if (account) addScore(account.username, finalScore * 2, tr("جايزة في سنة", "Award in a Year"));
      }
    }, 900);
  }

  function restart() {
    setQs(buildAwardQuestions(lang)); setIdx(0); setScore(0); setPicked(null); setPhase("quiz");
  }

  if (phase === "done") {
    return (
      <Shell>
        {score === qs.length && <Confetti />}
        <Header title={tr("جايزة في سنة", "Award in a Year")} onLeave={onExit} />
        <div className="rounded-xl p-6 text-center ff-pop-in" style={{ background: "#141B3D", border: "1px solid #39FF8855" }}>
          <div className={"ff-display text-5xl font-bold mb-2 " + (score === qs.length ? "ff-float" : "")} style={{ color: "#39FF88" }}>{score}/{qs.length}</div>
          <Btn className="mt-4 w-full" onClick={restart}>{tr("أسئلة جديدة", "New questions")}</Btn>
        </div>
      </Shell>
    );
  }

  const cur = qs[idx];
  return (
    <Shell>
      <Header title={tr("جايزة في سنة", "Award in a Year")} sub={tr(`سؤال ${idx + 1} من ${qs.length} · نقاطك ${score}`, `Question ${idx + 1} of ${qs.length} · Score ${score}`)} onLeave={onExit} />
      <div className="rounded-xl p-4 mb-4" style={{ background: "#141B3D" }}>
        <p className="ff-body font-bold text-lg mb-4 text-center" style={{ color: "#EEF1FF" }}>{cur.q}</p>
        <div className="space-y-2">
          {cur.options.map((opt, i) => {
            let bg = "#0A0E27";
            if (picked !== null) {
              if (i === cur.answer) bg = "#00D9FF";
              else if (i === picked) bg = "#FF3B5C";
            }
            return (
              <button key={i} onClick={() => pick(i)} disabled={picked !== null}
                className="ff-body w-full text-right px-4 py-3 rounded-lg" style={{ background: bg, color: "#EEF1FF", border: "1px solid #EEF1FF33" }}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

// ---------- League Fantasy ----------
function LeagueGame({ onExit, account }) {
  const { tr, lang } = useLang();
  const [screen, setScreen] = useState("boot"); // boot | pick-comp | home | lobby | draft | play
  const [compId, setCompId] = useState(null);
  const [myId, setMyId] = useState(null);
  const [code, setCode] = useState("");
  const [room, setRoomState] = useState(null);
  const [error, setError] = useState("");
  const pollRef = useRef(null);
  const awardRef = useRef({});

  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get("lg-session", false);
        if (s) {
          const sess = JSON.parse(s.value);
          const r = await getLgRoom(sess.roomCode);
          if (r && r.players.some((p) => p.id === sess.myId)) {
            setMyId(sess.myId); setCode(sess.roomCode); setCompId(r.compId);
            setRoomState(r); setScreen(r.phase === "lobby" ? "lobby" : r.phase === "draft" ? "draft" : "play");
            startPolling(sess.roomCode);
            return;
          }
        }
      } catch {}
      setScreen("pick-comp");
    })();
  }, []);

  const startPolling = useCallback((c) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => { const r = await getLgRoom(c); if (r) setRoomState(r); }, 3000);
  }, []);
  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  async function saveSession(id, name, roomCode) {
    try { await window.storage.set("lg-session", JSON.stringify({ myId: id, name, roomCode }), false); } catch {}
  }

  async function createRoom(name) {
    setError("");
    const id = uid(); const c = genCode();
    const r = newLgRoom(c, compId, id, name);
    await setLgRoom(c, r);
    setMyId(id); setCode(c); setRoomState(r); setScreen("lobby");
    saveSession(id, name, c); startPolling(c);
  }

  async function joinRoom(name, joinCode) {
    setError("");
    const c = joinCode.trim().toUpperCase();
    const r = await getLgRoom(c);
    if (!r || !Array.isArray(r.players)) { setError(tr("الغرفة دي معادتش شغالة، جرب كود تاني أو اعمل غرفة جديدة.", "This room is no longer valid — try a different code or create a new one.")); return; }
    if (r.phase !== "lobby") { setError(tr("الدرافت بدأ خلاص في الغرفة دي.", "Drafting already started in this room.")); return; }
    const id = uid();
    r.players.push({ id, name, squad: [], captainId: null, ready: false, total: 0 });
    await setLgRoom(c, r);
    setMyId(id); setCode(c); setCompId(r.compId); setRoomState(r); setScreen("lobby");
    saveSession(id, name, c); startPolling(c);
  }

  async function leaveRoom() {
    try { await window.storage.delete("lg-session", false); } catch {}
    if (pollRef.current) clearInterval(pollRef.current);
    setMyId(null); setRoomState(null); setCode("");
    onExit();
  }

  async function startDraft() {
    const r = await getLgRoom(code);
    if (!r || r.players.length < 1) return;
    r.phase = "draft";
    setRoomState(await setLgRoom(code, r)); setScreen("draft");
  }

  async function toggleSquad(playerId) {
    const r = await getLgRoom(code);
    if (!r) return;
    const me = r.players.find((p) => p.id === myId);
    if (!me || me.ready) return;
    if (me.squad.includes(playerId)) {
      me.squad = me.squad.filter((id) => id !== playerId);
      if (me.captainId === playerId) me.captainId = null;
    } else if (me.squad.length < 11) {
      me.squad.push(playerId);
    }
    setRoomState(await setLgRoom(code, r));
  }

  async function setCaptain(playerId) {
    const r = await getLgRoom(code);
    if (!r) return;
    const me = r.players.find((p) => p.id === myId);
    if (!me || me.ready || !me.squad.includes(playerId)) return;
    me.captainId = playerId;
    setRoomState(await setLgRoom(code, r));
  }

  async function markReady() {
    const r = await getLgRoom(code);
    if (!r) return;
    const me = r.players.find((p) => p.id === myId);
    if (!me || me.squad.length !== 11 || !me.captainId) return;
    me.ready = true;
    const everyoneReady = r.players.every((p) => p.ready);
    if (everyoneReady) r.phase = "playing";
    setRoomState(await setLgRoom(code, r));
    if (everyoneReady) setScreen("play");
  }

  async function runGameweek() {
    const r = await getLgRoom(code);
    if (!r) return;
    const comp = COMPETITIONS[r.compId];
    const events = simulateGwEvents(comp);
    const gwNum = r.gameweeks.length + 1;
    const summary = await generateGwSummary(comp, events, gwNum, lang);
    r.players.forEach((p) => {
      const pts = computeGwPoints(p.squad, p.captainId, events);
      p.total = (p.total || 0) + pts;
    });
    r.gameweeks.push({ number: gwNum, events, summary, at: Date.now() });
    setRoomState(await setLgRoom(code, r));
  }

  useEffect(() => {
    if (!room) return;
    setScreen(room.phase === "lobby" ? "lobby" : room.phase === "draft" ? "draft" : "play");
  }, [room && room.phase]);

  // self-award dashboard points as my fantasy total grows
  useEffect(() => {
    if (!room || !account) return;
    const me = room.players.find((p) => p.id === myId);
    if (!me) return;
    const key = code;
    const prev = awardRef.current[key] || 0;
    if (me.total > prev) {
      const gained = me.total - prev;
      awardRef.current[key] = me.total;
      addScore(account.username, Math.max(1, Math.round(gained / 5)), tr("الدوري الفانتازي", "Fantasy League"));
    } else {
      awardRef.current[key] = Math.max(prev, me.total);
    }
    // eslint-disable-next-line
  }, [room && room.players]);

  if (screen === "boot") return <LoadingScreen />;
  if (screen === "pick-comp") return <LgCompPicker onPick={(id) => { setCompId(id); setScreen("home"); }} onBack={onExit} />;
  if (screen === "home") return <LgHome onCreate={createRoom} onJoin={joinRoom} error={error} onBack={() => setScreen("pick-comp")} account={account} comp={COMPETITIONS[compId]} />;
  if (!room) return <LoadingScreen room />;
  if (screen === "lobby") return <LgLobby room={room} myId={myId} comp={COMPETITIONS[room.compId]} onStart={startDraft} onLeave={leaveRoom} />;
  if (screen === "draft") return <LgDraft room={room} myId={myId} comp={COMPETITIONS[room.compId]} onToggle={toggleSquad} onCaptain={setCaptain} onReady={markReady} onLeave={leaveRoom} />;
  return <LgPlay room={room} myId={myId} comp={COMPETITIONS[room.compId]} onRunGameweek={runGameweek} onLeave={leaveRoom} />;
}

function LgCompPicker({ onPick, onBack }) {
  const { tr, lang } = useLang();
  return (
    <Shell>
      <button onClick={onBack} className="ff-body text-xs mb-4" style={{ color: "#EEF1FFAA" }}>{tr("‹ رجوع لقائمة الألعاب", "‹ Back to games")}</button>
      <div className="text-center mb-8">
        <div className="ff-display text-5xl font-bold" style={{ color: "#39FF88" }}>{tr("الدوري الفانتازي", "Fantasy League")}</div>
        <p className="ff-body text-sm mt-1" style={{ color: "#EEF1FFAA" }}>{tr("اختار الدوري اللي عايز تعمل فانتازي ليه", "Pick which league you want a fantasy team for")}</p>
      </div>
      <div className="space-y-3">
        {Object.values(COMPETITIONS).map((c, i) => (
          <GameCard key={c.id} index={i} color="#00D9FF" icon={<IconCup color="#00D9FF" />} title={compName(c, lang)} desc={compShort(c, lang)} onClick={() => onPick(c.id)} />
        ))}
      </div>
      <p className="ff-body text-xs text-center mt-6" style={{ color: "#EEF1FF55" }}>{tr("قوائم اللاعبين تقريبية وممكن تتغير مع الانتقالات، بس كفاية عشان تلعبوا الفانتازي.", "Player lists are approximate and may shift with transfers, but they're enough to play fantasy.")}</p>
    </Shell>
  );
}

function LgHome({ onCreate, onJoin, error, onBack, account, comp }) {
  const { tr, lang } = useLang();
  const [tab, setTab] = useState("create");
  const [joinCode, setJoinCode] = useState("");
  const name = account?.username || "";
  const inputCls = "ff-body w-full rounded-lg px-3 py-2.5 outline-none";
  const inputStyle = { background: "#141B3D", color: "#EEF1FF", border: "1px solid #EEF1FF33" };
  return (
    <Shell>
      <button onClick={onBack} className="ff-body text-xs mb-4" style={{ color: "#EEF1FFAA" }}>{tr("‹ اختار دوري تاني", "‹ Pick another league")}</button>
      <div className="text-center mb-8">
        <div className="ff-display text-4xl font-bold" style={{ color: "#39FF88" }}>{compName(comp, lang)}</div>
        <p className="ff-body text-sm mt-1" style={{ color: "#EEF1FFAA" }}>{tr(`هتلعب باسم ${name} — ادرافت 11 لاعب واختار الكابتن، وكل جولة الذكاء الاصطناعي يحاكي نتايج ويوزّع النقط`, `Playing as ${name} — draft 11 players and pick a captain, then AI simulates results and awards points each gameweek`)}</p>
      </div>
      <div className="flex rounded-lg overflow-hidden mb-5" style={{ border: "1px solid #EEF1FF33" }}>
        {["create", "join"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className="ff-body flex-1 py-2.5 font-bold text-sm"
            style={{ background: tab === t ? "#39FF88" : "transparent", color: tab === t ? "#0A0E27" : "#EEF1FF" }}>
            {t === "create" ? tr("إنشاء غرفة", "Create room") : tr("الانضمام لغرفة", "Join room")}
          </button>
        ))}
      </div>
      {error && <div className="ff-body text-sm mb-3 px-3 py-2 rounded" style={{ background: "#FF3B5C33", color: "#EEF1FF" }}>{error}</div>}
      {tab === "create" ? (
        <Btn className="w-full" onClick={() => onCreate(name)}>{tr("إنشاء الغرفة", "Create room")}</Btn>
      ) : (
        <div className="space-y-3">
          <input className={inputCls} style={inputStyle} placeholder={tr("كود الغرفة", "Room code")} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
          <Btn className="w-full" disabled={!joinCode.trim()} onClick={() => onJoin(name, joinCode)}>{tr("انضمام", "Join")}</Btn>
        </div>
      )}
      <p className="ff-body text-xs text-center mt-6" style={{ color: "#EEF1FF55" }}>{tr("مش مرتبطة بنتايج حقيقية — كل جولة بتتحاكى بالذكاء الاصطناعي، أي لاعب في الغرفة يقدر يشغّلها.", "Not connected to real results — every gameweek is AI-simulated, and any player in the room can run it.")}</p>
    </Shell>
  );
}

function LgLobby({ room, myId, comp, onStart, onLeave }) {
  const { tr, lang } = useLang();
  if (!room || !Array.isArray(room.players)) return <RoomBroken onLeave={onLeave} />;
  const isHost = room.players[0]?.id === myId;
  return (
    <Shell>
      <Header title={tr("غرفة الانتظار", "Waiting Room")} sub={compName(comp, lang)} onLeave={onLeave} />
      <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "#141B3D", border: "1px dashed #39FF8888" }}>
        <div className="ff-body text-xs" style={{ color: "#EEF1FFAA" }}>{tr("كود الغرفة", "Room code")}</div>
        <div className="ff-display text-4xl font-bold tracking-widest" style={{ color: "#39FF88" }}>{room.code}</div>
      </div>
      <div className="space-y-2 mb-6">
        {room.players.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#141B3D" }}>
            <span className="ff-body" style={{ color: "#EEF1FF" }}>{p.name}{p.id === room.players[0].id && <Chip color="#39FF88"> {tr("الهوست", "Host")} </Chip>}</span>
            {p.id === myId && <Chip color="#2E8FFF">{tr("أنت", "You")}</Chip>}
          </div>
        ))}
      </div>
      {isHost ? (
        <Btn className="w-full" onClick={onStart}>{tr("ابدأ الدرافت", "Start draft")}</Btn>
      ) : (
        <div className="ff-body text-center text-sm" style={{ color: "#EEF1FFAA" }}>{tr("في انتظار الهوست يبدأ الدرافت...", "Waiting for the host to start the draft...")}</div>
      )}
    </Shell>
  );
}

function LgDraft({ room, myId, comp, onToggle, onCaptain, onReady, onLeave }) {
  const { tr, lang } = useLang();
  const me = room.players.find((p) => p.id === myId);
  if (!me) return null;
  if (me.ready) {
    return (
      <Shell>
        <Header title={compName(comp, lang)} sub={tr("تشكيلتك جاهزة", "Your squad is ready")} onLeave={onLeave} />
        <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "#141B3D" }}>
          <div className="ff-body text-sm mb-2" style={{ color: "#EEF1FF" }}>{tr(`في انتظار باقي اللاعبين (${room.players.filter((p) => p.ready).length}/${room.players.length})`, `Waiting for the rest (${room.players.filter((p) => p.ready).length}/${room.players.length})`)}</div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {room.players.map((p) => <Chip key={p.id} color={p.ready ? "#00D9FF" : "#EEF1FF55"}>{p.name} {p.ready ? "✓" : "..."}</Chip>)}
          </div>
        </div>
      </Shell>
    );
  }
  return (
    <Shell>
      <Header title={compName(comp, lang)} sub={tr(`${me.squad.length}/11 لاعب${me.captainId ? " · كابتنك: " + cpname(compPlayerById(me.captainId), lang) : ""}`, `${me.squad.length}/11 players${me.captainId ? " · Captain: " + cpname(compPlayerById(me.captainId), lang) : ""}`)} onLeave={onLeave} />
      <div className="grid grid-cols-4 gap-1 mb-4">
        {comp.players.map((p) => {
          const on = me.squad.includes(p.id);
          const isCap = me.captainId === p.id;
          return (
            <PlayerTile key={p.id} player={p} lang={lang} selected={on}
              onClick={() => (on ? onCaptain(p.id) : onToggle(p.id))}
              trailing={isCap ? <span style={{ fontSize: 12 }}>⭐</span> : null} />
          );
        })}
      </div>
      {me.squad.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {me.squad.map((id) => (
            <button key={id} onClick={() => onToggle(id)} className="ff-body text-xs px-2 py-1 rounded" style={{ background: "#141B3D", color: "#EEF1FFAA" }}>
              {cpname(compPlayerById(id), lang)} ✕
            </button>
          ))}
        </div>
      )}
      <p className="ff-body text-xs mb-3" style={{ color: "#EEF1FF55" }}>{tr("اختار 11 لاعب، وبعدين دوس على أي لاعب من اللي اخترتهم عشان تخليه الكابتن (نقطه تتضاعف).", "Pick 11 players, then tap one of your picks to make them captain (their points double).")}</p>
      <Btn className="w-full" disabled={me.squad.length !== 11 || !me.captainId} onClick={onReady}>
        {me.squad.length !== 11 ? tr(`اختار ${11 - me.squad.length} كمان`, `Pick ${11 - me.squad.length} more`) : !me.captainId ? tr("اختار الكابتن", "Pick a captain") : tr("تمام، أنا جاهز", "Ready to go")}
      </Btn>
    </Shell>
  );
}

function LgPlay({ room, myId, comp, onRunGameweek, onLeave }) {
  const { tr, lang } = useLang();
  const [loading, setLoading] = useState(false);
  if (!room || !room.players || !room.gameweeks) return <RoomBroken onLeave={onLeave} />;
  const standings = [...room.players].sort((a, b) => b.total - a.total);
  const lastGw = room.gameweeks[room.gameweeks.length - 1];

  async function run() {
    setLoading(true);
    await onRunGameweek();
    setLoading(false);
  }

  return (
    <Shell>
      <Header title={compName(comp, lang)} sub={tr(`الجولة الحالية: ${room.gameweeks.length}`, `Current gameweek: ${room.gameweeks.length}`)} onLeave={onLeave} />
      <div className="space-y-2 mb-5">
        {standings.map((p, i) => (
          <div key={p.id} className="flex justify-between items-center px-3 py-2 rounded-lg ff-fade-up ff-hover-lift" style={{ background: i === 0 ? "#39FF8822" : "#141B3D", animationDelay: `${i * 0.04}s` }}>
            <span className="ff-body" style={{ color: "#EEF1FF" }}>{i === 0 ? "🏆 " : `${i + 1}. `}{p.name}{p.id === myId ? tr(" (أنت)", " (you)") : ""}</span>
            <span className="ff-body font-bold" style={{ color: "#39FF88" }}>{tr(`${p.total} نقطة`, `${p.total} pts`)}</span>
          </div>
        ))}
      </div>

      <Btn className="w-full mb-4" disabled={loading} onClick={run}>{loading ? tr("بيحاكي الجولة...", "Simulating gameweek...") : tr("شغّل الجولة الجاية بالذكاء الاصطناعي", "Run the next gameweek with AI")}</Btn>

      {lastGw && (
        <div className="rounded-xl p-4" style={{ background: "#141B3D", border: "1px solid #39FF8855" }}>
          <div className="ff-body text-xs font-bold mb-1" style={{ color: "#39FF88" }}>{tr(`ملخص الجولة ${lastGw.number}`, `Gameweek ${lastGw.number} summary`)}</div>
          <p className="ff-body text-sm" style={{ color: "#EEF1FF" }}>{lastGw.summary}</p>
        </div>
      )}
    </Shell>
  );
}

function RoomBroken({ onLeave }) {
  const { tr } = useLang();
  return (
    <Shell>
      <div className="rounded-xl p-6 text-center ff-fade-up" style={{ background: "#141B3D", border: "1px solid #FF3B5C55" }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div className="ff-display text-2xl font-bold mt-2" style={{ color: "#FF3B5C" }}>{tr("الغرفة دي معادتش شغالة", "This room is no longer valid")}</div>
        <p className="ff-body text-sm mt-2" style={{ color: "#EEF1FFAA" }}>{tr("يمكن كانت غرفة قديمة من تجربة سابقة. جرّب تعمل غرفة جديدة.", "It might be an old test room. Try creating a new one.")}</p>
        <Btn onClick={onLeave} className="mt-4 w-full">{tr("رجوع لقائمة الألعاب", "Back to games")}</Btn>
      </div>
    </Shell>
  );
}

// ---------- Global safety net: catch any render crash and show a friendly recovery screen instead of a blank page ----------
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errMsg: "", errStack: "", compStack: "" }; }
  static getDerivedStateFromError(err) { return { hasError: true, errMsg: String(err?.message || err), errStack: String(err?.stack || "") }; }
  componentDidCatch(err, info) { console.error("App crashed:", err); this.setState({ compStack: String(info?.componentStack || "") }); }
  handleReset = () => {
    try {
      window.storage?.delete?.("my-session", false);
      window.storage?.delete?.("gw-session", false);
      window.storage?.delete?.("dt-session", false);
      window.storage?.delete?.("lg-session", false);
    } catch {}
    this.setState({ hasError: false });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#0A0E27", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 380, textAlign: "center", fontFamily: "Cairo, sans-serif" }}>
            <div style={{ fontSize: 44 }}>⚽💥</div>
            <div style={{ color: "#39FF88", fontSize: 22, fontWeight: 700, margin: "12px 0 6px" }}>حصل خطأ غير متوقع</div>
            <p style={{ color: "#EEF1FFAA", fontSize: 14, marginBottom: 16 }}>حاول نرجعك لبداية اللعبة. لو المشكلة استمرت، جرب تفتح الموقع من جديد.</p>
            <button onClick={this.handleReset} style={{ background: "#39FF88", color: "#0A0E27", fontWeight: 700, padding: "10px 20px", borderRadius: 10, border: "none" }}>
              رجوع للبداية
            </button>
            <details style={{ marginTop: 18, textAlign: "left", direction: "ltr" }}>
              <summary style={{ color: "#EEF1FF66", fontSize: 12, cursor: "pointer" }}>تفاصيل فنية (للمطور)</summary>
              <pre style={{ color: "#FF3B5C", fontSize: 10, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#141B3D", padding: 10, borderRadius: 8, marginTop: 8, maxHeight: 220, overflow: "auto" }}>
                {this.state.errMsg}
                {"\n\n"}
                {this.state.compStack}
                {"\n\n"}
                {this.state.errStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------- Root: detect device language, provide it to the whole app ----------
export default function App() {
  const [lang] = useState(detectLang);
  return (
    <ErrorBoundary>
      <LangContext.Provider value={{ lang }}>
        <AppInner />
      </LangContext.Provider>
    </ErrorBoundary>
  );
}
