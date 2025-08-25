// src/utils/csv.ts
export function toCsv(rows: Record<string, any>[], headers?: string[]): string {
    if (!rows.length) return '';
    const cols = headers ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
    const escape = (v: any) => {
    if (v == null) return '';
    const s = String(v).replaceAll('"', '""');
    return /[,"]|\n/.test(s) ? `"${s}"` : s;
    };
    const lines = [cols.join(',')];
    for (const r of rows) lines.push(cols.map((c) => escape(r[c])).join(','));
    return lines.join('\n');
    }
    
    
    export function download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    }