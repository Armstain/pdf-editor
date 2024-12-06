'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import { Document, Page } from 'react-pdf';
import { Canvas } from 'fabric';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { BlurTool } from './components/BlurTool';
import { TextTool } from './components/TextTool';
import { EraseTool } from './components/EraseTool';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tool, setTool] = useState<'blur' | 'erase' | 'text'>('blur');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
    // const [isDrawing, setIsDrawing] = useState(false);
    // const [path, setPath] = useState<Path | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setCurrentPage(1);
    }
  };

  const handleSavePDF = async () => {
    if (!pdfFile || !canvasRef.current) return;

    try {
      const pdfDoc = await PDFDocument.load(await pdfFile.arrayBuffer());
      const page = pdfDoc.getPage(currentPage - 1);
      
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const pngImage = await pdfDoc.embedPng(dataUrl);
      
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: page.getWidth(),
        height: page.getHeight(),
      });

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'edited-document.pdf';
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  };

  useEffect(() => {
    if (!pdfFile || !canvasRef.current) return;

    const initCanvas = () => {
      try {
        if (fabricRef.current) {
          fabricRef.current.dispose();
        }

        canvasRef.current.width = 612;
        canvasRef.current.height = 792;

        const canvas = new Canvas(canvasRef.current, {
          width: 612,
          height: 792,
          selection: true,
          renderOnAddRemove: true,
          isDrawingMode: false,
        });

        const container = canvas.wrapperEl as HTMLElement;
        if (container) {
          container.style.position = 'absolute';
          container.style.top = '0';
          container.style.left = '0';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.pointerEvents = 'auto';
          container.style.touchAction = 'none';
        }

        fabricRef.current = canvas;
        console.log('Canvas initialized successfully:', canvas);
      } catch (error) {
        console.error('Canvas initialization failed:', error);
      }
    };

    const timer = setTimeout(initCanvas, 500);
    return () => {
      clearTimeout(timer);
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [pdfFile]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let cleanup: (() => void) | undefined;

    switch (tool) {
      case 'blur':
        cleanup = BlurTool({ canvas });
        break;
      case 'text':
        cleanup = TextTool({ canvas });
        break;
      case 'erase':
        cleanup = EraseTool({ canvas });
        break;
    }

    return () => {
      cleanup?.();
    };
  }, [tool]);

  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.renderAll();
    }
  }, [currentPage]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">PDF Editor</h1>
      
      <div className="mb-8 text-center">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
        >
          Upload PDF
        </label>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {['blur', 'erase', 'text'].map((t) => (
          <button
            key={t}
            onClick={() => setTool(t as 'blur' | 'erase' | 'text')}
            className={`px-4 py-2 rounded ${
              tool === t ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {pdfFile && (
        <div className="flex flex-col items-center">
          <div style={{ position: 'relative' }}>
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="mb-4"
            >
              <Page 
                pageNumber={currentPage}
                width={612}
              />
            </Document>
            
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '612px',
                height: '792px',
                pointerEvents: 'all',
                zIndex: 10
              }}
            >
              <canvas 
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  touchAction: 'none',
                  userSelect: 'none',
                }}
              />
            </div>
          </div>

          <div className="flex gap-4 items-center mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {pdfFile && (
        <div className="mt-4 text-center">
          <button
            onClick={handleSavePDF}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Save PDF
          </button>
        </div>
      )}
    </main>
  );
}
