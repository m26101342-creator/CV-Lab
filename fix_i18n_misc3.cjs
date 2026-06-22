const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    content = content.replace(/>Sobre Mim</g, ">{data.language === 'en' ? 'About Me' : 'Sobre Mim'}<");
    content = content.replace(/>Síntese</g, ">{data.language === 'en' ? 'Summary' : 'Síntese'}<");
    content = content.replace(/>Atentamente,</g, ">{data.language === 'en' ? 'Sincerely,' : 'Atentamente,'}<");
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Fixed", filePath);
}

fixFile('src/App.tsx');
fixFile('src/pdf/PdfDocument.tsx');
