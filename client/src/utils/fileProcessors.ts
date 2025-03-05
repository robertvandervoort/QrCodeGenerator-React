import * as XLSX from 'xlsx';

interface ProcessResult {
  data: any[][];
  sheets: string[];
  columns: string[];
}

export const processExcelFile = (file: File): Promise<ProcessResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, {type: 'binary'});
        
        // Get all sheet names
        const sheets = workbook.SheetNames;
        
        if (sheets.length === 0) {
          reject(new Error('No sheets found in Excel file'));
          return;
        }
        
        // Get the first sheet by default
        const worksheet = workbook.Sheets[sheets[0]];
        
        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
        
        // Extract column names (assuming first row contains headers)
        const columns = jsonData[0] as string[];
        
        // Check if there's data
        if (jsonData.length <= 1) {
          reject(new Error('No data found in Excel file'));
          return;
        }
        
        resolve({
          data: jsonData.slice(1) as any[][],  // Skip header row
          sheets,
          columns
        });
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(new Error('Failed to process Excel file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsBinaryString(file);
  });
};

export const processCsvFile = (file: File): Promise<ProcessResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result as string;
        
        // Use XLSX to parse CSV
        const workbook = XLSX.read(data, {type: 'string'});
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
        
        // Extract column names
        const columns = jsonData[0] as string[];
        
        if (jsonData.length <= 1) {
          reject(new Error('No data found in CSV file'));
          return;
        }
        
        resolve({
          data: jsonData.slice(1) as any[][],  // Skip header row
          sheets: ['Sheet1'],  // CSV only has one sheet
          columns
        });
      } catch (error) {
        console.error('Error processing CSV file:', error);
        reject(new Error('Failed to process CSV file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

// Helper function to detect URL columns
export const detectUrlColumns = (columns: string[]): string[] => {
  const possibleUrlColumns = ['url', 'link', 'website', 'webpage', 'web', 'href'];
  
  return columns.filter(column => 
    possibleUrlColumns.includes(column.toLowerCase())
  );
};
