const fs = require('fs');
let s = fs.readFileSync('src/pdf/PdfDocument.tsx', 'utf8');

// The `expBox` in T6 (Creative)
s = s.replace(/<View key=\{ex\.id \|\| \`exp-\$\{idx\}\`\} style=\{styles\.expBox\}>/g,
  "<View key={ex.id || `exp-${idx}`} style={[styles.expBox, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>"
);

// The `expItem` in T10 (Ronalma)
s = s.replace(/<View key=\{ex\.id \|\| \`exp-\$\{idx\}\`\} style=\{styles\.expItem\}>/g,
  "<View key={ex.id || `exp-${idx}`} style={[styles.expItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>"
);

// The `eduItem` in T10
s = s.replace(/<View key=\{e\.id \|\| \`edu-\$\{idx\}\`\} style=\{styles\.eduItem\}>/g,
  "<View key={e.id || `edu-${idx}`} style={[styles.eduItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>"
);

// The `rowItem` in T13
s = s.replace(/<View key=\{idx\} style=\{styles\.rowItem\}>/g,
  "<View key={idx} style={[styles.rowItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>"
);
// We might also need `key={ex.id ...}` for rowItem if it has one. Let's see how rowItem is used in T13.
s = s.replace(/<View key=\{ex\.id \|\| \`exp-\$\{idx\}\`\} style=\{styles\.rowItem\}>/g,
  "<View key={ex.id || `exp-${idx}`} style={[styles.rowItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>"
);
s = s.replace(/<View key=\{e\.id \|\| \`edu-\$\{idx\}\`\} style=\{styles\.rowItem\}>/g,
  "<View key={e.id || `edu-${idx}`} style={[styles.rowItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>"
);

fs.writeFileSync('src/pdf/PdfDocument.tsx', s);
console.log("Done");
