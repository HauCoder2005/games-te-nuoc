import { DT, MOVE_SPEED, PREDICT_BLEND, PREDICT_SNAP_PX } from '@te-nuoc/shared';
import type { InputFrame, PlayerStatus } from '@te-nuoc/shared';

export class Predictor {
  position: { x: number; y: number };
  enabled = true;
  private pending: InputFrame[] = [];

  constructor(x: number, y: number) { this.position = { x, y }; }

  apply(input: InputFrame): void {
    if (!this.enabled) return;
    this.pending.push(input);
    this.position.x += input.mx * MOVE_SPEED * DT;
    this.position.y += input.my * MOVE_SPEED * DT;
  }

  reconcile(server: { x: number; y: number; ackSeq: number; status: PlayerStatus }): void {
    this.enabled = server.status === 'alive' || server.status === 'protected';
    this.pending = this.pending.filter((input) => input.seq > server.ackSeq);
    const target = { x: server.x, y: server.y };
    if (this.enabled) for (const input of this.pending) {
      target.x += input.mx * MOVE_SPEED * DT;
      target.y += input.my * MOVE_SPEED * DT;
    }
    const distance = Math.hypot(target.x - this.position.x, target.y - this.position.y);
    if (!this.enabled || distance > PREDICT_SNAP_PX) this.position = target;
    else {
      this.position.x += (target.x - this.position.x) * PREDICT_BLEND;
      this.position.y += (target.y - this.position.y) * PREDICT_BLEND;
    }
  }
}
