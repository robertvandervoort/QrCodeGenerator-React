import QRCodeStyling from '@solana/qr-code-styling';
import { QrCodeOptions } from '@/pages/Home';

/**
 * Generate a QR code as a data URL using QRCodeStyling library
 */
export const generateStyledQrCode = async (text: string, options: QrCodeOptions): Promise<string> => {
  try {
    // Map our dot style options to the library's options
    let dotType: string = 'square'; // default
    if (options.dotStyle === 'dots') {
      dotType = 'dots';
    } else if (options.dotStyle === 'rounded') {
      dotType = 'rounded';
    }
    
    // Map our corner style options to the library's options
    // The library only supports 'dot', 'square', or 'extra-rounded'
    let cornerType: string = 'square'; // default
    if (options.cornerStyle === 'extraRounded') {
      cornerType = 'extra-rounded';
    }
    
    // Create the QR code with styling options
    const qrCode = new QRCodeStyling({
      width: options.size,
      height: options.size,
      type: 'canvas',
      data: text,
      margin: options.margin || 4,
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.3,
        margin: 0,
      },
      dotsOptions: {
        type: dotType as any,
        color: options.foregroundColor || '#000000',
      },
      backgroundOptions: {
        color: options.backgroundColor || '#FFFFFF',
      },
      cornersSquareOptions: {
        type: cornerType as any,
        color: options.foregroundColor || '#000000',
      },
      cornersDotOptions: {
        type: 'dot',
        color: options.foregroundColor || '#000000',
      }
    });

    // Add image if specified
    if (options.centerImage) {
      qrCode.update({
        image: options.centerImage,
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: (options.centerImageSize || 20) / 100,
          margin: 5,
        }
      });
    }

    // Generate a data URL
    return new Promise((resolve) => {
      qrCode.getRawData('png').then((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } else {
          throw new Error('QR code generation failed');
        }
      });
    });
  } catch (error) {
    console.error('Error generating styled QR code:', error);
    throw new Error('Failed to generate styled QR code: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// Helper function to add text below the QR code
export const addTextToQrCode = (qrCodeDataUrl: string, text: string, options: QrCodeOptions): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();
      
      image.onload = () => {
        try {
          // Set canvas size to accommodate QR code and text
          canvas.width = image.width;
          // Add extra height for the text
          canvas.height = image.height + 40;
          
          if (ctx) {
            // Fill background
            ctx.fillStyle = options.backgroundColor || '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw QR code
            ctx.drawImage(image, 0, 0);
            
            // Draw text
            ctx.fillStyle = options.foregroundColor || '#000000';
            // Calculate font size based on QR code size
            const fontSize = Math.max(12, Math.min(16, Math.floor(image.width / 30)));
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            
            // Truncate text if too long
            const displayText = text.length > 50 ? text.substring(0, 47) + '...' : text;
            ctx.fillText(displayText, canvas.width / 2, image.height + 25);
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL(`image/${options.format}` || 'image/png');
            resolve(dataUrl);
          } else {
            resolve(qrCodeDataUrl);
          }
        } catch (err) {
          console.error('Error adding text to QR code:', err);
          resolve(qrCodeDataUrl);
        }
      };
      
      image.onerror = () => {
        console.error('Error loading QR code image for text addition');
        resolve(qrCodeDataUrl);
      };
      
      image.src = qrCodeDataUrl;
    } catch (err) {
      console.error('Error in addTextToQrCode:', err);
      resolve(qrCodeDataUrl);
    }
  });
};

// Helper function to add a frame around the QR code
export const addFrameToQrCode = (qrCodeDataUrl: string, options: QrCodeOptions): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (!options.frameStyle || options.frameStyle === 'none') {
        resolve(qrCodeDataUrl);
        return;
      }
      
      const qrImage = new Image();
      qrImage.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(qrCodeDataUrl);
            return;
          }
          
          // Frame calculations
          const frameWidthPercent = 3; // Fixed for scanning reliability
          const frameSize = Math.floor(qrImage.width * (frameWidthPercent / 100));
          
          // Make canvas larger to fit the frame
          canvas.width = qrImage.width + (frameSize * 2);
          canvas.height = qrImage.height + (frameSize * 2);
          
          // Fill background
          ctx.fillStyle = options.backgroundColor || '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the frame
          ctx.fillStyle = options.frameColor || options.foregroundColor || '#000000';
          
          if (options.frameStyle === 'simple') {
            // Simple frame
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = options.backgroundColor || '#FFFFFF';
            ctx.fillRect(frameSize, frameSize, qrImage.width, qrImage.height);
          } else if (options.frameStyle === 'double') {
            // Double frame
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
          
          // Draw the QR code in the center
          ctx.drawImage(qrImage, frameSize, frameSize);
          
          // Convert to data URL
          const dataUrl = canvas.toDataURL(`image/${options.format}` || 'image/png');
          resolve(dataUrl);
        } catch (err) {
          console.error('Error adding frame to QR code:', err);
          resolve(qrCodeDataUrl);
        }
      };
      
      qrImage.onerror = () => {
        console.error('Error loading QR code image for frame addition');
        resolve(qrCodeDataUrl);
      };
      
      qrImage.src = qrCodeDataUrl;
    } catch (err) {
      console.error('Error in addFrameToQrCode:', err);
      resolve(qrCodeDataUrl);
    }
  });
};

/**
 * Main function to generate a complete QR code with all options
 */
export const generateQrCode = async (text: string, options: QrCodeOptions, displayText?: string): Promise<string> => {
  try {
    // Generate the styled QR code
    let qrCodeDataUrl = await generateStyledQrCode(text, options);
    
    // Add frame if needed
    if (options.frameStyle && options.frameStyle !== 'none') {
      qrCodeDataUrl = await addFrameToQrCode(qrCodeDataUrl, options);
    }
    
    // Add text if needed
    if (options.includeText && displayText) {
      qrCodeDataUrl = await addTextToQrCode(qrCodeDataUrl, displayText, options);
    }
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error in QR code generation pipeline:', error);
    throw error;
  }
};