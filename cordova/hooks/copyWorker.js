const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;

  const prod = context.opts.options && context.opts.options['production'];
  let sourceFile = basePath + "/../node_modules/crypto-core-async/webworker" + (prod ? "-prod" : "-dev") + ".bundle.js";
  let targetFile = basePath + "/www/webworker.bundle.js";

  console.log('Copy worker');

  const copyCommand = process.platform === 'win32' ? "copy /b/v/y " : "cp ";
  if (process.platform === 'win32') {
    sourceFile = sourceFile.replace(/\//g, '\\');
    targetFile = targetFile.replace(/\//g, '\\');
  }

  console.log(execSync(
    copyCommand + sourceFile + " " + targetFile, {
      maxBuffer: 1024*1024,
      cwd: basePath
    }).toString('utf8')
  );
};
