// ข้อมูลตั้งต้นจากสูจิบัตรเชิงดอยเกมส์ ครั้งที่ 26 — ดู docs/ANALYSIS.md
import type { Competition, CriteriaConfig, Match, Settings, Village } from './types';

export const VILLAGES: Village[] = [
  { id: 'm1', no: 1, name: 'บ้านแม่ดอกแดง', colorName: 'สีเหลือง', colorHex: '#FFE600', paradeOrder: 1 },
  { id: 'm2', no: 2, name: 'บ้านโพธิ์ทองเจริญ', colorName: 'สีแดง', colorHex: '#FF1A1A', paradeOrder: 8 },
  { id: 'm5', no: 5, name: 'บ้านเกาะ', colorName: 'สีชมพู', colorHex: '#FF3399', paradeOrder: 10 },
  { id: 'm6', no: 6, name: 'บ้านสันอุ้ม', colorName: 'สีเทา', colorHex: '#BFBFBF', paradeOrder: 2 },
  { id: 'm7', no: 7, name: 'บ้านร้องขี้เหล็ก', colorName: 'สีฟ้า', colorHex: '#00B0F0', paradeOrder: 6 },
  { id: 'm9', no: 9, name: 'บ้านป่าสักน้อย', colorName: 'สีม่วง', colorHex: '#7030A0', paradeOrder: 5 },
  { id: 'm10', no: 10, name: 'บ้านป่าไผ่ศรีโขง', colorName: 'สีแดงเลือดหมู', colorHex: '#B80000', paradeOrder: 4 },
  { id: 'm11', no: 11, name: 'บ้านกิ่วแล', colorName: 'สีน้ำเงินกรมท่า', colorHex: '#1F4E79', paradeOrder: 3 },
  { id: 'm12', no: 12, name: 'บ้านปทุมนิเวศน์', colorName: 'สีน้ำเงิน', colorHex: '#0070C0', paradeOrder: 7 },
  { id: 'm13', no: 13, name: 'บ้านหนองบัวพัฒนา', colorName: 'สีส้ม', colorHex: '#FF6600', paradeOrder: 9 },
];
const ALL = VILLAGES.map((v) => v.id);

const base = (c: Partial<Competition> & Pick<Competition, 'id' | 'name' | 'category' | 'format' | 'order'>): Competition => ({
  gender: null, countsForCup: false, places: 3, prizes: [], status: 'draft', schedule: '', description: '',
  eligibleVillageIds: ALL, matchesPublic: false, judgeMode: 'single', league: null, version: 1, updatedAt: '', ...c,
});

const FOLK: { key: string; name: string; note: string; prizes: number[]; t: [string, string] }[] = [
  { key: 'kick', name: 'เตะปี๊บ', note: 'อายุ 50 ปีขึ้นไป ผู้เล่น 1 คน', prizes: [400, 300, 200], t: ['10.00', '10.15'] },
  { key: 'ball', name: 'แยกบอลสี', note: 'อายุ 50 ปีขึ้นไป ผู้เล่น 1 คน', prizes: [400, 300, 200], t: ['10.50', '10.55'] },
  { key: 'boat', name: 'เรือบก', note: 'ไม่จำกัดอายุ ผู้เล่น 8 คน', prizes: [1000, 800, 500], t: ['11.20', '11.25'] },
  { key: 'wheel', name: 'วิ่งวงล้อ', note: 'ไม่จำกัดอายุ ผู้เล่น 4 คน', prizes: [800, 600, 400], t: ['11.50', '11.55'] },
  { key: 'hoop', name: 'วิ่งในห่วง', note: 'ไม่จำกัดอายุ ผู้เล่น 4 คน', prizes: [800, 600, 400], t: ['13.20', '13.25'] },
  { key: 'giant', name: 'เตะลูกบอลยักษ์', note: 'ไม่จำกัดอายุ ผู้เล่น 4 คน', prizes: [800, 600, 400], t: ['13.50', '13.55'] },
];

