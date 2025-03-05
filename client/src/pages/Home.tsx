import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/QrCodeGenerator/Header";
import StepIndicator from "@/components/QrCodeGenerator/StepIndicator";
import FileUpload from "@/components/QrCodeGenerator/FileUpload";
import Configure from "@/components/QrCodeGenerator/Configure";
import Generate from "@/components/QrCodeGenerator/Generate";
import Footer from "@/components/QrCodeGenerator/Footer";
import DebugPanel from "@/components/QrCodeGenerator/DebugPanel";
import { Card } from "@/components/ui/card";

export type FileData = {
  name: string;
  size: number;
  data: any[][];
  sheets: string[];
  columns: string[];
  currentSheet?: string;
};

export type QrCodeOptions = {
  size: number;
  margin: number;
  format: string;
  includeText: boolean;
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
    size: 250,
    margin: 4,
    format: "png",
    includeText: true
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header debugMode={debugMode} setDebugMode={setDebugMode} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              />
            )}
          </Card>
        </div>
      </main>
      
      <Footer />
      
      {debugMode && <DebugPanel debugLogs={debugLogs} setDebugMode={setDebugMode} />}
    </div>
  );
};

export default Home;
