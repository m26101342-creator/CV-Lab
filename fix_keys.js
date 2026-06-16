const fs = require('fs');

function addKeys(filePath, tagNames) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let mapRegex = /\.map\s*\(\s*(?:\(\s*([a-zA-Z0-9_]+)\s*(?:,\s*([a-zA-Z0-9_]+)\s*)?\)|([a-zA-Z0-9_]+))\s*(?:=>\s*)?/g;
  
  let match;
  let matches = [];
  while ((match = mapRegex.exec(content)) !== null) {
      matches.push({
          index: match.index,
          length: match[0].length,
          itemVar: match[1] || match[3] || 'item',
          idxVar: match[2]
      });
  }
  
  // We will do a simpler approach: print out all map calls and the next 100 characters to manually inspect.
  const lines = content.split('\n');
  lines.forEach((line, i) => {
     if (line.includes('.map(')) {
        console.log(`${filePath}:${i+1}: ${line}`);
        for(let j=1; j<=4 && i+j < lines.length; j++) {
            console.log(`    ${lines[i+j]}`);
        }
     }
  });
}

addKeys('src/App.tsx');
addKeys('src/pdf/PdfDocument.tsx');
