
import QRCode from 'qrcode';
import { QrCodeOptions } from '../../shared/types';

/**
 * Generate a QR code as a data URL
 */
export const generateQrCode = async (text: string, options: QrCodeOptions): Promise<string> => {
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
    return await QRCode.toDataURL(text, opts);
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
};
