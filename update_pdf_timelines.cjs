const fs = require('fs');
let s = fs.readFileSync('src/pdf/PdfDocument.tsx', 'utf8');

// Replace standard timeline styles
s = s.replace(/<View key=\{e\.id \|\| \`edu-\$\{idx\}\`\} style=\{styles\.timelineItem\}>/g,
  "<View key={e.id || `edu-${idx}`} style={[styles.timelineItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>"
);
s = s.replace(/<View key=\{ex\.id \|\| \`exp-\$\{idx\}\`\} style=\{styles\.timelineItem\}>/g,
  "<View key={ex.id || `exp-${idx}`} style={[styles.timelineItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>"
);

// Conditionally hide dots
s = s.replace(/<View style=\{styles\.timelineDot\} \/>/g, 
  "{data.styleConfig?.showTimeline !== false && <View style={styles.timelineDot} />}"
);

fs.writeFileSync('src/pdf/PdfDocument.tsx', s);
console.log("Done");
