import QRCodeStyling, { CornerSquareType, DotType, FileExtension } from '@solana/qr-code-styling';

// Log available types to help debugging
console.log('DotType options:', Object.values(DotType));
console.log('CornerSquareType options:', Object.values(CornerSquareType));

// This is a test function to verify the exact values accepted by the QR code library
export function testQrCodeTypes() {
  const dotTypes: DotType[] = ['dots', 'rounded', 'square', 'classy', 'classy-rounded'];
  const cornerSquareTypes: CornerSquareType[] = ['dot', 'square', 'extra-rounded'];
  
  console.log('DotType test:', dotTypes);
  console.log('CornerSquareType test:', cornerSquareTypes);
}