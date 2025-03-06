import QRCode from 'qrcode';

// Define QrCodeOptions interface here to avoid circular imports
interface QrCodeOptions {
  size: number;
  margin: number;
  format: string;
  includeText?: boolean;
  foregroundColor?: string;
  backgroundColor?: string;
  centerImage?: string; // Data URL for center image
  centerImageSize?: number; // Size of center image as percentage of QR code (1-30)
  centerImageIsClipArt?: boolean; // Whether the center image is clip art
  
  // QR Code Style Options
  cornerStyle?: 'square' | 'rounded' | 'extraRounded'; // Style of the QR code corners
  cornerRadius?: number; // Radius for rounded corners (1-50 as percentage)
  dotStyle?: 'square' | 'dots' | 'rounded'; // Style of the QR code modules/dots
  frameStyle?: 'none' | 'simple' | 'double'; // Frame around the QR code
  frameColor?: string; // Color of the frame
  frameWidth?: number; // Width of the frame (1-10)
}

// Helper function to draw a rounded rectangle
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  if (typeof ctx.roundRect === 'function') {
    // Use native roundRect if available
    ctx.roundRect(x, y, width, height, radius);
  } else {
    // Fallback implementation for browsers without native roundRect
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
};

/**
 * Add a center image to the QR code
 */
const addCenterImageToQrCode = (qrCodeDataUrl: string, centerImageUrl: string, options: QrCodeOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const qrImage = new Image();
      const centerImage = new Image();
      
      // Add error handling for images
      qrImage.onerror = (err) => {
        console.error('Error loading QR code image:', err);
        resolve(qrCodeDataUrl); // Fallback to original QR code
      };
      
      centerImage.onerror = (err) => {
        console.error('Error loading center image:', err);
        resolve(qrCodeDataUrl); // Fallback to original QR code
      };
      
      qrImage.onload = () => {
        try {
          canvas.width = qrImage.width;
          canvas.height = qrImage.height;
          
          if (ctx) {
            // Draw the QR code first
            ctx.drawImage(qrImage, 0, 0);
            
            // Calculate center image size (as percentage of QR code)
            // Limit size to be smaller for better QR code compatibility - max 25% of total size
            const centerImgSizePercent = Math.min(Math.max(options.centerImageSize || 20, 1), 25);
            const centerImgSize = centerImgSizePercent / 100 * qrImage.width;
            
            // Load center image
            centerImage.onload = () => {
              try {
                // Calculate position for center image
                const centerX = (qrImage.width - centerImgSize) / 2;
                const centerY = (qrImage.height - centerImgSize) / 2;
                
                // Use the chosen background color for the center image background
                ctx.fillStyle = options.backgroundColor || '#FFFFFF';
                
                // For clipart or small images, use a circular background
                if (options.centerImageIsClipArt || centerImgSizePercent < 15) {
                  // Draw circle background slightly larger than the image
                  ctx.beginPath();
                  ctx.arc(qrImage.width/2, qrImage.height/2, centerImgSize * 0.6, 0, Math.PI * 2);
                  ctx.fill();
                } else {
                  // For larger images, use a rounded rect background
                  const padding = centerImgSize * 0.1;
                  const radius = centerImgSize * 0.15;
                  roundRect(ctx, centerX - padding, centerY - padding, 
                           centerImgSize + (padding * 2), centerImgSize + (padding * 2), radius);
                  ctx.fill();
                }
                
                // Draw the center image - make it slightly smaller than the background
                const imageDrawSize = options.centerImageIsClipArt ? centerImgSize : centerImgSize * 0.95;
                const adjustedX = (qrImage.width - imageDrawSize) / 2;
                const adjustedY = (qrImage.height - imageDrawSize) / 2;
                ctx.drawImage(centerImage, adjustedX, adjustedY, imageDrawSize, imageDrawSize);
                
                // Convert to data URL
                const dataUrl = canvas.toDataURL(`image/${options.format}` || 'image/png');
                resolve(dataUrl);
              } catch (err) {
                console.error('Error processing center image:', err);
                resolve(qrCodeDataUrl); // Fallback to original QR code
              }
            };
            
            centerImage.src = centerImageUrl;
          } else {
            // Fallback if context not available
            resolve(qrCodeDataUrl);
          }
        } catch (err) {
          console.error('Error in QR image onload handler:', err);
          resolve(qrCodeDataUrl); // Fallback to original QR code
        }
      };
      
      qrImage.src = qrCodeDataUrl;
    } catch (err) {
      console.error('Error in addCenterImageToQrCode:', err);
      resolve(qrCodeDataUrl); // Fallback to original QR code
    }
  });
};

