// src/components/common/PDFViewer.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import * as pdfjs from 'pdfjs-dist';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'pdfjs' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
} else {
  // Fallback worker path
  const pdfjsWorker = process.env.PUBLIC_URL + '/pdf.worker.min.js';
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Advanced PDF viewer component with error handling and fallbacks
 * 
 * @param {Object} props - Component props
 * @param {string} props.pdfUrl - URL to the PDF file
 * @param {number} props.scale - Scale factor for rendering (default: 1)
 * @param {Function} props.onRenderComplete - Callback when rendering is complete
 * @param {Function} props.onRenderError - Callback when rendering fails
 * @param {boolean} props.useFallbackImage - Try using image fallback on error
 */
const PDFViewer = ({ 
  pdfUrl, 
  scale = 1, 
  onRenderComplete,
  onRenderError,
  useFallbackImage = true,
  fallbackImageUrl,
  renderMode = 'canvas'  // 'canvas' or 'svg'
}) => {
  const canvasRef = useRef(null);
  const svgContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [usingFallback, setUsingFallback] = useState(false);

  // PDF rendering logic
  useEffect(() => {
    if (!pdfUrl) {
      setError("No PDF file provided");
      setLoading(false);
      if (onRenderError) onRenderError("No PDF file provided");
      return;
    }

    let isMounted = true;
    let renderTask = null;
    let pdfDocument = null;

    const renderPDF = async () => {
      if (renderMode === 'canvas' && !canvasRef.current) return;
      if (renderMode === 'svg' && !svgContainerRef.current) return;
      
      try {
        setLoading(true);
        setError(null);
        setUsingFallback(false);
        
        console.log(`Rendering PDF: ${pdfUrl} at scale ${scale} using ${renderMode} mode`);
        
        // Load the PDF
        const loadingTask = pdfjs.getDocument(pdfUrl);
        
        // Add progress callback
        loadingTask.onProgress = (progress) => {
          console.log(`Loading PDF: ${Math.round(progress.loaded / progress.total * 100)}%`);
        };
        
        pdfDocument = await loadingTask.promise;
        
        if (!isMounted) return;
        
        // Get the first page
        const page = await pdfDocument.getPage(1);
        if (!isMounted) return;
        
        // Get viewport for rendering
        const viewport = page.getViewport({ scale });

        // Set dimensions
        const newDimensions = {
          width: viewport.width,
          height: viewport.height
        };
        
        setDimensions(newDimensions);
        
        // Render based on mode
        if (renderMode === 'canvas') {
          const canvas = canvasRef.current;
          
          // Set canvas dimensions to match viewport
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Render the PDF page to the canvas
          const context = canvas.getContext('2d');
          renderTask = page.render({
            canvasContext: context,
            viewport
          });
        } else if (renderMode === 'svg') {
          // SVG rendering mode
          const container = svgContainerRef.current;
          
          // Clear previous content
          container.innerHTML = '';
          
          // Set up SVG rendering
          renderTask = page.getOperatorList().then(function (opList) {
            const svgGfx = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
            return svgGfx.getSVG(opList, viewport).then(function (svg) {
              container.appendChild(svg);
            });
          });
        }
        
        await renderTask;
        
        if (!isMounted) return;
        
        setLoading(false);
        
        // Notify parent that rendering is complete
        if (onRenderComplete) {
          onRenderComplete(newDimensions);
        }

      } catch (err) {
        console.error("Error rendering PDF:", err);
        if (isMounted) {
          const errorMessage = `Failed to render floor plan: ${err.message}`;
          setError(errorMessage);
          setLoading(false);
          
          // Notify parent of error
          if (onRenderError) {
            onRenderError(errorMessage);
          }
          
          // Try fallback if enabled and not already using fallback
          if (useFallbackImage && !usingFallback) {
            handleImageFallback();
          }
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
  }, [pdfUrl, scale, onRenderComplete, onRenderError, retryCount, renderMode, useFallbackImage, usingFallback]);

  // Handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Handle fallback to image if needed
  const handleImageFallback = () => {
    if (!pdfUrl) return;
    
    setUsingFallback(true);
    
    // Try to use a PNG version of the floor plan instead
    const imagePath = fallbackImageUrl || pdfUrl.replace('.pdf', '.png');
    console.log(`Attempting to load image fallback: ${imagePath}`);
    
    // Create an image
    const img = new Image();
    
    img.onload = () => {
      // If we have a canvas, draw the image on it
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        context.drawImage(img, 0, 0);
        
        // Update dimensions
        const newDimensions = {
          width: img.width,
          height: img.height
        };
        
        setDimensions(newDimensions);
        setLoading(false);
        setError(null);
        
        // Notify parent
        if (onRenderComplete) {
          onRenderComplete(newDimensions);
        }
      }
    };
    
    img.onerror = () => {
      setError("Could not load PDF or image fallback");
      setLoading(false);
      
      if (onRenderError) {
        onRenderError("Could not load PDF or image fallback");
      }
    };
    
    img.src = imagePath;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
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
          <Alert 
            severity="error" 
            sx={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start'
            }}
          >
            <Typography paragraph>{error}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
              >
                Try Again
              </Button>
              {useFallbackImage && !usingFallback && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleImageFallback}
                  startIcon={<ImageSearchIcon />}
                >
                  Try Image Fallback
                </Button>
              )}
            </Box>
          </Alert>
        </Box>
      )}
      
      {/* PDF Rendering Target */}
      {renderMode === 'canvas' ? (
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: loading ? 'none' : 'block',
            width: dimensions.width ? dimensions.width : '100%',
            height: dimensions.height ? dimensions.height : '100%' 
          }}
        />
      ) : (
        <div 
          ref={svgContainerRef}
          style={{ 
            width: '100%',
            height: '100%',
            display: loading ? 'none' : 'block'
          }}
        />
      )}
    </Box>
  );
};

export default PDFViewer;