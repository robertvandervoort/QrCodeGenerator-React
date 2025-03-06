import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { generateQrCode } from "../../lib/qrCodeGenerator";
import { Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { QrCodeOptions } from '@/pages/Home';

interface QuickQrGeneratorProps {
  showBatchOptions: () => void;
}

const QuickQrGenerator = ({ showBatchOptions }: QuickQrGeneratorProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [size, setSize] = useState(900); // Default for print applications
  const [margin, setMargin] = useState(4);
  const [format, setFormat] = useState('png');
  const [includeText, setIncludeText] = useState(true);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [generatedQrCode, setGeneratedQrCode] = useState<string | null>(null);

  const handleSizeChange = (value: number[]) => {
    setSize(value[0]);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const validateUrl = (url: string): boolean => {
    // Basic URL validation - must start with http:// or https://
    return !!url.match(/^https?:\/\//i);
  };

  const generateSingleQrCode = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to generate a QR code.",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive"
      });
      return;
    }

    try {
      const options: QrCodeOptions = {
        size,
        margin,
        format,
        includeText,
        foregroundColor,
        backgroundColor
      };
      
      const qrCodeDataUrl = await generateQrCode(url, options);
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
    link.download = `qrcode-${new Date().getTime()}.${format}`;
    link.href = generatedQrCode;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Quick QR Code Generator</CardTitle>
          <CardDescription>
            Generate a single QR code instantly from any URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-medium text-gray-700">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={handleUrlChange}
              />
            </div>

            {/* Size Controls */}
            <div className="space-y-2">
              <Label htmlFor="size" className="text-sm font-medium text-gray-700">Size (pixels)</Label>
              <div className="flex gap-4 items-center">
                <div className="flex-grow">
                  <Slider
                    id="size-slider"
                    min={100}
                    max={1000}
                    step={10}
                    value={[size]}
                    onValueChange={handleSizeChange}
                  />
                </div>
                <div className="w-24">
                  <Input
                    id="size-input"
                    type="number"
                    min={100}
                    max={2000}
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value) || 900)}
                  />
                </div>
              </div>
            </div>

            {/* Margin Control */}
            <div className="space-y-2">
              <Label htmlFor="margin" className="text-sm font-medium text-gray-700">Margin (modules)</Label>
              <Input
                id="margin"
                type="number"
                min={0}
                max={10}
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value) || 4)}
              />
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="format" className="text-sm font-medium text-gray-700">Format</Label>
              <Select
                value={format}
                onValueChange={setFormat}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">QR Code Color</Label>
                <ColorPicker 
                  color={foregroundColor} 
                  onChange={setForegroundColor} 
                  label="QR Code Color"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Background Color</Label>
                <ColorPicker 
                  color={backgroundColor} 
                  onChange={setBackgroundColor} 
                  label="Background Color"
                />
              </div>
            </div>

            {/* Include Text Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-text"
                checked={includeText}
                onCheckedChange={(checked) => setIncludeText(checked === true)}
              />
              <Label htmlFor="include-text" className="text-sm text-gray-700">
                Include URL text below QR code
              </Label>
            </div>

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

      <Card className="w-full flex flex-col">
        <CardHeader>
          <CardTitle>QR Code Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-6 bg-gray-50 rounded-md">
          {generatedQrCode ? (
            <img 
              src={generatedQrCode} 
              alt="Generated QR Code" 
              className="max-w-full max-h-[400px] object-contain"
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