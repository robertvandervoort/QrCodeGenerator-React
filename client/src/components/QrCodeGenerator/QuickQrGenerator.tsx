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
import { Download, Link, Phone, Mail, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
// Define QrCodeOptions directly here to match the shared type
interface QrCodeOptions {
  size: number;
  margin: number;
  format: string;
  includeText?: boolean;
  foregroundColor?: string;
  backgroundColor?: string;
}

interface QuickQrGeneratorProps {
  showBatchOptions: () => void;
}

// QR code type definitions
type QrCodeType = 'url' | 'phone' | 'email' | 'vcard';

// vCard interface
interface VCardData {
  firstName: string;
  lastName: string;
  organization?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  note?: string;
}

// Email data interface
interface EmailData {
  email: string;
  subject?: string;
  body?: string;
}

const QuickQrGenerator = ({ showBatchOptions }: QuickQrGeneratorProps) => {
  const { toast } = useToast();
  
  // Common settings
  const [qrCodeType, setQrCodeType] = useState<QrCodeType>('url');
  const [size, setSize] = useState(900); // Default for print applications
  const [margin, setMargin] = useState(4);
  const [format, setFormat] = useState('png');
  const [includeText, setIncludeText] = useState(true);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [generatedQrCode, setGeneratedQrCode] = useState<string | null>(null);
  
  // URL type data
  const [url, setUrl] = useState('');
  
  // Phone type data
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Email type data
  const [emailData, setEmailData] = useState<EmailData>({
    email: '',
    subject: '',
    body: '',
  });
  
  // vCard type data
  const [vCardData, setVCardData] = useState<VCardData>({
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    email: '',
    phone: '',
    mobile: '',
    fax: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    note: '',
  });

  const handleSizeChange = (value: number[]) => {
    setSize(value[0]);
  };

  // Event handlers for different inputs
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };
  
  const handleEmailDataChange = (field: keyof EmailData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEmailData({ ...emailData, [field]: e.target.value });
  };
  
  const handleVCardDataChange = (field: keyof VCardData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setVCardData({ ...vCardData, [field]: e.target.value });
  };
  
  // Validation functions
  const validateUrl = (url: string): boolean => {
    // Basic URL validation - must start with http:// or https://
    return !!url.match(/^https?:\/\//i);
  };
  
  const validatePhoneNumber = (phone: string): boolean => {
    // Validate phone number with country code
    // Format should be: +[country code][number] e.g., +12025550123
    return !!phone.match(/^\+[1-9]\d{1,14}$/);
  };
  
  const validateEmail = (email: string): boolean => {
    // Basic email validation
    return !!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  // Function to create vCard format
  const createVCardData = (data: VCardData): string => {
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    
    // Add name
    if (data.firstName || data.lastName) {
      vcard += `N:${data.lastName};${data.firstName};;;\n`;
      vcard += `FN:${data.firstName} ${data.lastName}\n`;
    }
    
    // Add organization
    if (data.organization) {
      vcard += `ORG:${data.organization}\n`;
    }
    
    // Add title
    if (data.title) {
      vcard += `TITLE:${data.title}\n`;
    }
    
    // Add phone numbers
    if (data.phone) {
      vcard += `TEL;TYPE=WORK,VOICE:${data.phone}\n`;
    }
    if (data.mobile) {
      vcard += `TEL;TYPE=CELL,VOICE:${data.mobile}\n`;
    }
    if (data.fax) {
      vcard += `TEL;TYPE=FAX:${data.fax}\n`;
    }
    
    // Add email
    if (data.email) {
      vcard += `EMAIL;TYPE=PREF,INTERNET:${data.email}\n`;
    }
    
    // Add address
    if (data.street || data.city || data.state || data.zipCode || data.country) {
      vcard += `ADR;TYPE=WORK,PREF:;;${data.street};${data.city};${data.state};${data.zipCode};${data.country}\n`;
    }
    
    // Add website
    if (data.website) {
      vcard += `URL:${data.website}\n`;
    }
    
    // Add note
    if (data.note) {
      vcard += `NOTE:${data.note}\n`;
    }
    
    vcard += 'END:VCARD';
    return vcard;
  };

  const generateSingleQrCode = async () => {
    let qrContent = '';
    let displayContent = '';
    let valid = true;
    
    // Validate and prepare content based on QR code type
    switch (qrCodeType) {
      case 'url':
        if (!url) {
          toast({
            title: "URL Required",
            description: "Please enter a URL to generate a QR code.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        if (!validateUrl(url)) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid URL starting with http:// or https://",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        qrContent = url;
        displayContent = url;
        break;
        
      case 'phone':
        if (!phoneNumber) {
          toast({
            title: "Phone Number Required",
            description: "Please enter a phone number to generate a QR code.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        if (!validatePhoneNumber(phoneNumber)) {
          toast({
            title: "Invalid Phone Number",
            description: "Please enter a valid phone number with country code (e.g., +12025550123)",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        qrContent = `tel:${phoneNumber}`;
        displayContent = phoneNumber;
        break;
        
      case 'email':
        if (!emailData.email) {
          toast({
            title: "Email Required",
            description: "Please enter an email address to generate a QR code.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        if (!validateEmail(emailData.email)) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        // Create mailto link with optional subject and body
        qrContent = `mailto:${emailData.email}`;
        if (emailData.subject || emailData.body) {
          qrContent += '?';
          if (emailData.subject) {
            qrContent += `subject=${encodeURIComponent(emailData.subject)}`;
          }
          if (emailData.subject && emailData.body) {
            qrContent += '&';
          }
          if (emailData.body) {
            qrContent += `body=${encodeURIComponent(emailData.body)}`;
          }
        }
        
        displayContent = emailData.email;
        break;
        
      case 'vcard':
        if (!vCardData.firstName || !vCardData.lastName) {
          toast({
            title: "Name Required",
            description: "First and last name are required for vCard QR codes.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        // Create vCard format string
        qrContent = createVCardData(vCardData);
        displayContent = `${vCardData.firstName} ${vCardData.lastName}`;
        break;
    }
    
    if (!valid) return;
    
    try {
      const options: QrCodeOptions = {
        size,
        margin,
        format,
        includeText: includeText ? true : false,
        foregroundColor,
        backgroundColor
      };
      
      console.log(`Generating ${qrCodeType} QR code:`, { content: qrContent, ...options });
      const qrCodeDataUrl = await generateQrCode(qrContent, options, displayContent);
      setGeneratedQrCode(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error generating QR code",
        description: "Please check your input and try again",
        variant: "destructive",
      });
    }
  };

  const downloadQrCode = () => {
    if (!generatedQrCode) return;

    const link = document.createElement('a');
    // Create a meaningful filename based on QR code type
    let filename = '';
    
    switch (qrCodeType) {
      case 'url':
        // Extract domain from URL for filename
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace('www.', '');
          filename = `url-${domain}`;
        } catch {
          filename = 'url-qrcode';
        }
        break;
        
      case 'phone':
        // Use last 4 digits of phone number if available
        const digits = phoneNumber.replace(/\D/g, '');
        const last4 = digits.length > 4 ? digits.slice(-4) : digits;
        filename = `phone-${last4}`;
        break;
        
      case 'email':
        // Use email username for filename
        const emailPrefix = emailData.email.split('@')[0] || 'email';
        filename = `email-${emailPrefix}`;
        break;
        
      case 'vcard':
        // Use person's name for filename
        filename = `vcard-${vCardData.firstName.toLowerCase()}-${vCardData.lastName.toLowerCase()}`;
        break;
        
      default:
        filename = 'qrcode';
    }
    
    // Add timestamp and format
    link.download = `${filename}-${new Date().getTime()}.${format}`;
    link.href = generatedQrCode;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-600">Quick QR Code Generator</CardTitle>
          <CardDescription>
            Generate a single QR code for different purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* QR Code Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="qr-type" className="text-sm font-medium text-gray-700">QR Code Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={qrCodeType === 'url' ? 'default' : 'outline'}
                  className={qrCodeType === 'url' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}
                  onClick={() => setQrCodeType('url')}
                >
                  <Link className="h-4 w-4 mr-2" /> URL
                </Button>
                <Button
                  type="button"
                  variant={qrCodeType === 'phone' ? 'default' : 'outline'}
                  className={qrCodeType === 'phone' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}
                  onClick={() => setQrCodeType('phone')}
                >
                  <Phone className="h-4 w-4 mr-2" /> Phone
                </Button>
                <Button
                  type="button"
                  variant={qrCodeType === 'email' ? 'default' : 'outline'}
                  className={qrCodeType === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}
                  onClick={() => setQrCodeType('email')}
                >
                  <Mail className="h-4 w-4 mr-2" /> Email
                </Button>
                <Button
                  type="button"
                  variant={qrCodeType === 'vcard' ? 'default' : 'outline'}
                  className={qrCodeType === 'vcard' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}
                  onClick={() => setQrCodeType('vcard')}
                >
                  <User className="h-4 w-4 mr-2" /> vCard
                </Button>
              </div>
            </div>
            
            {/* Dynamic input form based on QR code type */}
            {qrCodeType === 'url' && (
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
            )}
            
            {qrCodeType === 'phone' && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number (with country code)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+12025550123"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                />
                <p className="text-xs text-gray-500">
                  Format: +[country code][number] (e.g., +12025550123)
                </p>
              </div>
            )}
            
            {qrCodeType === 'email' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={emailData.email}
                    onChange={handleEmailDataChange('email')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject (optional)</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Email subject"
                    value={emailData.subject}
                    onChange={handleEmailDataChange('subject')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body" className="text-sm font-medium text-gray-700">Body (optional)</Label>
                  <Textarea
                    id="body"
                    placeholder="Email body text"
                    value={emailData.body}
                    onChange={handleEmailDataChange('body')}
                    rows={4}
                  />
                </div>
              </div>
            )}
            
            {qrCodeType === 'vcard' && (
              <div className="space-y-4 border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-700">Contact Information</h3>
                
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      required
                      placeholder="John"
                      value={vCardData.firstName}
                      onChange={handleVCardDataChange('firstName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      required
                      placeholder="Doe"
                      value={vCardData.lastName}
                      onChange={handleVCardDataChange('lastName')}
                    />
                  </div>
                </div>
                
                {/* Job info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-sm font-medium text-gray-700">Organization</Label>
                    <Input
                      id="organization"
                      type="text"
                      placeholder="Company Name"
                      value={vCardData.organization}
                      onChange={handleVCardDataChange('organization')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">Job Title</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Software Engineer"
                      value={vCardData.title}
                      onChange={handleVCardDataChange('title')}
                    />
                  </div>
                </div>
                
                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vcardEmail" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="vcardEmail"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={vCardData.email}
                      onChange={handleVCardDataChange('email')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vcardPhone" className="text-sm font-medium text-gray-700">Work Phone</Label>
                    <Input
                      id="vcardPhone"
                      type="tel"
                      placeholder="+12345678901"
                      value={vCardData.phone}
                      onChange={handleVCardDataChange('phone')}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">Mobile Phone</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="+12345678901"
                      value={vCardData.mobile}
                      onChange={handleVCardDataChange('mobile')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={vCardData.website}
                      onChange={handleVCardDataChange('website')}
                    />
                  </div>
                </div>
                
                {/* Address */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-medium text-gray-700">Address (optional)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-sm font-medium text-gray-700">Street</Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder="123 Main St"
                      value={vCardData.street}
                      onChange={handleVCardDataChange('street')}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Anytown"
                        value={vCardData.city}
                        onChange={handleVCardDataChange('city')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium text-gray-700">State/Province</Label>
                      <Input
                        id="state"
                        type="text"
                        placeholder="CA"
                        value={vCardData.state}
                        onChange={handleVCardDataChange('state')}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">Postal/ZIP Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="12345"
                        value={vCardData.zipCode}
                        onChange={handleVCardDataChange('zipCode')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
                      <Input
                        id="country"
                        type="text"
                        placeholder="United States"
                        value={vCardData.country}
                        onChange={handleVCardDataChange('country')}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-medium text-gray-700">Note</Label>
                  <Textarea
                    id="note"
                    placeholder="Additional information"
                    value={vCardData.note}
                    onChange={handleVCardDataChange('note')}
                    rows={3}
                  />
                </div>
              </div>
            )}

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
                <ColorPicker 
                  color={foregroundColor} 
                  onChange={setForegroundColor} 
                  label="QR Code Color"
                />
              </div>
              <div>
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
                {qrCodeType === 'url' && 'Include URL text below QR code'}
                {qrCodeType === 'phone' && 'Include phone number below QR code'}
                {qrCodeType === 'email' && 'Include email address below QR code'}
                {qrCodeType === 'vcard' && 'Include contact name below QR code'}
              </Label>
            </div>

            <Button 
              onClick={generateSingleQrCode} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {qrCodeType === 'url' && <><Link className="h-4 w-4 mr-2" /> Generate URL QR Code</>}
              {qrCodeType === 'phone' && <><Phone className="h-4 w-4 mr-2" /> Generate Phone QR Code</>}
              {qrCodeType === 'email' && <><Mail className="h-4 w-4 mr-2" /> Generate Email QR Code</>}
              {qrCodeType === 'vcard' && <><User className="h-4 w-4 mr-2" /> Generate vCard QR Code</>}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button 
            variant="outline" 
            onClick={showBatchOptions}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Need to generate multiple QR codes?
          </Button>
          {generatedQrCode && (
            <Button 
              onClick={downloadQrCode}
              className="inline-flex items-center bg-green-500 hover:bg-green-600 text-black font-bold"
            >
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
              <p className="text-sm">
                {qrCodeType === 'url' && 'Enter a URL and click Generate'}
                {qrCodeType === 'phone' && 'Enter a phone number and click Generate'}
                {qrCodeType === 'email' && 'Enter an email address and click Generate'}
                {qrCodeType === 'vcard' && 'Fill in the contact info and click Generate'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickQrGenerator;