import * as XLSX from 'xlsx';

interface ProcessResult {
  data: any[][];
  sheets: string[];
  columns: string[];
}

// Helper to check if a value is an array with at least one non-empty value
function isValidRow(row: any): boolean {
  if (!Array.isArray(row)) return false;
  return row.some(cell => cell !== undefined && cell !== null && cell !== '');
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
        
        // Filter out empty rows (rows with all undefined or empty values)
        const validRows = jsonData.slice(1).filter(isValidRow);
        
        console.log(`Excel processing: Found ${validRows.length} valid rows out of ${jsonData.length - 1} total rows`);
        
        resolve({
          data: validRows as any[][],  // Skip header row and include only valid rows
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
        
        // Filter out empty rows (rows with all undefined or empty values)
        const validRows = jsonData.slice(1).filter(isValidRow);
        
        console.log(`CSV processing: Found ${validRows.length} valid rows out of ${jsonData.length - 1} total rows`);
        
        resolve({
          data: validRows as any[][],  // Skip header row and include only valid rows
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
  // Common terms that might indicate URL columns
  const possibleUrlKeywords = ['url', 'link', 'website', 'webpage', 'web', 'href', 'http', 'https', 'www'];
  
  // First check for exact matches
  const exactMatches = columns.filter(column => 
    possibleUrlKeywords.includes(column.toLowerCase())
  );
  
  if (exactMatches.length > 0) {
    return exactMatches;
  }
  
  // If no exact matches, look for partial matches
  return columns.filter(column => {
    const lowerColumn = column.toLowerCase();
    return possibleUrlKeywords.some(keyword => lowerColumn.includes(keyword));
  });
};
