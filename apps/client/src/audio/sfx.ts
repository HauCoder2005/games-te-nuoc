import type { GameEvent } from '@te-nuoc/shared';

let audio: AudioContext | null = null;

export function unlockAudio(): void {
  audio ??= new AudioContext();
  void audio.resume();
}

export function playSfx(event: GameEvent): void {
  if (!audio || (event.k !== 'burst' && event.k !== 'score')) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = event.k === 'score' ? 660 : 280;
  gain.gain.setValueAtTime(0.07, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.12);
}