export function seedCompetitions(): Competition[] {
  const list: Competition[] = [];
  let order = 1;
  list.push(base({
    id: 'football7', name: 'ฟุตบอล 7 คน', category: 'sport', format: 'league', order: order++, places: 4,
    prizes: [4000, 2000, 1500, 1000], schedule: 'ส. 7 พ.ย. 08.00 น. · ชิงชนะเลิศ อา. 8 พ.ย. 15.00 น.',
    description: 'ครึ่งละ 15 นาที รอบแรกคะแนนเท่ากันตัดสินโดยการจับฉลาก (ไม่นับประตูได้เสีย) รอบรอง/ชิงที่ 3/ชิงชนะเลิศ เสมอยิงลูกจุดโทษ',
    eligibleVillageIds: ALL.filter((v) => v !== 'm5'), gender: 'male',
    league: { win: 3, draw: 1, loss: 0, advance: 2, groups: { A: ['m10', 'm6', 'm11', 'm7', 'm1'], B: ['m12', 'm13', 'm2', 'm9'] } },
  }));
  list.push(base({
    id: 'petanque', name: 'เปตองคู่ผสม (ชาย-หญิง)', category: 'sport', format: 'league', order: order++, places: 4,
    prizes: [2000, 1500, 1000, 500], schedule: 'ส. 7 พ.ย. 09.00 น. · ชิงชนะเลิศ 12.00 น.', gender: 'mixed',
    description: 'ทีมละ 2 คน (ชาย 1 หญิง 1) แข่ง 1 เซต ถึง 13 แต้มก่อนชนะ',
    league: { win: 1, draw: 0, loss: 0, advance: 2, groups: { A: ['m11', 'm12', 'm1', 'm6', 'm5'], B: ['m7', 'm10', 'm9', 'm2', 'm13'] } },
  }));
  FOLK.forEach((f) => {
    (['male', 'female'] as const).forEach((g, i) => {
      list.push(base({
        id: `${f.key}_${g === 'male' ? 'm' : 'f'}`, name: `${f.name} ${g === 'male' ? 'ชาย' : 'หญิง'}`,
        category: 'folk', format: 'placement', order: order++, gender: g, countsForCup: true,
        prizes: f.prizes, schedule: `อา. 8 พ.ย. รอบชิง ${f.t[i]} น.`, description: f.note,
      }));
    });
  });
  list.push(base({
    id: 'penalty', name: 'ยิงลูกโทษ', category: 'sport', format: 'knockout', order: order++, countsForCup: true,
    prizes: [1000, 800, 500], schedule: 'อา. 8 พ.ย. 14.00–14.54 น.', gender: 'mixed',
    description: 'ทีมละ 4 คน ผู้รักษาประตูต้องเป็นชาย ยิงทีมละ 3 ลูก เสมอยิงซัดเดนเดธ',
  }));
  list.push(base({ id: 'parade', name: 'ประกวดขบวนพาเหรด', category: 'contest', format: 'criteria', order: order++, judgeMode: 'panel',
    prizes: [1000, 800, 500], schedule: 'อา. 8 พ.ย. ตั้งขบวน 08.00 น.', description: 'ผู้เข้าร่วมขบวนไม่น้อยกว่า 50 คน แต่งกายฟรีสไตล์' }));
  list.push(base({ id: 'tent', name: 'ประกวดตกแต่งเต็นท์', category: 'contest', format: 'criteria', order: order++,
    prizes: [1000, 800, 500], schedule: '7–8 พ.ย.', description: 'ไม่อนุญาตเครื่องเสียงในเต็นท์ ลำดับเต็นท์ตามขบวนพาเหรด' }));
  list.push(base({ id: 'sign', name: 'ประกวดผู้ถือป้ายหมู่บ้าน', category: 'contest', format: 'criteria', order: order++,
    prizes: [1000, 800, 500], schedule: 'มอบรางวัล อา. 8 พ.ย. 09.20 น.', description: 'เพศหญิง ไม่จำกัดอายุ มีภูมิลำเนาในหมู่บ้าน · ชมเชย 7 รางวัล รางวัลละ 300 บาท' }));
  list.push(base({ id: 'dance', name: 'แข่งขันเต้นประกอบเพลง', category: 'contest', format: 'criteria', order: order++,
    prizes: [2000, 1500, 1000], schedule: 'รอบแรก 09.45 น. · รอบสอง 13.30 น.', description: 'ทีมละไม่ต่ำกว่า 8 คน เพลง "ผู้บ่าวเสื้อปุ้ย" และ "บังเอิญมันได้อ่ะ"' }));
  return list;
}

