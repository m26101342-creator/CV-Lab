const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf8');

// The `pt-2` dot container in T6
const regexT6Exp = /<div className="flex flex-col items-center pt-2">\s*<div className="w-2\.5 h-2\.5 rounded-full border-2 bg-white" style={{ borderColor: c\.primary }}><\/div>\s*<div className="w-0\.5 flex-1 bg-gray-200 mt-2 rounded-full"><\/div>\s*<\/div>/g;
s = s.replace(regexT6Exp, "{data.styleConfig?.showTimeline !== false && <div className=\"flex flex-col items-center pt-2\">\n<div className=\"w-2.5 h-2.5 rounded-full border-2 bg-white\" style={{ borderColor: c.primary }}></div>\n<div className=\"w-0.5 flex-1 bg-gray-200 mt-2 rounded-full\"></div>\n</div>}");

const regexT6Edu = /<div className="flex flex-col items-center pt-2">\s*<div className="w-2\.5 h-2\.5 rounded-full border-2 bg-white" style={{ borderColor: c\.primary }}><\/div>\s*<div className="w-0\.5 flex-1 bg-gray-50 my-1"><\/div>\s*<\/div>/g;
s = s.replace(regexT6Edu, "{data.styleConfig?.showTimeline !== false && <div className=\"flex flex-col items-center pt-2\">\n<div className=\"w-2.5 h-2.5 rounded-full border-2 bg-white\" style={{ borderColor: c.primary }}></div>\n<div className=\"w-0.5 flex-1 bg-gray-50 my-1\"></div>\n</div>}");

fs.writeFileSync('src/App.tsx', s);
console.log("Done T6");
