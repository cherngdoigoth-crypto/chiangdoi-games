"use strict";
var API = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // server/src/gas/main.ts
  var main_exports = {};
  __export(main_exports, {
    backupNow: () => backupNow,
    doGet: () => doGet,
    doPost: () => doPost,
    installBackupTrigger: () => installBackupTrigger,
    setup: () => setup
  });

  // shared/domain/seed.ts
  var VILLAGES = [
    { id: "m1", no: 1, name: "บ้านแม่ดอกแดง", colorName: "สีเหลือง", colorHex: "#FFE600", paradeOrder: 1 },
    { id: "m2", no: 2, name: "บ้านโพธิ์ทองเจริญ", colorName: "สีแดง", colorHex: "#FF1A1A", paradeOrder: 8 },
    { id: "m5", no: 5, name: "บ้านเกาะ", colorName: "สีชมพู", colorHex: "#FF3399", paradeOrder: 10 },
    { id: "m6", no: 6, name: "บ้านสันอุ้ม", colorName: "สีเทา", colorHex: "#BFBFBF", paradeOrder: 2 },
    { id: "m7", no: 7, name: "บ้านร้องขี้เหล็ก", colorName: "สีฟ้า", colorHex: "#00B0F0", paradeOrder: 6 },
    { id: "m9", no: 9, name: "บ้านป่าสักน้อย", colorName: "สีม่วง", colorHex: "#7030A0", paradeOrder: 5 },
    { id: "m10", no: 10, name: "บ้านป่าไผ่ศรีโขง", colorName: "สีแดงเลือดหมู", colorHex: "#B80000", paradeOrder: 4 },
    { id: "m11", no: 11, name: "บ้านกิ่วแล", colorName: "สีน้ำเงินกรมท่า", colorHex: "#1F4E79", paradeOrder: 3 },
    { id: "m12", no: 12, name: "บ้านปทุมนิเวศน์", colorName: "สีน้ำเงิน", colorHex: "#0070C0", paradeOrder: 7 },
    { id: "m13", no: 13, name: "บ้านหนองบัวพัฒนา", colorName: "สีส้ม", colorHex: "#FF6600", paradeOrder: 9 }
  ];
  var ALL = VILLAGES.map((v) => v.id);
  var base = (c) => ({
    gender: null,
    countsForCup: false,
    places: 3,
    prizes: [],
    status: "draft",
    schedule: "",
    description: "",
    eligibleVillageIds: ALL,
    matchesPublic: false,
    judgeMode: "single",
    league: null,
    version: 1,
    updatedAt: "",
    ...c
  });
  var FOLK = [
    { key: "kick", name: "เตะปี๊บ", note: "อายุ 50 ปีขึ้นไป ผู้เล่น 1 คน", prizes: [400, 300, 200], t: ["10.00", "10.15"] },
    { key: "ball", name: "แยกบอลสี", note: "อายุ 50 ปีขึ้นไป ผู้เล่น 1 คน", prizes: [400, 300, 200], t: ["10.50", "10.55"] },
    { key: "boat", name: "เรือบก", note: "ไม่จำกัดอายุ ผู้เล่น 8 คน", prizes: [1e3, 800, 500], t: ["11.20", "11.25"] },
    { key: "wheel", name: "วิ่งวงล้อ", note: "ไม่จำกัดอายุ ผู้เล่น 4 คน", prizes: [800, 600, 400], t: ["11.50", "11.55"] },
    { key: "hoop", name: "วิ่งในห่วง", note: "ไม่จำกัดอายุ ผู้เล่น 4 คน", prizes: [800, 600, 400], t: ["13.20", "13.25"] },
    { key: "giant", name: "เตะลูกบอลยักษ์", note: "ไม่จำกัดอายุ ผู้เล่น 4 คน", prizes: [800, 600, 400], t: ["13.50", "13.55"] }
  ];
  function seedCompetitions() {
    const list = [];
    let order = 1;
    list.push(base({
      id: "football7",
      name: "ฟุตบอล 7 คน",
      category: "sport",
      format: "league",
      order: order++,
      places: 4,
      prizes: [4e3, 2e3, 1500, 1e3],
      schedule: "ส. 7 พ.ย. 08.00 น. · ชิงชนะเลิศ อา. 8 พ.ย. 15.00 น.",
      description: "ครึ่งละ 15 นาที รอบแรกคะแนนเท่ากันตัดสินโดยการจับฉลาก (ไม่นับประตูได้เสีย) รอบรอง/ชิงที่ 3/ชิงชนะเลิศ เสมอยิงลูกจุดโทษ",
      eligibleVillageIds: ALL.filter((v) => v !== "m5"),
      gender: "male",
      league: { win: 3, draw: 1, loss: 0, advance: 2, groups: { A: ["m10", "m6", "m11", "m7", "m1"], B: ["m12", "m13", "m2", "m9"] } }
    }));
    list.push(base({
      id: "petanque",
      name: "เปตองคู่ผสม (ชาย-หญิง)",
      category: "sport",
      format: "league",
      order: order++,
      places: 4,
      prizes: [2e3, 1500, 1e3, 500],
      schedule: "ส. 7 พ.ย. 09.00 น. · ชิงชนะเลิศ 12.00 น.",
      gender: "mixed",
      description: "ทีมละ 2 คน (ชาย 1 หญิง 1) แข่ง 1 เซต ถึง 13 แต้มก่อนชนะ",
      league: { win: 1, draw: 0, loss: 0, advance: 2, groups: { A: ["m11", "m12", "m1", "m6", "m5"], B: ["m7", "m10", "m9", "m2", "m13"] } }
    }));
    FOLK.forEach((f) => {
      ["male", "female"].forEach((g, i) => {
        list.push(base({
          id: `${f.key}_${g === "male" ? "m" : "f"}`,
          name: `${f.name} ${g === "male" ? "ชาย" : "หญิง"}`,
          category: "folk",
          format: "placement",
          order: order++,
          gender: g,
          countsForCup: true,
          prizes: f.prizes,
          schedule: `อา. 8 พ.ย. รอบชิง ${f.t[i]} น.`,
          description: f.note
        }));
      });
    });
    list.push(base({
      id: "penalty",
      name: "ยิงลูกโทษ",
      category: "sport",
      format: "knockout",
      order: order++,
      countsForCup: true,
      prizes: [1e3, 800, 500],
      schedule: "อา. 8 พ.ย. 14.00–14.54 น.",
      gender: "mixed",
      description: "ทีมละ 4 คน ผู้รักษาประตูต้องเป็นชาย ยิงทีมละ 3 ลูก เสมอยิงซัดเดนเดธ"
    }));
    list.push(base({
      id: "parade",
      name: "ประกวดขบวนพาเหรด",
      category: "contest",
      format: "criteria",
      order: order++,
      judgeMode: "panel",
      prizes: [1e3, 800, 500],
      schedule: "อา. 8 พ.ย. ตั้งขบวน 08.00 น.",
      description: "ผู้เข้าร่วมขบวนไม่น้อยกว่า 50 คน แต่งกายฟรีสไตล์"
    }));
    list.push(base({
      id: "tent",
      name: "ประกวดตกแต่งเต็นท์",
      category: "contest",
      format: "criteria",
      order: order++,
      prizes: [1e3, 800, 500],
      schedule: "7–8 พ.ย.",
      description: "ไม่อนุญาตเครื่องเสียงในเต็นท์ ลำดับเต็นท์ตามขบวนพาเหรด"
    }));
    list.push(base({
      id: "sign",
      name: "ประกวดผู้ถือป้ายหมู่บ้าน",
      category: "contest",
      format: "criteria",
      order: order++,
      prizes: [1e3, 800, 500],
      schedule: "มอบรางวัล อา. 8 พ.ย. 09.20 น.",
      description: "เพศหญิง ไม่จำกัดอายุ มีภูมิลำเนาในหมู่บ้าน · ชมเชย 7 รางวัล รางวัลละ 300 บาท"
    }));
    list.push(base({
      id: "dance",
      name: "แข่งขันเต้นประกอบเพลง",
      category: "contest",
      format: "criteria",
      order: order++,
      prizes: [2e3, 1500, 1e3],
      schedule: "รอบแรก 09.45 น. · รอบสอง 13.30 น.",
      description: 'ทีมละไม่ต่ำกว่า 8 คน เพลง "ผู้บ่าวเสื้อปุ้ย" และ "บังเอิญมันได้อ่ะ"'
    }));
    return list;
  }
  var C = (labels) => labels.map((label, i) => ({ key: `c${i + 1}`, label, max: null }));
  var CRITERIA_LABELS = {
    parade: ["การรักษาเวลาและเป็นระเบียบในการตั้งขบวน", "ความสวยงามของขบวน การจัดรูปแบบของขบวนพาเหรด", "ความคิดริเริ่มสร้างสรรค์ (หลากหลาย, แปลกใหม่, จินตนาการ)", "ความพร้อมเพรียง เป็นระเบียบในขณะเคลื่อนขบวน", "จำนวนผู้เข้าร่วมขบวน"],
    tent: ["ความสวยงามและความคิดสร้างสรรค์", "ความเป็นเอกลักษณ์ของสีประจำทีม", "ความสะอาดและความเรียบร้อย", "การมีส่วนร่วมของสมาชิกสี", "วัสดุ อุปกรณ์ที่ใช้"],
    sign: ["ความสวยงาม (ใบหน้า ผิวพรรณ)", "การแต่งกาย สวยงาม เหมาะสม สวมเสื้อกีฬาหมู่บ้าน/กระโปรงสั้น", "ท่วงท่าการเดิน การยิ้ม บุคลิกภาพ", "สัดส่วน (น้ำหนัก ส่วนสูง อก เอว สะโพก)", "สุขภาพแข็งแรง ร่าเริง สดใส"],
    dance: ["มีนักกีฬาเต้นประกอบเพลงอย่างน้อย 8 คนขึ้นไป", "การแต่งกาย ความสวยงามและความเหมาะสม", "ลีลา ท่าทาง ความสนุกสนาน", "ความพร้อมเพรียงของทีม", "การแสดงสีหน้า และการมีส่วนร่วม"]
  };
  function seedCriteria() {
    return Object.entries(CRITERIA_LABELS).map(([competitionId, labels]) => ({
      competitionId,
      items: C(labels),
      maxTotal: 50,
      aggregation: null,
      confirmed: false,
      confirmedBy: null,
      confirmedAt: null
    }));
  }
  var m = (competitionId, no, round, group, schedule, field, home, away) => {
    const isId = (s) => /^m\d+$/.test(s);
    return {
      id: `${competitionId}-${no}`,
      competitionId,
      no,
      round,
      group,
      schedule,
      field,
      homeId: isId(home) ? home : null,
      awayId: isId(away) ? away : null,
      homeLabel: isId(home) ? "" : home,
      awayLabel: isId(away) ? "" : away,
      homeScore: null,
      awayScore: null,
      homePens: null,
      awayPens: null,
      status: "scheduled",
      version: 1,
      updatedBy: null,
      updatedAt: null
    };
  };
  function seedMatches() {
    const fb = [
      ["08.00", "A", "m10", "m6"],
      ["08.40", "B", "m12", "m13"],
      ["09.20", "A", "m11", "m7"],
      ["10.00", "B", "m2", "m9"],
      ["10.40", "A", "m10", "m1"],
      ["11.20", "A", "m6", "m11"],
      ["12.00", "B", "m13", "m2"],
      ["12.40", "A", "m7", "m1"],
      ["13.20", "A", "m10", "m11"],
      ["14.00", "B", "m12", "m2"],
      ["14.40", "A", "m6", "m7"],
      ["15.20", "B", "m13", "m9"],
      ["16.00", "A", "m11", "m1"],
      ["16.40", "A", "m10", "m7"],
      ["17.20", "B", "m12", "m9"],
      ["18.00", "A", "m6", "m1"]
    ];
    const out = fb.map(([t, g, h, a], i) => m("football7", i + 1, "group", g, `ส. 7 พ.ย. ${t} น.`, "", h, a));
    out.push(m("football7", 17, "semi", null, "ส. 7 พ.ย. 18.40 น.", "", "ที่ 1 สาย A", "ที่ 2 สาย B"));
    out.push(m("football7", 18, "semi", null, "ส. 7 พ.ย. 19.20 น.", "", "ที่ 1 สาย B", "ที่ 2 สาย A"));
    out.push(m("football7", 19, "third", null, "ส. 7 พ.ย. 20.00 น.", "", "ทีมแพ้คู่ที่ 17", "ทีมแพ้คู่ที่ 18"));
    out.push(m("football7", 20, "final", null, "อา. 8 พ.ย. 15.00 น.", "", "ทีมชนะคู่ที่ 17", "ทีมชนะคู่ที่ 18"));
    const pt = [
      ["9.00", "A", "m11", "m12", "1"],
      ["9.00", "B", "m7", "m10", "2"],
      ["9.00", "A", "m1", "m6", "3"],
      ["9.00", "B", "m9", "m2", "4"],
      ["9.30", "A", "m11", "m5", "1"],
      ["9.30", "B", "m7", "m13", "2"],
      ["9.30", "A", "m12", "m1", "3"],
      ["9.30", "B", "m10", "m9", "4"],
      ["10.00", "A", "m6", "m5", "1"],
      ["10.00", "B", "m2", "m13", "2"],
      ["10.00", "A", "m11", "m1", "3"],
      ["10.00", "B", "m7", "m9", "4"],
      ["10.30", "A", "m12", "m6", "1"],
      ["10.30", "B", "m10", "m2", "2"],
      ["10.30", "A", "m1", "m5", "3"],
      ["10.30", "B", "m9", "m13", "4"],
      ["11.00", "A", "m11", "m6", "1"],
      ["11.00", "B", "m7", "m2", "2"],
      ["11.00", "A", "m12", "m5", "3"],
      ["11.00", "B", "m10", "m13", "4"]
    ];
    pt.forEach(([t, g, h, a, f], i) => out.push(m("petanque", i + 1, "group", g, `ส. 7 พ.ย. ${t} น.`, `สนาม ${f}`, h, a)));
    out.push(m("petanque", 21, "semi", null, "ส. 7 พ.ย. 11.30 น.", "สนาม 1", "ที่ 1 สาย A", "ที่ 2 สาย B"));
    out.push(m("petanque", 22, "semi", null, "ส. 7 พ.ย. 11.30 น.", "สนาม 2", "ที่ 1 สาย B", "ที่ 2 สาย A"));
    out.push(m("petanque", 23, "third", null, "ส. 7 พ.ย. 12.00 น.", "สนาม 1", "ทีมแพ้คู่ที่ 21", "ทีมแพ้คู่ที่ 22"));
    out.push(m("petanque", 24, "final", null, "ส. 7 พ.ย. 12.00 น.", "สนาม 2", "ทีมชนะคู่ที่ 21", "ทีมชนะคู่ที่ 22"));
    const pk = [["14.00", "m5", "m1"], ["14.06", "m11", "m6"], ["14.12", "m13", "m12"], ["14.18", "m7", "m9"], ["14.24", "m10", "m2"]];
    pk.forEach(([t, h, a], i) => out.push(m("penalty", 34 + i, "r1", null, `อา. 8 พ.ย. ${t} น.`, "", h, a)));
    return out;
  }
  var DEFAULT_SETTINGS = {
    cupVisible: false,
    autoPublishOnApprove: false,
    tieRule: "unconfirmed",
    tieRuleConfirmed: false,
    tieManualOrder: [],
    eventName: "เชิงดอยเกมส์ ครั้งที่ 26 ประจำปีงบประมาณ 2570"
  };

  // shared/domain/scoring.ts
  var CUP_POINTS = { 1: 3, 2: 2, 3: 1 };
  function validateCriteriaConfig(items, maxTotal) {
    const issues = [];
    if (!items.length) issues.push({ field: "items", message: "ต้องมีเกณฑ์อย่างน้อย 1 ข้อ" });
    items.forEach((it, i) => {
      if (!it.label.trim()) issues.push({ field: it.key, message: `เกณฑ์ข้อ ${i + 1} ยังไม่มีชื่อ` });
      if (it.max === null || !Number.isFinite(it.max) || it.max <= 0) issues.push({ field: it.key, message: `เกณฑ์ข้อ ${i + 1} ยังไม่ได้กำหนดคะแนนเต็ม` });
    });
    const sum = items.reduce((s, it) => {
      var _a;
      return s + ((_a = it.max) != null ? _a : 0);
    }, 0);
    if (!issues.length && Math.abs(sum - maxTotal) > 1e-9) issues.push({ field: "items", message: `คะแนนเต็มรายข้อรวมได้ ${sum} ต้องเท่ากับ ${maxTotal}` });
    return issues;
  }
  function validateEntry(items, entry, requireComplete) {
    const issues = [];
    items.forEach((it, i) => {
      const v = entry == null ? void 0 : entry[it.key];
      if (v === null || v === void 0 || typeof v === "number" && Number.isNaN(v)) {
        if (requireComplete) issues.push({ field: it.key, message: `ข้อ ${i + 1} ยังไม่ได้กรอก` });
        return;
      }
      if (typeof v !== "number") {
        issues.push({ field: it.key, message: `ข้อ ${i + 1} ต้องเป็นตัวเลข` });
        return;
      }
      if (v < 0) issues.push({ field: it.key, message: `ข้อ ${i + 1} ติดลบไม่ได้` });
      if (it.max !== null && v > it.max) issues.push({ field: it.key, message: `ข้อ ${i + 1} เกินคะแนนเต็ม ${it.max}` });
    });
    return issues;
  }
  function entryTotal(items, entry) {
    let total = 0;
    let complete = true;
    for (const it of items) {
      const v = entry == null ? void 0 : entry[it.key];
      if (typeof v === "number" && Number.isFinite(v)) total += v;
      else complete = false;
    }
    return { total: round2(total), complete };
  }
  var round2 = (n) => Math.round(n * 100) / 100;
  function aggregatePanel(items, sheets, villageIds, method) {
    const out = {};
    for (const vid of villageIds) {
      const totals = sheets.map((s) => entryTotal(items, s[vid])).filter((t) => t.complete).map((t) => t.total);
      const sum = totals.reduce((a, b) => a + b, 0);
      out[vid] = { total: totals.length ? round2(method === "average" ? sum / totals.length : sum) : 0, judges: totals.length };
    }
    return out;
  }
  function rankTotals(totals, complete = {}) {
    const list = Object.entries(totals).map(([villageId, total]) => {
      var _a;
      return { villageId, total, complete: (_a = complete[villageId]) != null ? _a : true };
    });
    list.sort((a, b) => b.total - a.total || a.villageId.localeCompare(b.villageId, "en", { numeric: true }));
    const out = [];
    list.forEach((x, i) => {
      const rank = i > 0 && list[i - 1].total === x.total ? out[i - 1].rank : i + 1;
      out.push({ ...x, rank, tied: false });
    });
    out.forEach((x) => {
      x.tied = out.filter((y) => y.rank === x.rank).length > 1;
    });
    return out;
  }
  function tiesWithinPlaces(ranking, places) {
    const groups = {};
    ranking.forEach((r) => {
      var _a;
      if (r.tied && r.rank <= places) (groups[_a = r.rank] || (groups[_a] = [])).push(r.villageId);
    });
    return Object.values(groups);
  }
  function validatePlacements(p, places, eligible, requireComplete) {
    const issues = [];
    const seen = /* @__PURE__ */ new Set();
    const need = Math.min(places, eligible.length);
    for (let i = 1; i <= places; i++) {
      const v = p[String(i)];
      if (!v) {
        if (requireComplete && i <= need) issues.push({ field: String(i), message: `ยังไม่ได้เลือกอันดับที่ ${i}` });
        continue;
      }
      if (!eligible.includes(v)) issues.push({ field: String(i), message: `อันดับที่ ${i}: หมู่บ้านนี้ไม่มีสิทธิ์ในรายการนี้` });
      if (seen.has(v)) issues.push({ field: String(i), message: `อันดับที่ ${i}: เลือกหมู่บ้านซ้ำ` });
      seen.add(v);
    }
    return issues;
  }
  function placementsConsistent(p, ranking) {
    const total = Object.fromEntries(ranking.map((r) => [r.villageId, r.total]));
    const issues = [];
    const keys = Object.keys(p).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < keys.length; i++) {
      const a = p[String(keys[i - 1])], b = p[String(keys[i])];
      if (a && b && total[a] !== void 0 && total[b] !== void 0 && total[a] < total[b]) {
        issues.push({ field: String(keys[i]), message: `อันดับที่ ${keys[i - 1]} มีคะแนนน้อยกว่าอันดับที่ ${keys[i]}` });
      }
    }
    const placed = keys.map((k) => p[String(k)]).filter(Boolean);
    if (placed.length) {
      const minPlaced = Math.min(...placed.map((v) => {
        var _a;
        return (_a = total[v]) != null ? _a : Infinity;
      }));
      const outranked = ranking.find((r) => !placed.includes(r.villageId) && r.total > minPlaced);
      if (outranked) issues.push({ field: "placements", message: "มีหมู่บ้านที่ไม่ได้อันดับแต่คะแนนสูงกว่าผู้ได้อันดับ" });
    }
    return issues;
  }
  function cupPointsFor(p) {
    var _a;
    const out = {};
    for (const [place, vid] of Object.entries(p)) {
      const pts = CUP_POINTS[Number(place)];
      if (vid && pts) out[vid] = ((_a = out[vid]) != null ? _a : 0) + pts;
    }
    return out;
  }
  function computeCup(results2, villageIds, competitions2, settings) {
    const cupComps = competitions2.filter((c) => c.countsForCup);
    const cupIds = new Set(cupComps.map((c) => c.id));
    const rows = {};
    villageIds.forEach((id) => {
      rows[id] = { villageId: id, points: 0, golds: 0, silvers: 0, bronzes: 0, rank: 0, tied: false, breakdown: [] };
    });
    let counted = 0;
    for (const r of results2) {
      if (!cupIds.has(r.competitionId) || !r.countsForCup) continue;
      counted++;
      for (const [place, vid] of Object.entries(r.placements)) {
        const pts = CUP_POINTS[Number(place)];
        if (!vid || !pts || !rows[vid]) continue;
        const row = rows[vid];
        row.points += pts;
        if (place === "1") row.golds++;
        else if (place === "2") row.silvers++;
        else if (place === "3") row.bronzes++;
        row.breakdown.push({ competitionId: r.competitionId, place: Number(place), points: pts });
      }
    }
    const list = Object.values(rows);
    const rule = settings.tieRule;
    const manualIdx = (id) => {
      const i = settings.tieManualOrder.indexOf(id);
      return i < 0 ? 999 : i;
    };
    const key = (x) => rule === "countback" ? [x.points, x.golds, x.silvers, x.bronzes] : [x.points];
    list.sort((a, b) => {
      const ka = key(a), kb = key(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
      if (rule === "manual") return manualIdx(a.villageId) - manualIdx(b.villageId);
      return villageIds.indexOf(a.villageId) - villageIds.indexOf(b.villageId);
    });
    let tieUnresolved = false;
    list.forEach((x, i) => {
      if (i === 0) {
        x.rank = 1;
        return;
      }
      const prev = list[i - 1];
      const same = key(prev).every((v, k) => v === key(x)[k]);
      const manualSplit = rule === "manual" && manualIdx(prev.villageId) !== manualIdx(x.villageId);
      x.rank = same && !manualSplit ? prev.rank : i + 1;
    });
    list.forEach((x) => {
      const group = list.filter((y) => y.rank === x.rank);
      x.tied = group.length > 1;
      if (x.tied && x.points > 0 && rule === "unconfirmed") tieUnresolved = true;
    });
    return { rows: list, countedResults: counted, totalCupEvents: cupComps.length, tieRule: rule, tieUnresolved };
  }
  function contestRanking(items, villageIds, mode, entries, sheets, aggregation) {
    if (mode === "panel") {
      const agg = aggregatePanel(items, sheets, villageIds, aggregation != null ? aggregation : "average");
      const ranked = rankTotals(Object.fromEntries(villageIds.map((v) => [v, agg[v].total])), Object.fromEntries(villageIds.map((v) => [v, agg[v].judges > 0])));
      return ranked.map((r) => ({ ...r, judges: agg[r.villageId].judges }));
    }
    const totals = {};
    const complete = {};
    villageIds.forEach((v) => {
      const t = entryTotal(items, entries == null ? void 0 : entries[v]);
      totals[v] = t.total;
      complete[v] = t.complete;
    });
    return rankTotals(totals, complete);
  }

  // shared/domain/workflow.ts
  var TRANSITIONS = {
    open: { from: ["draft"], to: "open", roles: ["superadmin", "admin"], label: "เปิดรับคะแนน" },
    submit: { from: ["open"], to: "submitted", roles: ["superadmin", "admin"], assignedScorer: true, label: "ส่งผลเพื่อตรวจสอบ" },
    return: { from: ["submitted"], to: "open", roles: ["superadmin", "admin", "reviewer"], reasonRequired: true, label: "ส่งกลับแก้ไข" },
    reject: { from: ["submitted"], to: "draft", roles: ["superadmin", "admin", "reviewer"], reasonRequired: true, label: "ปฏิเสธ" },
    approve: { from: ["submitted"], to: "approved", roles: ["superadmin", "admin", "reviewer"], label: "อนุมัติผล" },
    publish: { from: ["approved"], to: "published", roles: ["superadmin", "admin"], label: "ประกาศผล" },
    unpublish: { from: ["published"], to: "approved", roles: ["superadmin", "admin"], reasonRequired: true, label: "ยกเลิกการประกาศ" },
    lock: { from: ["published"], to: "locked", roles: ["superadmin", "admin"], label: "ล็อกผล" },
    unlock: { from: ["locked"], to: "published", roles: ["superadmin"], reasonRequired: true, label: "ปลดล็อก" },
    reopen: { from: ["approved"], to: "open", roles: ["superadmin", "admin"], reasonRequired: true, label: "เปิดแก้ไขผลอีกครั้ง" }
  };
  function checkTransition(action, ctx2) {
    var _a;
    const rule = TRANSITIONS[action];
    if (!rule) return { ok: false, error: "ไม่รู้จักคำสั่งนี้" };
    if (!rule.from.includes(ctx2.status)) return { ok: false, error: `ทำ "${rule.label}" ไม่ได้ในสถานะปัจจุบัน` };
    const roleOk = rule.roles.includes(ctx2.role) || rule.assignedScorer && ctx2.role === "scorekeeper" && ctx2.isAssignedScorer;
    if (!roleOk) return { ok: false, error: "คุณไม่มีสิทธิ์ทำรายการนี้" };
    if (rule.reasonRequired && !((_a = ctx2.reason) != null ? _a : "").trim()) return { ok: false, error: "กรุณาระบุเหตุผล" };
    if (action === "approve" && ctx2.isSubmitter && ctx2.role !== "superadmin") return { ok: false, error: "ผู้ส่งผลไม่สามารถอนุมัติผลของตนเองได้" };
    return { ok: true, to: rule.to };
  }
  var isAdmin = (r) => r === "superadmin" || r === "admin";
  var canReview = (r) => isAdmin(r) || r === "reviewer";
  function canEditScores(status, role, isAssignedScorer) {
    if (isAdmin(role)) return status === "open" || status === "submitted";
    if (role === "scorekeeper" && isAssignedScorer) return status === "open";
    return false;
  }

  // server/src/schema.ts
  var TABLES = {
    Villages: { name: "Villages", key: ["id"], columns: ["id", "no", "name", "colorName", "colorHex", "paradeOrder"], num: ["no", "paradeOrder"] },
    Competitions: {
      name: "Competitions",
      key: ["id"],
      columns: ["id", "name", "category", "format", "gender", "countsForCup", "places", "prizes", "status", "order", "schedule", "description", "eligibleVillageIds", "matchesPublic", "judgeMode", "league", "version", "updatedAt"],
      json: ["prizes", "eligibleVillageIds", "league"],
      bool: ["countsForCup", "matchesPublic"],
      num: ["places", "order", "version"]
    },
    Criteria: {
      name: "Criteria",
      key: ["competitionId"],
      columns: ["competitionId", "items", "maxTotal", "aggregation", "confirmed", "confirmedBy", "confirmedAt"],
      json: ["items"],
      bool: ["confirmed"],
      num: ["maxTotal"]
    },
    Assignments: { name: "Assignments", key: ["competitionId"], columns: ["competitionId", "scorerId", "judgeIds"], json: ["judgeIds"] },
    Matches: {
      name: "Matches",
      key: ["id"],
      columns: ["id", "competitionId", "no", "round", "group", "schedule", "field", "homeId", "awayId", "homeLabel", "awayLabel", "homeScore", "awayScore", "homePens", "awayPens", "status", "version", "updatedBy", "updatedAt"],
      num: ["no", "homeScore", "awayScore", "homePens", "awayPens", "version"]
    },
    Scores: {
      name: "Scores",
      key: ["competitionId"],
      columns: ["competitionId", "data", "version", "updatedBy", "updatedAt", "submittedBy", "submittedAt", "reviewNote"],
      json: ["data"],
      num: ["version"]
    },
    JudgeSheets: { name: "JudgeSheets", key: ["competitionId", "judgeId"], columns: ["competitionId", "judgeId", "entries", "version", "updatedAt"], json: ["entries"], num: ["version"] },
    Results: {
      name: "Results",
      key: ["competitionId"],
      columns: ["competitionId", "summary", "placements", "ranking", "cupPoints", "countsForCup", "note", "tieNote", "approvedBy", "approvedAt", "publishedAt"],
      json: ["placements", "ranking", "cupPoints"],
      bool: ["countsForCup"]
    },
    Users: {
      name: "Users",
      key: ["id"],
      columns: ["id", "username", "displayName", "role", "active", "mustChangePassword", "passwordHash", "salt", "failedLogins", "lockedUntil", "createdAt"],
      bool: ["active", "mustChangePassword"],
      num: ["failedLogins"]
    },
    Sessions: { name: "Sessions", key: ["tokenHash"], columns: ["tokenHash", "userId", "expiresAt", "createdAt"] },
    Settings: { name: "Settings", key: ["key"], columns: ["key", "value"], json: ["value"] },
    AuditLog: { name: "AuditLog", key: ["id"], columns: ["id", "at", "userId", "userName", "action", "competitionId", "detail"] }
  };

  // server/src/store.ts
  var keyOf = (table, row) => TABLES[table].key.map((k) => {
    var _a;
    return String((_a = row[k]) != null ? _a : "");
  }).join("");
  function findRow(store, table, key) {
    var _a;
    const k = keyOf(table, key);
    return (_a = store.all(table).find((r) => keyOf(table, r) === k)) != null ? _a : null;
  }

  // server/src/api.ts
  var ApiError = class extends Error {
    constructor(code, message, extra) {
      super(message);
      this.code = code;
      this.extra = extra;
    }
  };
  var SESSION_HOURS = 12;
  var HASH_ROUNDS = 1e3;
  var MAX_FAILED = 5;
  var LOCK_MINUTES = 10;
  function handle(req, ctx2) {
    var _a;
    try {
      return { ok: true, data: route(req, ctx2) };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, error: e.message, code: e.code, extra: e.extra };
      return { ok: false, error: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่", code: "INTERNAL", extra: String((_a = e == null ? void 0 : e.message) != null ? _a : e) };
    }
  }
  function route(req, ctx2) {
    var _a, _b, _c, _d, _e, _f, _g;
    const p = (_a = req.payload) != null ? _a : {};
    switch (req.action) {
      case "ping":
        return { rev: ctx2.store.getRev(), serverTime: iso(ctx2) };
      case "public.snapshot":
        return publicSnapshot(ctx2, p.since);
      case "auth.login":
        return login(ctx2, String((_b = p.username) != null ? _b : ""), String((_c = p.password) != null ? _c : ""));
      case "auth.logout":
        return logout(ctx2, req.token);
      case "auth.me":
        return { user: toPublic(requireUser(ctx2, req.token, true)) };
      case "auth.changePassword":
        return changePassword(ctx2, req.token, String((_d = p.oldPassword) != null ? _d : ""), String((_e = p.newPassword) != null ? _e : ""));
    }
    const user = requireUser(ctx2, req.token);
    if (user.mustChangePassword) throw new ApiError("MUST_CHANGE_PASSWORD", "กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน");
    switch (req.action) {
      case "staff.snapshot":
        return staffSnapshot(ctx2, user, p.since);
      case "audit.list":
        return auditList(ctx2, user, (_f = p.competitionId) != null ? _f : null, Number((_g = p.limit) != null ? _g : 1e3));
      case "scores.save":
        return saveScores(ctx2, user, p);
      case "sheets.save":
        return saveSheet(ctx2, user, p);
      case "matches.save":
        return saveMatch(ctx2, user, p);
      case "matches.create":
        return createMatch(ctx2, user, p);
      case "matches.delete":
        return deleteMatch(ctx2, user, p);
      case "competitions.create":
        return createCompetition(ctx2, user, p);
      case "competitions.update":
        return updateCompetition(ctx2, user, p);
      case "criteria.update":
        return updateCriteria(ctx2, user, p);
      case "criteria.confirm":
        return confirmCriteria(ctx2, user, p);
      case "assignments.set":
        return setAssignment(ctx2, user, p);
      case "workflow.transition":
        return transition(ctx2, user, p.competitionId, p.action, p.reason);
      case "settings.update":
        return updateSettings(ctx2, user, p);
      case "users.create":
        return createUser(ctx2, user, p);
      case "users.update":
        return updateUser(ctx2, user, p);
      case "users.resetPassword":
        return resetPassword(ctx2, user, p);
    }
    throw new ApiError("BAD_ACTION", "ไม่รู้จักคำสั่งนี้");
  }
  var iso = (ctx2) => ctx2.crypto.now().toISOString();
  var str = (v, max = 500) => String(v != null ? v : "").trim().slice(0, max);
  function mutate(ctx2, fn, bump = true) {
    return ctx2.store.withLock(() => {
      const r = fn();
      if (bump) ctx2.store.bumpRev();
      return r;
    });
  }
  function audit(ctx2, user, action, competitionId, detail) {
    var _a, _b;
    ctx2.store.append("AuditLog", {
      id: ctx2.crypto.randomToken().slice(0, 16),
      at: iso(ctx2),
      userId: (_a = user == null ? void 0 : user.id) != null ? _a : null,
      userName: (_b = user == null ? void 0 : user.displayName) != null ? _b : "ระบบ",
      action,
      competitionId,
      detail: JSON.stringify(detail != null ? detail : {}).slice(0, 45e3)
    });
  }
  var villages = (ctx2) => ctx2.store.all("Villages").sort((a, b) => a.no - b.no);
  var competitions = (ctx2) => ctx2.store.all("Competitions").sort((a, b) => a.order - b.order);
  function getComp(ctx2, id) {
    const c = findRow(ctx2.store, "Competitions", { id: String(id != null ? id : "") });
    if (!c) throw new ApiError("NOT_FOUND", "ไม่พบรายการแข่งขัน");
    return c;
  }
  var getCriteria = (ctx2, id) => findRow(ctx2.store, "Criteria", { competitionId: id });
  function getAssignment(ctx2, id) {
    var _a;
    const a = findRow(ctx2.store, "Assignments", { competitionId: id });
    return a ? { competitionId: id, scorerId: a.scorerId || null, judgeIds: (_a = a.judgeIds) != null ? _a : [] } : { competitionId: id, scorerId: null, judgeIds: [] };
  }
  function getScore(ctx2, id) {
    const s = findRow(ctx2.store, "Scores", { competitionId: id });
    return s != null ? s : { competitionId: id, data: { placements: {} }, version: 0, updatedBy: null, updatedAt: null, submittedBy: null, submittedAt: null, reviewNote: null };
  }
  var sheetsOf = (ctx2, id) => ctx2.store.all("JudgeSheets").filter((s) => s.competitionId === id);
  var matchesOf = (ctx2, id) => ctx2.store.all("Matches").filter((m2) => m2.competitionId === id).sort((a, b) => a.no - b.no);
  var results = (ctx2) => ctx2.store.all("Results");
  function getSettings(ctx2) {
    const s = { ...DEFAULT_SETTINGS };
    for (const r of ctx2.store.all("Settings")) s[String(r.key)] = r.value;
    return s;
  }
  function toPublic(u) {
    return { id: u.id, username: u.username, displayName: u.displayName, role: u.role, active: !!u.active, mustChangePassword: !!u.mustChangePassword };
  }
  var allUsers = (ctx2) => ctx2.store.all("Users");
  function requireAdmin(u) {
    if (!isAdmin(u.role)) throw new ApiError("FORBIDDEN", "เฉพาะผู้ดูแลระบบ");
  }
  function checkVersion(current, base2, extra) {
    if (Number(base2) !== current) throw new ApiError("CONFLICT", "ข้อมูลถูกแก้ไขจากอุปกรณ์อื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก", extra);
  }
  function hashPassword(crypto, salt, password) {
    let h = `${salt}:${password}`;
    for (let i = 0; i < HASH_ROUNDS; i++) h = crypto.sha256Hex(salt + h);
    return h;
  }
  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let r = 0;
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  }
  function validatePassword(pw) {
    if (pw.length < 8) throw new ApiError("WEAK_PASSWORD", "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
    if (!/[0-9]/.test(pw) || !/[^0-9]/.test(pw)) throw new ApiError("WEAK_PASSWORD", "รหัสผ่านต้องมีทั้งตัวเลขและตัวอักษร");
  }
  function login(ctx2, username, password) {
    return mutate(ctx2, () => {
      const uname = username.trim().toLowerCase();
      const u = allUsers(ctx2).find((x) => x.username.toLowerCase() === uname);
      const fail = () => new ApiError("BAD_LOGIN", "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      if (!u || !u.active) throw fail();
      if (u.lockedUntil && new Date(u.lockedUntil) > ctx2.crypto.now()) throw new ApiError("LOCKED", "บัญชีถูกล็อกชั่วคราวเพราะใส่รหัสผิดหลายครั้ง ลองใหม่ภายหลัง");
      if (!safeEqual(hashPassword(ctx2.crypto, u.salt, password), u.passwordHash)) {
        const failed = (u.failedLogins || 0) + 1;
        ctx2.store.upsert("Users", { ...u, failedLogins: failed, lockedUntil: failed >= MAX_FAILED ? new Date(ctx2.crypto.now().getTime() + LOCK_MINUTES * 6e4).toISOString() : u.lockedUntil });
        if (failed >= MAX_FAILED) audit(ctx2, null, "auth.locked", null, { username: u.username });
        throw fail();
      }
      ctx2.store.upsert("Users", { ...u, failedLogins: 0, lockedUntil: null });
      const now = ctx2.crypto.now();
      for (const s of ctx2.store.all("Sessions")) if (new Date(String(s.expiresAt)) < now) ctx2.store.remove("Sessions", s);
      const token = ctx2.crypto.randomToken();
      ctx2.store.upsert("Sessions", { tokenHash: ctx2.crypto.sha256Hex(token), userId: u.id, expiresAt: new Date(now.getTime() + SESSION_HOURS * 36e5).toISOString(), createdAt: now.toISOString() });
      audit(ctx2, u, "auth.login", null, {});
      return { token, user: toPublic(u) };
    }, false);
  }
  function sessionUser(ctx2, token) {
    if (!token) return null;
    const s = findRow(ctx2.store, "Sessions", { tokenHash: ctx2.crypto.sha256Hex(token) });
    if (!s || new Date(String(s.expiresAt)) < ctx2.crypto.now()) return null;
    const u = findRow(ctx2.store, "Users", { id: s.userId });
    return u && u.active ? u : null;
  }
  function requireUser(ctx2, token, _allowMustChange = false) {
    const u = sessionUser(ctx2, token);
    if (!u) throw new ApiError("UNAUTHENTICATED", "กรุณาเข้าสู่ระบบใหม่");
    return u;
  }
  function logout(ctx2, token) {
    if (!token) return {};
    return mutate(ctx2, () => {
      ctx2.store.remove("Sessions", { tokenHash: ctx2.crypto.sha256Hex(token) });
      return {};
    }, false);
  }
  function changePassword(ctx2, token, oldPw, newPw) {
    const u = requireUser(ctx2, token, true);
    validatePassword(newPw);
    return mutate(ctx2, () => {
      if (!safeEqual(hashPassword(ctx2.crypto, u.salt, oldPw), u.passwordHash)) throw new ApiError("BAD_LOGIN", "รหัสผ่านเดิมไม่ถูกต้อง");
      const salt = ctx2.crypto.randomToken().slice(0, 24);
      const updated = { ...u, salt, passwordHash: hashPassword(ctx2.crypto, salt, newPw), mustChangePassword: false };
      ctx2.store.upsert("Users", updated);
      audit(ctx2, u, "auth.changePassword", null, {});
      return { user: toPublic(updated) };
    }, false);
  }
  function publishedResults(ctx2, comps) {
    const pub = new Set(comps.filter((c) => c.status === "published" || c.status === "locked").map((c) => c.id));
    return results(ctx2).filter((r) => pub.has(r.competitionId) && r.publishedAt);
  }
  function publicSnapshot(ctx2, since) {
    const rev = ctx2.store.getRev();
    if (since !== void 0 && since !== null && Number(since) === rev) return { rev, unchanged: true };
    const s = getSettings(ctx2);
    const comps = competitions(ctx2);
    const vs = villages(ctx2);
    const pubResults = publishedResults(ctx2, comps);
    const pubMatchComps = new Set(comps.filter((c) => c.matchesPublic).map((c) => c.id));
    const cup = s.cupVisible ? computeCup(pubResults, vs.map((v) => v.id), comps, s) : null;
    return {
      rev,
      serverTime: iso(ctx2),
      settings: { cupVisible: s.cupVisible, tieRule: s.tieRule, tieRuleConfirmed: s.tieRuleConfirmed, eventName: s.eventName },
      villages: vs,
      competitions: comps.map((c) => ({ ...c, version: void 0 })),
      criteria: ctx2.store.all("Criteria").filter((c) => pubResults.some((r) => r.competitionId === c.competitionId)),
      results: pubResults,
      matches: ctx2.store.all("Matches").filter((m2) => pubMatchComps.has(m2.competitionId)),
      cup
    };
  }
  function staffSnapshot(ctx2, user, since) {
    const rev = ctx2.store.getRev();
    if (since !== void 0 && since !== null && Number(since) === rev) return { rev, unchanged: true };
    const s = getSettings(ctx2);
    const comps = competitions(ctx2);
    const vs = villages(ctx2);
    const assignments = comps.map((c) => getAssignment(ctx2, c.id));
    const admin = canReview(user.role);
    const scorerOf = new Set(assignments.filter((a) => a.scorerId === user.id).map((a) => a.competitionId));
    const scores = ctx2.store.all("Scores").filter((x) => admin || scorerOf.has(x.competitionId));
    const sheets = ctx2.store.all("JudgeSheets").filter((x) => admin || scorerOf.has(x.competitionId) || x.judgeId === user.id);
    const res = results(ctx2);
    const approvedIds = new Set(comps.filter((c) => ["approved", "published", "locked"].includes(c.status)).map((c) => c.id));
    const users = allUsers(ctx2);
    return {
      rev,
      serverTime: iso(ctx2),
      me: toPublic(user),
      settings: s,
      villages: vs,
      competitions: comps,
      criteria: ctx2.store.all("Criteria"),
      assignments,
      matches: ctx2.store.all("Matches"),
      scores,
      sheets,
      results: res.filter((r) => approvedIds.has(r.competitionId)),
      cupInternal: computeCup(res.filter((r) => approvedIds.has(r.competitionId)), vs.map((v) => v.id), comps, s),
      cupPublic: computeCup(publishedResults(ctx2, comps), vs.map((v) => v.id), comps, s),
      users: isAdmin(user.role) ? users.map(toPublic) : users.map((u) => ({ id: u.id, displayName: u.displayName, role: u.role, active: u.active })),
      audit: admin ? auditList(ctx2, user, null, 300) : []
    };
  }
  function auditList(ctx2, user, competitionId, limit) {
    if (!canReview(user.role)) throw new ApiError("FORBIDDEN", "ไม่มีสิทธิ์ดูประวัติ");
    const rows = ctx2.store.all("AuditLog").filter((r) => !competitionId || r.competitionId === competitionId);
    return rows.sort((a, b) => a.at < b.at ? 1 : -1).slice(0, Math.max(1, Math.min(limit, 5e3)));
  }
  function sanitizePlacements(p, places) {
    const out = {};
    const src = p && typeof p === "object" ? p : {};
    for (let i = 1; i <= places; i++) {
      const v = src[String(i)];
      out[String(i)] = typeof v === "string" && v ? v : null;
    }
    return out;
  }
  function sanitizeEntries(e, keys, villageIds) {
    const out = {};
    const src = e && typeof e === "object" ? e : {};
    for (const v of villageIds) {
      if (!src[v]) continue;
      out[v] = {};
      for (const k of keys) {
        const raw2 = src[v][k];
        out[v][k] = raw2 === null || raw2 === void 0 || raw2 === "" ? null : Number(raw2);
      }
    }
    return out;
  }
  function requireCriteria(ctx2, c) {
    const cr = getCriteria(ctx2, c.id);
    if (!cr || !cr.confirmed) throw new ApiError("CRITERIA_NOT_CONFIRMED", "เกณฑ์การให้คะแนนยังไม่ได้รับการยืนยันจากผู้ดูแล");
    return cr;
  }
  function throwIssues(issues) {
    if (issues.length) throw new ApiError("INVALID", issues.map((i) => i.message).join(" · "), issues);
  }
  function saveScores(ctx2, user, p) {
    return mutate(ctx2, () => {
      var _a;
      const c = getComp(ctx2, p.competitionId);
      const a = getAssignment(ctx2, c.id);
      if (!canEditScores(c.status, user.role, a.scorerId === user.id)) throw new ApiError("FORBIDDEN", c.status === "open" ? "คุณไม่ได้รับมอบหมายให้บันทึกรายการนี้" : "รายการนี้ไม่ได้เปิดรับคะแนน");
      const cur = getScore(ctx2, c.id);
      checkVersion(cur.version, p.baseVersion, cur);
      const raw2 = (_a = p.data) != null ? _a : {};
      const data = { placements: sanitizePlacements(raw2.placements, c.places), note: str(raw2.note, 2e3), tieNote: str(raw2.tieNote, 1e3) };
      throwIssues(validatePlacements(data.placements, c.places, c.eligibleVillageIds, false));
      if (c.format === "criteria" && c.judgeMode === "single") {
        const cr = requireCriteria(ctx2, c);
        data.entries = sanitizeEntries(raw2.entries, cr.items.map((i) => i.key), c.eligibleVillageIds);
        const issues = Object.entries(data.entries).flatMap(([vid, en]) => validateEntry(cr.items, en, false).map((i) => ({ ...i, message: `${vname(ctx2, vid)}: ${i.message}` })));
        throwIssues(issues);
      }
      if (c.format === "league" && raw2.leagueTieOrder && typeof raw2.leagueTieOrder === "object") {
        data.leagueTieOrder = {};
        for (const [g, ids] of Object.entries(raw2.leagueTieOrder)) if (Array.isArray(ids)) data.leagueTieOrder[g] = ids.filter((x) => c.eligibleVillageIds.includes(x));
      }
      const rec = { ...cur, data, version: cur.version + 1, updatedBy: user.id, updatedAt: iso(ctx2) };
      ctx2.store.upsert("Scores", rec);
      audit(ctx2, user, "scores.save", c.id, { version: rec.version, data });
      return { score: rec };
    });
  }
  function vname(ctx2, id) {
    var _a, _b;
    return (_b = (_a = villages(ctx2).find((v) => v.id === id)) == null ? void 0 : _a.name) != null ? _b : id;
  }
  function saveSheet(ctx2, user, p) {
    return mutate(ctx2, () => {
      var _a;
      const c = getComp(ctx2, p.competitionId);
      if (c.format !== "criteria" || c.judgeMode !== "panel") throw new ApiError("INVALID", "รายการนี้ไม่ได้ใช้คณะกรรมการ");
      const a = getAssignment(ctx2, c.id);
      if (!a.judgeIds.includes(user.id)) throw new ApiError("FORBIDDEN", "คุณไม่ได้เป็นกรรมการของรายการนี้");
      if (c.status !== "open") throw new ApiError("FORBIDDEN", "รายการนี้ไม่ได้เปิดรับคะแนน");
      const cr = requireCriteria(ctx2, c);
      const cur = (_a = findRow(ctx2.store, "JudgeSheets", { competitionId: c.id, judgeId: user.id })) != null ? _a : { competitionId: c.id, judgeId: user.id, entries: {}, version: 0, updatedAt: null };
      checkVersion(cur.version, p.baseVersion, cur);
      const entries = sanitizeEntries(p.entries, cr.items.map((i) => i.key), c.eligibleVillageIds);
      throwIssues(Object.entries(entries).flatMap(([vid, en]) => validateEntry(cr.items, en, false).map((i) => ({ ...i, message: `${vname(ctx2, vid)}: ${i.message}` }))));
      const rec = { ...cur, entries, version: cur.version + 1, updatedAt: iso(ctx2) };
      ctx2.store.upsert("JudgeSheets", rec);
      audit(ctx2, user, "sheets.save", c.id, { version: rec.version, entries });
      return { sheet: rec };
    });
  }
  var intOrNull = (v, label) => {
    if (v === null || v === void 0 || v === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 99) throw new ApiError("INVALID", `${label} ต้องเป็นจำนวนเต็ม 0–99`);
    return n;
  };
  function saveMatch(ctx2, user, p) {
    return mutate(ctx2, () => {
      var _a, _b;
      const c = getComp(ctx2, p.competitionId);
      const a = getAssignment(ctx2, c.id);
      if (!canEditScores(c.status, user.role, a.scorerId === user.id)) throw new ApiError("FORBIDDEN", "ไม่มีสิทธิ์บันทึกผลนัดนี้ หรือรายการไม่ได้เปิดรับคะแนน");
      const cur = findRow(ctx2.store, "Matches", { id: String((_a = p.matchId) != null ? _a : "") });
      if (!cur || cur.competitionId !== c.id) throw new ApiError("NOT_FOUND", "ไม่พบนัดการแข่งขัน");
      checkVersion(cur.version, p.baseVersion, cur);
      const patch = (_b = p.patch) != null ? _b : {};
      const next = { ...cur };
      for (const k of ["homeScore", "awayScore", "homePens", "awayPens"]) if (k in patch) next[k] = intOrNull(patch[k], "คะแนน");
      for (const k of ["homeId", "awayId"]) if (k in patch) {
        const v = patch[k] || null;
        if (v && !c.eligibleVillageIds.includes(v)) throw new ApiError("INVALID", "หมู่บ้านนี้ไม่ได้อยู่ในรายการ");
        next[k] = v;
      }
      if (isAdmin(user.role)) {
        for (const k of ["schedule", "field", "homeLabel", "awayLabel"]) if (k in patch) next[k] = str(patch[k], 100);
      }
      if ("status" in patch) next.status = patch.status === "played" ? "played" : "scheduled";
      if (next.homeId && next.homeId === next.awayId) throw new ApiError("INVALID", "ทีมเหย้าและทีมเยือนต้องไม่ซ้ำกัน");
      if (next.status === "played") {
        if (!next.homeId || !next.awayId) throw new ApiError("INVALID", "ต้องระบุทั้งสองทีมก่อนบันทึกผล");
        if (next.homeScore === null || next.awayScore === null) throw new ApiError("INVALID", "ต้องกรอกคะแนนทั้งสองทีม");
        if (next.round !== "group" && next.homeScore === next.awayScore && (next.homePens === null || next.awayPens === null || next.homePens === next.awayPens)) {
          throw new ApiError("INVALID", "รอบน็อคเอาท์ที่เสมอต้องกรอกผลยิงจุดโทษที่มีผู้ชนะ");
        }
      }
      next.version = cur.version + 1;
      next.updatedBy = user.id;
      next.updatedAt = iso(ctx2);
      ctx2.store.upsert("Matches", next);
      audit(ctx2, user, "matches.save", c.id, { matchId: cur.id, before: pickScore(cur), after: pickScore(next) });
      return { match: next };
    });
  }
  var pickScore = (m2) => ({ homeId: m2.homeId, awayId: m2.awayId, homeScore: m2.homeScore, awayScore: m2.awayScore, homePens: m2.homePens, awayPens: m2.awayPens, status: m2.status });
  function createMatch(ctx2, user, p) {
    requireAdmin(user);
    return mutate(ctx2, () => {
      const c = getComp(ctx2, p.competitionId);
      if (c.format !== "league" && c.format !== "knockout") throw new ApiError("INVALID", "รายการนี้ไม่มีตารางนัด");
      const existing = matchesOf(ctx2, c.id);
      const no = Math.max(0, ...existing.map((m3) => m3.no)) + 1;
      const round = ["group", "r1", "qf", "semi", "third", "final"].includes(p.round) ? p.round : "r1";
      const m2 = {
        id: `${c.id}-${no}`,
        competitionId: c.id,
        no,
        round,
        group: p.group ? str(p.group, 5) : null,
        schedule: str(p.schedule, 100),
        field: str(p.field, 50),
        homeId: null,
        awayId: null,
        homeLabel: str(p.homeLabel, 60),
        awayLabel: str(p.awayLabel, 60),
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: "scheduled",
        version: 1,
        updatedBy: user.id,
        updatedAt: iso(ctx2)
      };
      ctx2.store.upsert("Matches", m2);
      audit(ctx2, user, "matches.create", c.id, { matchId: m2.id });
      return { match: m2 };
    });
  }
  function deleteMatch(ctx2, user, p) {
    requireAdmin(user);
    return mutate(ctx2, () => {
      var _a;
      const m2 = findRow(ctx2.store, "Matches", { id: String((_a = p.matchId) != null ? _a : "") });
      if (!m2) throw new ApiError("NOT_FOUND", "ไม่พบนัด");
      if (m2.status === "played") throw new ApiError("INVALID", "ลบนัดที่บันทึกผลแล้วไม่ได้ ให้ล้างผลก่อน");
      ctx2.store.remove("Matches", { id: m2.id });
      audit(ctx2, user, "matches.delete", m2.competitionId, { matchId: m2.id });
      return {};
    });
  }
  function createCompetition(ctx2, user, p) {
    requireAdmin(user);
    const id = str(p.id, 40).toLowerCase();
    if (!/^[a-z0-9_-]{2,40}$/.test(id)) throw new ApiError("INVALID", "รหัสรายการใช้ a-z 0-9 _ - ยาว 2–40 ตัว");
    const category = ["sport", "folk", "contest"].includes(p.category) ? p.category : null;
    const format = ["placement", "criteria", "league", "knockout"].includes(p.format) ? p.format : null;
    if (!category || !format) throw new ApiError("INVALID", "กรุณาเลือกประเภทและรูปแบบการแข่งขัน");
    if (p.countsForCup && (user.role !== "superadmin" || !str(p.reason))) throw new ApiError("FORBIDDEN", "การนับรายการใหม่เข้าถ้วยรวมทำได้เฉพาะ Super Admin พร้อมเหตุผลการยืนยันจากผู้จัด");
    return mutate(ctx2, () => {
      var _a, _b, _c, _d;
      if (findRow(ctx2.store, "Competitions", { id })) throw new ApiError("INVALID", "รหัสรายการนี้มีอยู่แล้ว");
      const comps = competitions(ctx2);
      const c = {
        id,
        name: str(p.name, 120) || id,
        category,
        format,
        gender: ["male", "female", "mixed"].includes(p.gender) ? p.gender : null,
        countsForCup: !!p.countsForCup,
        places: [1, 2, 3, 4].includes(Number(p.places)) ? Number(p.places) : 3,
        prizes: [],
        status: "draft",
        order: Math.max(0, ...comps.map((x) => x.order)) + 1,
        schedule: str(p.schedule, 200),
        description: str(p.description, 1e3),
        eligibleVillageIds: villages(ctx2).map((v) => v.id),
        matchesPublic: false,
        judgeMode: "single",
        league: format === "league" ? { win: Number((_a = p.win) != null ? _a : 3), draw: Number((_b = p.draw) != null ? _b : 1), loss: Number((_c = p.loss) != null ? _c : 0), advance: 2, groups: {} } : null,
        version: 1,
        updatedAt: iso(ctx2)
      };
      ctx2.store.upsert("Competitions", c);
      if (format === "criteria") {
        ctx2.store.upsert("Criteria", { competitionId: id, items: [], maxTotal: Number((_d = p.maxTotal) != null ? _d : 50), aggregation: null, confirmed: false, confirmedBy: null, confirmedAt: null });
      }
      audit(ctx2, user, "competitions.create", id, { ...c, reason: str(p.reason) });
      return { competition: c };
    });
  }
  function updateCompetition(ctx2, user, p) {
    requireAdmin(user);
    return mutate(ctx2, () => {
      var _a, _b, _c, _d, _e, _f;
      const c = getComp(ctx2, p.id);
      checkVersion(c.version, p.baseVersion, c);
      const patch = (_a = p.patch) != null ? _a : {};
      const next = { ...c };
      if ("name" in patch) next.name = str(patch.name, 120) || c.name;
      if ("schedule" in patch) next.schedule = str(patch.schedule, 200);
      if ("description" in patch) next.description = str(patch.description, 1e3);
      if ("matchesPublic" in patch) next.matchesPublic = !!patch.matchesPublic;
      const structural = ["places", "prizes", "eligibleVillageIds", "judgeMode", "league"].filter((k) => k in patch);
      if ("league" in patch && c.format === "league" && patch.league && c.status === "draft") {
        const L = patch.league;
        const groups = {};
        for (const [g, ids] of Object.entries((_b = L.groups) != null ? _b : {})) groups[str(g, 5)] = (Array.isArray(ids) ? ids : []).filter((x) => c.eligibleVillageIds.includes(x));
        next.league = { win: Number((_c = L.win) != null ? _c : 3), draw: Number((_d = L.draw) != null ? _d : 1), loss: Number((_e = L.loss) != null ? _e : 0), advance: Math.max(1, Number((_f = L.advance) != null ? _f : 2)), groups };
      }
      if (structural.length && c.status !== "draft") throw new ApiError("INVALID", 'แก้โครงสร้างรายการได้เฉพาะสถานะ "ยังไม่เริ่ม"');
      if ("places" in patch) {
        const n = Number(patch.places);
        if (![1, 2, 3, 4].includes(n)) throw new ApiError("INVALID", "จำนวนอันดับต้องเป็น 1–4");
        next.places = n;
      }
      if ("prizes" in patch) next.prizes = (Array.isArray(patch.prizes) ? patch.prizes : []).map((x) => Math.max(0, Number(x) || 0)).slice(0, 4);
      if ("eligibleVillageIds" in patch) {
        const ids = villages(ctx2).map((v) => v.id);
        next.eligibleVillageIds = (Array.isArray(patch.eligibleVillageIds) ? patch.eligibleVillageIds : []).filter((x) => ids.includes(x));
        if (next.eligibleVillageIds.length < 2) throw new ApiError("INVALID", "ต้องมีผู้เข้าแข่งขันอย่างน้อย 2 หมู่บ้าน");
      }
      if ("judgeMode" in patch) {
        if (c.format !== "criteria") throw new ApiError("INVALID", "ใช้ได้เฉพาะรายการประกวด");
        next.judgeMode = patch.judgeMode === "panel" ? "panel" : "single";
      }
      if ("countsForCup" in patch && !!patch.countsForCup !== c.countsForCup) {
        if (user.role !== "superadmin") throw new ApiError("FORBIDDEN", "การเปลี่ยนเงื่อนไขถ้วยรวมทำได้เฉพาะ Super Admin");
        if (c.status !== "draft") throw new ApiError("INVALID", 'เปลี่ยนเงื่อนไขถ้วยรวมได้เฉพาะสถานะ "ยังไม่เริ่ม"');
        if (!str(p.reason)) throw new ApiError("INVALID", "กรุณาระบุเหตุผลและการยืนยันจากผู้จัด");
        next.countsForCup = !!patch.countsForCup;
      }
      next.version = c.version + 1;
      next.updatedAt = iso(ctx2);
      ctx2.store.upsert("Competitions", next);
      if (next.judgeMode !== c.judgeMode) {
        const cr = getCriteria(ctx2, c.id);
        if (cr) ctx2.store.upsert("Criteria", { ...cr, confirmed: false, confirmedBy: null, confirmedAt: null });
      }
      audit(ctx2, user, "competitions.update", c.id, { patch, reason: str(p.reason) });
      return { competition: next };
    });
  }
  function updateCriteria(ctx2, user, p) {
    requireAdmin(user);
    return mutate(ctx2, () => {
      var _a;
      const c = getComp(ctx2, p.competitionId);
      if (c.format !== "criteria") throw new ApiError("INVALID", "รายการนี้ไม่ได้ใช้เกณฑ์คะแนน");
      if (c.status !== "draft") throw new ApiError("INVALID", 'แก้เกณฑ์ได้เฉพาะสถานะ "ยังไม่เริ่ม"');
      const cur = (_a = getCriteria(ctx2, c.id)) != null ? _a : { competitionId: c.id, items: [], maxTotal: 50, aggregation: null, confirmed: false, confirmedBy: null, confirmedAt: null };
      const items = (Array.isArray(p.items) ? p.items : cur.items).slice(0, 20).map((it, i) => ({
        key: str(it.key, 20) || `c${i + 1}`,
        label: str(it.label, 200),
        max: it.max === null || it.max === "" || it.max === void 0 ? null : Number(it.max)
      }));
      const next = {
        ...cur,
        items,
        maxTotal: p.maxTotal !== void 0 ? Number(p.maxTotal) : cur.maxTotal,
        aggregation: p.aggregation === "average" || p.aggregation === "sum" ? p.aggregation : p.aggregation === null ? null : cur.aggregation,
        confirmed: false,
        confirmedBy: null,
        confirmedAt: null
      };
      ctx2.store.upsert("Criteria", next);
      audit(ctx2, user, "criteria.update", c.id, next);
      return { criteria: next };
    });
  }
  function confirmCriteria(ctx2, user, p) {
    requireAdmin(user);
    return mutate(ctx2, () => {
      const c = getComp(ctx2, p.competitionId);
      if (c.status !== "draft") throw new ApiError("INVALID", 'ยืนยันเกณฑ์ได้เฉพาะสถานะ "ยังไม่เริ่ม"');
      const cr = getCriteria(ctx2, c.id);
      if (!cr) throw new ApiError("NOT_FOUND", "ยังไม่มีเกณฑ์");
      throwIssues(validateCriteriaConfig(cr.items, cr.maxTotal));
      if (c.judgeMode === "panel" && !cr.aggregation) throw new ApiError("INVALID", "ต้องเลือกวิธีรวมคะแนนกรรมการ (เฉลี่ย/รวม)");
      const next = { ...cr, confirmed: true, confirmedBy: user.id, confirmedAt: iso(ctx2) };
      ctx2.store.upsert("Criteria", next);
      audit(ctx2, user, "criteria.confirm", c.id, next);
      return { criteria: next };
    });
  }
  function setAssignment(ctx2, user, p) {
    requireAdmin(user);
    return mutate(ctx2, () => {
      const c = getComp(ctx2, p.competitionId);
      if (["approved", "published", "locked"].includes(c.status)) throw new ApiError("INVALID", "รายการนี้อนุมัติผลแล้ว");
      const users = allUsers(ctx2);
      const okScorer = (id) => users.some((u) => u.id === id && u.active && (u.role === "scorekeeper" || isAdmin(u.role)));
      const scorerId = p.scorerId ? String(p.scorerId) : null;
      if (scorerId && !okScorer(scorerId)) throw new ApiError("INVALID", "ผู้บันทึกต้องเป็นบัญชีบทบาทผู้บันทึกคะแนนที่ใช้งานอยู่");
      const judgeIds = Array.isArray(p.judgeIds) ? [...new Set(p.judgeIds.map(String))] : [];
      if (judgeIds.some((id) => !okScorer(id))) throw new ApiError("INVALID", "กรรมการต้องเป็นบัญชีบทบาทผู้บันทึกคะแนนที่ใช้งานอยู่");
      const next = { competitionId: c.id, scorerId, judgeIds: c.judgeMode === "panel" ? judgeIds : [] };
      ctx2.store.upsert("Assignments", next);
      audit(ctx2, user, "assignments.set", c.id, next);
      return { assignment: next };
    });
  }
  function updateSettings(ctx2, user, p) {
    requireAdmin(user);
    return mutate(ctx2, () => {
      const s = getSettings(ctx2);
      const next = { ...s };
      if ("cupVisible" in p) next.cupVisible = !!p.cupVisible;
      if ("autoPublishOnApprove" in p) next.autoPublishOnApprove = !!p.autoPublishOnApprove;
      if ("tieRule" in p) {
        if (!["unconfirmed", "shared", "countback", "manual"].includes(p.tieRule)) throw new ApiError("INVALID", "กติกาตัดสินเสมอไม่ถูกต้อง");
        next.tieRule = p.tieRule;
        next.tieRuleConfirmed = p.tieRule !== "unconfirmed" && !!p.tieRuleConfirmed;
        if (p.tieRule !== "unconfirmed" && !p.tieRuleConfirmed) throw new ApiError("INVALID", "ต้องยืนยันว่ากติกานี้ผู้จัดรับรองแล้ว");
      }
      if ("tieManualOrder" in p) {
        const ids = villages(ctx2).map((v) => v.id);
        next.tieManualOrder = (Array.isArray(p.tieManualOrder) ? p.tieManualOrder : []).filter((x) => ids.includes(x));
      }
      for (const [k, v] of Object.entries(next)) if (s[k] !== v || k === "tieManualOrder") ctx2.store.upsert("Settings", { key: k, value: v });
      audit(ctx2, user, "settings.update", null, { before: s, after: next, reason: str(p.reason) });
      return { settings: next };
    });
  }
  function buildResult(ctx2, c, score, approver) {
    var _a, _b, _c;
    let ranking = null;
    if (c.format === "criteria") {
      const cr = requireCriteria(ctx2, c);
      ranking = contestRanking(cr.items, c.eligibleVillageIds, c.judgeMode, score.data.entries, sheetsOf(ctx2, c.id).map((s) => s.entries), cr.aggregation);
    }
    return {
      competitionId: c.id,
      placements: score.data.placements,
      ranking,
      cupPoints: c.countsForCup ? cupPointsFor(score.data.placements) : {},
      countsForCup: c.countsForCup,
      note: (_a = score.data.note) != null ? _a : "",
      tieNote: (_b = score.data.tieNote) != null ? _b : "",
      approvedBy: (_c = approver == null ? void 0 : approver.id) != null ? _c : null,
      approvedAt: iso(ctx2),
      publishedAt: null
    };
  }
  function validateSubmission(ctx2, c, score) {
    var _a, _b;
    const p = (_a = score.data.placements) != null ? _a : {};
    throwIssues(validatePlacements(p, c.places, c.eligibleVillageIds, true));
    if (c.format === "criteria") {
      const cr = requireCriteria(ctx2, c);
      if (c.judgeMode === "single") {
        const issues = c.eligibleVillageIds.flatMap((vid) => {
          var _a2;
          return validateEntry(cr.items, (_a2 = score.data.entries) == null ? void 0 : _a2[vid], true).map((i) => ({ ...i, message: `${vname(ctx2, vid)}: ${i.message}` }));
        });
        throwIssues(issues);
      } else {
        const sheets = sheetsOf(ctx2, c.id);
        const judges = getAssignment(ctx2, c.id).judgeIds;
        const missing = judges.filter((j) => !sheets.some((s) => s.judgeId === j && c.eligibleVillageIds.every((v) => entryTotal(cr.items, s.entries[v]).complete)));
        if (missing.length) throw new ApiError("INVALID", `ยังมีกรรมการกรอกคะแนนไม่ครบ ${missing.length} คน`);
      }
      const ranking = contestRanking(cr.items, c.eligibleVillageIds, c.judgeMode, score.data.entries, sheetsOf(ctx2, c.id).map((s) => s.entries), cr.aggregation);
      throwIssues(placementsConsistent(p, ranking));
      if (tiesWithinPlaces(ranking, c.places).length && !((_b = score.data.tieNote) != null ? _b : "").trim()) {
        throw new ApiError("INVALID", "มีคะแนนเท่ากันในอันดับที่ได้รางวัล กรุณาระบุเหตุผลการจัดลำดับ");
      }
    }
  }
  function transition(ctx2, user, competitionId, action, reason) {
    return mutate(ctx2, () => {
      const c = getComp(ctx2, competitionId);
      const a = getAssignment(ctx2, c.id);
      const score = getScore(ctx2, c.id);
      const chk = checkTransition(action, { status: c.status, role: user.role, isAssignedScorer: a.scorerId === user.id, reason, isSubmitter: score.submittedBy === user.id });
      if (!chk.ok) throw new ApiError("FORBIDDEN", chk.error);
      const s = getSettings(ctx2);
      let to = chk.to;
      const now = iso(ctx2);
      switch (action) {
        case "open":
          if (c.format === "criteria") requireCriteria(ctx2, c);
          if (!a.scorerId) throw new ApiError("INVALID", "ยังไม่ได้มอบหมายผู้บันทึกคะแนน");
          if (c.format === "criteria" && c.judgeMode === "panel" && !a.judgeIds.length) throw new ApiError("INVALID", "ยังไม่ได้กำหนดกรรมการ");
          break;
        case "submit":
          validateSubmission(ctx2, c, score);
          ctx2.store.upsert("Scores", { ...score, submittedBy: user.id, submittedAt: now, reviewNote: null });
          break;
        case "return":
        case "reject":
          ctx2.store.upsert("Scores", { ...score, reviewNote: str(reason, 1e3) });
          break;
        case "approve": {
          validateSubmission(ctx2, c, score);
          const r = buildResult(ctx2, c, score, user);
          if (s.autoPublishOnApprove) {
            r.publishedAt = now;
            to = "published";
          }
          ctx2.store.upsert("Results", { ...r, summary: summary(ctx2, r) });
          break;
        }
        case "publish": {
          const r = findRow(ctx2.store, "Results", { competitionId: c.id });
          if (!r) throw new ApiError("INVALID", "ยังไม่มีผลที่อนุมัติ");
          ctx2.store.upsert("Results", { ...r, publishedAt: now });
          break;
        }
        case "unpublish": {
          const r = findRow(ctx2.store, "Results", { competitionId: c.id });
          if (r) ctx2.store.upsert("Results", { ...r, publishedAt: null });
          break;
        }
        case "reopen":
          ctx2.store.remove("Results", { competitionId: c.id });
          break;
      }
      const next = { ...c, status: to, version: c.version + 1, updatedAt: now };
      ctx2.store.upsert("Competitions", next);
      audit(ctx2, user, `workflow.${action}`, c.id, { from: c.status, to, reason: str(reason, 1e3) });
      return { competition: next };
    });
  }
  function summary(ctx2, r) {
    return Object.entries(r.placements).filter(([, v]) => v).map(([k, v]) => `${k}: ${vname(ctx2, v)}`).join(" | ");
  }
  var ROLES = ["superadmin", "admin", "scorekeeper", "reviewer", "viewer"];
  function assertCanGrant(actor, role) {
    if (!ROLES.includes(role)) throw new ApiError("INVALID", "บทบาทไม่ถูกต้อง");
    if ((role === "superadmin" || role === "admin") && actor.role !== "superadmin") throw new ApiError("FORBIDDEN", "เฉพาะ Super Admin ที่กำหนดบทบาทผู้ดูแลได้");
  }
  function createUser(ctx2, actor, p) {
    var _a;
    requireAdmin(actor);
    const username = str(p.username, 40).toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new ApiError("INVALID", "ชื่อผู้ใช้ใช้ a-z 0-9 . _ - ยาว 3–40 ตัว");
    const role = p.role;
    assertCanGrant(actor, role);
    validatePassword(String((_a = p.password) != null ? _a : ""));
    return mutate(ctx2, () => {
      if (allUsers(ctx2).some((u2) => u2.username.toLowerCase() === username)) throw new ApiError("INVALID", "ชื่อผู้ใช้นี้มีอยู่แล้ว");
      const u = newUserRow(ctx2, username, str(p.displayName, 80) || username, role, String(p.password), true);
      ctx2.store.upsert("Users", u);
      audit(ctx2, actor, "users.create", null, { id: u.id, username, role });
      return { user: toPublic(u) };
    });
  }
  function newUserRow(ctx2, username, displayName, role, password, mustChange) {
    const salt = ctx2.crypto.randomToken().slice(0, 24);
    return {
      id: "u_" + ctx2.crypto.randomToken().slice(0, 12),
      username,
      displayName,
      role,
      active: true,
      mustChangePassword: mustChange,
      passwordHash: hashPassword(ctx2.crypto, salt, password),
      salt,
      failedLogins: 0,
      lockedUntil: null,
      createdAt: iso(ctx2)
    };
  }
  function updateUser(ctx2, actor, p) {
    requireAdmin(actor);
    return mutate(ctx2, () => {
      var _a;
      const u = findRow(ctx2.store, "Users", { id: String((_a = p.id) != null ? _a : "") });
      if (!u) throw new ApiError("NOT_FOUND", "ไม่พบผู้ใช้");
      if ((u.role === "superadmin" || u.role === "admin") && actor.role !== "superadmin") throw new ApiError("FORBIDDEN", "เฉพาะ Super Admin ที่แก้บัญชีผู้ดูแลได้");
      const next = { ...u };
      if ("displayName" in p) next.displayName = str(p.displayName, 80) || u.displayName;
      if ("role" in p && p.role !== u.role) {
        assertCanGrant(actor, p.role);
        next.role = p.role;
      }
      if ("active" in p) next.active = !!p.active;
      if (u.id === actor.id && (!next.active || next.role !== u.role)) throw new ApiError("INVALID", "แก้บทบาทหรือปิดบัญชีของตัวเองไม่ได้");
      if (u.role === "superadmin" && (next.role !== "superadmin" || !next.active) && allUsers(ctx2).filter((x) => x.role === "superadmin" && x.active).length <= 1) {
        throw new ApiError("INVALID", "ต้องมี Super Admin ที่ใช้งานอยู่อย่างน้อย 1 บัญชี");
      }
      ctx2.store.upsert("Users", next);
      if (!next.active || next.role !== u.role) revokeSessions(ctx2, u.id);
      audit(ctx2, actor, "users.update", null, { id: u.id, before: toPublic(u), after: toPublic(next) });
      return { user: toPublic(next) };
    });
  }
  function resetPassword(ctx2, actor, p) {
    var _a;
    requireAdmin(actor);
    validatePassword(String((_a = p.password) != null ? _a : ""));
    return mutate(ctx2, () => {
      var _a2;
      const u = findRow(ctx2.store, "Users", { id: String((_a2 = p.id) != null ? _a2 : "") });
      if (!u) throw new ApiError("NOT_FOUND", "ไม่พบผู้ใช้");
      if ((u.role === "superadmin" || u.role === "admin") && actor.role !== "superadmin") throw new ApiError("FORBIDDEN", "เฉพาะ Super Admin ที่รีเซ็ตรหัสผู้ดูแลได้");
      const salt = ctx2.crypto.randomToken().slice(0, 24);
      ctx2.store.upsert("Users", { ...u, salt, passwordHash: hashPassword(ctx2.crypto, salt, String(p.password)), mustChangePassword: true, failedLogins: 0, lockedUntil: null });
      revokeSessions(ctx2, u.id);
      audit(ctx2, actor, "users.resetPassword", null, { id: u.id });
      return {};
    });
  }
  function revokeSessions(ctx2, userId) {
    for (const s of ctx2.store.all("Sessions")) if (s.userId === userId) ctx2.store.remove("Sessions", s);
  }
  function seedAll(ctx2, admin) {
    return mutate(ctx2, () => {
      var _a;
      const created = [];
      const ensure = (table, rows, key) => {
        const have = new Set(ctx2.store.all(table).map((r) => String(r[key])));
        rows.forEach((r) => {
          if (!have.has(String(r[key]))) {
            ctx2.store.upsert(table, r);
            created.push(`${table}:${r[key]}`);
          }
        });
      };
      ensure("Villages", VILLAGES, "id");
      ensure("Competitions", seedCompetitions().map((c) => ({ ...c, updatedAt: iso(ctx2) })), "id");
      ensure("Criteria", seedCriteria(), "competitionId");
      ensure("Matches", seedMatches(), "id");
      ensure("Settings", Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })), "key");
      if (admin && !allUsers(ctx2).some((u) => u.role === "superadmin")) {
        validatePassword(admin.password);
        const u = newUserRow(ctx2, admin.username.toLowerCase(), (_a = admin.displayName) != null ? _a : "Super Admin", "superadmin", admin.password, true);
        ctx2.store.upsert("Users", u);
        created.push(`Users:${u.username}`);
      }
      audit(ctx2, null, "system.seed", null, { created: created.length });
      return { created };
    });
  }

  // server/src/gas/sheetStore.ts
  var SheetStore = class {
    constructor(ss) {
      this.ss = ss;
      this.cache = /* @__PURE__ */ new Map();
    }
    ensureSheet(table) {
      const def = TABLES[table];
      let sheet = this.ss.getSheetByName(def.name);
      if (!sheet) sheet = this.ss.insertSheet(def.name);
      const lastCol = Math.max(sheet.getLastColumn(), 1);
      const header = sheet.getLastRow() >= 1 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String).filter(Boolean) : [];
      const missing = def.columns.filter((c) => !header.includes(c));
      if (missing.length) {
        sheet.getRange(1, header.length + 1, 1, missing.length).setValues([missing]);
        sheet.getRange(1, 1, 1, header.length + missing.length).setFontWeight("bold").setBackground("#E8F1E9");
        sheet.setFrozenRows(1);
      }
      return sheet;
    }
    load(table) {
      var _a;
      const hit = this.cache.get(table);
      if (hit) return hit;
      const def = TABLES[table];
      const sheet = this.ensureSheet(table);
      const values = sheet.getDataRange().getValues();
      const header = ((_a = values[0]) != null ? _a : []).map(String);
      const rows = values.slice(1).filter((r) => r.some((c) => c !== "" && c !== null)).map((r) => {
        const row = {};
        header.forEach((h, i) => {
          if (def.columns.includes(h)) row[h] = fromCell(def, h, r[i]);
        });
        return row;
      });
      const loaded = { sheet, header, rows };
      this.cache.set(table, loaded);
      return loaded;
    }
    all(table) {
      return JSON.parse(JSON.stringify(this.load(table).rows));
    }
    upsert(table, row) {
      const L = this.load(table);
      const def = TABLES[table];
      const k = keyOf(table, row);
      const idx = L.rows.findIndex((r) => keyOf(table, r) === k);
      const full = {};
      def.columns.forEach((c) => {
        var _a;
        full[c] = (_a = row[c]) != null ? _a : null;
      });
      this.writeRow(L, def, idx >= 0 ? idx + 2 : L.rows.length + 2, full);
      if (idx >= 0) L.rows[idx] = full;
      else L.rows.push(full);
    }
    append(table, row) {
      const L = this.load(table);
      const def = TABLES[table];
      this.writeRow(L, def, L.rows.length + 2, row);
      L.rows.push(row);
    }
    remove(table, key) {
      const L = this.load(table);
      const k = keyOf(table, key);
      const idx = L.rows.findIndex((r) => keyOf(table, r) === k);
      if (idx < 0) return;
      L.sheet.deleteRow(idx + 2);
      L.rows.splice(idx, 1);
    }
    writeRow(L, def, rowNo, row) {
      const cells = L.header.map((h) => def.columns.includes(h) ? toCell(def, h, row[h]) : "");
      const formats = L.header.map((h) => {
        var _a;
        return ((_a = def.num) == null ? void 0 : _a.includes(h)) ? "0.##" : "@";
      });
      const range = L.sheet.getRange(rowNo, 1, 1, L.header.length);
      range.setNumberFormats([formats]);
      range.setValues([cells]);
    }
    withLock(fn) {
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(25e3)) throw new ApiError("BUSY", "ระบบกำลังบันทึกข้อมูลจากผู้ใช้อื่น กรุณาลองใหม่อีกครั้ง");
      try {
        this.cache.clear();
        const r = fn();
        SpreadsheetApp.flush();
        return r;
      } finally {
        lock.releaseLock();
      }
    }
    getRev() {
      var _a;
      return Number((_a = PropertiesService.getScriptProperties().getProperty("REV")) != null ? _a : "0");
    }
    bumpRev() {
      var _a;
      const props = PropertiesService.getScriptProperties();
      const next = Number((_a = props.getProperty("REV")) != null ? _a : "0") + 1;
      props.setProperty("REV", String(next));
      return next;
    }
  };
  function toCell(def, col, v) {
    var _a, _b, _c;
    if ((_a = def.json) == null ? void 0 : _a.includes(col)) return v === null || v === void 0 ? "" : JSON.stringify(v);
    if ((_b = def.bool) == null ? void 0 : _b.includes(col)) return v ? "TRUE" : "FALSE";
    if (v === null || v === void 0) return "";
    if ((_c = def.num) == null ? void 0 : _c.includes(col)) return Number(v);
    return String(v);
  }
  function fromCell(def, col, v) {
    var _a, _b, _c;
    if (v instanceof Date) return v.toISOString();
    if ((_a = def.json) == null ? void 0 : _a.includes(col)) {
      if (v === "" || v === null) return null;
      try {
        return JSON.parse(String(v));
      } catch (_e) {
        return null;
      }
    }
    if ((_b = def.bool) == null ? void 0 : _b.includes(col)) return v === true || String(v).toUpperCase() === "TRUE";
    if (v === "" || v === null || v === void 0) return null;
    if ((_c = def.num) == null ? void 0 : _c.includes(col)) {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return String(v);
  }

  // server/src/gas/main.ts
  var gasCrypto = {
    sha256Hex(s) {
      return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8).map((b) => ((b + 256) % 256).toString(16).padStart(2, "0")).join("");
    },
    randomToken() {
      return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
    },
    now() {
      return /* @__PURE__ */ new Date();
    }
  };
  function spreadsheet() {
    const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  }
  function ctx() {
    return { store: new SheetStore(spreadsheet()), crypto: gasCrypto };
  }
  function json(o) {
    return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  }
  function publicSnapshotCached(since) {
    const c = ctx();
    const rev = c.store.getRev();
    if (since !== void 0 && since === rev) return JSON.stringify({ ok: true, data: { rev, unchanged: true } });
    const cache = CacheService.getScriptCache();
    const key = "pub:" + rev;
    const hit = cache.get(key);
    if (hit) return hit;
    const out = JSON.stringify(handle({ action: "public.snapshot", payload: {} }, c));
    if (out.length < 95e3) cache.put(key, out, 300);
    return out;
  }
  var raw = (s) => ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
  function doGet(e) {
    var _a, _b;
    const action = (_b = (_a = e == null ? void 0 : e.parameter) == null ? void 0 : _a.action) != null ? _b : "public.snapshot";
    if (action !== "public.snapshot" && action !== "ping") return json({ ok: false, code: "BAD_ACTION", error: "ใช้ POST สำหรับคำสั่งนี้" });
    const since = e.parameter.since !== void 0 ? Number(e.parameter.since) : void 0;
    if (action === "public.snapshot") return raw(publicSnapshotCached(since));
    return json(handle({ action, payload: { since } }, ctx()));
  }
  function doPost(e) {
    var _a, _b, _c, _d, _e;
    let req;
    try {
      req = JSON.parse(e.postData.contents);
    } catch (_err) {
      return json({ ok: false, code: "BAD_REQUEST", error: "รูปแบบคำขอไม่ถูกต้อง" });
    }
    if (req.action === "public.snapshot") return raw(publicSnapshotCached((_b = (_a = req.payload) == null ? void 0 : _a.since) != null ? _b : void 0));
    return json(handle({ action: String((_c = req.action) != null ? _c : ""), token: (_d = req.token) != null ? _d : null, payload: (_e = req.payload) != null ? _e : {} }, ctx()));
  }
  function setup() {
    var _a;
    const c = ctx();
    Object.keys(TABLES).forEach((t) => c.store.ensureSheet(t));
    const props = PropertiesService.getScriptProperties();
    const username = props.getProperty("ADMIN_USERNAME");
    const password = props.getProperty("ADMIN_PASSWORD");
    const res = seedAll(c, username && password ? { username, password, displayName: "Super Admin" } : void 0);
    if (password) props.deleteProperty("ADMIN_PASSWORD");
    const ss = spreadsheet();
    const blank = (_a = ss.getSheetByName("Sheet1")) != null ? _a : ss.getSheetByName("ชีต1");
    if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
    Logger.log(JSON.stringify(res));
    return res;
  }
  function backupNow() {
    const ss = spreadsheet();
    const folderId = PropertiesService.getScriptProperties().getProperty("BACKUP_FOLDER_ID");
    const stamp = Utilities.formatDate(/* @__PURE__ */ new Date(), "Asia/Bangkok", "yyyy-MM-dd_HHmm");
    const file = DriveApp.getFileById(ss.getId());
    const name = `สำรอง ${ss.getName()} ${stamp}`;
    const copy = folderId ? file.makeCopy(name, DriveApp.getFolderById(folderId)) : file.makeCopy(name);
    Logger.log("สำรองข้อมูลแล้ว: " + copy.getUrl());
    return copy.getUrl();
  }
  function installBackupTrigger() {
    ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "backupNow").forEach((t) => ScriptApp.deleteTrigger(t));
    ScriptApp.newTrigger("backupNow").timeBased().everyHours(1).create();
  }
  return __toCommonJS(main_exports);
})();
function doGet(e) { return API.doGet(e); }
function doPost(e) { return API.doPost(e); }
function setup() { return API.setup(); }
function backupNow() { return API.backupNow(); }
function installBackupTrigger() { return API.installBackupTrigger(); }
