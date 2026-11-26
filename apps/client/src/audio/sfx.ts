import type { GameEvent } from '@te-nuoc/shared';

let audio: AudioContext | null = null;

export function unlockAudio(): void {
  audio ??= new AudioContext();
  void audio.resume();
}

export function playSfx(event: GameEvent): void {
  if (!audio) return;
  const notes: Record<GameEvent['k'], [number, number, number]> = {
    throw: [380, 0.08, 100], burst: [190, 0.18, -140], hit: [120, 0.16, -90],
    fall: [260, 0.28, -230], score: [660, 0.35, 360], respawn: [480, 0.18, 160],
    streak: [780, 0.25, 220], matchPoint: [650, 0.35, 120], lastMinute: [440, 0.3, -160],
    golden: [890, 0.5, 420], shrinkWarn: [310, 0.15, -70], shrink: [150, 0.24, -100],
    matchEnd: [920, 0.55, -420],
  };
  const [frequency, duration, slide] = notes[event.k];
  const sampleRate = audio.sampleRate;
  const buffer = audio.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate);
  const data = buffer.getChannelData(0);
  let phase = 0;
  for (let index = 0; index < data.length; index++) {
    const progress = index / data.length;
    phase += (frequency + slide * progress) / sampleRate;
    const envelope = (1 - progress) ** 2;
    const noise = event.k === 'burst' || event.k === 'hit' ? (Math.random() - 0.5) * 0.35 : 0;
    data[index] = (Math.sin(phase * Math.PI * 2) + noise) * envelope * 0.08;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  source.start();
}
