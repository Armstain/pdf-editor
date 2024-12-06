import { Canvas, IEvent } from 'fabric';

interface EraseToolProps {
  canvas: Canvas;
}

type FabricMouseEvent = IEvent<MouseEvent> & {
  pointer: { x: number; y: number };
  e: MouseEvent;
};

export function EraseTool({ canvas }: EraseToolProps) {
  let isErasing = false;

  const handleMouseDown = () => { isErasing = true; };
  const handleMouseMove = (options: FabricMouseEvent) => {
    if (!isErasing) return;
    const pointer = canvas.getPointer(options.e);
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if (obj.containsPoint(pointer)) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
  };
  const handleMouseUp = () => { isErasing = false; };

  canvas.on('mouse:down', handleMouseDown);
  canvas.on('mouse:move', handleMouseMove);
  canvas.on('mouse:up', handleMouseUp);

  return () => {
    canvas.off('mouse:down', handleMouseDown);
    canvas.off('mouse:move', handleMouseMove);
    canvas.off('mouse:up', handleMouseUp);
  };
} 