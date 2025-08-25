// ==============================================
// File: src/utils/pdf/exportSummaryPdf.ts
// Reusable utility to generate a PDF with jsPDF + autoTable
// ==============================================
export type TableRow = (string | number | null | undefined)[];

export interface ExportSummaryOptions {
  /** Document title shown at the top of the PDF */
  title?: string;
  /** Headings for the table */
  columns: string[];
  /** 2D rows for the table */
  rows: TableRow[];
  /** File name for the download */
  filename?: string; // default: 'summary.pdf'
  /** Optional orientation and size */
  orientation?: 'p' | 'portrait' | 'l' | 'landscape';
  unit?: 'pt' | 'mm' | 'cm' | 'in';
  format?: string | number[]; // e.g. 'a4'
}

export async function exportSummaryPdf(opts: ExportSummaryOptions) {
  const {
    title = 'Summary',
    columns,
    rows,
    filename = 'summary.pdf',
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
  } = opts;

  // Dynamically import libs only when needed (keeps main bundle small)
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  // Some versions export default, some patch doc.autoTable — support both
  const autoTable = (autoTableMod as any).default ?? (autoTableMod as any);

  const doc = new jsPDF({ orientation, unit, format });

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 16);

  // Table (try doc.autoTable first, then the standalone helper)
  const tableOptions = {
    head: [columns],
    body: rows.map((r) => r.map((c) => (c ?? '') as string | number)),
    startY: 22,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [39, 116, 174] }, // UCLA-ish blue
  } as const;

  const maybeAuto = (doc as any).autoTable;
  if (typeof maybeAuto === 'function') {
    maybeAuto.call(doc, tableOptions);
  } else if (typeof autoTable === 'function') {
    autoTable(doc as any, tableOptions);
  } else {
    // Fallback: no-op to avoid hard crash
    console.warn('jspdf-autotable not available — table will not render');
  }

  doc.save(filename);
}

