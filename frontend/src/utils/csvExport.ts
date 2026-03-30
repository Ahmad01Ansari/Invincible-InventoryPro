export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data provided for CSV export');
    return;
  }

  // Define headers from the keys of the first object
  const headers = Object.keys(data[0]);

  // Map rows
  const csvRows = [
    headers.join(',') // Headers row
  ];

  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header] ?? ''; // Support null/undefined gracefully

      val = String(val); // Ensure string

      // Escape quotes and wrap in quotes if there's a comma or newline or quote
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }

  // Convert to Blob and download natively
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', `${filename}_${new Date().getTime()}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
