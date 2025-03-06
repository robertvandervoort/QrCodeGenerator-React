import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { generateQrCode } from "../../lib/qrCodeGenerator";
import { Download } from 'lucide-react';
import { useToast } from "../ui/Toast";

interface QuickQrGeneratorProps {
  showBatchOptions: () => void;
}

const QuickQrGenerator = ({ showBatchOptions }: QuickQrGeneratorProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [generatedQrCode, setGeneratedQrCode] = useState<string | null>(null);

  const generateSingleQrCode = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const qrCodeDataUrl = await generateQrCode(url, {
        foregroundColor,
        backgroundColor,
      });
      setGeneratedQrCode(qrCodeDataUrl);
    } catch (error) {
      toast({
        title: "Error generating QR code",
        description: "Please try again with a valid URL",
        variant: "destructive",
      });
    }
  };

  const downloadQrCode = () => {
    if (!generatedQrCode) return;

    const link = document.createElement('a');
    link.download = `qrcode-${new Date().getTime()}.png`;
    link.href = generatedQrCode;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick QR Code Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL (e.g., https://example.com)"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker 
              color={foregroundColor} 
              onChange={setForegroundColor} 
              label="QR code color" 
            />
            <ColorPicker 
              color={backgroundColor} 
              onChange={setBackgroundColor} 
              label="Background color" 
            />
          </div>
          <div className="pt-2">
            <Button 
              onClick={generateSingleQrCode} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Generate QR Code
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={showBatchOptions}>
            Need to generate multiple QR codes?
          </Button>
          {generatedQrCode && (
            <Button variant="secondary" onClick={downloadQrCode}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="w-full lg:w-1/2 flex flex-col">
        <CardHeader>
          <CardTitle>QR Code Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-6 bg-gray-50 rounded-md">
          {generatedQrCode ? (
            <img 
              src={generatedQrCode} 
              alt="Generated QR Code" 
              className="max-w-full max-h-[300px] object-contain"
            />
          ) : (
            <div className="text-center text-gray-400">
              <div className="mb-2 text-6xl">🔍</div>
              <p>Your QR code will appear here</p>
              <p className="text-sm">Enter a URL and click Generate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickQrGenerator;