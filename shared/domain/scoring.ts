// การคำนวณคะแนนทั้งหมด (pure functions) — ใช้ทั้งฝั่ง API และหน้าเว็บ, ทดสอบใน tests/domain.test.ts
import type {
  Aggregation, Competition, CriteriaEntries, CriterionItem, CupRow, CupStandings, Match, Placements, RankedEntry, ResultRecord, Settings,
} from './types';

export const CUP_POINTS: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

/* ---------------- เกณฑ์การให้คะแนน ---------------- */

export interface ValidationIssue { field: string; message: string; }

/** ตรวจการตั้งค่าเกณฑ์: ทุกข้อต้องมีคะแนนเต็มเป็นจำนวนบวก และรวมได้เท่าคะแนนเต็มของรายการ */
export function validateCriteriaConfig(items: CriterionItem[], maxTotal: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!items.length) issues.push({ field: 'items', message: 'ต้องมีเกณฑ์อย่างน้อย 1 ข้อ' });
  items.forEach((it, i) => {
    if (!it.label.trim()) issues.push({ field: it.key, message: `เกณฑ์ข้อ ${i + 1} ยังไม่มีชื่อ` });
    if (it.max === null || !Number.isFinite(it.max) || it.max <= 0) issues.push({ field: it.key, message: `เกณฑ์ข้อ ${i + 1} ยังไม่ได้กำหนดคะแนนเต็ม` });
  });
  const sum = items.reduce((s, it) => s + (it.max ?? 0), 0);
  if (!issues.length && Math.abs(sum - maxTotal) > 1e-9) issues.push({ field: 'items', message: `คะแนนเต็มรายข้อรวมได้ ${sum} ต้องเท่ากับ ${maxTotal}` });
  return issues;
}

/** ตรวจคะแนนของหมู่บ้านหนึ่ง: ห้ามติดลบ ห้ามเกินคะแนนเต็ม และ (ถ้า requireComplete) ต้องครบทุกข้อ */
export function validateEntry(items: CriterionItem[], entry: Record<string, number | null> | undefined, requireComplete: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  items.forEach((it, i) => {
    const v = entry?.[it.key];
    if (v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))) {
      if (requireComplete) issues.push({ field: it.key, message: `ข้อ ${i + 1} ยังไม่ได้กรอก` });
      return;
    }
    if (typeof v !== 'number') { issues.push({ field: it.key, message: `ข้อ ${i + 1} ต้องเป็นตัวเลข` }); return; }
    if (v < 0) issues.push({ field: it.key, message: `ข้อ ${i + 1} ติดลบไม่ได้` });
    if (it.max !== null && v > it.max) issues.push({ field: it.key, message: `ข้อ ${i + 1} เกินคะแนนเต็ม ${it.max}` });
  });
  return issues;
}

