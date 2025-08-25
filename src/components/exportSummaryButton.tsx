

// ==============================================
// File: src/components/ExportSummaryButton.tsx
// Small example button that calls exportSummaryPdf
// ==============================================
import React from 'react';
import { exportSummaryPdf, type TableRow } from '../utils/exportSummarypdf';


interface Props {
columns: string[];
rows: TableRow[];
filename?: string;
title?: string;
}


const ExportSummaryButton: React.FC<Props> = ({ columns, rows, filename = 'summary.pdf', title = 'Summary' }) => {
const [busy, setBusy] = React.useState(false);
const [err, setErr] = React.useState<string | null>(null);


const onClick = async () => {
setErr(null);
setBusy(true);
try {
await exportSummaryPdf({ columns, rows, filename, title });
} catch (e: any) {
console.error('Export failed', e);
setErr(e?.message ?? 'Export failed');
} finally {
setBusy(false);
}
};


return (
<div>
<button type="button" onClick={onClick} disabled={busy} className="submit">
{busy ? 'Exporting…' : 'Export PDF'}
</button>
{err && <p style={{ color: 'salmon' }}>{err}</p>}
</div>
);
};


export default ExportSummaryButton;