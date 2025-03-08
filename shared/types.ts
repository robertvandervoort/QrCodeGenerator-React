
export interface QrCodeOptions {
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
  cornerStyle?: 'square' | 'rounded'; // Style of the QR code corners (square or rounded)
  dotStyle?: 'square' | 'dots' | 'rounded'; // Style of the QR code modules/dots
  frameStyle?: 'none' | 'thin' | 'medium' | 'thick'; // Frame thickness
  frameColor?: string; // Color of the frame
}

export interface GeneratedQrCode {
  url: string;
  filename: string;
  dataUrl: string;
}