const C = (labels: string[]) => labels.map((label, i) => ({ key: `c${i + 1}`, label, max: null }));
export const CRITERIA_LABELS: Record<string, string[]> = {
  parade: ['การรักษาเวลาและเป็นระเบียบในการตั้งขบวน', 'ความสวยงามของขบวน การจัดรูปแบบของขบวนพาเหรด', 'ความคิดริเริ่มสร้างสรรค์ (หลากหลาย, แปลกใหม่, จินตนาการ)', 'ความพร้อมเพรียง เป็นระเบียบในขณะเคลื่อนขบวน', 'จำนวนผู้เข้าร่วมขบวน'],
  tent: ['ความสวยงามและความคิดสร้างสรรค์', 'ความเป็นเอกลักษณ์ของสีประจำทีม', 'ความสะอาดและความเรียบร้อย', 'การมีส่วนร่วมของสมาชิกสี', 'วัสดุ อุปกรณ์ที่ใช้'],
  sign: ['ความสวยงาม (ใบหน้า ผิวพรรณ)', 'การแต่งกาย สวยงาม เหมาะสม สวมเสื้อกีฬาหมู่บ้าน/กระโปรงสั้น', 'ท่วงท่าการเดิน การยิ้ม บุคลิกภาพ', 'สัดส่วน (น้ำหนัก ส่วนสูง อก เอว สะโพก)', 'สุขภาพแข็งแรง ร่าเริง สดใส'],
  dance: ['มีนักกีฬาเต้นประกอบเพลงอย่างน้อย 8 คนขึ้นไป', 'การแต่งกาย ความสวยงามและความเหมาะสม', 'ลีลา ท่าทาง ความสนุกสนาน', 'ความพร้อมเพรียงของทีม', 'การแสดงสีหน้า และการมีส่วนร่วม'],
};
export function seedCriteria(): CriteriaConfig[] {
  return Object.entries(CRITERIA_LABELS).map(([competitionId, labels]) => ({
    competitionId, items: C(labels), maxTotal: 50, aggregation: null, confirmed: false, confirmedBy: null, confirmedAt: null,
  }));
}

const m = (competitionId: string, no: number, round: Match['round'], group: string | null, schedule: string, field: string,
  home: string, away: string): Match => {
  const isId = (s: string) => /^m\d+$/.test(s);
  return {
    id: `${competitionId}-${no}`, competitionId, no, round, group, schedule, field,
    homeId: isId(home) ? home : null, awayId: isId(away) ? away : null,
    homeLabel: isId(home) ? '' : home, awayLabel: isId(away) ? '' : away,
    homeScore: null, awayScore: null, homePens: null, awayPens: null, status: 'scheduled', version: 1, updatedBy: null, updatedAt: null,
  };
};

