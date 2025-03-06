
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
  cornerStyle?: 'square' | 'rounded' | 'extraRounded'; // Style of the QR code corners
  cornerRadius?: number; // Radius for rounded corners (1-50 as percentage)
  dotStyle?: 'square' | 'dots' | 'rounded'; // Style of the QR code modules/dots
  frameStyle?: 'none' | 'simple' | 'double'; // Frame around the QR code
  frameColor?: string; // Color of the frame
  frameWidth?: number; // Width of the frame (1-10)
}

export interface GeneratedQrCode {
  url: string;
  filename: string;
  dataUrl: string;
}