export function entryTotal(items: CriterionItem[], entry: Record<string, number | null> | undefined): { total: number; complete: boolean } {
  let total = 0; let complete = true;
  for (const it of items) {
    const v = entry?.[it.key];
    if (typeof v === 'number' && Number.isFinite(v)) total += v; else complete = false;
  }
  return { total: round2(total), complete };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** รวมคะแนนจากใบคะแนนกรรมการ (เฉพาะใบที่กรอกครบสำหรับหมู่บ้านนั้น) */
export function aggregatePanel(items: CriterionItem[], sheets: CriteriaEntries[], villageIds: string[], method: Aggregation): Record<string, { total: number; judges: number }> {
  const out: Record<string, { total: number; judges: number }> = {};
  for (const vid of villageIds) {
    const totals = sheets.map((s) => entryTotal(items, s[vid])).filter((t) => t.complete).map((t) => t.total);
    const sum = totals.reduce((a, b) => a + b, 0);
    out[vid] = { total: totals.length ? round2(method === 'average' ? sum / totals.length : sum) : 0, judges: totals.length };
  }
  return out;
}

/** จัดอันดับจากคะแนนรวมมากไปน้อย คะแนนเท่ากันได้อันดับร่วม (1,1,3) — ไม่ตัดสินเสมอเอง */
export function rankTotals(totals: Record<string, number>, complete: Record<string, boolean> = {}): RankedEntry[] {
  const list = Object.entries(totals).map(([villageId, total]) => ({ villageId, total, complete: complete[villageId] ?? true }));
  list.sort((a, b) => b.total - a.total || a.villageId.localeCompare(b.villageId, 'en', { numeric: true }));
  const out: RankedEntry[] = [];
  list.forEach((x, i) => {
    const rank = i > 0 && list[i - 1].total === x.total ? out[i - 1].rank : i + 1;
    out.push({ ...x, rank, tied: false });
  });
  out.forEach((x) => { x.tied = out.filter((y) => y.rank === x.rank).length > 1; });
  return out;
}

/** หาว่ามีคะแนนเท่ากันในตำแหน่งที่ได้รางวัลหรือไม่ (ต้องให้คนตัดสินเอง) */
export function tiesWithinPlaces(ranking: RankedEntry[], places: number): string[][] {
  const groups: Record<number, string[]> = {};
  ranking.forEach((r) => { if (r.tied && r.rank <= places) (groups[r.rank] ||= []).push(r.villageId); });
  return Object.values(groups);
}

/** อันดับที่ระบบเสนอจากคะแนน (ถ้ามีคะแนนเท่ากันในตำแหน่งรางวัล คืน null ในตำแหน่งนั้น) */
export function suggestedPlacements(ranking: RankedEntry[], places: number): Placements {
  const p: Placements = {};
  for (let i = 1; i <= places; i++) {
    const r = ranking[i - 1];
    p[String(i)] = r && !r.tied ? r.villageId : null;
  }
  return p;
}

/** ตรวจอันดับ: ไม่ซ้ำ อยู่ในรายชื่อผู้มีสิทธิ์ และครบ (ถ้า requireComplete) */
export function validatePlacements(p: Placements, places: number, eligible: string[], requireComplete: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const need = Math.min(places, eligible.length);
  for (let i = 1; i <= places; i++) {
    const v = p[String(i)];
    if (!v) { if (requireComplete && i <= need) issues.push({ field: String(i), message: `ยังไม่ได้เลือกอันดับที่ ${i}` }); continue; }
    if (!eligible.includes(v)) issues.push({ field: String(i), message: `อันดับที่ ${i}: หมู่บ้านนี้ไม่มีสิทธิ์ในรายการนี้` });
    if (seen.has(v)) issues.push({ field: String(i), message: `อันดับที่ ${i}: เลือกหมู่บ้านซ้ำ` });
    seen.add(v);
  }
  return issues;
}

/** อันดับต้องสอดคล้องกับคะแนน (คะแนนน้อยกว่าห้ามอยู่อันดับดีกว่า) */
export function placementsConsistent(p: Placements, ranking: RankedEntry[]): ValidationIssue[] {
  const total = Object.fromEntries(ranking.map((r) => [r.villageId, r.total]));
  const issues: ValidationIssue[] = [];
  const keys = Object.keys(p).map(Number).sort((a, b) => a - b);
  for (let i = 1; i < keys.length; i++) {
    const a = p[String(keys[i - 1])], b = p[String(keys[i])];
    if (a && b && total[a] !== undefined && total[b] !== undefined && total[a] < total[b]) {
      issues.push({ field: String(keys[i]), message: `อันดับที่ ${keys[i - 1]} มีคะแนนน้อยกว่าอันดับที่ ${keys[i]}` });
    }
  }
  // ผู้ที่ไม่ได้อยู่ในอันดับต้องไม่มีคะแนนสูงกว่าคนที่ได้อันดับสุดท้าย
  const placed = keys.map((k) => p[String(k)]).filter(Boolean) as string[];
  if (placed.length) {
    const minPlaced = Math.min(...placed.map((v) => total[v] ?? Infinity));
    const outranked = ranking.find((r) => !placed.includes(r.villageId) && r.total > minPlaced);
    if (outranked) issues.push({ field: 'placements', message: 'มีหมู่บ้านที่ไม่ได้อันดับแต่คะแนนสูงกว่าผู้ได้อันดับ' });
  }
  return issues;
}

export function cupPointsFor(p: Placements): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [place, vid] of Object.entries(p)) {
    const pts = CUP_POINTS[Number(place)];
    if (vid && pts) out[vid] = (out[vid] ?? 0) + pts;
  }
  return out;
}

