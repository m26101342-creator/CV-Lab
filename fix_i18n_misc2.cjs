const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    content = content.replace(/>Habilidades</g, ">{data.language === 'en' ? 'Skills' : 'Habilidades'}<");
    content = content.replace(/>Resumo</g, ">{data.language === 'en' ? 'Summary' : 'Resumo'}<");
    content = content.replace(/>Prémios</g, ">{data.language === 'en' ? 'Awards' : 'Prémios'}<");
    content = content.replace(/>Prêmios</g, ">{data.language === 'en' ? 'Awards' : 'Prêmios'}<");
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Fixed", filePath);
}

fixFile('src/App.tsx');
fixFile('src/pdf/PdfDocument.tsx');
