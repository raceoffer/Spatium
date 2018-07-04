const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;

  const prod = context.opts.options && context.opts.options['production'];
  let sourceFile = basePath + "\\node_modules\\crypto-core-async\\webworker.bundle.js";
  let targetDirectory = basePath + "\\www";

  if (!fs.existsSync(targetDirectory)) {
    return;
  }

  console.log('Copy worker');

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
  if (!prod) {
    console.log(execSync(
      copyCommand + sourceFile + ".map" + " " + targetDirectory, {
        maxBuffer: 1024*1024,
        cwd: basePath
      }).toString('utf8')
    );
  }
};
