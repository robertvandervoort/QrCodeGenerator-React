import { QrCodeOptions } from '@/pages/Home';
// Import the new QR code styling library
import { generateQrCode as qrCodeGenerator } from '@/lib/qrCodeStyling';

// This is a wrapper around our enhanced QR code generator library
export const generateQrCode = async (
  url: string, 
  options: QrCodeOptions
): Promise<string> => {
  try {
    if (!url) {
      throw new Error('URL is required');
    }
    
    console.log(`Generating ${url.substring(0, 20)}... QR code with options:`, options);
    
    // Use our new styled QR code generator that supports multiple styling options
    // and maintains consistent styling across the application
    return await qrCodeGenerator(url, options, url);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};
