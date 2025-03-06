import { QrCodeOptions } from '@/pages/Home';
import QRCode from 'qrcode';

export const generateQrCode = (
  url: string, 
  options: QrCodeOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!url) {
        throw new Error('URL is required');
      }
      
      // For SVG format
      if (options.format === 'svg') {
        QRCode.toString(url, {
          type: 'svg',
          width: options.size,
          margin: options.margin,
          errorCorrectionLevel: 'H',
          color: {
            dark: options.foregroundColor || '#000000',
            light: options.backgroundColor || '#FFFFFF'
          }
        }, (err, svgString) => {
          if (err) {
            reject(err);
            return;
          }
          
          // If text is to be included, add it to SVG
          if (options.includeText) {
            const textColor = options.foregroundColor || '#000000';
            // Insert text element before closing svg tag with matching color
            const svgWithText = svgString.replace('</svg>', 
              `<text x="${options.size / 2}" y="${options.size + 20}" font-family="Arial" font-size="12" text-anchor="middle" fill="${textColor}">${url}</text></svg>`);
            resolve('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgWithText));
          } else {
            resolve('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString));
          }
        });
        return;
      }
      
      // Create a temporary canvas element to render the QR code
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      // Set up dimensions
      const size = options.size;
      const margin = 20; // Margin for text
      const totalHeight = options.includeText ? size + margin + 30 : size;
      
      canvas.width = size;
      canvas.height = totalHeight;
      
      // Fill background with specified color
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Generate QR code directly to canvas
      QRCode.toCanvas(canvas, url, {
        width: size,
        margin: options.margin,
        color: {
          dark: options.foregroundColor || '#000000',
          light: options.backgroundColor || '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Add URL text if requested
        if (options.includeText) {
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = options.foregroundColor || '#000000';
          
          // Truncate URL if too long
          let displayUrl = url;
          if (url.length > 50) {
            displayUrl = url.substring(0, 47) + '...';
          }
          
          ctx.fillText(displayUrl, size / 2, size + 20);
        }
        
        // Convert to data URL
        if (options.format === 'jpeg') {
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          // Default to PNG
          resolve(canvas.toDataURL('image/png'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