/**
 * Add URL text below the QR code image
 */
const addTextToQrCode = (qrCodeDataUrl: string, text: string, options: QrCodeOptions): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();
      
      // Add error handling
      image.onerror = (err) => {
        console.error('Error loading QR code image for text addition:', err);
        resolve(qrCodeDataUrl); // Fallback to original QR code
      };
      
      image.onload = () => {
        try {
          // Set canvas size to accommodate QR code and text
          canvas.width = image.width;
          // Add extra height for the text (approximately 30px)
          canvas.height = image.height + 40;
          
          if (ctx) {
            // Fill background
            ctx.fillStyle = options.backgroundColor || '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw QR code
            ctx.drawImage(image, 0, 0);
            
            // Draw text
            ctx.fillStyle = options.foregroundColor || '#000000';
            // Calculate font size based on QR code size (between 12px and 16px)
            const fontSize = Math.max(12, Math.min(16, Math.floor(image.width / 30)));
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            
            // Draw text centered below the QR code
            const displayText = text.length > 50 ? text.substring(0, 47) + '...' : text;
            ctx.fillText(displayText, canvas.width / 2, image.height + 25);
            
            try {
              // Convert to data URL
              const dataUrl = canvas.toDataURL(`image/${options.format}` || 'image/png');
              resolve(dataUrl);
            } catch (dataUrlErr) {
              console.error('Error creating data URL:', dataUrlErr);
              resolve(qrCodeDataUrl); // Fallback to original QR code
            }
          } else {
            // Fallback if context not available
            resolve(qrCodeDataUrl);
          }
        } catch (onloadErr) {
          console.error('Error in image onload handler for text addition:', onloadErr);
          resolve(qrCodeDataUrl); // Fallback to original QR code
        }
      };
      
      // Set the source of the image to the original QR code
      image.src = qrCodeDataUrl;
    } catch (err) {
      console.error('Error in addTextToQrCode:', err);
      resolve(qrCodeDataUrl); // Fallback to original QR code
    }
  });
};

/**
 * Apply styling options to a QR code
 */
