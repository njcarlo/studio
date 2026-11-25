/**
 * Export tabular data as a UTF-8 BOM CSV file compatible with Excel and Google Sheets.
 */
export function exportToCsv(
    filename: string,
    headers: string[],
    rows: Array<Array<string | number | boolean | null | undefined>>,
): void {
    const escapeCell = (value: string | number | boolean | null | undefined): string => {
        if (value === null || value === undefined) return '""';
        const str = String(value);
        // Prevent Excel/Sheets formula execution when string cells start with formula prefixes.
        const safe = typeof value === 'string' && /^[=+\-@]/.test(str) ? `'${str}` : str;
        return `"${safe.replace(/"/g, '""')}"`;
    };

    const lines = [
        headers.map(escapeCell).join(','),
        ...rows.map((row) => row.map(escapeCell).join(',')),
    ];

    const csvContent = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
