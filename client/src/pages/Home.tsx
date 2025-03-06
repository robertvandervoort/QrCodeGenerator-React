import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/QrCodeGenerator/Header";
import StepIndicator from "@/components/QrCodeGenerator/StepIndicator";
import FileUpload from "@/components/QrCodeGenerator/FileUpload";
import Configure from "@/components/QrCodeGenerator/Configure";
import Generate from "@/components/QrCodeGenerator/Generate";
import Footer from "@/components/QrCodeGenerator/Footer";
import DebugPanel from "@/components/QrCodeGenerator/DebugPanel";
import QuickQrGenerator from "@/components/QrCodeGenerator/QuickQrGenerator";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FileData = {
  name: string;
  size: number;
  data: Record<string, any>[];
  sheets: string[];
  columns: string[];
  currentSheet?: string;
};

export type QrCodeOptions = {
  size: number;
  margin: number;
  format: string;
  includeText: boolean;
  foregroundColor?: string;
  backgroundColor?: string;
};

export type GeneratedQrCode = {
  url: string;
  filename: string;
  dataUrl: string;
};

export type DebugLog = {
  type: 'file' | 'url' | 'config' | 'generation' | 'sheet' | 'download' | 'app';
  message: string;
  timestamp: Date;
};

const Home = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("quick");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [selectedUrlColumn, setSelectedUrlColumn] = useState<string>("");
  const [selectedFilenameColumns, setSelectedFilenameColumns] = useState<string[]>([]);
  const [filenameSeparator, setFilenameSeparator] = useState<string>("_");
  const [separatorType, setSeparatorType] = useState<string>("_");
  const [customSeparator, setCustomSeparator] = useState<string>("");
  const [qrOptions, setQrOptions] = useState<QrCodeOptions>({
    size: 900, // Default size for print applications
    margin: 4,
    format: "png",
    includeText: true,
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF"
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [generatedQrCodes, setGeneratedQrCodes] = useState<GeneratedQrCode[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  const logDebug = (type: DebugLog['type'], message: string) => {
    if (debugMode) {
      const newLog: DebugLog = {
        type,
        message,
        timestamp: new Date()
      };
      setDebugLogs(prev => [newLog, ...prev]);
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  };

  const resetApplication = () => {
    setCurrentStep(1);
    setFileData(null);
    setSelectedSheet("");
    setSelectedUrlColumn("");
    setSelectedFilenameColumns([]);
    setPreviewData([]);
    setGeneratedQrCodes([]);
    setGenerationProgress(0);
    setIsGenerating(false);
    logDebug('app', 'Application state reset');
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      logDebug('app', `Moving to step ${currentStep + 1}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      logDebug('app', `Moving back to step ${currentStep - 1}`);
    }
  };

  const showBatchOptions = () => {
    setActiveTab("batch");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header debugMode={debugMode} setDebugMode={setDebugMode} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs 
            defaultValue="quick" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-6 border border-gray-200 rounded-lg shadow-sm">
              <TabsTrigger value="quick" className="text-base py-3 px-6 font-semibold">Quick QR Code</TabsTrigger>
              <TabsTrigger value="batch" className="text-base py-3 px-6 font-semibold">Batch Processing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quick">
              <Card className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <QuickQrGenerator showBatchOptions={showBatchOptions} />
              </Card>
            </TabsContent>
            
            <TabsContent value="batch">
              <StepIndicator currentStep={currentStep} />
              
              <Card className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                {currentStep === 1 && (
                  <FileUpload 
                    fileData={fileData}
                    setFileData={setFileData}
                    selectedSheet={selectedSheet}
                    setSelectedSheet={setSelectedSheet}
                    logDebug={logDebug}
                    nextStep={nextStep}
                    setPreviewData={setPreviewData}
                  />
                )}
                
                {currentStep === 2 && (
                  <Configure
                    fileData={fileData}
                    previewData={previewData}
                    selectedUrlColumn={selectedUrlColumn}
                    setSelectedUrlColumn={setSelectedUrlColumn}
                    selectedFilenameColumns={selectedFilenameColumns}
                    setSelectedFilenameColumns={setSelectedFilenameColumns}
                    filenameSeparator={filenameSeparator}
                    setFilenameSeparator={setFilenameSeparator}
                    separatorType={separatorType}
                    setSeparatorType={setSeparatorType}
                    customSeparator={customSeparator}
                    setCustomSeparator={setCustomSeparator}
                    qrOptions={qrOptions}
                    setQrOptions={setQrOptions}
                    nextStep={nextStep}
                    prevStep={prevStep}
                    logDebug={logDebug}
                    debugMode={debugMode}
                  />
                )}
                
                {currentStep === 3 && (
                  <Generate
                    previewData={previewData}
                    selectedUrlColumn={selectedUrlColumn}
                    selectedFilenameColumns={selectedFilenameColumns}
                    filenameSeparator={filenameSeparator}
                    separatorType={separatorType}
                    customSeparator={customSeparator}
                    qrOptions={qrOptions}
                    generatedQrCodes={generatedQrCodes}
                    setGeneratedQrCodes={setGeneratedQrCodes}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                    generationProgress={generationProgress}
                    setGenerationProgress={setGenerationProgress}
                    prevStep={prevStep}
                    resetApplication={resetApplication}
                    logDebug={logDebug}
                    currentSheet={fileData?.currentSheet}
                  />
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
      
      {debugMode && <DebugPanel debugLogs={debugLogs} setDebugMode={setDebugMode} />}
    </div>
  );
};

export default Home;
