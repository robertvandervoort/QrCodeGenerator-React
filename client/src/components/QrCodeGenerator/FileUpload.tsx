import { useState } from "react";
import { Upload, File, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processExcelFile, processCsvFile } from "@/utils/fileProcessors";
import { FileData, DebugLog } from "@/pages/Home";

interface FileUploadProps {
  fileData: FileData | null;
  setFileData: (fileData: FileData | null) => void;
  selectedSheet: string;
  setSelectedSheet: (sheet: string) => void;
  logDebug: (type: DebugLog['type'], message: string) => void;
  nextStep: () => void;
  setPreviewData: (data: any[]) => void;
}

const FileUpload = ({
  fileData,
  setFileData,
  selectedSheet,
  setSelectedSheet,
  logDebug,
  nextStep,
  setPreviewData
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setFileError("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.");
      logDebug('file', `Invalid file type: ${fileExtension}`);
      return;
    }
    
    setIsLoading(true);
    setFileError(null);
    logDebug('file', `Processing file: ${file.name}`);
    
    try {
      let result;
      
      if (fileExtension === '.csv') {
        result = await processCsvFile(file);
      } else {
        result = await processExcelFile(file);
      }
      
      setFileData({
        name: file.name,
        size: file.size,
        data: result.data,
        sheets: result.sheets,
        columns: result.columns
      });
      
      // Auto-select first sheet for Excel files
      if (result.sheets.length > 0) {
        setSelectedSheet(result.sheets[0]);
        logDebug('sheet', `Selected sheet: ${result.sheets[0]}`);
      }
      
      // Convert all data to objects with column names
      const allRows = result.data.map(row => {
        const rowObj: {[key: string]: any} = {};
        result.columns.forEach((col, index) => {
          rowObj[col] = row[index];
        });
        return rowObj;
      });
      
      // Set full data for processing but only show a preview in the table
      setPreviewData(allRows);
      logDebug('file', `Processed ${allRows.length} rows from file`);
      
      // Auto-detect URL column
      const possibleUrlColumns = ['url', 'link', 'website', 'webpage', 'web'];
      const foundUrlColumn = result.columns.find(column => 
        possibleUrlColumns.includes(column.toLowerCase())
      );
      
      if (foundUrlColumn) {
        logDebug('url', `Auto-detected URL column: ${foundUrlColumn}`);
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      setFileError("Failed to process the file. Make sure it's a valid Excel or CSV file.");
      logDebug('file', `Error processing file: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    setFileData(null);
    setSelectedSheet("");
    setFileError(null);
    logDebug('file', 'File removed');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canProceedToNextStep = fileData !== null && selectedSheet !== "" && !isLoading && !fileError;

  return (
    <>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Spreadsheet</h2>
        
        <div className="mb-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragging ? 'border-primary bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleFileDrop}
          >
            <div className="space-y-2">
              <Upload className="h-10 w-10 text-gray-400 mx-auto" />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Drag and drop your file here</p>
                <p className="text-xs">or</p>
              </div>
              <div>
                <label className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md cursor-pointer hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <span>Browse Files</span>
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">Accepted formats: .xlsx, .xls, .csv</p>
            </div>
          </div>
        </div>
        
        {fileData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-start">
            <div className="flex-shrink-0">
              {fileData.name.endsWith('.xlsx') || fileData.name.endsWith('.xls') ? (
                <File className="h-6 w-6 text-green-600 mr-3" />
              ) : (
                <FileText className="h-6 w-6 text-blue-600 mr-3" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900">{fileData.name}</h3>
              <p className="text-xs text-gray-500">{formatFileSize(fileData.size)}</p>
            </div>
            <div>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600" 
                onClick={removeFile}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Processing file...</p>
          </div>
        )}
        
        {fileData && !isLoading && fileData.sheets.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Sheet</label>
            <div className="relative">
              <select 
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={selectedSheet}
                onChange={(e) => {
                  setSelectedSheet(e.target.value);
                  logDebug('sheet', `Selected sheet: ${e.target.value}`);
                }}
              >
                <option value="" disabled>Select a sheet</option>
                {fileData.sheets.map((sheet) => (
                  <option key={sheet} value={sheet}>{sheet}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {fileError && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error processing file</h3>
                <div className="mt-2 text-sm text-red-700">{fileError}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
        <Button
          onClick={nextStep}
          disabled={!canProceedToNextStep}
          className="inline-flex items-center"
        >
          Next
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </>
  );
};

export default FileUpload;
