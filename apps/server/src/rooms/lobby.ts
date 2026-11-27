import {
  botName, dedupeName, MAX_PLAYERS, normalizeName,
} from '@te-nuoc/shared';
import type { ErrorCode, RosterEntry, Team } from '@te-nuoc/shared';

export interface LobbyMember {
  sessionId: string; slot: number; username: string; name: string; team: Team; variant: number;
  joinOrder: number; ready: boolean; connected: boolean;
}

export interface LobbySettings { teamSize: 4 | 5; scoreToWin: 5 | 10 | 15; botFill: boolean }
export interface NamedRosterEntry extends RosterEntry { name: string }
export type LobbyPhase = 'lobby' | 'starting' | 'match';

export function publicCanStart(humans: number): boolean { return humans === MAX_PLAYERS; }

function clampVariant(variant: unknown): number | null {
  return typeof variant === 'number' && Number.isInteger(variant) && variant >= 0 && variant < 5 ? variant : null;
}

export class LobbyModel {
  hostId: string | null = null;
  members: LobbyMember[] = [];
  settings: LobbySettings;
  phase: LobbyPhase = 'lobby';
  private nextJoinOrder = 0;
  private activeRoster: NamedRosterEntry[] = [];
  private readonly preferredVariants = new Map<string, number>();

  constructor(readonly mode: 'public' | 'private') {
    this.settings = { teamSize: 5, scoreToWin: 10, botFill: mode === 'private' };
  }

  private firstFreeSlot(): number {
    for (let slot = 0; slot < MAX_PLAYERS; slot++) {
      if (!this.members.some((member) => member.slot === slot)) return slot;
    }
    throw new Error('full');
  }

  private firstFreeVariant(team: Team, preferred?: number | null): number {
    if (preferred !== undefined && preferred !== null && preferred >= 0 && preferred < 5) {
      if (!this.members.some((member) => member.team === team && member.variant === preferred)) return preferred;
    }
    for (let variant = 0; variant < 5; variant++) {
      if (!this.members.some((member) => member.team === team && member.variant === variant)) return variant;
    }
    return preferred ?? 0;
  }

  private counts(): [number, number] {
    return [this.members.filter((member) => member.team === 0).length, this.members.filter((member) => member.team === 1).length];
  }

  join(sessionId: string, rawName: string, preferredVariant?: unknown, rawUsername?: unknown): LobbyMember {
    if (this.members.some((member) => member.sessionId === sessionId)) throw new Error('bad_request');
    const normalized = normalizeName(rawName);
    if (!normalized) throw new Error('bad_request');
    const normalizedUsername = normalizeName(rawUsername) ?? normalized;
    const counts = this.counts();
    const preferred: Team = counts[0] <= counts[1] ? 0 : 1;
    const team: Team = counts[preferred] < this.settings.teamSize ? preferred : preferred === 0 ? 1 : 0;
    if (counts[team] >= this.settings.teamSize) throw new Error('full');
    const chosenVariant = clampVariant(preferredVariant);
    if (chosenVariant !== null) this.preferredVariants.set(sessionId, chosenVariant);
    const member: LobbyMember = {
      sessionId, slot: this.firstFreeSlot(),
      username: normalizedUsername,
      name: dedupeName(normalized, this.members.map((existing) => existing.name)),
      team, variant: chosenVariant ?? this.firstFreeVariant(team), joinOrder: this.nextJoinOrder++,
      ready: false, connected: true,
    };
    this.members.push(member);
    if (this.mode === 'private' && this.hostId === null) this.hostId = sessionId;
    return member;
  }

  leave(sessionId: string): void {
    this.preferredVariants.delete(sessionId);
    this.members = this.members.filter((member) => member.sessionId !== sessionId);
    if (this.hostId === sessionId) {
      const earliest = [...this.members].sort((a, b) => a.joinOrder - b.joinOrder)[0];
      this.hostId = earliest?.sessionId ?? null;
    }
  }

  setTeam(sessionId: string, team: Team): ErrorCode | null {
    if (this.mode !== 'private' || this.phase !== 'lobby') return 'bad_request';
    if (team !== 0 && team !== 1) return 'bad_request';
    const member = this.members.find((candidate) => candidate.sessionId === sessionId);
    if (!member) return 'bad_request';
    if (member.team === team) return null;
    if (this.counts()[team] >= this.settings.teamSize) return 'full';
    const pref = this.preferredVariants.get(sessionId);
    member.variant = pref ?? this.firstFreeVariant(team);
    member.team = team;
    return null;
  }