/* ---------------- ถ้วยคะแนนรวม ---------------- */

/**
 * คะแนนถ้วยรวม = ผลรวมคะแนนอันดับจากรายการที่นับถ้วยรวมและอยู่ในชุด results ที่ส่งเข้ามา
 * (ฝั่ง API ส่งเฉพาะผลที่อนุมัติแล้ว หรือเฉพาะที่ประกาศแล้วสำหรับหน้าสาธารณะ)
 */
export function computeCup(results: ResultRecord[], villageIds: string[], competitions: Competition[], settings: Pick<Settings, 'tieRule' | 'tieManualOrder'>): CupStandings {
  const cupComps = competitions.filter((c) => c.countsForCup);
  const cupIds = new Set(cupComps.map((c) => c.id));
  const rows: Record<string, CupRow> = {};
  villageIds.forEach((id) => { rows[id] = { villageId: id, points: 0, golds: 0, silvers: 0, bronzes: 0, rank: 0, tied: false, breakdown: [] }; });
  let counted = 0;
  for (const r of results) {
    if (!cupIds.has(r.competitionId) || !r.countsForCup) continue;
    counted++;
    for (const [place, vid] of Object.entries(r.placements)) {
      const pts = CUP_POINTS[Number(place)];
      if (!vid || !pts || !rows[vid]) continue;
      const row = rows[vid];
      row.points += pts;
      if (place === '1') row.golds++; else if (place === '2') row.silvers++; else if (place === '3') row.bronzes++;
      row.breakdown.push({ competitionId: r.competitionId, place: Number(place), points: pts });
    }
  }
  const list = Object.values(rows);
  const rule = settings.tieRule;
  const manualIdx = (id: string) => { const i = settings.tieManualOrder.indexOf(id); return i < 0 ? 999 : i; };
  const key = (x: CupRow) => (rule === 'countback' ? [x.points, x.golds, x.silvers, x.bronzes] : [x.points]);
  list.sort((a, b) => {
    const ka = key(a), kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    if (rule === 'manual') return manualIdx(a.villageId) - manualIdx(b.villageId);
    return villageIds.indexOf(a.villageId) - villageIds.indexOf(b.villageId);
  });
  let tieUnresolved = false;
  list.forEach((x, i) => {
    if (i === 0) { x.rank = 1; return; }
    const prev = list[i - 1];
    const same = key(prev).every((v, k) => v === key(x)[k]);
    const manualSplit = rule === 'manual' && manualIdx(prev.villageId) !== manualIdx(x.villageId);
    x.rank = same && !manualSplit ? prev.rank : i + 1;
  });
  list.forEach((x) => {
    const group = list.filter((y) => y.rank === x.rank);
    x.tied = group.length > 1;
    if (x.tied && x.points > 0 && (rule === 'unconfirmed')) tieUnresolved = true;
  });
  return { rows: list, countedResults: counted, totalCupEvents: cupComps.length, tieRule: rule, tieUnresolved };
}

/* ---------------- ตารางคะแนนแบบพบกันหมด ---------------- */

export interface LeagueRow { villageId: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number; rank: number; tied: boolean; }

