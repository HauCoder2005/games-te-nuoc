import { defineRoom, defineServer, matchMaker } from 'colyseus';
import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MatchRoom } from './rooms/MatchRoom.js';
import { normalizeName } from '@te-nuoc/shared';

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? (process.env.NODE_ENV === 'production' ? '' : '*');

interface AccountRecord {
  username: string;
  gameName: string;
  password: string;
  stars: number;
  wins: number;
  variant: number;
}

const accounts = new Map<string, AccountRecord>([
  ['hungthuythan', { username: 'hungthuythan', gameName: 'Hưng Thủy Thần', password: '123', stars: 16, wins: 16, variant: 2 }],
  ['maibantia', { username: 'maibantia', gameName: 'Mai Bắn Tỉa', password: '123', stars: 12, wins: 12, variant: 4 }],
  ['khoasongthan', { username: 'khoasongthan', gameName: 'Khoa Sóng Thần', password: '123', stars: 9, wins: 9, variant: 0 }],
  ['suthuykich', { username: 'suthuykich', gameName: 'Su Thủy Kích', password: '123', stars: 6, wins: 6, variant: 3 }],
  ['nabongnuoc', { username: 'nabongnuoc', gameName: 'Na Bóng Nước', password: '123', stars: 3, wins: 3, variant: 1 }],
  ['titapboi', { username: 'titapboi', gameName: 'Tí Tập Bơi', password: '123', stars: 1, wins: 1, variant: 0 }],
]);

function publicUser(acc: AccountRecord) {
  return {
    username: acc.username,
    gameName: acc.gameName,
    stars: acc.stars,
    wins: acc.wins,
    variant: acc.variant,
  };
}

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
    app.post('/api/register', (request, response) => {
      const body = request.body as Record<string, unknown> | undefined;
      const cleanUser = normalizeName(body?.username);
      const cleanGameName = normalizeName(body?.gameName ?? body?.name);
      const rawPass = typeof body?.password === 'string' ? body.password.trim() : '';
      const confirmPass = typeof body?.confirmPassword === 'string' ? body.confirmPassword.trim() : rawPass;
      const variant = typeof body?.variant === 'number' && body.variant >= 0 && body.variant < 5 ? body.variant : 0;
      if (!cleanUser || !cleanGameName || rawPass.length < 3) {
        response.status(400).json({ ok: false, message: 'Vui lòng điền đủ Username, Tên trong game và Mật khẩu (≥ 3 ký tự)' });
        return;
      }
      if (rawPass !== confirmPass) {
        response.status(400).json({ ok: false, message: 'Mật khẩu xác nhận không khớp' });
        return;
      }
      const key = cleanUser.toLowerCase();
      if (accounts.has(key)) {
        response.status(409).json({ ok: false, message: 'Username này đã tồn tại, vui lòng đăng nhập hoặc chọn Username khác' });
        return;
      }
      const record: AccountRecord = { username: cleanUser, gameName: cleanGameName, password: rawPass, stars: 0, wins: 0, variant };
      accounts.set(key, record);
      response.json({ ok: true, created: true, user: publicUser(record) });
    });
    app.post('/api/login', (request, response) => {
      const body = request.body as Record<string, unknown> | undefined;
      const cleanUser = normalizeName(body?.username);
      const rawPass = typeof body?.password === 'string' ? body.password.trim() : '';
      if (!cleanUser || !rawPass) {
        response.status(400).json({ ok: false, message: 'Vui lòng nhập Username và Mật khẩu' });
        return;
      }
      const existing = accounts.get(cleanUser.toLowerCase());
      if (!existing || existing.password !== rawPass) {
        response.status(401).json({ ok: false, message: 'Sai Username hoặc Mật khẩu' });
        return;
      }
      response.json({ ok: true, user: publicUser(existing) });
    });
    app.post('/api/auth', (request, response) => {
      const body = request.body as Record<string, unknown> | undefined;
      const cleanUser = normalizeName(body?.username);
      const cleanGameName = normalizeName(body?.gameName ?? body?.name) ?? cleanUser;
      const rawPass = typeof body?.password === 'string' ? body.password.trim() : '';
      const variant = typeof body?.variant === 'number' && body.variant >= 0 && body.variant < 5 ? body.variant : 0;
      if (!cleanUser || !cleanGameName || rawPass.length < 3) {
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
        if (body?.gameName) existing.gameName = cleanGameName;
        response.json({ ok: true, created: false, user: publicUser(existing) });
        return;
      }
      const record: AccountRecord = { username: cleanUser, gameName: cleanGameName, password: rawPass, stars: 0, wins: 0, variant };
      accounts.set(key, record);
      response.json({ ok: true, created: true, user: publicUser(record) });
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
      response.json({ ok: true, user: publicUser(existing) });
    });
    app.get('/api/leaderboard', (_request, response) => {
      const list = [...accounts.values()]
        .map((acc) => ({ username: acc.username, name: acc.gameName, stars: acc.stars, wins: acc.wins, variant: acc.variant }))
        .sort((a, b) => b.stars - a.stars);
      response.json({ ok: true, leaderboard: list.slice(0, 10) });
    });
    const clientDistCandidates = [
      resolve(process.cwd(), 'apps/client/dist'),
      resolve(process.cwd(), '../client/dist'),
    ];
    const clientDist = clientDistCandidates.find((dir) => existsSync(dir));
    if (clientDist) {
      app.use(express.static(clientDist));
    }
  },
});

export default server;

