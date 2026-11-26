import { FALL_TIME, GOLDEN_SHRINK_EVERY, KO_CREDIT_WINDOW, LAST_MINUTE_AT, MATCH_END_TIME, SHRINK_WARNING } from '../config';
import { shrunk } from './raft';
import type { Awards, GameEvent, PlayerState, Team, World } from './types';

export function computeAwards(w: World): Awards {
  const best = (field: 'ko' | 'direct' | 'falls'): number | null => {
    const sorted = [...w.players].sort((a, b) => b.stats[field] - a.stats[field] || a.joinOrder - b.joinOrder);
    return sorted[0]?.slot ?? null;
  };
  return { mvp: best('ko'), sharpshooter: best('direct'), mostFalls: best('falls') };
}

export function endMatch(w: World, winner: Team, events: GameEvent[]): void {
  if (w.phase === 'matchEnd') return;
  w.phase = 'matchEnd';
  w.phaseTimer = MATCH_END_TIME;
  w.winner = winner;
  events.push({ k: 'matchEnd', winner, awards: computeAwards(w) });
}

export function onFall(w: World, p: PlayerState, events: GameEvent[]): void {
  if (p.status === 'falling' || p.status === 'respawning' || w.phase === 'matchEnd') return;
  const credited = p.lastHitBy !== null && w.time - p.lastHitTime <= KO_CREDIT_WINDOW
    ? w.players.find((candidate) => candidate.slot === p.lastHitBy && candidate.team !== p.team)
    : undefined;
  const by = credited?.slot ?? null;
  p.status = 'falling';
  p.timer = FALL_TIME;
  p.mvx = 0; p.mvy = 0; p.kbx = 0; p.kby = 0;
  p.stats.falls++;
  p.stats.streak = 0;
  if (credited) {
    credited.stats.ko++;
    credited.stats.streak++;
  }
  events.push({ k: 'fall', slot: p.slot, by });
  if (credited && (credited.stats.streak === 3 || credited.stats.streak === 5)) {
    events.push({ k: 'streak', slot: credited.slot, n: credited.stats.streak });
  }
  const scoringTeam: Team = p.team === 0 ? 1 : 0;
  w.score[scoringTeam]++;
  events.push({ k: 'score', team: scoringTeam, red: w.score[0], blue: w.score[1] });
  if (w.phase === 'golden' || w.score[scoringTeam] >= w.settings.scoreToWin) {
    endMatch(w, scoringTeam, events);
  } else if (w.score[scoringTeam] === w.settings.scoreToWin - 1) {
    const teams: Team[] = [];
    if (w.score[0] === w.settings.scoreToWin - 1) teams.push(0);
    if (w.score[1] === w.settings.scoreToWin - 1) teams.push(1);
    events.push({ k: 'matchPoint', teams });
  }
}

function warnShrink(w: World, events: GameEvent[]): void {
  if (w.raft.w <= 20 && w.raft.h <= 4) return;
  w.raft.warn = true;
  w.raft.warnTimer = SHRINK_WARNING;
  events.push({ k: 'shrinkWarn' });
}

function advanceWarning(w: World, dt: number, events: GameEvent[]): void {
  if (!w.raft.warn) return;
  w.raft.warnTimer -= dt;
  if (w.raft.warnTimer <= 0) {
    w.raft = shrunk(w.raft);
    events.push({ k: 'shrink', w: w.raft.w, h: w.raft.h });
  }
}

export function updateClock(w: World, dt: number, events: GameEvent[]): void {
  if (w.phase === 'countdown' || w.phase === 'matchEnd') {
    w.phaseTimer = Math.max(0, w.phaseTimer - dt);
    if (w.phase === 'countdown' && w.phaseTimer === 0) w.phase = 'playing';
    return;
  }
  if (w.phase === 'playing') {
    w.timeLeft = Math.max(0, w.timeLeft - dt);
    if (!w.lastMinuteDone && w.timeLeft <= LAST_MINUTE_AT) {
      w.lastMinuteDone = true;
      events.push({ k: 'lastMinute' });
      warnShrink(w, events);
    } else {
      advanceWarning(w, dt, events);
    }
    if (w.timeLeft === 0) {
      if (w.score[0] !== w.score[1]) endMatch(w, w.score[0] > w.score[1] ? 0 : 1, events);
      else {
        w.phase = 'golden';
        w.goldenTimer = 0;
        events.push({ k: 'golden' });
        warnShrink(w, events);
      }
    }
    return;
  }
  if (w.phase === 'golden') {
    advanceWarning(w, dt, events);
    w.goldenTimer += dt;
    if (!w.raft.warn && w.goldenTimer >= GOLDEN_SHRINK_EVERY - SHRINK_WARNING) warnShrink(w, events);
    if (w.goldenTimer >= GOLDEN_SHRINK_EVERY) {
      w.goldenTimer %= GOLDEN_SHRINK_EVERY;
      if (w.raft.warn) {
        w.raft = shrunk(w.raft);
        events.push({ k: 'shrink', w: w.raft.w, h: w.raft.h });
      }
    }
  }
}
