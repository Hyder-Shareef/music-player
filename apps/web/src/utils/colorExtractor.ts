// Canvas-based dominant color extraction with caching for album artwork

export interface ArtworkPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  glow: string;
}

const colorCache = new Map<string, string>();
const paletteCache = new Map<string, ArtworkPalette>();

const DEFAULT_PALETTE: ArtworkPalette = {
  primary: '#fa233b',
  secondary: '#ff758c',
  tertiary: '#1e1028',
  glow: 'rgba(250, 35, 59, 0.45)',
};

export async function extractArtworkPalette(imageUrl?: string | null): Promise<ArtworkPalette> {
  if (!imageUrl) return DEFAULT_PALETTE;
  if (paletteCache.has(imageUrl)) return paletteCache.get(imageUrl)!;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        canvas.width = 48;
        canvas.height = 48;
        ctx.drawImage(img, 0, 0, 48, 48);

        const imageData = ctx.getImageData(0, 0, 48, 48).data;
        const colorBuckets: Array<{ r: number; g: number; b: number; count: number; score: number }> = [];

        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];

          // Filter out extreme blacks, whites, and low saturation gray
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const delta = maxVal - minVal;
          const brightness = (r + g + b) / 3;

          if (brightness > 25 && brightness < 235 && delta > 18) {
            // Find existing bucket within tolerance
            let matched = false;
            for (const bucket of colorBuckets) {
              const dist = Math.abs(bucket.r - r) + Math.abs(bucket.g - g) + Math.abs(bucket.b - b);
              if (dist < 60) {
                bucket.count++;
                bucket.score += delta * 1.5;
                matched = true;
                break;
              }
            }
            if (!matched && colorBuckets.length < 12) {
              colorBuckets.push({ r, g, b, count: 1, score: delta * 2 });
            }
          }
        }

        if (colorBuckets.length === 0) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        colorBuckets.sort((a, b) => b.score - a.score);

        const b1 = colorBuckets[0];
        const b2 = colorBuckets[1] || colorBuckets[0];
        const b3 = colorBuckets[2] || colorBuckets[0];

        const toHex = (r: number, g: number, b: number) =>
          `#${Math.min(255, Math.max(0, r)).toString(16).padStart(2, '0')}${Math.min(255, Math.max(0, g)).toString(16).padStart(2, '0')}${Math.min(255, Math.max(0, b)).toString(16).padStart(2, '0')}`;

        const primary = toHex(b1.r, b1.g, b1.b);
        const secondary = toHex(
          Math.round((b2.r * 1.1 + 20) % 255),
          Math.round((b2.g * 1.1 + 20) % 255),
          Math.round((b2.b * 1.1 + 20) % 255)
        );
        const tertiary = toHex(
          Math.round(b3.r * 0.35),
          Math.round(b3.g * 0.35),
          Math.round(b3.b * 0.35)
        );
        const glow = `rgba(${b1.r}, ${b1.g}, ${b1.b}, 0.5)`;

        const res: ArtworkPalette = { primary, secondary, tertiary, glow };
        paletteCache.set(imageUrl, res);
        colorCache.set(imageUrl, primary);
        resolve(res);
      } catch {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_PALETTE);
    };

    img.src = imageUrl;
  });
}

export async function extractDominantColor(imageUrl?: string | null): Promise<string> {
  if (!imageUrl) return '#fa233b';
  if (colorCache.has(imageUrl)) return colorCache.get(imageUrl)!;
  const palette = await extractArtworkPalette(imageUrl);
  return palette.primary;
}

