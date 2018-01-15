const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;

  const sourceFile = basePath + "/hooks/MainActivity.java";
  const targetDirectory = basePath + "/platforms/android/src/capital/spatium/wallet";

  if (!fs.existsSync(targetDirectory)) {
    return;
  }
  
  console.log('Replace MainActivity.java with the custom activity');
  console.log(execSync(
      "cp " + sourceFile + " " + targetDirectory,
      {
        maxBuffer: 1024*1024,
        cwd: basePath
      }).toString('utf8')
    );
};
