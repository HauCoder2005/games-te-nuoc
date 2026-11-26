import { defineRoom, defineServer, matchMaker } from 'colyseus';
import express from 'express';
import { MatchRoom } from './rooms/MatchRoom.js';
import { normalizeName } from '@te-nuoc/shared';

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? (process.env.NODE_ENV === 'production' ? '' : '*');

interface AccountRecord {
  username: string;
  password: string;
  stars: number;
  wins: number;
  variant: number;
}

const accounts = new Map<string, AccountRecord>([
  ['hungthuythan', { username: 'Hưng Thủy Thần', password: '123', stars: 16, wins: 16, variant: 2 }],
  ['maibantia', { username: 'Mai Bắn Tỉa', password: '123', stars: 12, wins: 12, variant: 4 }],
  ['khoasongthan', { username: 'Khoa Sóng Thần', password: '123', stars: 9, wins: 9, variant: 0 }],
  ['suthuykich', { username: 'Su Thủy Kích', password: '123', stars: 6, wins: 6, variant: 3 }],
  ['nabongnuoc', { username: 'Na Bóng Nước', password: '123', stars: 3, wins: 3, variant: 1 }],
  ['titapboi', { username: 'Tí Tập Bơi', password: '123', stars: 1, wins: 1, variant: 0 }],
]);

const server = defineServer({
  rooms: { match: defineRoom(MatchRoom).filterBy(['mode']) },
  express: (app) => {
    app.use(express.json());
    app.use((request, response, next) => {
      const origin = request.headers.origin;
      if (allowedOrigin === '*' || origin === allowedOrigin) {
        response.setHeader('Access-Control-Allow-Origin', allowedOrigin === '*' ? '*' : origin ?? '');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      }
      if (request.method === 'OPTIONS') { response.status(204).end(); return; }
      next();
    });
    app.get('/health', async (_request, response) => {
      const rooms = await matchMaker.query({ name: 'match' });
      response.json({ ok: true, rooms: rooms.length, clients: rooms.reduce((total, room) => total + room.clients, 0) });
    });
    app.post('/api/auth', (request, response) => {
      const body = request.body as Record<string, unknown> | undefined;
      const cleanUser = normalizeName(body?.username);
      const rawPass = typeof body?.password === 'string' ? body.password.trim() : '';
      const variant = typeof body?.variant === 'number' && body.variant >= 0 && body.variant < 5 ? body.variant : 0;
      if (!cleanUser || rawPass.length < 3) {
        response.status(400).json({ ok: false, message: 'Tên tài khoản và mật khẩu (tối thiểu 3 ký tự) là bắt buộc' });
        return;
      }
      const key = cleanUser.toLowerCase();
      const existing = accounts.get(key);
      if (existing) {
        if (existing.password !== rawPass) {
          response.status(401).json({ ok: false, message: 'Sai mật khẩu cho tài khoản này' });
          return;
        }
        existing.variant = variant;
        response.json({ ok: true, created: false, user: { username: existing.username, stars: existing.stars, wins: existing.wins, variant: existing.variant } });
        return;
      }
      const record: AccountRecord = { username: cleanUser, password: rawPass, stars: 0, wins: 0, variant };
      accounts.set(key, record);
      response.json({ ok: true, created: true, user: { username: record.username, stars: record.stars, wins: record.wins, variant: record.variant } });
    });
    app.post('/api/rank/win', (request, response) => {
      const body = request.body as Record<string, unknown> | undefined;
      const cleanUser = normalizeName(body?.username);
      const rawPass = typeof body?.password === 'string' ? body.password.trim() : '';
      if (!cleanUser) { response.status(400).json({ ok: false }); return; }
      const existing = accounts.get(cleanUser.toLowerCase());
      if (!existing || existing.password !== rawPass) { response.status(401).json({ ok: false }); return; }
      existing.stars += 1;
      existing.wins += 1;
      response.json({ ok: true, user: { username: existing.username, stars: existing.stars, wins: existing.wins, variant: existing.variant } });
    });
    app.get('/api/leaderboard', (_request, response) => {
      const list = [...accounts.values()]
        .map((acc) => ({ name: acc.username, stars: acc.stars, wins: acc.wins, variant: acc.variant }))
        .sort((a, b) => b.stars - a.stars);
      response.json({ ok: true, leaderboard: list.slice(0, 10) });
    });
  },
});

export default server;