const applyQrCodeStyling = (qrCodeDataUrl: string, options: QrCodeOptions): Promise<string> => {
  return new Promise((resolve) => {
    try {
      // If no styling options are specified, return the original QR code
      if ((!options.cornerStyle || options.cornerStyle === 'square') && 
          (!options.dotStyle || options.dotStyle === 'square') && 
          (!options.frameStyle || options.frameStyle === 'none')) {
        resolve(qrCodeDataUrl);
        return;
      }
      
      const qrImage = new Image();
      
      qrImage.onerror = (err) => {
        console.error('Error loading QR code image for styling:', err);
        resolve(qrCodeDataUrl); // Fallback to original QR code
      };
      
      // Define helper function for dot and corner styling
      const applyDotAndCornerStyling = (currentQrImage: HTMLImageElement) => {
        try {
          // We'll create a fresh QR code with advanced styling
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (!ctx) {
            resolve(qrCodeDataUrl);
            return;
          }
          
          canvas.width = currentQrImage.width;
          canvas.height = currentQrImage.height;
          
          // Fill with background color first
          ctx.fillStyle = options.backgroundColor || '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the original QR code as the base
          ctx.drawImage(currentQrImage, 0, 0);
          
          // First, identify the corner finder patterns that need special handling
          const moduleEstimate = Math.floor(currentQrImage.width / 25); // Approximate module size
          const finderSize = moduleEstimate * 7; // Finder patterns are 7x7 modules
          const padding = moduleEstimate / 2; // Add padding to ensure we find full finders
          
          // Store finder pattern positions (to be excluded from dot styling)
          const finderPositions = [
            [padding, padding, finderSize, finderSize], // Top-left
            [canvas.width - finderSize - padding, padding, finderSize, finderSize], // Top-right
            [padding, canvas.height - finderSize - padding, finderSize, finderSize] // Bottom-left
          ];
          
          // Only apply dot styling if requested
          if (options.dotStyle && options.dotStyle !== 'square') {
            // We need to completely redraw the QR code with dot styling
            // This approach solves the partial redraw problem
            
            // First, get the QR code data pattern (we need to know which modules are dark/light)
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            
            if (!tempCtx) {
              // If we can't get a context, skip dot styling
              console.warn('Could not get 2D context for dot styling');
            } else {
              tempCanvas.width = canvas.width;
              tempCanvas.height = canvas.height;
              
              // Draw the QR code onto the temp canvas
              tempCtx.drawImage(currentQrImage, 0, 0);
              
              // Get the pixel data to detect the QR code pattern
              const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
              const pixelData = imageData.data;
              
              // Now clear our main canvas and redraw the background
              ctx.fillStyle = options.backgroundColor || '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // QR code is black and white, so we can use a simple threshold
              const threshold = 128;
              const isLightPixel = (r: number, g: number, b: number) => (r + g + b) / 3 > threshold;
              
              // Define dot characteristics based on the module size
              const dotSize = moduleEstimate * 0.85; // Slightly smaller than a module
              
              // Check if the point is inside any finder pattern box
              const isInFinderArea = (x: number, y: number) => {
                return finderPositions.some(([fx, fy, fw, fh]) => 
                  x >= fx && x <= fx + fw && y >= fy && y <= fy + fh
                );
              };
              
              // Draw the QR code with the selected dot style
              // Use a fixed grid spacing for consistency
              const gridSize = Math.floor(canvas.width / 25); // This creates a reasonable grid
              
              for (let y = 0; y < canvas.height; y += gridSize) {
                for (let x = 0; x < canvas.width; x += gridSize) {
                  // Skip if in a finder pattern area
                  if (isInFinderArea(x, y)) continue;
                  
                  // Sample the center of each grid cell
                  const sampleX = Math.floor(x + gridSize / 2);
                  const sampleY = Math.floor(y + gridSize / 2);
                  
                  // Skip if out of bounds
                  if (sampleX >= canvas.width || sampleY >= canvas.height) continue;
                  
                  // Get pixel color at the sample point
                  const pixelIndex = (sampleY * canvas.width + sampleX) * 4;
                  const r = pixelData[pixelIndex];
                  const g = pixelData[pixelIndex + 1];
                  const b = pixelData[pixelIndex + 2];
                  
                  // If it's a dark pixel (part of the QR code)
                  if (!isLightPixel(r, g, b)) {
                    ctx.fillStyle = options.foregroundColor || '#000000';
                    
                    if (options.dotStyle === 'dots') {
                      // Circular dots - ensure they're big enough for scanning
                      const radius = gridSize * 0.45;
                      ctx.beginPath();
                      ctx.arc(
                        x + gridSize / 2,
                        y + gridSize / 2,
                        radius,
                        0,
                        Math.PI * 2
                      );
                      ctx.fill();
                    } else if (options.dotStyle === 'rounded') {
                      // Rounded square modules
                      const cornerRadius = gridSize / 5;
                      ctx.beginPath();
                      roundRect(
                        ctx,
                        x + gridSize * 0.1,
                        y + gridSize * 0.1,
                        gridSize * 0.8,
                        gridSize * 0.8,
                        cornerRadius
                      );
                      ctx.fill();
                    }
                  }
                }
              }
            }
          }
          
          // Apply corner styling to the finder patterns if requested
          if (options.cornerStyle && options.cornerStyle !== 'square') {
            // First completely clear each finder pattern area to remove the original pattern
            ctx.fillStyle = options.backgroundColor || '#FFFFFF';
            for (const [x, y, w, h] of finderPositions) {
              // Clear a slightly larger area to ensure complete coverage
              const padding = moduleEstimate / 4;
              ctx.fillRect(
                x - padding,
                y - padding,
                w + padding * 2,
                h + padding * 2
              );
            }
            
            // Now draw our custom styled finder patterns
            for (const [x, y, w, h] of finderPositions) {
              applyCornerStyleToFinder(ctx, x, y, w, options);
            }
          }
          
          // Convert the final result to a data URL
          const dataUrl = canvas.toDataURL(`image/${options.format}` || 'image/png');
          resolve(dataUrl);
        } catch (err) {
          console.error('Error in dot/corner styling:', err);
          resolve(qrCodeDataUrl); // Fallback to original
        }
      };
      
      qrImage.onload = () => {
        try {
          // First, let's handle just the frame style which is simpler and less likely to break scanning
          if (options.frameStyle && options.frameStyle !== 'none') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              resolve(qrCodeDataUrl);
              return;
            }
            
            // Frame calculations - use a fixed, scannable size regardless of user settings
            // This ensures QR codes remain readable even with frames
            const frameWidthPercent = 3; // Fixed at 3% of QR size for better scanning reliability
            const frameSize = Math.floor(qrImage.width * (frameWidthPercent / 100));
            
            // Make canvas slightly larger to accommodate the frame
            canvas.width = qrImage.width + (frameSize * 2);
            canvas.height = qrImage.height + (frameSize * 2);
            
            // Fill the background for the entire canvas
            ctx.fillStyle = options.backgroundColor || '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the frame
            ctx.fillStyle = options.frameColor || options.foregroundColor || '#000000';
            
            if (options.frameStyle === 'simple') {
              // Simple frame - draw outer rectangle then inner white rectangle
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = options.backgroundColor || '#FFFFFF';
              ctx.fillRect(frameSize, frameSize, qrImage.width, qrImage.height);
            } else if (options.frameStyle === 'double') {
              // Double frame - two concentric borders
              const innerFrameSize = frameSize / 2;
              
              // Outer frame
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Gap between frames
              ctx.fillStyle = options.backgroundColor || '#FFFFFF';
              ctx.fillRect(
                innerFrameSize, 
                innerFrameSize, 
                canvas.width - (innerFrameSize * 2), 
                canvas.height - (innerFrameSize * 2)
              );
              
              // Inner frame
              ctx.fillStyle = options.frameColor || options.foregroundColor || '#000000';
              ctx.fillRect(
                frameSize, 
                frameSize, 
                canvas.width - (frameSize * 2), 
                canvas.height - (frameSize * 2)
              );
              
              // Inner content area
              ctx.fillStyle = options.backgroundColor || '#FFFFFF';
              ctx.fillRect(
                frameSize + innerFrameSize, 
                frameSize + innerFrameSize, 
                qrImage.width, 
                qrImage.height
              );
            }
            
            // Draw the original QR code in the center
            ctx.drawImage(qrImage, frameSize, frameSize);
            
            // Convert to data URL and return it
            const dataUrl = canvas.toDataURL(`image/${options.format}` || 'image/png');
            
            // If only frame styling is requested, we're done
            if ((!options.cornerStyle || options.cornerStyle === 'square') && 
                (!options.dotStyle || options.dotStyle === 'square')) {
              resolve(dataUrl);
              return;
            }
            
            // Otherwise, load this framed QR code and continue with dot/corner styling
            const framedQrImage = new Image();
            framedQrImage.onload = () => {
              // Apply dot and corner styling to the framed QR code
              applyDotAndCornerStyling(framedQrImage);
            };
            framedQrImage.onerror = () => {
              // If loading the framed QR fails, just return it
              resolve(dataUrl);
            };
            framedQrImage.src = dataUrl;
            return;
          }
          
          // If we're here, either there's no frame or we've already applied it
          applyDotAndCornerStyling(qrImage);
          
        } catch (err) {
          console.error('Error applying QR code styling:', err);
          resolve(qrCodeDataUrl); // Fallback to original QR code
        }
      };
      
      qrImage.src = qrCodeDataUrl;
    } catch (err) {
      console.error('Error in applyQrCodeStyling:', err);
      resolve(qrCodeDataUrl); // Fallback to original QR code
    }
  });
};

