const fs = require('fs');
const readline = require('readline');

async function processFile() {
    const inputFile = 'c:\\Users\\Jace\\Antigravity\\studio\\apps\\web\\workers-data-dump.sql';
    const outputFile = 'c:\\Users\\Jace\\Antigravity\\studio\\apps\\web\\workers-trimmed.sql';

    const targetColumns = [0, 2, 3, 4, 6, 7, 9, 10, 12, 15, 21, 23, 24, 25, 27];
    const targetColNames = ['id', 'first_name', 'last_name', 'email', 'password', 'mobile', 'area_id', 'birthdate', 'ministry_id', 'status', 'sys_update_date', 'remarks', 'qrdata', 'worker_status', 'worker_type'];

    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const outStream = fs.createWriteStream(outputFile);
    outStream.write(`INSERT INTO \`worker\` (\`${targetColNames.join('`, `')}\`) VALUES\n`);

    function parseValues(rowStr) {
        let vals = [];
        let current = '';
        let inString = false;
        let escape = false;

        for (let i = 0; i < rowStr.length; i++) {
            const c = rowStr[i];
            if (escape) {
                current += c;
                escape = false;
            } else if (c === '\\') {
                current += c;
                escape = true;
            } else if (c === "'") {
                inString = !inString;
                current += c;
            } else if (c === ',' && !inString) {
                vals.push(current.trim());
                current = '';
            } else {
                current += c;
            }
        }
        vals.push(current.trim());
        return vals;
    }

    let count = 0;
    for await (const line of rl) {
        if (line.trim().startsWith('INSERT')) continue;
        if (!line.trim()) continue;

        // Extract the values part between parentheses: (val1, val2, ...), OR (val1, val2, ...);
        // Because of the size, regex might not always work perfectly if there are newlines,
        // but looking at your dump format, each row is neatly on its own line:  (1, 72, ...),
        const match = line.match(/^\s*\((.*)\)\s*([,;]?)\s*$/);
        if (!match) continue;

        const inner = match[1];
        const endChar = match[2] || ',';

        const vals = parseValues(inner);
        
        // Safety check to ensure we parsed roughly the right number of columns (29)
        if (vals.length >= 25) {
            const keptVals = targetColumns.map(idx => vals[idx]);
            outStream.write(`(${keptVals.join(', ')})${endChar}\n`);
            count++;
        }
    }

    outStream.end();
    console.log(`Successfully trimmed ${count} rows and saved to ${outputFile}`);
}

processFile().catch(console.error);
