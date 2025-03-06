import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileData, QrCodeOptions, DebugLog } from "@/pages/Home";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { CheckCircle } from "lucide-react";
import { detectUrlColumns } from "@/utils/fileProcessors";

interface ConfigureProps {
  fileData: FileData | null;
  previewData: any[];
  selectedUrlColumn: string;
  setSelectedUrlColumn: (column: string) => void;
  selectedFilenameColumns: string[];
  setSelectedFilenameColumns: (columns: string[]) => void;
  filenameSeparator: string;
  setFilenameSeparator: (separator: string) => void;
  separatorType: string;
  setSeparatorType: (type: string) => void;
  customSeparator: string;
  setCustomSeparator: (separator: string) => void;
  qrOptions: QrCodeOptions;
  setQrOptions: (options: QrCodeOptions) => void;
  nextStep: () => void;
  prevStep: () => void;
  logDebug: (type: DebugLog['type'], message: string) => void;
  debugMode: boolean;
}

const Configure = ({
  fileData,
  previewData,
  selectedUrlColumn,
  setSelectedUrlColumn,
  selectedFilenameColumns,
  setSelectedFilenameColumns,
  filenameSeparator,
  setFilenameSeparator,
  separatorType,
  setSeparatorType,
  customSeparator,
  setCustomSeparator,
  qrOptions,
  setQrOptions,
  nextStep,
  prevStep,
  logDebug,
  debugMode
}: ConfigureProps) => {
  
  // Auto-detect URL column on component mount
  useEffect(() => {
    if (fileData && fileData.columns.length > 0 && selectedUrlColumn === '') {
      // Use our enhanced URL column detection function
      const possibleUrlColumns = detectUrlColumns(fileData.columns);
      
      if (possibleUrlColumns.length > 0) {
        const foundUrlColumn = possibleUrlColumns[0]; // Use the first detected URL column
        setSelectedUrlColumn(foundUrlColumn);
        logDebug('url', `Auto-detected URL column: ${foundUrlColumn}`);
      }
    }
  }, [fileData, selectedUrlColumn, setSelectedUrlColumn, logDebug]);

  const handleFilenameColumnToggle = (column: string) => {
    if (selectedFilenameColumns.includes(column)) {
      setSelectedFilenameColumns(selectedFilenameColumns.filter(col => col !== column));
    } else {
      setSelectedFilenameColumns([...selectedFilenameColumns, column]);
    }
    logDebug('config', `Updated filename columns: ${selectedFilenameColumns.join(', ')}`);
  };

  const handleSeparatorChange = (value: string) => {
    if (value === 'custom') {
      setSeparatorType('custom');
    } else {
      setSeparatorType(value);
      setFilenameSeparator(value);
    }
    logDebug('config', `Set filename separator to: ${value}`);
  };

  const handleQrOptionChange = (name: keyof QrCodeOptions, value: any) => {
    setQrOptions({
      ...qrOptions,
      [name]: value
    });
    logDebug('config', `Updated QR option ${name}: ${value}`);
  };

  const getFilenamePreview = () => {
    if (selectedFilenameColumns.length === 0 || previewData.length === 0) return '';
    
    const separator = separatorType === 'custom' ? customSeparator : filenameSeparator;
    const filename = selectedFilenameColumns.map(col => {
      return previewData[0][col] || col;
    }).join(separator);
    
    return `${filename}.${qrOptions.format}`;
  };

  const canProceedToNextStep = selectedUrlColumn !== "" && selectedFilenameColumns.length > 0;

  return (
    <>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Configure QR Code Generation</h2>
        {fileData?.currentSheet && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Working with sheet: <span className="font-medium text-primary">{fileData.currentSheet}</span>
            </p>
          </div>
        )}
        
        <div className="space-y-6">
          {/* URL Column Selection */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">URL Column</Label>
            <p className="text-xs text-gray-500 mb-2">Select the column containing URL data (columns marked with 🔗 are detected as potential URL columns)</p>
            <Select
              value={selectedUrlColumn}
              onValueChange={(value) => {
                setSelectedUrlColumn(value);
                logDebug('url', `Selected URL column: ${value}`);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select URL column" />
              </SelectTrigger>
              <SelectContent>
                {fileData?.columns.map((column) => {
                  // Check if this column might be a URL column
                  const isPossibleUrlColumn = detectUrlColumns([column]).length > 0;
                  return (
                    <SelectItem key={column} value={column} className={isPossibleUrlColumn ? "font-medium text-primary" : ""}>
                      {column} {isPossibleUrlColumn && "🔗"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedUrlColumn && (
              <p className="mt-1 text-xs text-green-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                URL column selected
              </p>
            )}
          </div>
          
          {/* Filename Column Selection */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Filename Columns</Label>
            <p className="text-xs text-gray-500 mb-2">Select columns to use for generating filenames</p>
            
            <ScrollArea className="h-48 border border-gray-200 rounded-md p-2">
              <div className="space-y-2">
                {fileData?.columns.map((column) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${column}`}
                      checked={selectedFilenameColumns.includes(column)}
                      onCheckedChange={() => handleFilenameColumnToggle(column)}
                    />
                    <Label htmlFor={`column-${column}`} className="text-sm text-gray-700">{column}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Filename Separator */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Filename Separator</Label>
            <RadioGroup 
              value={separatorType}
              onValueChange={handleSeparatorChange}
              className="flex space-x-4 flex-wrap"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="_" id="sep-underscore" />
                <Label htmlFor="sep-underscore">Underscore (_)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="-" id="sep-dash" />
                <Label htmlFor="sep-dash">Dash (-)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="." id="sep-dot" />
                <Label htmlFor="sep-dot">Dot (.)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="sep-custom" />
                <Label htmlFor="sep-custom">Custom</Label>
              </div>
            </RadioGroup>
            
            {separatorType === 'custom' && (
              <div className="mt-2">
                <Input
                  type="text"
                  placeholder="Enter custom separator"
                  maxLength={3}
                  value={customSeparator}
                  onChange={(e) => {
                    setCustomSeparator(e.target.value);
                    setFilenameSeparator(e.target.value);
                    logDebug('config', `Set custom separator: ${e.target.value}`);
                  }}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
          
          {/* QR Code Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">QR Code Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <Label htmlFor="qr-size" className="block text-sm font-medium text-gray-700 mb-1">Size (pixels)</Label>
                <div className="flex gap-4 items-center">
                  <div className="flex-grow">
                    <Slider
                      id="qr-size-slider"
                      min={100}
                      max={1000}
                      step={10}
                      value={[qrOptions.size]}
                      onValueChange={(value) => handleQrOptionChange('size', value[0])}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      id="qr-size"
                      type="number"
                      min="100"
                      max="2000"
                      value={qrOptions.size}
                      onChange={(e) => handleQrOptionChange('size', parseInt(e.target.value) || 900)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="qr-margin" className="block text-sm font-medium text-gray-700 mb-1">Margin (modules)</Label>
                <Input
                  id="qr-margin"
                  type="number"
                  min="0"
                  max="10"
                  value={qrOptions.margin}
                  onChange={(e) => handleQrOptionChange('margin', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="qr-format" className="block text-sm font-medium text-gray-700 mb-1">Format</Label>
                <Select
                  value={qrOptions.format}
                  onValueChange={(value) => handleQrOptionChange('format', value)}
                >
                  <SelectTrigger id="qr-format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox
                id="include-url"
                checked={qrOptions.includeText}
                onCheckedChange={(checked) => 
                  handleQrOptionChange('includeText', checked === true)
                }
              />
              <Label htmlFor="include-url" className="text-sm text-gray-700">
                Include URL text below QR code
              </Label>
            </div>
            
            {/* Color options */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ColorPicker
                  color={qrOptions.foregroundColor || "#000000"}
                  onChange={(color) => handleQrOptionChange('foregroundColor', color)}
                  label="QR Code Color"
                />
              </div>
              <div>
                <ColorPicker
                  color={qrOptions.backgroundColor || "#FFFFFF"}
                  onChange={(color) => handleQrOptionChange('backgroundColor', color)}
                  label="Background Color"
                />
              </div>
            </div>
          </div>
          
          {/* Data Preview */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                <span>
                  Data Preview <span className="text-gray-500 font-normal">
                    {debugMode ? `(showing all ${previewData.length} rows)` : `(showing first 5 rows of ${previewData.length})`}
                    {fileData?.currentSheet && ` from sheet '${fileData.currentSheet}'`}
                  </span>
                </span>
                <span className="text-xs text-primary">All {previewData.length} rows will be processed</span>
              </h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className={`${debugMode ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        {Object.keys(previewData[0] || {}).map((key) => (
                          <th 
                            key={key}
                            className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(debugMode ? previewData : previewData.slice(0, 5)).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((cell, cellIndex) => (
                            <td 
                              key={cellIndex}
                              className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                            >
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span>
                    {debugMode 
                      ? `Showing all ${previewData.length} rows in debug mode`
                      : `Showing 5 of ${previewData.length} rows (enable debug mode to see all)`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Filename Preview */}
          {selectedFilenameColumns.length > 0 && previewData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filename Preview</h3>
              <div className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-200 font-mono break-all">
                {getFilenamePreview()}
              </div>
            </div>
          )}
        </div>
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
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!canProceedToNextStep}
          className="inline-flex items-center"
        >
          Generate QR Codes
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </>
  );
};

export default Configure;
