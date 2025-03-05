import * as ExcelJS from 'exceljs';

interface ProcessResult {
  data: Record<string, any>[];
  sheets: string[];
  columns: string[];
  currentSheet?: string;
}

// Helper to check if a row has at least one non-empty value
function isValidRow(rowValues: any[]): boolean {
  return rowValues.some(value => value !== undefined && value !== null && value !== '');
}

export const processExcelFile = (file: File, sheetName?: string): Promise<ProcessResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file data'));
          return;
        }
        
        const workbook = new ExcelJS.Workbook();
        const buffer = data instanceof ArrayBuffer ? data : new Uint8Array(data as ArrayBuffer).buffer;
        
        await workbook.xlsx.load(buffer);
        
        // Get all sheet names
        const sheets = workbook.worksheets.map(worksheet => worksheet.name);
        
        if (sheets.length === 0) {
          reject(new Error('No sheets found in Excel file'));
          return;
        }
        
        // Get the requested sheet or the first sheet by default
        const selectedSheetName = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
        const worksheet = workbook.getWorksheet(selectedSheetName);
        
        if (!worksheet) {
          reject(new Error(`Sheet '${selectedSheetName}' not found`));
          return;
        }
        
        console.log(`Processing Excel sheet: ${selectedSheetName}`);
        
        // Extract column names (from first row)
        const columns: string[] = [];
        const firstRow = worksheet.getRow(1);
        firstRow.eachCell((cell, colNumber) => {
          // Note: Excel column numbers are 1-based
          columns[colNumber - 1] = cell.value ? cell.value.toString() : '';
        });
        
        // Check if there's data
        if (worksheet.rowCount <= 1) {
          reject(new Error(`No data found in Excel sheet: ${selectedSheetName}`));
          return;
        }
        
        // Process data rows
        const objectRows: Record<string, any>[] = [];
        
        // Start from row 2 (skip headers)
        for (let i = 2; i <= worksheet.rowCount; i++) {
          const row = worksheet.getRow(i);
          const rowValues: any[] = [];
          
          // Get all cell values for the row
          row.eachCell((cell, colNumber) => {
            rowValues[colNumber - 1] = cell.value;
          });
          
          // Skip empty rows
          if (!isValidRow(rowValues)) continue;
          
          // Create an object with column headers as keys
          const rowObject: Record<string, any> = {};
          columns.forEach((col, index) => {
            if (col) { // Only use non-empty column names
              rowObject[col] = rowValues[index];
            }
          });
          
          objectRows.push(rowObject);
        }
        
        console.log(`Excel processing: Found ${objectRows.length} valid rows out of ${worksheet.rowCount - 1} total rows in sheet '${selectedSheetName}'`);
        
        resolve({
          data: objectRows,
          sheets,
          columns,
          currentSheet: selectedSheetName
        });
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(new Error('Failed to process Excel file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const processCsvFile = (file: File): Promise<ProcessResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read CSV file data'));
          return;
        }
        
        const csvString = data as string;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
        
        // Parse CSV
        const rows = csvString.split('\n');
        
        // Process header row
        const headerRow = rows[0].split(',').map(header => header.trim());
        worksheet.addRow(headerRow);
        
        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].trim() === '') continue;
          const rowValues = rows[i].split(',').map(value => value.trim());
          worksheet.addRow(rowValues);
        }
        
        // Extract column names
        const columns = headerRow;
        
        if (rows.length <= 1) {
          reject(new Error('No data found in CSV file'));
          return;
        }
        
        // Process data rows
        const objectRows: Record<string, any>[] = [];
        
        // Start from row 2 (skip headers)
        for (let i = 2; i <= worksheet.rowCount; i++) {
          const row = worksheet.getRow(i);
          const rowValues: any[] = [];
          
          // Get all cell values for the row
          row.eachCell((cell, colNumber) => {
            rowValues[colNumber - 1] = cell.value;
          });
          
          // Skip empty rows
          if (!isValidRow(rowValues)) continue;
          
          // Create an object with column headers as keys
          const rowObject: Record<string, any> = {};
          columns.forEach((col, index) => {
            if (col) { // Only use non-empty column names
              rowObject[col] = rowValues[index];
            }
          });
          
          objectRows.push(rowObject);
        }
        
        console.log(`CSV processing: Found ${objectRows.length} valid rows out of ${rows.length - 1} total rows`);
        
        resolve({
          data: objectRows,
          sheets: ['Sheet1'],
          columns,
          currentSheet: 'Sheet1'
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
