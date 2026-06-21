const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf8');

// The issue: "
//     Formação Académica
//   "
// Inside defaultText=" ... "
// We can replace newlines inside defaultText="..." with nothing, and trim the spaces.
// Same for text=

s = s.replace(/defaultText="([^"]*)"/g, (match, p1) => {
    return 'defaultText="' + p1.replace(/\n/g, '').trim() + '"';
});

s = s.replace(/\]\), '([^']+)'\)/g, (match, p1) => {
    return "]), '" + p1.replace(/\n/g, '').trim() + "')";
});

fs.writeFileSync('src/App.tsx', s);
console.log("Done");
