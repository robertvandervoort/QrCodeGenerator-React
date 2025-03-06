
import QRCode from 'qrcode';

// Define QrCodeOptions interface here to avoid circular imports
interface QrCodeOptions {
  size: number;
  margin: number;
  format: string;
  includeText?: boolean;
  foregroundColor?: string;
  backgroundColor?: string;
}

/**
 * Generate a QR code as a data URL
 */
export const generateQrCode = async (text: string, options: QrCodeOptions, displayText?: string): Promise<string> => {
  const opts: QRCode.QRCodeToDataURLOptions = {
    width: options.size,
    margin: options.margin,
    type: options.format as 'image/png' | 'image/jpeg' | 'image/webp',
    color: {
      dark: options.foregroundColor || '#000000',
      light: options.backgroundColor || '#FFFFFF'
    }
  };

  try {
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(text, opts);
    
    // If includeText is true, create a new canvas with the QR code and text
    if (options.includeText) {
      return addTextToQrCode(qrCodeDataUrl, displayText || text, options);
    }
    
    return qrCodeDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Add URL text below the QR code image
 */
const addTextToQrCode = (qrCodeDataUrl: string, text: string, options: QrCodeOptions): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    
    image.onload = () => {
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
        
        // Convert to data URL
        resolve(canvas.toDataURL(`image/${options.format}` || 'image/png'));
      } else {
        // Fallback if context not available
        resolve(qrCodeDataUrl);
      }
    };
    
    // Set the source of the image to the original QR code
    image.src = qrCodeDataUrl;
  });
};
