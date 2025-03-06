import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateQrCode } from "../../lib/qrCodeGenerator";
import { getClipArtDataUrl, fileToDataUrl } from "../../lib/clipart";
import { 
  Download, Link, Phone, Mail, User, 
  Wifi, MessageSquare, MapPin, Calendar,
  Image, X
} from 'lucide-react';
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
  centerImage?: string; // Data URL for center image
  centerImageSize?: number; // Size of center image as percentage of QR code (1-30)
  centerImageIsClipArt?: boolean; // Whether the center image is clip art
}

interface QuickQrGeneratorProps {
  showBatchOptions: () => void;
}

// QR code type definitions
type QrCodeType = 'url' | 'phone' | 'email' | 'vcard' | 'wifi' | 'sms' | 'geo' | 'calendar';

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

// WiFi network interface
interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WEP' | 'WPA' | 'WPA2-EAP' | 'nopass';
  hidden: boolean;
}

// SMS message interface
interface SmsData {
  phoneNumber: string;
  message: string;
}

// Geographic location interface
interface GeoData {
  latitude: string;
  longitude: string;
  altitude?: string;
}

// Calendar event interface
interface CalendarData {
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
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
  
  // Center image settings
  const [useCenterImage, setUseCenterImage] = useState(false);
  const [centerImageType, setCenterImageType] = useState<'clipart' | 'custom'>('clipart');
  const [centerImage, setCenterImage] = useState<string | null>(null);
  const [centerImageSize, setCenterImageSize] = useState(20); // Default 20% of QR code size
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // WiFi type data
  const [wifiData, setWifiData] = useState<WifiData>({
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false
  });
  
  // SMS type data
  const [smsData, setSmsData] = useState<SmsData>({
    phoneNumber: '',
    message: ''
  });
  
  // Geographic location type data
  const [geoData, setGeoData] = useState<GeoData>({
    latitude: '',
    longitude: '',
    altitude: ''
  });
  
