// src/components/rooms/PDFRenderer.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
// Note: In a real implementation, you'd need to include the PDF.js worker file
// and provide the workerSrc. For this implementation, we'll assume it's already set up.
if (typeof window !== 'undefined' && 'pdfjs' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

const PDFRenderer = ({ file, scale = 1, onRenderComplete }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!file) {
      setError("No PDF file provided");
      setLoading(false);
      return;
    }

    let isMounted = true;
    let renderTask = null;
    let pdfDocument = null;

    const renderPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the PDF
        const loadingTask = pdfjs.getDocument(file);
        pdfDocument = await loadingTask.promise;

        if (!isMounted) return;

        // Get the first page
        const page = await pdfDocument.getPage(1);
        if (!isMounted) return;

        // Get viewport for rendering
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        
        if (!canvas) {
          throw new Error("Canvas element not found");
        }

        // Set canvas dimensions to match viewport
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        setDimensions({
          width: viewport.width, 
          height: viewport.height
        });

        // Render the PDF page to the canvas
        const context = canvas.getContext('2d');
        renderTask = page.render({
          canvasContext: context,
          viewport
        });

        await renderTask.promise;
        
        if (!isMounted) return;
        
        setLoading(false);
        
        // Notify parent that rendering is complete
        if (onRenderComplete) {
          onRenderComplete({
            width: viewport.width,
            height: viewport.height
          });
        }

      } catch (err) {
        console.error("Error rendering PDF:", err);
        if (isMounted) {
          setError(`Failed to render PDF: ${err.message}`);
          setLoading(false);
        }
      }
    };

    renderPDF();

    // Cleanup function
    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [file, scale, onRenderComplete]);

  // Handle image fallback for development/testing
  const handleImageFallback = () => {
    if (!file) return;
    
    // If the file is a URL to a PDF but we can't render it with PDF.js,
    // try to display it as an image (for development/testing convenience)
    if (file.endsWith('.pdf')) {
      const imagePath = file.replace('.pdf', '.png');
      
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          context.drawImage(img, 0, 0);
          
          setDimensions({
            width: img.width * scale,
            height: img.height * scale
          });
          
          setLoading(false);
          setError(null);
          
          // Notify parent that rendering is complete
          if (onRenderComplete) {
            onRenderComplete({
              width: img.width * scale,
              height: img.height * scale
            });
          }
        }
      };
      
      img.onerror = () => {
        setError("Could not load PDF or image fallback");
        setLoading(false);
      };
      
      img.src = imagePath;
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 10
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography>Loading floor plan...</Typography>
        </Box>
      )}
      
      {error && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            zIndex: 10
          }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
            <Button 
              variant="text" 
              size="small" 
              onClick={handleImageFallback}
              sx={{ mt: 1 }}
            >
              Try image fallback
            </Button>
          </Alert>
        </Box>
      )}
      
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: dimensions.width ? dimensions.width : '100%',
          height: dimensions.height ? dimensions.height : '100%'
        }}
      />
    </Box>
  );
};

export default PDFRenderer;