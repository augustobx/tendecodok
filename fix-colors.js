const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/xampp/htdocs/tendecodok/src');
let modifiedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    let lines = content.split('\n');
    let changed = false;
    for(let i=0; i<lines.length; i++) {
        let line = lines[i];
        
        const replaceIfNotDark = (pattern, replacement, excludePatterns = []) => {
            if (line.includes(pattern)) {
                let hasExclude = excludePatterns.some(ex => line.includes(ex));
                if (!hasExclude) {
                    const regex = new RegExp(pattern + '\\b', 'g');
                    let oldLine = line;
                    line = line.replace(regex, replacement);
                    if (oldLine !== line) {
                        changed = true;
                    }
                }
            }
        };

        replaceIfNotDark('bg-white', 'bg-white dark:bg-zinc-900', ['dark:bg-', 'bg-white/20', 'bg-white/10', 'bg-white text-indigo', 'text-white']);
        replaceIfNotDark('border-slate-200', 'border-slate-200 dark:border-zinc-800', ['dark:border-']);
        replaceIfNotDark('bg-slate-50', 'bg-slate-50 dark:bg-zinc-800', ['dark:bg-', 'hover:bg-slate-50']);
        
        replaceIfNotDark('text-slate-500', 'text-slate-500 dark:text-slate-400', ['dark:text-']);
        replaceIfNotDark('text-slate-600', 'text-slate-600 dark:text-slate-300', ['dark:text-']);
        replaceIfNotDark('text-slate-700', 'text-slate-700 dark:text-slate-200', ['dark:text-']);
        replaceIfNotDark('text-slate-800', 'text-slate-800 dark:text-slate-100', ['dark:text-']);

        if (line.includes('hover:bg-slate-50') && !line.includes('dark:hover:bg-')) {
            line = line.replace(/hover:bg-slate-50/g, 'hover:bg-slate-50 dark:hover:bg-zinc-800');
            changed = true;
        }

        lines[i] = line;
    }
    
    if (changed) {
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
        modifiedFiles++;
        console.log('Fixed: ' + file);
    }
});
console.log('Total files modified: ' + modifiedFiles);