// Helper function to apply corner styling to a finder pattern
const applyCornerStyleToFinder = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  options: QrCodeOptions
) => {
  // Save current context state
  ctx.save();
  
  const cornerRadius = options.cornerRadius || 10;
  // Ensure reasonable radius limits for scanner compatibility
  const radiusPercent = Math.min(Math.max(cornerRadius, 1), 30) / 100;
  const cornerRadiusPixels = radiusPercent * size;
  
  // Finder patterns must maintain proper proportions for scanning
  // Standard finder pattern is 7x7 modules with proper spacing
  const outerBorderWidth = size / 7; // 1/7 of finder size
  const innerSquareSize = size - (outerBorderWidth * 2); // 5/7 of finder size
  const innerBorderWidth = outerBorderWidth; // Same as outer border width
  const centerSize = innerSquareSize - (innerBorderWidth * 2); // 3/7 of finder size
  
  // Fill the finder area with background color first
  ctx.fillStyle = options.backgroundColor || '#FFFFFF';
  ctx.fillRect(x, y, size, size);
  
  // Calculate actual radius to use based on styling option
  let actualOuterRadius = 0;
  let actualInnerRadius = 0;
  
  if (options.cornerStyle === 'rounded') {
    actualOuterRadius = cornerRadiusPixels;
    actualInnerRadius = cornerRadiusPixels * 0.7;
  } else if (options.cornerStyle === 'extraRounded') {
    // For extra rounded, limit the radius to make sure it's still recognizable as a finder pattern
    actualOuterRadius = Math.min(cornerRadiusPixels * 1.5, size * 0.3);
    actualInnerRadius = Math.min(cornerRadiusPixels, size * 0.2);
  }
  
  // Draw outer square with rounded corners (limit the radius to ensure scanner compatibility)
  ctx.fillStyle = options.foregroundColor || '#000000';
  ctx.beginPath();
  roundRect(ctx, x, y, size, size, actualOuterRadius);
  ctx.fill();
  
  // Draw inner white square with rounded corners
  ctx.fillStyle = options.backgroundColor || '#FFFFFF';
  ctx.beginPath();
  roundRect(
    ctx,
    x + outerBorderWidth,
    y + outerBorderWidth,
    innerSquareSize,
    innerSquareSize,
    actualInnerRadius
  );
  ctx.fill();
  
  // Draw center black square (keep it square for better recognition)
  ctx.fillStyle = options.foregroundColor || '#000000';
  ctx.fillRect(
    x + outerBorderWidth + innerBorderWidth,
    y + outerBorderWidth + innerBorderWidth,
    centerSize,
    centerSize
  );
  
  // Restore context state
  ctx.restore();
};

