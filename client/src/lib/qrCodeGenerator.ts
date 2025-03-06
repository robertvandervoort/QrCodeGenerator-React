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