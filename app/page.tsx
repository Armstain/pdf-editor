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
  const [tool, setTool] = useState<'text' | 'erase' | 'blur' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
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
    if (!pdfFile || !canvasRef.current || !pdfDimensions.width || !pdfDimensions.height) return;

    const initCanvas = () => {
      try {
        if (fabricRef.current) {
          fabricRef.current.dispose();
        }

        canvasRef.current.width = pdfDimensions.width;
        canvasRef.current.height = pdfDimensions.height;

        const canvas = new Canvas(canvasRef.current, {
          width: pdfDimensions.width,
          height: pdfDimensions.height,
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
  }, [pdfFile, pdfDimensions]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let cleanup: (() => void) | undefined;

    switch (tool) {
      
      case 'text':
        cleanup = TextTool({ canvas });
        break;
      case 'erase':
        cleanup = EraseTool({ canvas });
        break;
        case 'blur':
        cleanup = BlurTool({ canvas });
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
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">PDF Editor</h1>
      
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
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors duration-200 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload PDF
        </label>
      </div>

      {pdfFile && (
        <div className="flex justify-center gap-4 mb-8">
          {['blur', 'erase', 'text'].map((t) => (
            <button
              key={t}
              onClick={() => setTool(t as 'blur' | 'erase' | 'text')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                tool === t 
                  ? 'bg-blue-600 text-white shadow-md scale-105' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      {pdfFile && (
        <div className="flex flex-col items-center">
          <div className="relative bg-white p-4 rounded-lg shadow-lg">
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="mb-4"
            >
              <Page 
                pageNumber={currentPage}
                width={pdfDimensions.width}
                onLoadSuccess={({ width, height }) => setPdfDimensions({ width, height })}
              />
            </Document>
            
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${pdfDimensions.width}px`,
                height: `${pdfDimensions.height}px`,
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

          <div className="flex gap-4 items-center mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200"
            >
              ← Previous
            </button>
            <span className="text-gray-700 font-medium">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {pdfFile && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSavePDF}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save PDF
          </button>
        </div>
      )}
    </main>
  );
}
