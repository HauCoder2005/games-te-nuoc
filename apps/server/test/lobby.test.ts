import { expect, it } from 'vitest';
import { LobbyModel } from '../src/rooms/lobby.js';

it('balances teams on join, red on a tie', () => {
  const lobby = new LobbyModel('private');
  ['a', 'b', 'c'].forEach((id) => lobby.join(id, id));
  expect(lobby.members.map((member) => member.team)).toEqual([0, 1, 0]);
});
it('normalizes and deduplicates names', () => {
  const lobby = new LobbyModel('private');
  lobby.join('x', ' Tèo ');
  expect(lobby.join('y', 'Tèo').name).toBe('Tèo 2');
});
it('host migrates to earliest remaining human', () => {
  const lobby = new LobbyModel('private');
  lobby.join('a', 'A'); lobby.join('b', 'B'); lobby.join('c', 'C');
  lobby.leave('a');
  expect(lobby.hostId).toBe('b');
  lobby.leave('b');
  expect(lobby.hostId).toBe('c');
});
it('public lobby never has a host', () => {
  const lobby = new LobbyModel('public');
  lobby.join('a', 'A');
  expect(lobby.hostId).toBeNull();
});
it('nonhost cannot change settings and invalid score is rejected', () => {
  const lobby = new LobbyModel('private');
  lobby.join('a', 'A'); lobby.join('b', 'B');
  expect(lobby.setSettings('b', { teamSize: 4 })).toBe('not_host');
  expect(lobby.setSettings('a', { scoreToWin: 7 as 5 })).toBe('bad_request');
});
it('cannot pick 4v4 when a team has five humans', () => {
  const lobby = new LobbyModel('private');
  for (let i = 0; i < 9; i++) lobby.join(String(i), String(i));
  expect(lobby.setSettings('0', { teamSize: 4 })).toBe('bad_request');
});
it('moving teams respects capacity and assigns a new variant', () => {
  const lobby = new LobbyModel('private');
  for (let i = 0; i < 10; i++) lobby.join(String(i), String(i));
  expect(lobby.setTeam('1', 0)).toBe('full');
  lobby.leave('0');
  expect(lobby.setTeam('1', 0)).toBeNull();
  expect(new Set(lobby.members.filter((member) => member.team === 0).map((member) => member.variant)).size).toBe(5);
});
it('buildRoster fills bots to 5v5 with unique names and variants', () => {
  const lobby = new LobbyModel('private');
  lobby.join('a', 'Tèo'); lobby.join('b', 'Bin');
  const roster = lobby.buildRoster();
  expect(roster).toHaveLength(10);
  expect(roster.filter((entry) => entry.isBot)).toHaveLength(8);
  expect(new Set(roster.map((entry) => entry.name)).size).toBe(10);
  expect(roster.filter((entry) => entry.team === 0).map((entry) => entry.variant)).toEqual([0, 1, 2, 3, 4]);
});
it('buildRoster without bot fill keeps humans only and start requires both teams', () => {
  const lobby = new LobbyModel('private');
  lobby.join('a', 'A');
  expect(lobby.setSettings('a', { botFill: false })).toBeNull();
  expect(lobby.buildRoster()).toHaveLength(1);
  expect(lobby.canHostStart('a')).toBe('bad_request');
  lobby.join('b', 'B');
  expect(lobby.canHostStart('a')).toBeNull();
});
it('midmatch join replaces a bot on the smaller human team', () => {
  const lobby = new LobbyModel('private');
  lobby.join('a', 'A'); lobby.join('b', 'B'); lobby.join('c', 'C');
  lobby.buildRoster();
  lobby.phase = 'match';
  const joined = lobby.replaceBotWith('d', 'D');
  expect(joined?.team).toBe(1);
  expect(joined?.slot).toBeGreaterThanOrEqual(0);
  expect(lobby.buildRoster().filter((entry) => entry.isBot)).toHaveLength(6);
});
it('shuffle keeps teams balanced and all human names', () => {
  const lobby = new LobbyModel('private');
  for (let i = 0; i < 7; i++) lobby.join(String(i), String(i));
  expect(lobby.shuffle('0', () => 0.5)).toBeNull();
  expect(lobby.members.filter((member) => member.team === 0)).toHaveLength(4);
  expect(lobby.members.filter((member) => member.team === 1)).toHaveLength(3);
  expect(new Set(lobby.members.map((member) => member.name)).size).toBe(7);
});
it('respects player chosen character variant while keeping team uniform', () => {
  const lobby = new LobbyModel('private');
  const member = lobby.join('a', 'Tèo Bóng', 3, 'teovip01');
  expect(member.variant).toBe(3);
  expect(member.username).toBe('teovip01');
  expect(member.name).toBe('Tèo Bóng');
  expect(member.team).toBe(0);
  expect(lobby.setTeam('a', 1)).toBeNull();
  expect(lobby.members[0].team).toBe(1);
  expect(lobby.members[0].variant).toBe(3);
});
