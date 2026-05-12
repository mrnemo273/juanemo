import { useCallback } from 'react';

export function useCollageExport() {
  const exportAsImage = useCallback(
    async (canvas: HTMLCanvasElement, filename: string = 'collage.png') => {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [],
  );

  return { exportAsImage };
}
