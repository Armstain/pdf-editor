import { Canvas, IEvent, Rect, Gradient, Shadow } from 'fabric';

interface BlurToolProps {
  canvas: Canvas;
}

type FabricMouseEvent = IEvent<MouseEvent> & {
  pointer: { x: number; y: number };
};

export function BlurTool({ canvas }: BlurToolProps) {
  let isDrawing = false;
  let blurRect: Rect | null = null;
  let startX = 0;
  let startY = 0;

  canvas.on('mouse:down', function(options: FabricMouseEvent) {
    isDrawing = true;
    startX = options.pointer.x;
    startY = options.pointer.y;

    blurRect = new Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      fill: new Gradient({
        type: 'linear',
        coords: {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
        },
        colorStops: [
          { offset: 0, color: 'rgba(255,255,255,0.9)' },
          { offset: 0.5, color: 'rgba(255,255,255,0.7)' },
          { offset: 1, color: 'rgba(255,255,255,0.5)' }
        ]
      }),
      rx: 10,
      ry: 10,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false,
      cornerColor: '#666',
      cornerSize: 8,
      strokeWidth: 2,
      stroke: 'rgba(255,255,255,0.5)',
      shadow: new Shadow({
        color: 'rgba(255,255,255,0.8)',
        blur: 15,
        offsetX: 0,
        offsetY: 0,
      }),
    });

    canvas.add(blurRect);
    canvas.renderAll();
  });

  canvas.on('mouse:move', function(options: FabricMouseEvent) {
    if (!isDrawing || !blurRect) return;

    const pointer = options.pointer;
    const width = Math.abs(pointer.x - startX);
    const height = Math.abs(pointer.y - startY);

    blurRect.set({
      width: width,
      height: height,
      left: Math.min(startX, pointer.x),
      top: Math.min(startY, pointer.y)
    });

    const gradient = blurRect.fill as Gradient;
    if (gradient) {
      gradient.coords.r2 = Math.max(width, height) / 2;
      gradient.coords.x1 = width / 2;
      gradient.coords.y1 = height / 2;
      gradient.coords.x2 = width / 2;
      gradient.coords.y2 = height / 2;
    }

    canvas.renderAll();
  });

  canvas.on('mouse:up', function() {
    isDrawing = false;
    blurRect = null;
  });

  return () => {
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
  };
} 