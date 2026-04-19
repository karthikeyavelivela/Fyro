const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Replace Google Fonts Import
css = css.replace(
  /@import url\('.*?'\);/g,
  `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');`
);

// 2. Replace CSS Variables
css = css.replace(/--bg: #f5f1ea;/g, '--bg: #FAFAFA;');
css = css.replace(/--bg-secondary: #ebe4d8;/g, '--bg-secondary: #F4F4F5;');
css = css.replace(/--surface: rgba\(255, 255, 255, 0\.92\);/g, '--surface: rgba(255, 255, 255, 0.98);');
css = css.replace(/--surface-raised: #fcfaf6;/g, '--surface-raised: #FFFFFF;');
css = css.replace(/--surface-dark: #171614;/g, '--surface-dark: #09090B;');
css = css.replace(/--surface-dark-2: #23211e;/g, '--surface-dark-2: #18181B;');
css = css.replace(/--border: rgba\(26,25,22,0\.08\);/g, '--border: rgba(0,0,0,0.06);');
css = css.replace(/--border-strong: rgba\(26,25,22,0\.14\);/g, '--border-strong: rgba(0,0,0,0.12);');
css = css.replace(/--text: #0F0E0C;/g, '--text: #09090B;');
css = css.replace(/--text-muted: #6B6860;/g, '--text-muted: #71717A;');
css = css.replace(/--text-faint: #A8A49E;/g, '--text-faint: #A1A1AA;');
css = css.replace(/--teal: #0D9488;/g, '--dark-red: #9F1239;'); // Dark red / Rose-800 equivalent
css = css.replace(/--teal-light: #CCFBF1;/g, '--dark-red-light: #FFE4E6;');

// 3. Replace Fonts
css = css.replace(/font-family: 'Outfit', sans-serif;/g, `font-family: 'Inter', sans-serif;`);
css = css.replace(/font-family: 'Syne', sans-serif;/g, `font-family: 'Plus Jakarta Sans', sans-serif;`);
css = css.replace(/Syne, sans-serif/g, `Plus Jakarta Sans, sans-serif`);

// 4. Update body backgrounds
css = css.replace(/background:\s+radial-gradient\([\s\S]*?linear-gradient\([\s\S]*?#efe7dc 100%\);/, 
  `background: radial-gradient(circle at 0% 0%, rgba(255, 107, 43, 0.08), transparent 24%), radial-gradient(circle at 100% 0%, rgba(159, 18, 57, 0.05), transparent 22%), linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%);`
);

// 5. Update specific usages of teal/orange to dark red
css = css.replace(/rgba\(13, 148, 136, 0.12\)/g, 'rgba(159, 18, 57, 0.08)');
css = css.replace(/var\(--teal\)/g, 'var(--dark-red)');
css = css.replace(/var\(--teal-light\)/g, 'var(--dark-red-light)');

fs.writeFileSync(cssPath, css);
console.log('CSS updated successfully');
