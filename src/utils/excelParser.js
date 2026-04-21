// Excel Parser utility for React Web
import * as XLSX from 'xlsx';

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const validateExcelFormat = (data, requiredColumns) => {
  if (!data || data.length === 0) {
    return { isValid: false, error: 'Empty file' };
  }
  
  const headers = data[0];
  const missingColumns = requiredColumns.filter(
    col => !headers.some(h => h && h.toString().toLowerCase() === col.toLowerCase())
  );
  
  if (missingColumns.length > 0) {
    return { isValid: false, error: `Missing columns: ${missingColumns.join(', ')}` };
  }
  
  return { isValid: true };
};

export const convertExcelToVolunteerData = (data) => {
  if (!data || data.length < 2) {
    return [];
  }
  
  const headers = data[0].map(h => h?.toString().toLowerCase().trim());
  const rows = data.slice(1);
  
  return rows.map((row, index) => {
    const rowData = {};
    headers.forEach((header, i) => {
      rowData[header] = row[i];
    });
    
    return {
      rowNumber: index + 2,
      cnic: rowData.cnic?.toString() || '',
      name: rowData.name?.toString() || '',
      eventNumber: parseInt(rowData.event_number || rowData.eventnumber || rowData.event, 10) || 1,
      dutyType: rowData.duty_type || rowData.dutytype || rowData.duty || '',
      accessLevel: parseInt(rowData.access_level || rowData.accesslevel, 10) || 1,
    };
  }).filter(row => row.cnic);
};
