const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  // T1
  { match: /<div className="t1-right-title">Resumo Profissional<\/div>/g, key: 'summary', default: 'Resumo Profissional', el: 'div', className: 't1-right-title' },
  { match: /<div className="t1-right-title">Experiência Profissional<\/div>/g, key: 'experience', default: 'Experiência Profissional', el: 'div', className: 't1-right-title' },
  { match: /<div className="t1-right-title">Formação Acadêmica<\/div>/g, key: 'education', default: 'Formação Acadêmica', el: 'div', className: 't1-right-title' },
  { match: /<div className="t1-section-title">Habilidades<\/div>/g, key: 'skills', default: 'Habilidades', el: 'div', className: 't1-section-title' },
  { match: /<div className="t1-section-title">Idiomas<\/div>/g, key: 'languages', default: 'Idiomas', el: 'div', className: 't1-section-title' },
  { match: /<div className="t1-section-title">Certificações e Cursos<\/div>/g, key: 'certifications', default: 'Certificações e Cursos', el: 'div', className: 't1-section-title' },
  // T2
  { match: /<div className="t2-section-title">Resumo<\/div>/g, key: 'summary', default: 'Resumo', el: 'div', className: 't2-section-title' },
  { match: /<div className="t2-section-title">Experiência Profissional<\/div>/g, key: 'experience', default: 'Experiência Profissional', el: 'div', className: 't2-section-title' },
  { match: /<div className="t2-section-title">Educação<\/div>/g, key: 'education', default: 'Educação', el: 'div', className: 't2-section-title' },
  { match: /<div className="t2-section-title">Competências<\/div>/g, key: 'skills', default: 'Competências', el: 'div', className: 't2-section-title' },
  { match: /<div className="t2-section-title">Idiomas<\/div>/g, key: 'languages', default: 'Idiomas', el: 'div', className: 't2-section-title' },
  { match: /<div className="t2-section-title">Certificações<\/div>/g, key: 'certifications', default: 'Certificações', el: 'div', className: 't2-section-title' },
  // T3
  { match: /<div className="t3-section-title">Resumo<\/div>/g, key: 'summary', default: 'Resumo', el: 'div', className: 't3-section-title' },
  { match: /<div className="t3-section-title">Experiência Profissional<\/div>/g, key: 'experience', default: 'Experiência Profissional', el: 'div', className: 't3-section-title' },
  { match: /<div className="t3-section-title">Educação<\/div>/g, key: 'education', default: 'Educação', el: 'div', className: 't3-section-title' },
  { match: /<div className="t3-section-title">Competências<\/div>/g, key: 'skills', default: 'Competências', el: 'div', className: 't3-section-title' },
  { match: /<div className="t3-section-title">Línguas<\/div>/g, key: 'languages', default: 'Línguas', el: 'div', className: 't3-section-title' },
  { match: /<div className="t3-section-title">Certificações<\/div>/g, key: 'certifications', default: 'Certificações', el: 'div', className: 't3-section-title' },
  // H2 generic (t4, t5, t6, t7...)
  { match: /<h2 className="text-\[28px\] font-black mb-4 leading-tight" style={{ color: '#111827' }}>([^<]+)<\/h2>/g, targetEl: 'h2', matchGroup: 1 },
  { match: /<h2 className="text-\[18px\] font-black uppercase tracking-\[0\.15em\] mb-6 border-b pb-4" style={{ color: '#111827', borderColor: '#F3F4F6' }}>([^<]+)<\/h2>/g, targetEl: 'h2', matchGroup: 1 },
  // H3 generic
  { match: /<h3 className="([^"]+)"(.*?)>([^<]+)<\/h3>/g, targetEl: 'h3', matchGroup: 3 },
  // Other headers
  { match: /<div className="([^"]*)text-\[10px\] font-black uppercase tracking-wider text-white mb-4([^"]*)"(.*?)>([^<]+)<\/div>/g, targetEl: 'div', matchGroup: 4 },
];

function getKey(text) {
    if (text.toLowerCase().includes('resumo') || text.toLowerCase().includes('perfil') || text.toLowerCase().includes('sobre') || text.toLowerCase().includes('objetivo')) return 'summary';
    if (text.toLowerCase().includes('experiência') || text.toLowerCase().includes('experiencia') || text.toLowerCase().includes('trabalho')) return 'experience';
    if (text.toLowerCase().includes('formação') || text.toLowerCase().includes('formacao') || text.toLowerCase().includes('educação') || text.toLowerCase().includes('educacao')) return 'education';
    if (text.toLowerCase().includes('habilidad') || text.toLowerCase().includes('competência') || text.toLowerCase().includes('competencias')) return 'skills';
    if (text.toLowerCase().includes('idioma') || text.toLowerCase().includes('língua') || text.toLowerCase().includes('lingua')) return 'languages';
    if (text.toLowerCase().includes('certifica')) return 'certifications';
    if (text.toLowerCase().includes('interesse')) return 'interests';
    return null;
}

replacements.forEach(r => {
    if (r.targetEl) {
        if (r.targetEl === 'h2') {
             content = content.replace(r.match, (match, title) => {
                 const key = getKey(title);
                 if (!key) return match;
                 let className = match.match(/className="([^"]+)"/)?.[1] || '';
                 let styleStr = match.match(/style=\{([^}]+)\}/)?.[0] || '';
                 return `<EditableTitle as="h2" className="${className}" ${styleStr} defaultText="${title}" text={getSectionTitle(data, '${key}', '${title}')} onSave={onChange ? (v) => handleTitleChange('${key}', v) : undefined} />`;
             });
        }
        if (r.targetEl === 'h3') {
             content = content.replace(r.match, (match, className, rest, title) => {
                 const key = getKey(title);
                 if (!key) return match;
                 // Don't replace if it's dynamic title like {cs.title}
                 if (title.includes('{')) return match;
                 return `<EditableTitle as="h3" className="${className}" ${rest} defaultText="${title}" text={getSectionTitle(data, '${key}', '${title}')} onSave={onChange ? (v) => handleTitleChange('${key}', v) : undefined} />`;
             });
        }
        if (r.targetEl === 'div') {
             content = content.replace(r.match, (match, cl1, cl2, rest, title) => {
                 const key = getKey(title);
                 if (!key) return match;
                 if (title.includes('{')) return match;
                 return `<EditableTitle as="div" className="${cl1}text-[10px] font-black uppercase tracking-wider text-white mb-4${cl2}" ${rest} defaultText="${title}" text={getSectionTitle(data, '${key}', '${title}')} onSave={onChange ? (v) => handleTitleChange('${key}', v) : undefined} />`;
             });
        }
    } else {
        content = content.replace(r.match, `<EditableTitle as="${r.el}" className="${r.className}" defaultText="${r.default}" text={getSectionTitle(data, '${r.key}', '${r.default}')} onSave={onChange ? (v) => handleTitleChange('${r.key}', v) : undefined} />`);
    }
});

fs.writeFileSync('src/App.tsx', content);

console.log("Done");
