const fs = require('fs');
let content = fs.readFileSync('src/pdf/PdfDocument.tsx', 'utf8');

const replacements = [
  { match: />Resumo Profissional</g, key: 'summary', default: 'Resumo Profissional' },
  { match: />Experiência Profissional</g, key: 'experience', default: 'Experiência Profissional' },
  { match: />Formação Acadêmica</g, key: 'education', default: 'Formação Acadêmica' },
  { match: />Habilidades</g, key: 'skills', default: 'Habilidades' },
  { match: />Idiomas</g, key: 'languages', default: 'Idiomas' },
  { match: />Certificações e Cursos</g, key: 'certifications', default: 'Certificações e Cursos' },

  { match: />Resumo</g, key: 'summary', default: 'Resumo' },
  { match: />Experiência</g, key: 'experience', default: 'Experiência' },
  { match: />Experiência de Trabalho</g, key: 'experience', default: 'Experiência de Trabalho' },
  { match: />Educação</g, key: 'education', default: 'Educação' },
  { match: />Formação</g, key: 'education', default: 'Formação' },
  { match: />Competências</g, key: 'skills', default: 'Competências' },
  { match: />Línguas</g, key: 'languages', default: 'Línguas' },
  { match: />Certificações</g, key: 'certifications', default: 'Certificações' },
  { match: />Interesses</g, key: 'interests', default: 'Interesses' }
];

replacements.forEach(r => {
    // Only replace inside existing `<Text>` headers! We don't want to replace all occurrences.
    // The `<Text...>` is closed, so we can match `>Title<`
    content = content.replace(r.match, `>{getSectionTitle(data, '${r.key}', '${r.default}')}<`);
});

fs.writeFileSync('src/pdf/PdfDocument.tsx', content);
console.log("Done");