  // Calendar event type data
  const [calendarData, setCalendarData] = useState<CalendarData>({
    summary: '',
    start: '',
    end: '',
    location: '',
    description: ''
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
  
  // Event handlers for wifi data
  const handleWifiDataChange = (field: keyof WifiData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (field === 'hidden') {
      setWifiData({ ...wifiData, hidden: (e.target as HTMLInputElement).checked });
    } else if (field === 'encryption') {
      setWifiData({ ...wifiData, encryption: e.target.value as WifiData['encryption'] });
    } else {
      setWifiData({ ...wifiData, [field]: e.target.value });
    }
  };
  
  // Event handlers for SMS data
  const handleSmsDataChange = (field: keyof SmsData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSmsData({ ...smsData, [field]: e.target.value });
  };
  
  // Event handlers for geographic location data
  const handleGeoDataChange = (field: keyof GeoData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setGeoData({ ...geoData, [field]: e.target.value });
  };
  
  // Event handlers for calendar data
  const handleCalendarDataChange = (field: keyof CalendarData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCalendarData({ ...calendarData, [field]: e.target.value });
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
  
  // Function to create WiFi network QR code content
  const createWifiData = (data: WifiData): string => {
    // Format: WIFI:T:WPA;S:SSID;P:PASSWORD;H:true/false;;
    let wifi = 'WIFI:';
    wifi += `T:${data.encryption};`;
    wifi += `S:${data.ssid};`;
    
    if (data.password && data.encryption !== 'nopass') {
      wifi += `P:${data.password};`;
    }
    
    if (data.hidden) {
      wifi += 'H:true;';
    }
    
    wifi += ';';
    return wifi;
  };
  
  // Function to create SMS QR code content
  const createSmsData = (data: SmsData): string => {
    // Format: SMSTO:PHONE_NUMBER:MESSAGE
    let sms = `SMSTO:${data.phoneNumber}:`;
    if (data.message) {
      sms += data.message;
    }
    return sms;
  };
  
  // Function to create geographic location QR code content
  const createGeoData = (data: GeoData): string => {
    // Format: geo:latitude,longitude,altitude
    let geo = `geo:${data.latitude},${data.longitude}`;
    if (data.altitude) {
      geo += `,${data.altitude}`;
    }
    return geo;
  };
  
  // Function to create calendar event QR code content
  const createCalendarData = (data: CalendarData): string => {
    // Format: BEGIN:VEVENT ... END:VEVENT
    let calendar = 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n';
    
    // Required properties
    calendar += `SUMMARY:${data.summary}\n`;
    calendar += `DTSTART:${formatCalendarDate(data.start)}\n`;
    calendar += `DTEND:${formatCalendarDate(data.end)}\n`;
    
    // Optional properties
    if (data.location) {
      calendar += `LOCATION:${data.location}\n`;
    }
    
    if (data.description) {
      calendar += `DESCRIPTION:${data.description}\n`;
    }
    
    calendar += 'END:VEVENT\nEND:VCALENDAR';
    return calendar;
  };
  
  // Helper function to format date for calendar events
  const formatCalendarDate = (dateString: string): string => {
    // Convert from yyyy-MM-ddThh:mm to yyyyMMddThhmmssZ format
    try {
      const date = new Date(dateString);
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    } catch (e) {
      return dateString.replace(/[-:]/g, '');
    }
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
        
      case 'wifi':
        if (!wifiData.ssid) {
          toast({
            title: "Network Name (SSID) Required",
            description: "Please enter the WiFi network name.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        if (wifiData.encryption !== 'nopass' && !wifiData.password) {
          toast({
            title: "Password Required",
            description: "Please enter the WiFi password or select 'No Password' encryption.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        qrContent = createWifiData(wifiData);
        displayContent = wifiData.ssid;
        break;
        
      case 'sms':
        if (!smsData.phoneNumber) {
          toast({
            title: "Phone Number Required",
            description: "Please enter a phone number for the SMS.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        if (!validatePhoneNumber(smsData.phoneNumber)) {
          toast({
            title: "Invalid Phone Number",
            description: "Please enter a valid phone number with country code (e.g., +12025550123)",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        qrContent = createSmsData(smsData);
        displayContent = smsData.phoneNumber;
        break;
        
      case 'geo':
        if (!geoData.latitude || !geoData.longitude) {
          toast({
            title: "Coordinates Required",
            description: "Please enter both latitude and longitude.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        // Basic validation for latitude (-90 to 90) and longitude (-180 to 180)
        const lat = parseFloat(geoData.latitude);
        const lng = parseFloat(geoData.longitude);
        
        if (isNaN(lat) || lat < -90 || lat > 90) {
          toast({
            title: "Invalid Latitude",
            description: "Latitude must be a number between -90 and 90.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        if (isNaN(lng) || lng < -180 || lng > 180) {
          toast({
            title: "Invalid Longitude",
            description: "Longitude must be a number between -180 and 180.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        qrContent = createGeoData(geoData);
        displayContent = `${geoData.latitude},${geoData.longitude}`;
        break;
        
      case 'calendar':
        if (!calendarData.summary) {
          toast({
            title: "Event Title Required",
            description: "Please enter a title for the event.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        if (!calendarData.start || !calendarData.end) {
          toast({
            title: "Event Dates Required",
            description: "Please enter both start and end dates for the event.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        // Check that end date is after start date
        const startDate = new Date(calendarData.start);
        const endDate = new Date(calendarData.end);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          toast({
            title: "Invalid Dates",
            description: "Please enter valid dates in the format YYYY-MM-DDTHH:MM.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        if (endDate < startDate) {
          toast({
            title: "Invalid Date Range",
            description: "End date must be after start date.",
            variant: "destructive"
          });
          valid = false;
          break;
        }
        
        qrContent = createCalendarData(calendarData);
        displayContent = calendarData.summary;
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
        backgroundColor,
        // Add center image if enabled
        ...(useCenterImage && centerImage && {
          centerImage,
          centerImageSize,
          centerImageIsClipArt: centerImageType === 'clipart'
        })
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
        const phoneDigits = phoneNumber.replace(/\D/g, '');
        const phoneLast4 = phoneDigits.length > 4 ? phoneDigits.slice(-4) : phoneDigits;
        filename = `phone-${phoneLast4}`;
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
        
      case 'wifi':
        // Use network name for filename
        const networkName = wifiData.ssid.replace(/\s+/g, '-').toLowerCase();
        filename = `wifi-${networkName}`;
        break;
        
      case 'sms':
        // Use phone number for filename
        const smsDigits = smsData.phoneNumber.replace(/\D/g, '');
        const smsLast4 = smsDigits.length > 4 ? smsDigits.slice(-4) : smsDigits;
        filename = `sms-${smsLast4}`;
        break;
        
      case 'geo':
        // Use coordinates for filename
        const latCoord = parseFloat(geoData.latitude).toFixed(2);
        const lngCoord = parseFloat(geoData.longitude).toFixed(2);
        filename = `geo-${latCoord}_${lngCoord}`;
        break;
        
      case 'calendar':
        // Use event name for filename
        const eventName = calendarData.summary.replace(/\s+/g, '-').toLowerCase();
        filename = `calendar-${eventName}`;
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
                {/* First row of QR code types */}
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
                
                {/* Second row of QR code types */}
                <Button
                  type="button"
                  variant={qrCodeType === 'wifi' ? 'default' : 'outline'}
                  className={qrCodeType === 'wifi' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}
                  onClick={() => setQrCodeType('wifi')}
                >
                  <Wifi className="h-4 w-4 mr-2" /> WiFi
                </Button>
                <Button
                  type="button"
                  variant={qrCodeType === 'sms' ? 'default' : 'outline'}
                  className={qrCodeType === 'sms' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}
                  onClick={() => setQrCodeType('sms')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> SMS
                </Button>
                <Button
                  type="button"
                  variant={qrCodeType === 'geo' ? 'default' : 'outline'}
                  className={qrCodeType === 'geo' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}
                  onClick={() => setQrCodeType('geo')}
                >
                  <MapPin className="h-4 w-4 mr-2" /> Location
                </Button>
                <Button
                  type="button"
                  variant={qrCodeType === 'calendar' ? 'default' : 'outline'}
                  className={qrCodeType === 'calendar' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}
                  onClick={() => setQrCodeType('calendar')}
                >
                  <Calendar className="h-4 w-4 mr-2" /> Event
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
            
            {/* WiFi Network Form */}
            {qrCodeType === 'wifi' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wifi-ssid" className="text-sm font-medium text-gray-700">Network Name (SSID)</Label>
                  <Input
                    id="wifi-ssid"
                    type="text"
                    placeholder="Your WiFi Network"
                    value={wifiData.ssid}
                    onChange={e => setWifiData({ ...wifiData, ssid: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wifi-encryption" className="text-sm font-medium text-gray-700">Security Type</Label>
                  <Select
                    value={wifiData.encryption}
                    onValueChange={(value) => setWifiData({ 
                      ...wifiData, 
                      encryption: value as WifiData['encryption'],
                      // Clear password if "No Password" is selected
                      password: value === 'nopass' ? '' : wifiData.password
                    })}
                  >
                    <SelectTrigger id="wifi-encryption">
                      <SelectValue placeholder="Select security type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WPA">WPA/WPA2</SelectItem>
                      <SelectItem value="WEP">WEP</SelectItem>
                      <SelectItem value="WPA2-EAP">Enterprise (WPA2-EAP)</SelectItem>
                      <SelectItem value="nopass">No Password</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {wifiData.encryption !== 'nopass' && (
                  <div className="space-y-2">
                    <Label htmlFor="wifi-password" className="text-sm font-medium text-gray-700">Password</Label>
                    <Input
                      id="wifi-password"
                      type="password"
                      placeholder="WiFi Password"
                      value={wifiData.password}
                      onChange={e => setWifiData({ ...wifiData, password: e.target.value })}
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="wifi-hidden"
                    checked={wifiData.hidden}
                    onCheckedChange={(checked) => setWifiData({ ...wifiData, hidden: checked === true })}
                  />
                  <Label htmlFor="wifi-hidden" className="text-sm text-gray-700">
                    Hidden Network
                  </Label>
                </div>
              </div>
            )}
            
            {/* SMS Message Form */}
            {qrCodeType === 'sms' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-phone" className="text-sm font-medium text-gray-700">Phone Number (with country code)</Label>
                  <Input
                    id="sms-phone"
                    type="tel"
                    placeholder="+12025550123"
                    value={smsData.phoneNumber}
                    onChange={e => setSmsData({ ...smsData, phoneNumber: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Format: +[country code][number] (e.g., +12025550123)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sms-message" className="text-sm font-medium text-gray-700">Message (optional)</Label>
                  <Textarea
                    id="sms-message"
                    placeholder="Enter message text"
                    value={smsData.message}
                    onChange={e => setSmsData({ ...smsData, message: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}
            
            {/* Geographic Location Form */}
            {qrCodeType === 'geo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="geo-latitude" className="text-sm font-medium text-gray-700">Latitude</Label>
                    <Input
                      id="geo-latitude"
                      type="text"
                      placeholder="37.7749"
                      value={geoData.latitude}
                      onChange={e => setGeoData({ ...geoData, latitude: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Value between -90 and 90
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="geo-longitude" className="text-sm font-medium text-gray-700">Longitude</Label>
                    <Input
                      id="geo-longitude"
                      type="text"
                      placeholder="-122.4194"
                      value={geoData.longitude}
                      onChange={e => setGeoData({ ...geoData, longitude: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Value between -180 and 180
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="geo-altitude" className="text-sm font-medium text-gray-700">Altitude (optional)</Label>
                  <Input
                    id="geo-altitude"
                    type="text"
                    placeholder="0"
                    value={geoData.altitude}
                    onChange={e => setGeoData({ ...geoData, altitude: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    In meters above sea level
                  </p>
                </div>
              </div>
            )}
            
            {/* Calendar Event Form */}
            {qrCodeType === 'calendar' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calendar-summary" className="text-sm font-medium text-gray-700">Event Title</Label>
                  <Input
                    id="calendar-summary"
                    type="text"
                    placeholder="Meeting with Team"
                    value={calendarData.summary}
                    onChange={e => setCalendarData({ ...calendarData, summary: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="calendar-start" className="text-sm font-medium text-gray-700">Start Time</Label>
                    <Input
                      id="calendar-start"
                      type="datetime-local"
                      value={calendarData.start}
                      onChange={e => setCalendarData({ ...calendarData, start: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="calendar-end" className="text-sm font-medium text-gray-700">End Time</Label>
                    <Input
                      id="calendar-end"
                      type="datetime-local"
                      value={calendarData.end}
                      onChange={e => setCalendarData({ ...calendarData, end: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="calendar-location" className="text-sm font-medium text-gray-700">Location (optional)</Label>
                  <Input
                    id="calendar-location"
                    type="text"
                    placeholder="Conference Room A"
                    value={calendarData.location}
                    onChange={e => setCalendarData({ ...calendarData, location: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="calendar-description" className="text-sm font-medium text-gray-700">Description (optional)</Label>
                  <Textarea
                    id="calendar-description"
                    placeholder="Event details and notes"
                    value={calendarData.description}
                    onChange={e => setCalendarData({ ...calendarData, description: e.target.value })}
                    rows={3}
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
                {qrCodeType === 'wifi' && 'Include network name below QR code'}
                {qrCodeType === 'sms' && 'Include phone number below QR code'}
                {qrCodeType === 'geo' && 'Include coordinates below QR code'}
                {qrCodeType === 'calendar' && 'Include event name below QR code'}
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
              {qrCodeType === 'wifi' && <><Wifi className="h-4 w-4 mr-2" /> Generate WiFi QR Code</>}
              {qrCodeType === 'sms' && <><MessageSquare className="h-4 w-4 mr-2" /> Generate SMS QR Code</>}
              {qrCodeType === 'geo' && <><MapPin className="h-4 w-4 mr-2" /> Generate Location QR Code</>}
              {qrCodeType === 'calendar' && <><Calendar className="h-4 w-4 mr-2" /> Generate Calendar QR Code</>}
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
                {qrCodeType === 'wifi' && 'Enter WiFi network details and click Generate'}
                {qrCodeType === 'sms' && 'Enter a phone number and message text, then click Generate'}
                {qrCodeType === 'geo' && 'Enter latitude and longitude coordinates, then click Generate'}
                {qrCodeType === 'calendar' && 'Enter event details with dates and click Generate'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickQrGenerator;