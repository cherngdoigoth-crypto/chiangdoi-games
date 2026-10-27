import type {
  Assignment, AuditEntry, Competition, CriteriaConfig, CupStandings, JudgeSheet, Match, PublicUser, ResultRecord, Role, ScoreRecord, Settings, Village,
} from '@domain';

export interface PublicSnapshot {
  rev: number;
  serverTime: string;
  settings: Pick<Settings, 'cupVisible' | 'tieRule' | 'tieRuleConfirmed' | 'eventName'>;
  villages: Village[];
  competitions: Competition[];
  criteria: CriteriaConfig[];
  results: ResultRecord[];
  matches: Match[];
  cup: CupStandings | null;
}

export interface StaffUser { id: string; displayName: string; role: Role; active: boolean; username?: string; mustChangePassword?: boolean; }

export interface StaffSnapshot {
  rev: number;
  serverTime: string;
  me: PublicUser;
  settings: Settings;
  villages: Village[];
  competitions: Competition[];
  criteria: CriteriaConfig[];
  assignments: Assignment[];
  matches: Match[];
  scores: ScoreRecord[];
  sheets: JudgeSheet[];
  results: ResultRecord[];
  cupInternal: CupStandings;
  cupPublic: CupStandings;
  users: StaffUser[];
  audit: AuditEntry[];
}
