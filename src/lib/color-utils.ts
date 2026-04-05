/**
 * Sample brightness of an image to determine if it is predominantly dark or light.
 * Returns 'dark' if average luminance < 0.5, 'light' otherwise.
 * Gracefully falls back to 'dark' on CORS or load errors.
 */
export function detectImageBrightness(src: string): Promise<'dark' | 'light'> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('dark');
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let total = 0;
        const count = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          // Relative luminance approximation
          total += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        }
        resolve(total / count < 0.5 ? 'dark' : 'light');
      } catch {
        resolve('dark');
      }
    };

    img.onerror = () => resolve('dark');
    img.src = src;
  });
}