  setSettings(sessionId: string, settings: Partial<LobbySettings>): ErrorCode | null {
    if (this.mode !== 'private' || sessionId !== this.hostId) return 'not_host';
    if (this.phase !== 'lobby') return 'bad_request';
    if (settings.teamSize !== undefined && settings.teamSize !== 4 && settings.teamSize !== 5) return 'bad_request';
    if (settings.scoreToWin !== undefined && settings.scoreToWin !== 5 && settings.scoreToWin !== 10 && settings.scoreToWin !== 15) return 'bad_request';
    if (settings.botFill !== undefined && typeof settings.botFill !== 'boolean') return 'bad_request';
    if (settings.teamSize === 4 && this.counts().some((count) => count > 4)) return 'bad_request';
    this.settings = { ...this.settings, ...settings };
    return null;
  }

  shuffle(sessionId: string, rng: () => number): ErrorCode | null {
    if (this.mode !== 'private' || sessionId !== this.hostId) return 'not_host';
    if (this.phase !== 'lobby') return 'bad_request';
    const shuffled = [...this.members];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.max(0, Math.min(i, Math.floor(rng() * (i + 1))));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const variants: [number, number] = [0, 0];
    shuffled.forEach((member, index) => {
      const team: Team = index % 2 === 0 ? 0 : 1;
      member.team = team;
      member.variant = this.preferredVariants.get(member.sessionId) ?? variants[team]++;
      member.ready = false;
    });
    return null;
  }

  canHostStart(sessionId: string): ErrorCode | null {
    if (this.mode !== 'private' || sessionId !== this.hostId) return 'not_host';
    if (this.phase !== 'lobby') return 'bad_request';
    const counts = this.counts();
    if (!this.settings.botFill && (counts[0] === 0 || counts[1] === 0)) return 'bad_request';
    return null;
  }

  buildRoster(): NamedRosterEntry[] {
    const roster: NamedRosterEntry[] = this.members.map((member) => ({
      slot: member.slot, team: member.team, variant: member.variant, isBot: false,
      joinOrder: member.joinOrder, name: member.name,
    }));
    if (this.settings.botFill) {
      const taken = roster.map((entry) => entry.name);
      for (const team of [0, 1] as const) {
        let teamCount = roster.filter((entry) => entry.team === team).length;
        for (let variant = 0; variant < 5 && teamCount < this.settings.teamSize; variant++) {
          if (roster.some((entry) => entry.team === team && entry.variant === variant)) continue;
          const name = botName(taken);
          taken.push(name);
          let slot = 0;
          while (roster.some((entry) => entry.slot === slot)) slot++;
          roster.push({ slot, team, variant, isBot: true, joinOrder: this.nextJoinOrder + roster.length, name });
          teamCount++;
        }
        for (let fallback = 0; teamCount < this.settings.teamSize; fallback++) {
          const name = botName(taken);
          taken.push(name);
          let slot = 0;
          while (roster.some((entry) => entry.slot === slot)) slot++;
          roster.push({ slot, team, variant: fallback % 5, isBot: true, joinOrder: this.nextJoinOrder + roster.length, name });
          teamCount++;
        }
      }
    }
    roster.sort((a, b) => a.slot - b.slot);
    this.activeRoster = roster;
    return roster;
  }

  replaceBotWith(sessionId: string, name: string, preferredVariant?: unknown, rawUsername?: unknown): LobbyMember | null {
    if (this.mode !== 'private' || this.phase !== 'match') return null;
    const normalized = normalizeName(name);
    if (!normalized || this.members.some((member) => member.sessionId === sessionId)) return null;
    const normalizedUsername = normalizeName(rawUsername) ?? normalized;
    const counts = this.counts();
    const team: Team = counts[0] <= counts[1] ? 0 : 1;
    if (counts[team] >= this.settings.teamSize) return null;
    const bot = this.activeRoster.find((entry) => entry.team === team && entry.isBot);
    const chosenVariant = clampVariant(preferredVariant);
    if (chosenVariant !== null) this.preferredVariants.set(sessionId, chosenVariant);
    let slot: number;
    let variant: number;
    if (bot) {
      slot = bot.slot; variant = chosenVariant ?? bot.variant;
      this.activeRoster = this.activeRoster.filter((entry) => entry !== bot);
    } else {
      slot = this.firstFreeSlot(); variant = chosenVariant ?? this.firstFreeVariant(team);
    }
    const member: LobbyMember = {
      sessionId, slot, team, variant,
      username: normalizedUsername,
      name: dedupeName(normalized, this.members.map((existing) => existing.name)),
      joinOrder: this.nextJoinOrder++, ready: false, connected: true,
    };
    this.members.push(member);
    this.activeRoster.push({ ...member, isBot: false });
    return member;
  }
}
