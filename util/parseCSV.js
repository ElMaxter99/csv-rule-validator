import Papa from 'papaparse';

export async function parseCSV(csvString) {
  const { data } = Papa.parse(csvString.trim(), {
    header: true,
    skipEmptyLines: true,
  });
  return data;
}
