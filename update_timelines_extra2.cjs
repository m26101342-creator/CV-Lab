const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  // T9
  {
    regex: /className="space-y-1\.5 relative pl-4 border-l border-gray-100"/g,
    repl: "className={`space-y-1.5 relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l border-gray-100' : ''}`}"
  },
  
  // T10?
  {
    regex: /className="space-y-1 relative pl-3 border-l border-gray-100"/g,
    repl: "className={`space-y-1 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l border-gray-100' : ''}`}"
  },
  {
    regex: /className="space-y-0\.5 relative pl-3 border-l border-gray-100"/g,
    repl: "className={`space-y-0.5 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l border-gray-100' : ''}`}"
  },
  
  // T12?
  {
    regex: /className="space-y-0\.5 relative pl-3 border-l border-zinc-800"/g,
    repl: "className={`space-y-0.5 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l border-zinc-800' : ''}`}"
  }
];

let changed = s;
replacements.forEach(r => {
  changed = changed.replace(r.regex, r.repl);
});

fs.writeFileSync('src/App.tsx', changed);
console.log("Done");
