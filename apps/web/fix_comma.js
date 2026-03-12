const fs = require('fs');

const outputFile = 'c:\\Users\\Jace\\Antigravity\\studio\\apps\\web\\workers-trimmed.sql';
let content = fs.readFileSync(outputFile, 'utf8');

// Replace the very last trailing comma and newline with a semicolon
content = content.replace(/,\n$/, ';\n');

fs.writeFileSync(outputFile, content);
console.log('Fixed trailing comma to semicolon.');
