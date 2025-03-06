import { QrCodeOptions } from '@/pages/Home';
import { generateQrCode as qrCodeGenerator } from '@/lib/qrCodeGenerator';

// This is a wrapper around our enhanced QR code generator library
export const generateQrCode = async (
  url: string, 
  options: QrCodeOptions
): Promise<string> => {
  try {
    if (!url) {
      throw new Error('URL is required');
    }
    
    // Use our enhanced QR code generator that supports center images 
    // and maintains consistent styling across the application
    return await qrCodeGenerator(url, options, url);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};
