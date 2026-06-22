const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix ex.current checks
    content = content.replace(/ex\.current \? "Presente" : ex\.endDate/g, "ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate");
    content = content.replace(/ex\.current \? "PRESENTE" : ex\.endDate/g, "ex.current ? (data.language === 'en' ? 'PRESENT' : 'PRESENTE') : ex.endDate");
    content = content.replace(/ex\.current \? 'PRESENTE' : ex\.endDate/g, "ex.current ? (data.language === 'en' ? 'PRESENT' : 'PRESENTE') : ex.endDate");

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Fixed", filePath);
}

fixFile('src/App.tsx');
fixFile('src/pdf/PdfDocument.tsx');
