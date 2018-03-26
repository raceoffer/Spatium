const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;

  const sourceFile = basePath + "\\..\\src\\crypto-core-async\\webworker.bundle.js";
  const targetDirectory = basePath + "\\www";

  if (!fs.existsSync(targetDirectory)) {
    return;
  }
  
  console.log('Copy worker');
  console.log(execSync(
      "copy /b/v/y " + sourceFile + " " + targetDirectory,
      {
        maxBuffer: 1024*1024,
        cwd: basePath
      }).toString('utf8')
    );
};
