const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    content = content.replace(/>Formação</g, ">{data.language === 'en' ? 'Education' : 'Formação'}<");
    content = content.replace(/>Idiomas</g, ">{data.language === 'en' ? 'Languages' : 'Idiomas'}<");
    content = content.replace(/>Perfil</g, ">{data.language === 'en' ? 'Profile' : 'Perfil'}<");
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Fixed", filePath);
}

fixFile('src/App.tsx');
fixFile('src/pdf/PdfDocument.tsx');