export function seedMatches(): Match[] {
  const fb: [string, string, string, string][] = [
    ['08.00', 'A', 'm10', 'm6'], ['08.40', 'B', 'm12', 'm13'], ['09.20', 'A', 'm11', 'm7'], ['10.00', 'B', 'm2', 'm9'],
    ['10.40', 'A', 'm10', 'm1'], ['11.20', 'A', 'm6', 'm11'], ['12.00', 'B', 'm13', 'm2'], ['12.40', 'A', 'm7', 'm1'],
    ['13.20', 'A', 'm10', 'm11'], ['14.00', 'B', 'm12', 'm2'], ['14.40', 'A', 'm6', 'm7'], ['15.20', 'B', 'm13', 'm9'],
    ['16.00', 'A', 'm11', 'm1'], ['16.40', 'A', 'm10', 'm7'], ['17.20', 'B', 'm12', 'm9'], ['18.00', 'A', 'm6', 'm1'],
  ];
  const out: Match[] = fb.map(([t, g, h, a], i) => m('football7', i + 1, 'group', g, `ส. 7 พ.ย. ${t} น.`, '', h, a));
  out.push(m('football7', 17, 'semi', null, 'ส. 7 พ.ย. 18.40 น.', '', 'ที่ 1 สาย A', 'ที่ 2 สาย B'));
  out.push(m('football7', 18, 'semi', null, 'ส. 7 พ.ย. 19.20 น.', '', 'ที่ 1 สาย B', 'ที่ 2 สาย A'));
  out.push(m('football7', 19, 'third', null, 'ส. 7 พ.ย. 20.00 น.', '', 'ทีมแพ้คู่ที่ 17', 'ทีมแพ้คู่ที่ 18'));
  out.push(m('football7', 20, 'final', null, 'อา. 8 พ.ย. 15.00 น.', '', 'ทีมชนะคู่ที่ 17', 'ทีมชนะคู่ที่ 18'));

  const pt: [string, string, string, string, string][] = [
    ['9.00', 'A', 'm11', 'm12', '1'], ['9.00', 'B', 'm7', 'm10', '2'], ['9.00', 'A', 'm1', 'm6', '3'], ['9.00', 'B', 'm9', 'm2', '4'],
    ['9.30', 'A', 'm11', 'm5', '1'], ['9.30', 'B', 'm7', 'm13', '2'], ['9.30', 'A', 'm12', 'm1', '3'], ['9.30', 'B', 'm10', 'm9', '4'],
    ['10.00', 'A', 'm6', 'm5', '1'], ['10.00', 'B', 'm2', 'm13', '2'], ['10.00', 'A', 'm11', 'm1', '3'], ['10.00', 'B', 'm7', 'm9', '4'],
    ['10.30', 'A', 'm12', 'm6', '1'], ['10.30', 'B', 'm10', 'm2', '2'], ['10.30', 'A', 'm1', 'm5', '3'], ['10.30', 'B', 'm9', 'm13', '4'],
    ['11.00', 'A', 'm11', 'm6', '1'], ['11.00', 'B', 'm7', 'm2', '2'], ['11.00', 'A', 'm12', 'm5', '3'], ['11.00', 'B', 'm10', 'm13', '4'],
  ];
  pt.forEach(([t, g, h, a, f], i) => out.push(m('petanque', i + 1, 'group', g, `ส. 7 พ.ย. ${t} น.`, `สนาม ${f}`, h, a)));
  out.push(m('petanque', 21, 'semi', null, 'ส. 7 พ.ย. 11.30 น.', 'สนาม 1', 'ที่ 1 สาย A', 'ที่ 2 สาย B'));
  out.push(m('petanque', 22, 'semi', null, 'ส. 7 พ.ย. 11.30 น.', 'สนาม 2', 'ที่ 1 สาย B', 'ที่ 2 สาย A'));
  out.push(m('petanque', 23, 'third', null, 'ส. 7 พ.ย. 12.00 น.', 'สนาม 1', 'ทีมแพ้คู่ที่ 21', 'ทีมแพ้คู่ที่ 22'));
  out.push(m('petanque', 24, 'final', null, 'ส. 7 พ.ย. 12.00 น.', 'สนาม 2', 'ทีมชนะคู่ที่ 21', 'ทีมชนะคู่ที่ 22'));

  const pk: [string, string, string][] = [['14.00', 'm5', 'm1'], ['14.06', 'm11', 'm6'], ['14.12', 'm13', 'm12'], ['14.18', 'm7', 'm9'], ['14.24', 'm10', 'm2']];
  pk.forEach(([t, h, a], i) => out.push(m('penalty', 34 + i, 'r1', null, `อา. 8 พ.ย. ${t} น.`, '', h, a)));
  return out;
}

export const DEFAULT_SETTINGS: Settings = {
  cupVisible: false, autoPublishOnApprove: false, tieRule: 'unconfirmed', tieRuleConfirmed: false, tieManualOrder: [],
  eventName: 'เชิงดอยเกมส์ ครั้งที่ 26 ประจำปีงบประมาณ 2570',
};
