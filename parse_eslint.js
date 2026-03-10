const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint_results.json', 'utf8'));
data.forEach(file => {
  file.messages.forEach(msg => {
    if ([
        'react-hooks/set-state-in-effect', 
        'react-hooks/preserve-manual-memoization', 
        '@typescript-eslint/no-unused-vars', 
        'react-refresh/only-export-components'
    ].includes(msg.ruleId)) {
        console.log(`${file.filePath}:${msg.line}:${msg.ruleId}`);
    }
  });
});
