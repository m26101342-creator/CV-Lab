const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf8');

// For specific lines 3140, 3159, 3181
const replacements = [
  // T8
  {
    regex: /className="relative pl-6 border-l-2 border-sky-400\/30"/g,
    repl: "className={`relative ${data.styleConfig?.showTimeline !== false ? 'pl-6 border-l-2 border-sky-400/30' : ''}`}"
  },
  {
    regex: /<div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow bg-sky-400" \/>/g,
    repl: "{data.styleConfig?.showTimeline !== false && <div className=\"absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow bg-sky-400\" />}"
  },
  
  // T9 (around 3255, 3279)
  {
    regex: /className="relative pl-4 border-l-2 border-emerald-100"/g,
    repl: "className={`relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l-2 border-emerald-100' : ''}`}"
  },
  {
    regex: /<div className="absolute -left-\[5px\] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: c.primary }}><\/div>/g,
    repl: "{data.styleConfig?.showTimeline !== false && <div className=\"absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white\" style={{ backgroundColor: c.primary }}></div>}"
  },

  // T10
  {
    regex: /className="pl-5 border-l-2 relative"/g,
    repl: "className={`relative ${data.styleConfig?.showTimeline !== false ? 'pl-5 border-l-2' : ''}`}"
  },
  {
    regex: /<div className="absolute -left-\[4px\] top-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.primary }}><\/div>/g,
    repl: "{data.styleConfig?.showTimeline !== false && <div className=\"absolute -left-[4px] top-1.5 w-1.5 h-1.5 rounded-full\" style={{ backgroundColor: c.primary }}></div>}"
  },

  // T11
  {
    regex: /className="relative pl-4 border-l"/g,
    repl: "className={`relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l' : ''}`}"
  },
  {
    regex: /<div className="absolute -left-\[1.5px\] top-1.5 w-1 h-1 rounded-full" style={{ backgroundColor: c.primary }}><\/div>/g,
    repl: "{data.styleConfig?.showTimeline !== false && <div className=\"absolute -left-[1.5px] top-1.5 w-1 h-1 rounded-full\" style={{ backgroundColor: c.primary }}></div>}"
  },

  // T13
  {
    regex: /className="space-y-1 relative pl-4 border-l-2" style={{ borderLeftColor: c.primary }}/g,
    repl: "className={`space-y-1 relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}"
  },

  // other random template
  {
    regex: /className="pl-3 border-l-2 space-y-1" style={{ borderColor: c.primary }}/g,
    repl: "className={`space-y-1 ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}"
  },
  {
    regex: /className="space-y-1.5 pl-3 border-l-2" style={{ borderColor: c.primary }}/g,
    repl: "className={`space-y-1.5 ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}"
  },
  {
    regex: /className="space-y-1 relative pl-3 border-l-2" style={{ borderColor: c.primary }}/g,
    repl: "className={`space-y-1 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}"
  }
];

let changed = s;
replacements.forEach(r => {
  changed = changed.replace(r.regex, r.repl);
});

fs.writeFileSync('src/App.tsx', changed);
console.log("Done");
