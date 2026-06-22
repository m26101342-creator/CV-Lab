const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix Contacto 
    content = content.replace(/"Contacto"/g, "(data.language === 'en' ? 'Contact' : 'Contacto')");
    content = content.replace(/'Contacto'/g, "(data.language === 'en' ? 'Contact' : 'Contacto')");
    content = content.replace(/>Contacto</g, ">{data.language === 'en' ? 'Contact' : 'Contacto'}<");

    // Any Mês, Ano?
    content = content.replace(/>Mês\/Ano</g, ">{data.language === 'en' ? 'Month/Year' : 'Mês/Ano'}<");
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Fixed", filePath);
}

fixFile('src/App.tsx');
fixFile('src/pdf/PdfDocument.tsx');
