const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;

  let sourceFile = basePath + "/package.windows10.appxmanifest";
  let targetDirectory = basePath + "/platforms/windows";

  if (!fs.existsSync(targetDirectory)) {
    return;
  }
  
  console.log('Copy package.windows10.appxmanifest');

  const copyCommand = process.platform === 'win32' ? "copy /b/v/y " : "cp ";
  if (process.platform === 'win32') {
    sourceFile = sourceFile.replace(/\//g, '\\');
    targetDirectory = targetDirectory.replace(/\//g, '\\');
  }

  console.log(execSync(
    copyCommand + sourceFile + " " + targetDirectory, {
      maxBuffer: 1024*1024,
      cwd: basePath
    }).toString('utf8')
  );
};
