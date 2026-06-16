import fs from 'fs';

function addKeys(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const lines = content.split('\n');
  lines.forEach((line, i) => {
     if (line.includes('.map')) {
        console.log(`${filePath}:${i+1}: ${line.trim()}`);
        for(let j=1; j<=4 && i+j < lines.length; j++) {
            console.log(`    ${lines[i+j].trim()}`);
        }
     }
  });
}

addKeys('src/App.tsx');
addKeys('src/pdf/PdfDocument.tsx');
