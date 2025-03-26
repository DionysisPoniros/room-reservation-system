// src/components/rooms/PDFViewer.js - A dedicated component for rendering PDFs with interactive overlays
import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import * as pdfjs from 'pdfjs-dist';

// Set worker path
const pdfjsWorker = process.env.PUBLIC_URL + '/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFViewer = ({ pdfPath, scale = 1, onRenderComplete, roomOverlays = [], onRoomClick }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!pdfPath) {
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
        const loadingTask = pdfjs.getDocument(pdfPath);
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
  }, [pdfPath, scale, onRenderComplete]);

  // Handle fallback to image if needed
  const handleImageFallback = () => {
    if (!pdfPath) return;
    
    // Try to use a PNG version of the floor plan instead
    const imagePath = pdfPath.replace('.pdf', '.png');
    
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
  };

  return (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      {/* Loading indicator */}
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
      
      {/* Error message */}
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
            <Box sx={{ mt: 1 }}>
              <Button 
                variant="text" 
                size="small" 
                onClick={handleImageFallback}
              >
                Try image fallback
              </Button>
            </Box>
          </Alert>
        </Box>
      )}
      
      {/* PDF Canvas */}
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: dimensions.width ? dimensions.width : '100%',
          height: dimensions.height ? dimensions.height : '100%'
        }}
      />
      
      {/* Room overlay elements */}
      {!loading && !error && roomOverlays.map((overlay, index) => (
        <Box
          key={`room-${overlay.id || index}`}
          sx={{
            position: 'absolute',
            left: overlay.x,
            top: overlay.y,
            width: overlay.width,
            height: overlay.height,
            backgroundColor: overlay.isOccupied ? 
              'rgba(244, 67, 54, 0.7)' : 'rgba(76, 175, 80, 0.7)',
            border: '2px solid rgba(0, 0, 0, 0.3)',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            textShadow: '0 0 2px black',
            fontWeight: 'bold',
            overflow: 'hidden',
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transform: 'translateY(-1px)',
              zIndex: 2
            }
          }}
          onClick={() => onRoomClick && onRoomClick(overlay)}
        >
          {overlay.width > 60 && overlay.height > 20 ? overlay.label : ''}
        </Box>
      ))}
    </Box>
  );
};

export default PDFViewer;