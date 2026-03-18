const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function compile(template, filename) {
  let code = 'let __output = "";\n';
  let cursor = 0;
  const regex = /<%([=-]?)([\s\S]*?)%>/g;
  let match;

  while ((match = regex.exec(template)) !== null) {
    const preceding = template.slice(cursor, match.index);
    if (preceding) {
      code += `__output += ${JSON.stringify(preceding)};\n`;
    }
    const prefix = match[1];
    const content = match[2].trim();
    if (prefix === '=') {
      code += `__output += __escape(${content});\n`;
    } else if (prefix === '-') {
      code += `__output += (${content});\n`;
    } else {
      code += `${content}\n`;
    }
    cursor = match.index + match[0].length;
  }

  const rest = template.slice(cursor);
  if (rest) {
    code += `__output += ${JSON.stringify(rest)};\n`;
  }
  code += 'return __output;';

  return new Function('__data', 'include', '__escape', `with (__data) {\n${code}\n}`);
}

function render(template, data, filename) {
  const compiled = compile(template, filename);
  const include = (includePath, includeData = {}) => {
    const resolved = includePath.endsWith('.ejs') ? includePath : `${includePath}.ejs`;
    const fullPath = path.resolve(path.dirname(filename), resolved);
    const source = fs.readFileSync(fullPath, 'utf8');
    return render(source, { ...data, ...includeData }, fullPath);
  };
  return compiled(data, include, escapeHtml);
}

function renderFile(filename, data, callback) {
  try {
    const template = fs.readFileSync(filename, 'utf8');
    const html = render(template, data, filename);
    callback(null, html);
  } catch (error) {
    callback(error);
  }
}

module.exports = {
  renderFile,
  __express: renderFile
};
