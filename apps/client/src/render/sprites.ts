export interface SpriteFrame {
  img: HTMLImageElement;
  sx: number; sy: number; sw: number; sh: number; ax: number; ay: number;
}

interface ImageDef { file: string; w: number; h: number; anchor?: [number, number] }
interface AnimDef { start: number; count: number; fps: number; loop?: boolean }
interface SheetDef { file: string; frameW: number; frameH: number; anchor?: [number, number]; anims?: Record<string, AnimDef>; variants?: number }
interface Manifest { images: Record<string, ImageDef>; sheets: Record<string, SheetDef> }

export class SpriteBank {
  constructor(private readonly manifest: Manifest, private readonly images: Map<string, HTMLImageElement>) {}

  image(name: string): SpriteFrame | null {
    const def = this.manifest.images[name];
    const img = this.images.get(name);
    if (!def || !img) return null;
    return { img, sx: 0, sy: 0, sw: def.w, sh: def.h, ax: def.anchor?.[0] ?? 0, ay: def.anchor?.[1] ?? 0 };
  }

  frame(sheet: string, anim: string, time: number): SpriteFrame | null {
    const def = this.manifest.sheets[sheet];
    const img = this.images.get(sheet);
    if (!def || !img) return null;
    const sequence = def.anims?.[anim];
    if (!sequence) return null;
    const elapsed = Math.max(0, Math.floor(time * sequence.fps));
    const index = sequence.loop === false ? Math.min(sequence.count - 1, elapsed) : elapsed % sequence.count;
    const frameIndex = sequence.start + index;
    return { img, sx: frameIndex * def.frameW, sy: 0, sw: def.frameW, sh: def.frameH, ax: def.anchor?.[0] ?? 0, ay: def.anchor?.[1] ?? 0 };
  }

  tileFrame(sheet: string, index: number): SpriteFrame | null {
    const def = this.manifest.sheets[sheet];
    const img = this.images.get(sheet);
    if (!def || !img) return null;
    const frameIndex = Math.max(0, Math.min((def.variants ?? 1) - 1, index));
    return { img, sx: frameIndex * def.frameW, sy: 0, sw: def.frameW, sh: def.frameH, ax: 0, ay: 0 };
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Không tải được ảnh: ${url}`));
    img.src = url;
  });
}

export async function loadSprites(manifestUrl: string): Promise<SpriteBank> {
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error('Không tải được danh sách ảnh');
  const manifest = await response.json() as Manifest;
  const images = new Map<string, HTMLImageElement>();
  const baseUrl = new URL('.', new URL(manifestUrl, location.href));
  await Promise.all([
    ...Object.entries(manifest.images), ...Object.entries(manifest.sheets),
  ].map(async ([name, def]) => {
    try { images.set(name, await loadImage(new URL(def.file, baseUrl).href)); }
    catch { /* Asset missing: renderer uses team circles or plain shapes. */ }
  }));
  return new SpriteBank(manifest, images);
}
