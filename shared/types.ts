
export interface QrCodeOptions {
  size: number;
  margin: number;
  format: string;
  includeText?: boolean;
  foregroundColor?: string;
  backgroundColor?: string;
}

export interface GeneratedQrCode {
  url: string;
  filename: string;
  dataUrl: string;
}