/** ตารางคะแนนในสาย — ตามสูจิบัตร คะแนนเท่ากันตัดสินด้วยการจับฉลาก (tieOrder) ไม่ใช้ประตูได้เสีย */
export function leagueTable(matches: Match[], teams: string[], pts: { win: number; draw: number; loss: number }, tieOrder: string[] = []): LeagueRow[] {
  const rows: Record<string, LeagueRow> = {};
  teams.forEach((t) => { rows[t] = { villageId: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, rank: 0, tied: false }; });
  for (const mt of matches) {
    if (mt.status !== 'played' || mt.homeScore === null || mt.awayScore === null || !mt.homeId || !mt.awayId) continue;
    const h = rows[mt.homeId], a = rows[mt.awayId];
    if (!h || !a) continue;
    h.played++; a.played++; h.gf += mt.homeScore; h.ga += mt.awayScore; a.gf += mt.awayScore; a.ga += mt.homeScore;
    if (mt.homeScore > mt.awayScore) { h.won++; a.lost++; h.points += pts.win; a.points += pts.loss; }
    else if (mt.homeScore < mt.awayScore) { a.won++; h.lost++; a.points += pts.win; h.points += pts.loss; }
    else { h.drawn++; a.drawn++; h.points += pts.draw; a.points += pts.draw; }
  }
  const idx = (id: string) => { const i = tieOrder.indexOf(id); return i < 0 ? 999 : i; };
  const list = Object.values(rows).sort((x, y) => y.points - x.points || idx(x.villageId) - idx(y.villageId) || teams.indexOf(x.villageId) - teams.indexOf(y.villageId));
  list.forEach((x, i) => {
    const prev = list[i - 1];
    x.rank = prev && prev.points === x.points && idx(prev.villageId) === idx(x.villageId) ? prev.rank : i + 1;
  });
  list.forEach((x) => { x.tied = list.filter((y) => y.rank === x.rank).length > 1; });
  return list;
}

/** ผู้ชนะของนัด (รวมยิงจุดโทษเมื่อเสมอ) */
export function matchWinner(mt: Match): string | null {
  if (mt.status !== 'played' || mt.homeScore === null || mt.awayScore === null) return null;
  if (mt.homeScore > mt.awayScore) return mt.homeId;
  if (mt.homeScore < mt.awayScore) return mt.awayId;
  if (mt.homePens !== null && mt.awayPens !== null && mt.homePens !== mt.awayPens) return mt.homePens > mt.awayPens ? mt.homeId : mt.awayId;
  return null;
}

/** อันดับ 1–4 ที่เสนอจากนัดชิงชนะเลิศและชิงที่ 3 */
export function knockoutPlacements(matches: Match[], places: number): Placements {
  const p: Placements = {};
  for (let i = 1; i <= places; i++) p[String(i)] = null;
  const fin = matches.find((x) => x.round === 'final');
  const third = matches.find((x) => x.round === 'third');
  if (fin) { const w = matchWinner(fin); if (w) { p['1'] = w; p['2'] = w === fin.homeId ? fin.awayId : fin.homeId; } }
  if (third) { const w = matchWinner(third); if (w) { p['3'] = w; if (places >= 4) p['4'] = w === third.homeId ? third.awayId : third.homeId; } }
  return p;
}

/** คำนวณ ranking ของรายการประกวดจากข้อมูลคะแนน */
export function contestRanking(items: CriterionItem[], villageIds: string[], mode: 'single' | 'panel', entries: CriteriaEntries | undefined, sheets: CriteriaEntries[], aggregation: Aggregation | null): RankedEntry[] {
  if (mode === 'panel') {
    const agg = aggregatePanel(items, sheets, villageIds, aggregation ?? 'average');
    const ranked = rankTotals(Object.fromEntries(villageIds.map((v) => [v, agg[v].total])), Object.fromEntries(villageIds.map((v) => [v, agg[v].judges > 0])));
    return ranked.map((r) => ({ ...r, judges: agg[r.villageId].judges }));
  }
  const totals: Record<string, number> = {}; const complete: Record<string, boolean> = {};
  villageIds.forEach((v) => { const t = entryTotal(items, entries?.[v]); totals[v] = t.total; complete[v] = t.complete; });
  return rankTotals(totals, complete);
}
