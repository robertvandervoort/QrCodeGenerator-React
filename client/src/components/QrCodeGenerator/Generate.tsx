import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCodeOptions, GeneratedQrCode, DebugLog } from "@/pages/Home";
import { generateQrCode } from "@/utils/qrCodeUtils";
import QrPreviewModal from "./QrPreviewModal";
import { Loader2, Eye, Download, DownloadCloud, ChevronLeft, ChevronRight } from "lucide-react";
import { saveAs } from "file-saver";
import JSZip from "jszip";

interface GenerateProps {
  previewData: any[];
  selectedUrlColumn: string;
  selectedFilenameColumns: string[];
  filenameSeparator: string;
  separatorType: string;
  customSeparator: string;
  qrOptions: QrCodeOptions;
  generatedQrCodes: GeneratedQrCode[];
  setGeneratedQrCodes: (codes: GeneratedQrCode[]) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  generationProgress: number;
  setGenerationProgress: (progress: number) => void;
  prevStep: () => void;
  resetApplication: () => void;
  logDebug: (type: DebugLog['type'], message: string) => void;
  currentSheet?: string;
}

const Generate = ({
  previewData,
  selectedUrlColumn,
  selectedFilenameColumns,
  filenameSeparator,
  separatorType,
  customSeparator,
  qrOptions,
  generatedQrCodes,
  setGeneratedQrCodes,
  isGenerating,
  setIsGenerating,
  generationProgress,
  setGenerationProgress,
  prevStep,
  resetApplication,
  logDebug,
  currentSheet
}: GenerateProps) => {
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [currentPreviewQr, setCurrentPreviewQr] = useState<GeneratedQrCode | null>(null);
  const [generatedCount, setGeneratedCount] = useState<number>(0);
  const [totalToGenerate, setTotalToGenerate] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [codesPerPage, setCodesPerPage] = useState<number>(10);

  // Get the current page's QR codes
  const getCurrentPageQrCodes = () => {
    const indexOfLastQrCode = currentPage * codesPerPage;
    const indexOfFirstQrCode = indexOfLastQrCode - codesPerPage;
    return generatedQrCodes.slice(indexOfFirstQrCode, indexOfLastQrCode);
  };

  // Change page
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    logDebug('app', `Changed to page ${pageNumber}`);
  };

  // Start generating QR codes when component mounts
  useEffect(() => {
    if (previewData.length > 0 && selectedUrlColumn && generatedQrCodes.length === 0 && !isGenerating) {
      generateQrCodes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateQrCodes = async () => {
    setIsGenerating(true);
    setGeneratedQrCodes([]);
    setGenerationProgress(0);
    setGeneratedCount(0);
    setTotalToGenerate(previewData.length);
    
    logDebug('generation', `Starting QR code generation for ${previewData.length} items`);
    logDebug('config', `QR settings: size=${qrOptions.size}, margin=${qrOptions.margin}, format=${qrOptions.format}`);
    
    const separator = separatorType === 'custom' ? customSeparator : filenameSeparator;
    
    const generateQrCodesSequentially = async () => {
      const codes: GeneratedQrCode[] = [];
      
      for (let i = 0; i < previewData.length; i++) {
        const row = previewData[i];
        const url = row[selectedUrlColumn];
        
        if (!url) {
          logDebug('generation', `Skipping row ${i+1} as URL is missing`);
          continue;
        }
        
        const filename = selectedFilenameColumns
          .map(col => row[col] || col)
          .join(separator) + '.' + qrOptions.format;
        
        try {
          const dataUrl = await generateQrCode(url, qrOptions);
          
          codes.push({
            url,
            filename,
            dataUrl
          });
          
          logDebug('generation', `Generated QR code for ${url} as ${filename}`);
        } catch (error) {
          logDebug('generation', `Error generating QR code for ${url}: ${error}`);
        }
        
        // Update progress
        setGeneratedCount(i + 1);
        setGenerationProgress(Math.round(((i + 1) / previewData.length) * 100));
      }
      
      setGeneratedQrCodes(codes);
      setIsGenerating(false);
      logDebug('generation', `Completed generating ${codes.length} QR codes`);
    };
    
    generateQrCodesSequentially();
  };

  const previewQrCode = (index: number) => {
    setCurrentPreviewQr(generatedQrCodes[index]);
    setShowPreviewModal(true);
  };

  const downloadQrCode = (index: number) => {
    const qrCode = generatedQrCodes[index];
    logDebug('download', `Downloading QR code: ${qrCode.filename}`);
    
    // For SVG format
    if (qrOptions.format === 'svg') {
      // Extract SVG content from data URL if needed
      const svgContent = qrCode.dataUrl.startsWith('data:image/svg+xml;charset=utf-8,') 
        ? decodeURIComponent(qrCode.dataUrl.split(',')[1])
        : qrCode.dataUrl;
      
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      saveAs(blob, qrCode.filename);
      logDebug('download', `Downloaded SVG file: ${qrCode.filename}`);
    } else {
      // For PNG and JPEG
      saveAs(qrCode.dataUrl, qrCode.filename);
      logDebug('download', `Downloaded ${qrOptions.format.toUpperCase()} file: ${qrCode.filename}`);
    }
  };

  const downloadAllQrCodes = async () => {
    if (generatedQrCodes.length === 0) return;
    
    logDebug('download', `Preparing ZIP file with ${generatedQrCodes.length} QR codes`);
    
    const zip = new JSZip();
    
    // Add QR codes to zip
    try {
      for (const qrCode of generatedQrCodes) {
        if (qrOptions.format === 'svg') {
          // For SVG format, we need to extract the actual SVG content from the data URL
          const svgContent = qrCode.dataUrl.startsWith('data:image/svg+xml;charset=utf-8,') 
            ? decodeURIComponent(qrCode.dataUrl.split(',')[1])
            : qrCode.dataUrl;
          
          zip.file(qrCode.filename, svgContent);
          logDebug('download', `Added SVG to ZIP: ${qrCode.filename}`);
        } else {
          // For PNG and JPEG, need to fetch the dataUrl as a blob
          try {
            const response = await fetch(qrCode.dataUrl);
            const blob = await response.blob();
            zip.file(qrCode.filename, blob);
            logDebug('download', `Added ${qrOptions.format.toUpperCase()} to ZIP: ${qrCode.filename}`);
          } catch (error) {
            logDebug('download', `Error adding ${qrCode.filename} to ZIP: ${error}`);
          }
        }
      }
    } catch (error) {
      console.error('Error adding files to ZIP:', error);
      logDebug('download', `Error creating ZIP file: ${error}`);
    }
    
    // Generate and download zip
    zip.generateAsync({ type: "blob" }).then((content) => {
      const zipFilename = currentSheet 
        ? `qr-codes-${currentSheet.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip` 
        : "qr-codes.zip";
      saveAs(content, zipFilename);
      logDebug('download', `Downloaded ZIP file (${zipFilename}) with ${generatedQrCodes.length} QR codes`);
    });
  };

  return (
    <>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Generated QR Codes</h2>
        {currentSheet && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              From sheet: <span className="font-medium text-primary">{currentSheet}</span>
            </p>
          </div>
        )}
        
        {isGenerating && (
          <div className="mb-8">
            <div className="text-center p-12">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm rounded-md text-primary bg-blue-100 mb-3">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                Generating QR codes...
              </div>
              <p className="text-sm text-gray-500">This may take a moment depending on file size</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{generatedCount} of {totalToGenerate} complete</span>
              <span>{generationProgress}%</span>
            </div>
          </div>
        )}
        
        {!isGenerating && generatedQrCodes.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">QR Code Gallery</h3>
              <Button
                onClick={downloadAllQrCodes}
                variant="default"
                size="sm"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white"
              >
                <DownloadCloud className="mr-1 h-4 w-4" /> 
                Download All as ZIP
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {getCurrentPageQrCodes().map((qr, index) => {
                // Calculate the actual index in the full array
                const actualIndex = (currentPage - 1) * codesPerPage + index;
                return (
                  <div key={actualIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-2 flex justify-center">
                      <img src={qr.dataUrl} className="w-32 h-32" alt={`QR Code for ${qr.url}`} />
                    </div>
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 truncate" title={qr.filename}>
                        {qr.filename}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <button
                          className="text-xs text-primary hover:text-blue-700 flex items-center"
                          onClick={() => previewQrCode(actualIndex)}
                        >
                          <Eye className="mr-1 h-3 w-3" /> Preview
                        </button>
                        <button
                          className="text-xs text-gray-600 hover:text-gray-900 flex items-center"
                          onClick={() => downloadQrCode(actualIndex)}
                        >
                          <Download className="mr-1 h-3 w-3" /> Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {generatedQrCodes.length > codesPerPage && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * codesPerPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * codesPerPage, generatedQrCodes.length)}
                  </span>{" "}
                  of <span className="font-medium">{generatedQrCodes.length}</span> QR codes
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page numbers - only show a reasonable number */}
                  <div className="hidden sm:flex space-x-1">
                    {Array.from({ length: Math.ceil(generatedQrCodes.length / codesPerPage) }).slice(0, 7).map((_, i) => (
                      <Button
                        key={i}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(i + 1)}
                        className="w-8 h-8 p-0"
                      >
                        {i + 1}
                      </Button>
                    ))}
                    
                    {Math.ceil(generatedQrCodes.length / codesPerPage) > 7 && (
                      <>
                        <span className="text-gray-500 self-center">...</span>
                        <Button
                          variant={currentPage === Math.ceil(generatedQrCodes.length / codesPerPage) ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(Math.ceil(generatedQrCodes.length / codesPerPage))}
                          className="w-8 h-8 p-0"
                        >
                          {Math.ceil(generatedQrCodes.length / codesPerPage)}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === Math.ceil(generatedQrCodes.length / codesPerPage)}
                    className="inline-flex items-center"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!isGenerating && generatedQrCodes.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-yellow-50 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">No QR codes generated</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>There was an issue generating QR codes. Please check your URL column selection and try again.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* QR Code Preview Modal */}
        <QrPreviewModal
          showModal={showPreviewModal}
          setShowModal={setShowPreviewModal}
          currentQr={currentPreviewQr}
          downloadQrCode={() => {
            if (currentPreviewQr) {
              // For SVG format
              if (qrOptions.format === 'svg') {
                // Extract SVG content from data URL if needed
                const svgContent = currentPreviewQr.dataUrl.startsWith('data:image/svg+xml;charset=utf-8,') 
                  ? decodeURIComponent(currentPreviewQr.dataUrl.split(',')[1])
                  : currentPreviewQr.dataUrl;
                
                const blob = new Blob([svgContent], { type: "image/svg+xml" });
                saveAs(blob, currentPreviewQr.filename);
              } else {
                // For PNG and JPEG
                saveAs(currentPreviewQr.dataUrl, currentPreviewQr.filename);
              }
              logDebug('download', `Downloaded QR code from preview: ${currentPreviewQr.filename}`);
            }
          }}
        />
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          className="inline-flex items-center"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Configuration
        </Button>
        <Button
          variant="outline"
          onClick={resetApplication}
          className="inline-flex items-center"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start New Batch
        </Button>
      </div>
    </>
  );
};

export default Generate;
