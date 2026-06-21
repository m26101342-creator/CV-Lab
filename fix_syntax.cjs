const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 1: style={{ ... }}} defaultText=
s = s.replace(/style=\{([^}]+)\}\}\} defaultText=/g, "style={$1}} defaultText=");

// Fix 2: style={{ ... } defaultText=
s = s.replace(/style=\{([^}]+)\} defaultText=/g, "style={$1} defaultText=");
// wait, the previous code had `style={{ color: '#111827' } defaultText=` where the `}` of the style object was missing.
s = s.replace(/style=\{\{\s*color:\s*['"]#[0-9A-Z]+['"]\s*\}\s*defaultText=/ig, (match) => {
    return match.replace("} defaultText=", "}} defaultText=");
});

// Let's do a more robust regex:
// If it's single brace inside `{ }`
s = s.replace(/style=\{\{\s*color:\s*[^}]*\}\s+defaultText=/g, (match) => {
    return match.replace("} defaultText=", "}} defaultText=");
});

s = s.replace(/\}\}\} defaultText=/g, '}} defaultText=');

// Fix 3: any other unterminated strings or braces? Let's check the error log again.
// tsc complains about parsing. Let's just fix `}}}` and see.

fs.writeFileSync('src/App.tsx', s);
console.log("Done");
