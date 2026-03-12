const fs = require('fs');

const inputFile = 'c:\\Users\\Jace\\Antigravity\\studio\\apps\\web\\ministry.sql';
const outputFile = 'c:\\Users\\Jace\\Antigravity\\studio\\apps\\web\\ministry.json';

const content = fs.readFileSync(inputFile, 'utf8');

// The departments match WORDA as requested:
// 1 = Worship
// 2 = Outreach
// 3 = Relationship
// 4 = Discipleship
// 5 = Administration
const departmentMap = {
    1: 'Worship',
    2: 'Outreach',
    3: 'Relationship',
    4: 'Discipleship',
    5: 'Administration'
};

const lines = content.split('\n');
const ministries = {};

for (const line of lines) {
    // Looking for lines like: (1, 'Crusade', 1, NULL),
    const match = line.match(/^\s*\((\d+),\s*'([^']+)',\s*(\d+),\s*([^\)]+)\)[,;]/);
    if (match) {
        const id = parseInt(match[1]);
        const name = match[2];
        const deptId = parseInt(match[3]);
        
        let departmentName = departmentMap[deptId] || 'Administration'; // fallback
        
        ministries[id] = {
            id: id,
            name: name,
            department: departmentName
            // Note: Our Prisma schema needs department (enum) and name.
        };
    }
}

fs.writeFileSync(outputFile, JSON.stringify(ministries, null, 2));
console.log(`Parsed ${Object.keys(ministries).length} ministries.`);
