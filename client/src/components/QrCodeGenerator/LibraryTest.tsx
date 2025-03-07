import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateQrCode } from '@/lib/qrCodeStyling';
import { QrCodeOptions } from '@/pages/Home';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testQrCodeTypes } from '@/lib/qrCodeTest';

const LibraryTest = () => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [url, setUrl] = useState<string>('https://example.com');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Default QR code styling options
  const defaultOptions: QrCodeOptions = {
    size: 300,
    margin: 4,
    format: 'png',
    includeText: true,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    cornerStyle: 'square',
    dotStyle: 'square',
    frameStyle: 'none',
  };

  const testLibraryTypes = () => {
    try {
      testQrCodeTypes();
      console.log('Library type test completed');
    } catch (err) {
      console.error('Error testing library types:', err);
      setError(`Error testing library types: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const generateTestQrCode = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dataUrl = await generateQrCode(url, defaultOptions, url);
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating test QR code:', err);
      setError(`Error generating QR code: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateTestQrCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-full max-w-lg mx-auto my-8">
      <CardHeader>
        <CardTitle>QR Code Library Test</CardTitle>
        <CardDescription>
          This is a test component for the new QR code styling library
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL to encode</Label>
          <Input 
            id="url" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            placeholder="Enter URL"
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
            {error}
          </div>
        )}
        
        <div className="flex justify-center p-4 bg-gray-50 rounded-md">
          {isLoading ? (
            <div className="text-center p-8">Loading...</div>
          ) : qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Generated QR Code" 
              className="max-w-full max-h-[300px]"
            />
          ) : (
            <div className="text-center p-8">QR code will appear here</div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button onClick={testLibraryTypes} variant="outline">
          Test Library Types
        </Button>
        <Button onClick={generateTestQrCode} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate QR Code'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LibraryTest;