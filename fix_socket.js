const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('.next') && !dirFile.includes('node_modules')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'client'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(/getSocket\(\)/g, 'socket');
  content = content.replace(/getSocket/g, 'socket');
  content = content.replace(/'static'/g, '"static" as any'); // fix the string literal type issue
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
