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
      if (!options.cornerStyle && !options.dotStyle && !options.frameStyle) {
        resolve(qrCodeDataUrl);
        return;
      }
      
      const originalCanvas = document.createElement('canvas');
      const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
      const qrImage = new Image();
      
      // Create a second canvas for the styled QR code
      const styledCanvas = document.createElement('canvas');
      const styledCtx = styledCanvas.getContext('2d');
      
      qrImage.onerror = (err) => {
        console.error('Error loading QR code image for styling:', err);
        resolve(qrCodeDataUrl); // Fallback to original QR code
      };
      
      qrImage.onload = () => {
        try {
          // Set canvas sizes based on the QR code
          originalCanvas.width = qrImage.width;
          originalCanvas.height = qrImage.height;
          styledCanvas.width = qrImage.width;
          styledCanvas.height = qrImage.height;
          
          if (!originalCtx || !styledCtx) {
            resolve(qrCodeDataUrl);
            return;
          }
          
          // Draw the original QR code to analyze its pixels
          originalCtx.drawImage(qrImage, 0, 0);
          
          // Fill background of the styled canvas
          styledCtx.fillStyle = options.backgroundColor || '#FFFFFF';
          styledCtx.fillRect(0, 0, styledCanvas.width, styledCanvas.height);
          
          // If a frame is requested, we need to make space for it
          let qrDrawSize = qrImage.width;
          let qrDrawX = 0;
          let qrDrawY = 0;
          let frameSize = 0;
          
          if (options.frameStyle && options.frameStyle !== 'none') {
            const frameWidth = Math.min(Math.max(options.frameWidth || 5, 1), 10);
            frameSize = Math.floor(qrImage.width * (frameWidth / 100));
            
            // Adjust QR code size and position
            qrDrawSize = qrImage.width - (frameSize * 2);
            qrDrawX = frameSize;
            qrDrawY = frameSize;
            
            // Draw frame
            styledCtx.fillStyle = options.frameColor || options.foregroundColor || '#000000';
            
            if (options.frameStyle === 'simple') {
              // Simple frame is just a border around the QR code
              styledCtx.fillRect(0, 0, qrImage.width, qrImage.height);
              styledCtx.fillStyle = options.backgroundColor || '#FFFFFF';
              styledCtx.fillRect(frameSize, frameSize, qrDrawSize, qrDrawSize);
            } else if (options.frameStyle === 'double') {
              // Double frame has an inner and outer border
              styledCtx.fillRect(0, 0, qrImage.width, qrImage.height);
              styledCtx.fillStyle = options.backgroundColor || '#FFFFFF';
              styledCtx.fillRect(frameSize / 2, frameSize / 2, 
                           qrImage.width - frameSize, qrImage.height - frameSize);
              styledCtx.fillStyle = options.frameColor || options.foregroundColor || '#000000';
              styledCtx.fillRect(frameSize, frameSize, 
                           qrImage.width - (frameSize * 2), qrImage.height - (frameSize * 2));
              styledCtx.fillStyle = options.backgroundColor || '#FFFFFF';
              styledCtx.fillRect(frameSize * 1.5, frameSize * 1.5, 
                           qrImage.width - (frameSize * 3), qrImage.height - (frameSize * 3));
            }
          }
          
          // Analyze the QR code to find the modules (dots)
          const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
          const pixelData = imageData.data;
          
          // QR code is black and white, so we can use a simple threshold
          // to determine if a pixel is part of a module (dot)
          const threshold = 128;
          const isLightPixel = (r: number, g: number, b: number) => (r + g + b) / 3 > threshold;
          
          // Detect the QR code module size and grid
          const moduleSize = Math.floor(qrDrawSize / 25); // QR codes are typically 21-25 modules across
          styledCtx.fillStyle = options.foregroundColor || '#000000';
          
          // Apply the required dot style
          for (let y = 0; y < qrDrawSize; y += moduleSize) {
            for (let x = 0; x < qrDrawSize; x += moduleSize) {
              // Sample the middle of the module in the original image
              const sampleX = Math.floor(x + moduleSize / 2);
              const sampleY = Math.floor(y + moduleSize / 2);
              
              // Get the pixel color at the sample point
              const pixelIndex = (sampleY * originalCanvas.width + sampleX) * 4;
              const r = pixelData[pixelIndex];
              const g = pixelData[pixelIndex + 1];
              const b = pixelData[pixelIndex + 2];
              
              // If it's a dark pixel (part of the QR code pattern)
              if (!isLightPixel(r, g, b)) {
                // Draw the module with the selected style
                const moduleX = qrDrawX + x;
                const moduleY = qrDrawY + y;
                
                if (options.dotStyle === 'square' || !options.dotStyle) {
                  // Default square modules
                  styledCtx.fillRect(moduleX, moduleY, moduleSize, moduleSize);
                } else if (options.dotStyle === 'dots') {
                  // Circular dots
                  const radius = moduleSize / 2;
                  styledCtx.beginPath();
                  styledCtx.arc(
                    moduleX + radius,
                    moduleY + radius,
                    radius * 0.85, // Slightly smaller than the module
                    0,
                    Math.PI * 2
                  );
                  styledCtx.fill();
                } else if (options.dotStyle === 'rounded') {
                  // Rounded square modules
                  const cornerRadius = moduleSize / 4;
                  styledCtx.beginPath();
                  roundRect(
                    styledCtx,
                    moduleX,
                    moduleY,
                    moduleSize,
                    moduleSize,
                    cornerRadius
                  );
                  styledCtx.fill();
                }
              }
            }
          }
          
          // Apply corner style to the finder patterns (the three large square patterns)
          // These are always in the corners of the QR code
          if (options.cornerStyle && options.cornerStyle !== 'square') {
            const cornerRadius = options.cornerRadius || 10;
            const radiusPercent = Math.min(Math.max(cornerRadius, 1), 50) / 100;
            const finderPatternSize = moduleSize * 7; // Finder patterns are 7x7 modules
            
            // Clear the areas where finder patterns are
            styledCtx.fillStyle = options.backgroundColor || '#FFFFFF';
            
            // Top-left finder pattern
            styledCtx.fillRect(qrDrawX, qrDrawY, finderPatternSize, finderPatternSize);
            
            // Top-right finder pattern (may not exist in smaller QR codes)
            styledCtx.fillRect(qrDrawX + qrDrawSize - finderPatternSize, qrDrawY, finderPatternSize, finderPatternSize);
            
            // Bottom-left finder pattern (may not exist in smaller QR codes)
            styledCtx.fillRect(qrDrawX, qrDrawY + qrDrawSize - finderPatternSize, finderPatternSize, finderPatternSize);
            
            // Redraw finder patterns with corners
            styledCtx.fillStyle = options.foregroundColor || '#000000';
            
            // Function to draw a styled finder pattern
            const drawFinderPattern = (x: number, y: number) => {
              const patternRadius = finderPatternSize;
              const innerPatternSize = finderPatternSize - 2 * moduleSize;
              const innerPatternRadius = radiusPercent * innerPatternSize;
              const coreSize = finderPatternSize - 4 * moduleSize;
              
              // Outer square with optional rounded corners
              styledCtx.beginPath();
              if (options.cornerStyle === 'rounded') {
                roundRect(styledCtx, x, y, patternRadius, patternRadius, radiusPercent * patternRadius);
              } else if (options.cornerStyle === 'extraRounded') {
                roundRect(styledCtx, x, y, patternRadius, patternRadius, radiusPercent * patternRadius * 1.5);
              } else {
                styledCtx.rect(x, y, patternRadius, patternRadius);
              }
              styledCtx.fill();
              
              // Inner white square
              styledCtx.fillStyle = options.backgroundColor || '#FFFFFF';
              styledCtx.beginPath();
              if (options.cornerStyle === 'rounded') {
                roundRect(styledCtx, x + moduleSize, y + moduleSize, innerPatternSize, innerPatternSize, innerPatternRadius);
              } else if (options.cornerStyle === 'extraRounded') {
                roundRect(styledCtx, x + moduleSize, y + moduleSize, innerPatternSize, innerPatternSize, innerPatternRadius * 1.5);
              } else {
                styledCtx.rect(x + moduleSize, y + moduleSize, innerPatternSize, innerPatternSize);
              }
              styledCtx.fill();
              
              // Core black square
              styledCtx.fillStyle = options.foregroundColor || '#000000';
              styledCtx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, coreSize, coreSize);
            };
            
            // Draw the styled finder patterns
            drawFinderPattern(qrDrawX, qrDrawY); // Top-left
            drawFinderPattern(qrDrawX + qrDrawSize - finderPatternSize, qrDrawY); // Top-right
            drawFinderPattern(qrDrawX, qrDrawY + qrDrawSize - finderPatternSize); // Bottom-left
          }
          
          // Convert to data URL
          const dataUrl = styledCanvas.toDataURL(`image/${options.format}` || 'image/png');
          resolve(dataUrl);
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

/**
 * Generate a QR code as a data URL
 */
export const generateQrCode = async (text: string, options: QrCodeOptions, displayText?: string): Promise<string> => {
  // When using center images, increase error correction level to 'H' (high)
  const opts: QRCode.QRCodeToDataURLOptions = {
    width: options.size,
    margin: options.margin,
    type: options.format as 'image/png' | 'image/jpeg' | 'image/webp',
    errorCorrectionLevel: options.centerImage ? 'H' : 'M', // Use high error correction when center image is used
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