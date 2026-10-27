// โครงสร้างชีตใน Google Sheets — แต่ละตารางคือ 1 แท็บ แถวแรกเป็นหัวคอลัมน์
export type TableName =
  | 'Villages' | 'Competitions' | 'Criteria' | 'Assignments' | 'Matches' | 'Scores' | 'JudgeSheets'
  | 'Results' | 'Users' | 'Sessions' | 'Settings' | 'AuditLog';

export interface TableDef {
  name: TableName;
  key: string[];
  columns: string[];
  json?: string[];
  bool?: string[];
  num?: string[];
}

export const TABLES: Record<TableName, TableDef> = {
  Villages: { name: 'Villages', key: ['id'], columns: ['id', 'no', 'name', 'colorName', 'colorHex', 'paradeOrder'], num: ['no', 'paradeOrder'] },
  Competitions: {
    name: 'Competitions', key: ['id'],
    columns: ['id', 'name', 'category', 'format', 'gender', 'countsForCup', 'places', 'prizes', 'status', 'order', 'schedule', 'description', 'eligibleVillageIds', 'matchesPublic', 'judgeMode', 'league', 'version', 'updatedAt'],
    json: ['prizes', 'eligibleVillageIds', 'league'], bool: ['countsForCup', 'matchesPublic'], num: ['places', 'order', 'version'],
  },
  Criteria: {
    name: 'Criteria', key: ['competitionId'],
    columns: ['competitionId', 'items', 'maxTotal', 'aggregation', 'confirmed', 'confirmedBy', 'confirmedAt'],
    json: ['items'], bool: ['confirmed'], num: ['maxTotal'],
  },
  Assignments: { name: 'Assignments', key: ['competitionId'], columns: ['competitionId', 'scorerId', 'judgeIds'], json: ['judgeIds'] },
  Matches: {
    name: 'Matches', key: ['id'],
    columns: ['id', 'competitionId', 'no', 'round', 'group', 'schedule', 'field', 'homeId', 'awayId', 'homeLabel', 'awayLabel', 'homeScore', 'awayScore', 'homePens', 'awayPens', 'status', 'version', 'updatedBy', 'updatedAt'],
    num: ['no', 'homeScore', 'awayScore', 'homePens', 'awayPens', 'version'],
  },
  Scores: {
    name: 'Scores', key: ['competitionId'],
    columns: ['competitionId', 'data', 'version', 'updatedBy', 'updatedAt', 'submittedBy', 'submittedAt', 'reviewNote'],
    json: ['data'], num: ['version'],
  },
  JudgeSheets: { name: 'JudgeSheets', key: ['competitionId', 'judgeId'], columns: ['competitionId', 'judgeId', 'entries', 'version', 'updatedAt'], json: ['entries'], num: ['version'] },
  Results: {
    name: 'Results', key: ['competitionId'],
    columns: ['competitionId', 'summary', 'placements', 'ranking', 'cupPoints', 'countsForCup', 'note', 'tieNote', 'approvedBy', 'approvedAt', 'publishedAt'],
    json: ['placements', 'ranking', 'cupPoints'], bool: ['countsForCup'],
  },
  Users: {
    name: 'Users', key: ['id'],
    columns: ['id', 'username', 'displayName', 'role', 'active', 'mustChangePassword', 'passwordHash', 'salt', 'failedLogins', 'lockedUntil', 'createdAt'],
    bool: ['active', 'mustChangePassword'], num: ['failedLogins'],
  },
  Sessions: { name: 'Sessions', key: ['tokenHash'], columns: ['tokenHash', 'userId', 'expiresAt', 'createdAt'] },
  Settings: { name: 'Settings', key: ['key'], columns: ['key', 'value'], json: ['value'] },
  AuditLog: { name: 'AuditLog', key: ['id'], columns: ['id', 'at', 'userId', 'userName', 'action', 'competitionId', 'detail'] },
};

export type Row = Record<string, unknown>;
