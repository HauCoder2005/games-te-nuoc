import {
  FALL_TIME, GOLDEN_SHRINK_EVERY, KO_CREDIT_WINDOW, LAST_MINUTE_AT, MATCH_END_TIME,
  PILLAR_CAPTURE_TIME, PILLAR_DECAY_RATE, PILLAR_HOLD_SCORE_TIME, PILLAR_RADIUS,
  RAFT_CENTER, SHRINK_WARNING,
} from '../config';
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

export function awardTeamScore(w: World, scoringTeam: Team, events: GameEvent[]): void {
  if (w.phase === 'matchEnd') return;
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

export function updatePillar(w: World, dt: number, events: GameEvent[]): void {
  if (w.phase !== 'playing' && w.phase !== 'golden') return;
  const counts: [number, number] = [0, 0];
  for (const p of w.players) {
    if (p.status === 'falling' || p.status === 'respawning') continue;
    if (Math.hypot(p.x - RAFT_CENTER.x, p.y - RAFT_CENTER.y) <= PILLAR_RADIUS) {
      counts[p.team]++;
    }
  }
  const pillar = w.pillar;
  pillar.contested = counts[0] > 0 && counts[1] > 0;
  const activeTeam: Team | null = counts[0] > 0 && counts[1] === 0 ? 0
    : counts[1] > 0 && counts[0] === 0 ? 1 : null;

  if (!pillar.contested) {
    if (activeTeam !== null) {
      const n = counts[activeTeam];
      const speedBonus = 1 + (n - 1) * 0.25;
      const rate = (1 / PILLAR_CAPTURE_TIME) * speedBonus;
      if (pillar.owner === activeTeam) {
        if (pillar.progress > 0) {
          pillar.progress = Math.max(0, pillar.progress - rate * dt);
          if (pillar.progress === 0) pillar.capturingTeam = null;
        }
      } else {
        if (pillar.capturingTeam !== null && pillar.capturingTeam !== activeTeam) {
          pillar.progress = Math.max(0, pillar.progress - rate * dt);
          if (pillar.progress === 0) pillar.capturingTeam = activeTeam;
        } else {
          pillar.capturingTeam = activeTeam;
          pillar.progress = Math.min(1, pillar.progress + rate * dt);
          if (pillar.progress >= 1) {
            pillar.owner = activeTeam;
            pillar.capturingTeam = null;
            pillar.progress = 0;
            pillar.holdTimer = 0;
            events.push({ k: 'pillarCaptured', team: activeTeam });
            awardTeamScore(w, activeTeam, events);
            if ((w.phase as string) !== 'matchEnd') {
              if (pillar.round < pillar.maxRounds) {
                pillar.round++;
              } else {
                const winner: Team = w.score[0] === w.score[1] ? activeTeam : w.score[0] > w.score[1] ? 0 : 1;
                endMatch(w, winner, events);
              }
            }
            return;
          }
        }
      }
    } else if (pillar.progress > 0) {
      const decay = (1 / PILLAR_CAPTURE_TIME) * PILLAR_DECAY_RATE * dt;
      pillar.progress = Math.max(0, pillar.progress - decay);
      if (pillar.progress === 0) pillar.capturingTeam = null;
    }
  }

  if (pillar.owner !== null && !pillar.contested && counts[pillar.owner === 0 ? 1 : 0] === 0) {
    pillar.holdTimer += dt;
    while (pillar.holdTimer >= PILLAR_HOLD_SCORE_TIME) {
      pillar.holdTimer -= PILLAR_HOLD_SCORE_TIME;
      awardTeamScore(w, pillar.owner, events);
      if ((w.phase as string) === 'matchEnd') break;
    }
  }
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
  awardTeamScore(w, scoringTeam, events);
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
    const elapsed = (w.timeLeft > 0 ? 300 - w.timeLeft : 300);
    const timeRound = Math.min(w.pillar.maxRounds, Math.floor(elapsed / (300 / w.pillar.maxRounds)) + 1);
    if (timeRound > w.pillar.round) {
      w.pillar.round = timeRound;
      w.pillar.owner = null;
      w.pillar.capturingTeam = null;
      w.pillar.progress = 0;
      w.pillar.holdTimer = 0;
    }
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