/**
 * Generate a QR code as a data URL
 */
export const generateQrCode = async (text: string, options: QrCodeOptions, displayText?: string): Promise<string> => {
  // Determine error correction level based on styling options
  // - Level L (Low) = 7% error correction
  // - Level M (Medium) = 15% error correction
  // - Level Q (Quartile) = 25% error correction
  // - Level H (High) = 30% error correction
  
  // Use higher error correction when any styling or center image is used
  const needsHighErrorCorrection = 
    options.centerImage || 
    options.cornerStyle !== 'square' ||
    options.dotStyle !== 'square';
  
  // Use highest error correction when multiple styling features are used together
  const needsHighestErrorCorrection = 
    (options.cornerStyle !== 'square' && options.dotStyle !== 'square') ||
    (options.cornerStyle !== 'square' && options.centerImage) ||
    (options.dotStyle !== 'square' && options.centerImage);
  
  const errorCorrectionLevel = needsHighestErrorCorrection ? 'H' : (needsHighErrorCorrection ? 'Q' : 'M');
  
  const opts: QRCode.QRCodeToDataURLOptions = {
    width: options.size,
    margin: options.margin,
    type: options.format as 'image/png' | 'image/jpeg' | 'image/webp',
    errorCorrectionLevel: errorCorrectionLevel,
    color: {
      dark: options.foregroundColor || '#000000',
      light: options.backgroundColor || '#FFFFFF'
    }
  };

  try {
    // Generate QR code
    let qrCodeDataUrl = await QRCode.toDataURL(text, opts)
      .catch(err => {
        console.error('Error in QRCode.toDataURL:', err);
        throw new Error('Failed to generate QR code: ' + err.message);
      });
    
    // Apply styling options (frame, corner style, dot style)
    if (options.frameStyle || options.cornerStyle || options.dotStyle) {
      try {
        qrCodeDataUrl = await applyQrCodeStyling(qrCodeDataUrl, options);
      } catch (styleErr) {
        console.error('Error applying QR code styling:', styleErr);
        // Continue with the un-styled QR code if there's an error
      }
    }
    
    // If there's a center image, add it to the QR code
    if (options.centerImage) {
      try {
        qrCodeDataUrl = await addCenterImageToQrCode(qrCodeDataUrl, options.centerImage, options);
      } catch (centerImgErr) {
        console.error('Error adding center image:', centerImgErr);
        // Continue with the QR code without center image if there's an error
      }
    }
    
    // If includeText is true, create a new canvas with the QR code and text
    if (options.includeText) {
      try {
        return await addTextToQrCode(qrCodeDataUrl, displayText || text, options);
      } catch (textErr) {
        console.error('Error adding text to QR code:', textErr);
        // Return QR code without text if there's an error
        return qrCodeDataUrl;
      }
    }
    
    return qrCodeDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code: ' + (err instanceof Error ? err.message : String(err)));
  }
};