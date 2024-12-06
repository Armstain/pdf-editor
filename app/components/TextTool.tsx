import { Canvas, IEvent, IText } from 'fabric';

interface TextToolProps {
  canvas: Canvas;
}

type FabricMouseEvent = IEvent<MouseEvent> & {
  pointer: { x: number; y: number };
  e: MouseEvent;
};

type TextEditingEvent = {
  target: IText;
};

export function TextTool({ canvas }: TextToolProps) {
  canvas.on('mouse:down', function(options: FabricMouseEvent) {
    if (!options.pointer) return;

    const clickedObject = canvas.findTarget(options.e, false);
    if (clickedObject instanceof IText) {
      clickedObject.enterEditing();
      canvas.setActiveObject(clickedObject);
      return;
    }

    const text = new IText('', {
      left: options.pointer.x,
      top: options.pointer.y,
      fontSize: 16,
      fill: '#000000',
      fontFamily: 'Arial',
      selectable: true,
      editable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      backgroundColor: 'rgba(255,255,255,0.4)',
      padding: 8,
      cursorWidth: 2,
      cursorColor: '#333',
      cursorDuration: 600,
      width: 150,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    canvas.requestRenderAll();
  });

  canvas.on('text:editing:entered', function(e: TextEditingEvent) {
    const textObject = e.target as IText;
    if (textObject) {
      textObject.set({
        backgroundColor: 'rgba(255,255,255,0.8)'
      });
    }
    canvas.requestRenderAll();
  });

  canvas.on('text:editing:exited', function(e: TextEditingEvent) {
    const textObject = e.target as IText;
    if (textObject) {
      if (textObject.text.trim() === '') {
        canvas.remove(textObject);
      } else {
        textObject.set({
          backgroundColor: 'rgba(255,255,255,0.4)'
        });
      }
    }
    canvas.requestRenderAll();
  });

  return () => {
    canvas.off('mouse:down');
    canvas.off('text:editing:entered');
    canvas.off('text:editing:exited');
  };
} 