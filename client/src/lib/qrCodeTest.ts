import QRCodeStyling from '@solana/qr-code-styling';

// This is a test function to verify the exact values accepted by the QR code library
export function testQrCodeTypes() {
  // These are the dot types supported by the library
  const dotTypes = ['dots', 'rounded', 'square', 'classy', 'classy-rounded'];
  
  // These are the corner square types supported by the library
  const cornerSquareTypes = ['dot', 'square', 'extra-rounded'];
  
  console.log('DotType test:', dotTypes);
  console.log('CornerSquareType test:', cornerSquareTypes);
  
  // Create a simple QR code to test type compatibility
  const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    data: "Test QR Code",
    dotsOptions: {
      type: 'square',
      color: '#000000',
    },
    cornersSquareOptions: {
      type: 'square',
      color: '#000000',
    },
    cornersDotOptions: {
      type: 'dot',
      color: '#000000',
    }
  });
  
  console.log('QR code created successfully:', qrCode);
}