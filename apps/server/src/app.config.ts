import { defineRoom, defineServer, matchMaker } from 'colyseus';
import { MatchRoom } from './rooms/MatchRoom.js';

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? (process.env.NODE_ENV === 'production' ? '' : '*');

const server = defineServer({
  rooms: { match: defineRoom(MatchRoom).filterBy(['mode']) },
  express: (app) => {
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
  },
});

export default server;

