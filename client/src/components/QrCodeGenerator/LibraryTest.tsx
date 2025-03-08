import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateQrCode } from '@/lib/qrCodeStyling';
import { QrCodeOptions } from '@/pages/Home';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testQrCodeTypes } from '@/lib/qrCodeTest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const LibraryTest = () => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [url, setUrl] = useState<string>('https://google.com');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Styling options state
  const [options, setOptions] = useState<QrCodeOptions>({
    size: 300,
    margin: 4,
    format: 'png',
    includeText: true,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    cornerStyle: 'square',
    dotStyle: 'square',
    frameStyle: 'none',
  });

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
      console.log('Generating url QR code:', {
        content: url,
        ...options
      });
      const dataUrl = await generateQrCode(url, options, url);
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating test QR code:', err);
      setError(`Error generating QR code: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a single option
  const updateOption = (key: keyof QrCodeOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    generateTestQrCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader>
        <CardTitle>QR Code Library Test</CardTitle>
        <CardDescription>
          Test the new QR code styling library with various options
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">URL to encode</Label>
              <Input 
                id="url" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="Enter URL"
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Styling Options</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cornerStyle">Corner Style</Label>
                  <Select 
                    value={options.cornerStyle}
                    onValueChange={(value) => updateOption('cornerStyle', value)}
                  >
                    <SelectTrigger id="cornerStyle">
                      <SelectValue placeholder="Select corner style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dotStyle">Dot Style</Label>
                  <Select 
                    value={options.dotStyle}
                    onValueChange={(value) => updateOption('dotStyle', value)}
                  >
                    <SelectTrigger id="dotStyle">
                      <SelectValue placeholder="Select dot style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frameStyle">Frame Style</Label>
                  <Select 
                    value={options.frameStyle}
                    onValueChange={(value) => updateOption('frameStyle', value)}
                  >
                    <SelectTrigger id="frameStyle">
                      <SelectValue placeholder="Select frame style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="thin">Thin</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="thick">Thick</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="foregroundColor">Foreground Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="foregroundColor" 
                      type="color" 
                      value={options.foregroundColor} 
                      onChange={(e) => updateOption('foregroundColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      value={options.foregroundColor} 
                      onChange={(e) => updateOption('foregroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="backgroundColor" 
                      type="color" 
                      value={options.backgroundColor} 
                      onChange={(e) => updateOption('backgroundColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      value={options.backgroundColor} 
                      onChange={(e) => updateOption('backgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="includeText">Include Text</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="includeText" 
                      checked={options.includeText} 
                      onCheckedChange={(checked) => updateOption('includeText', checked)}
                    />
                    <Label htmlFor="includeText" className="cursor-pointer">
                      {options.includeText ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
                {error}
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button onClick={testLibraryTypes} variant="outline">
                Test Library Types
              </Button>
              <Button onClick={generateTestQrCode} disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate QR Code'}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-full p-4 bg-gray-50 rounded-md flex items-center justify-center">
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
            <p className="text-sm text-gray-500 mt-2 text-center">
              Scan the code to test its functionality
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LibraryTest;