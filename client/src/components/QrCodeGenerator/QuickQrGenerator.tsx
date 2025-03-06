import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateQrCode } from "@/utils/qrCodeUtils";
import { QrCodeOptions } from "@/pages/Home";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface QuickQrGeneratorProps {
  showBatchOptions: () => void;
}

import { QrCodeOptions } from "../../../shared/types";
import { ColorPicker } from "../ui/ColorPicker";

const QuickQrGenerator = ({ showBatchOptions }: QuickQrGeneratorProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [size, setSize] = useState(900); // Default for print applications
  const [generatedQrCode, setGeneratedQrCode] = useState<string | null>(null);
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");

  const qrOptions: QrCodeOptions = {
    size,
    margin: 4,
    format: "png",
    includeText: true,
    foregroundColor,
    backgroundColor
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSizeChange = (value: number[]) => {
    setSize(value[0]);
  };

  const validateUrl = (url: string): boolean => {
    // Basic URL validation - must start with http:// or https://
    return !!url.match(/^https?:\/\//i);
  };

  import { generateQrCode } from "../../lib/qrCodeGenerator";

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
      const dataUrl = await generateQrCode(url, qrOptions);
      setGeneratedQrCode(dataUrl);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    }

    try {
      const dataUrl = await generateQrCode(url, qrOptions);
      setGeneratedQrCode(dataUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    }
  };

  const downloadQrCode = () => {
    if (!generatedQrCode) return;
    
    const link = document.createElement("a");
    link.href = generatedQrCode;
    link.download = `qr-${new Date().getTime()}.${qrOptions.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      <Card className="w-full lg:w-1/2">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Quick QR Code Generator</CardTitle>
          <CardDescription>
            Generate a single QR code instantly from any URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={handleUrlChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size (pixels)</Label>
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
                  onChange={(e) => setSize(parseInt(e.target.value) || 250)}
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
                  className="w-full"
                />
              </div>
            </div>
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