const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;

  const sourceDirecrory = basePath + "\\res\\ic_stat_res";
  const targetDirectory = basePath + "\\platforms\\android\\res";

  if (!fs.existsSync(targetDirectory)) {
    return;
  }
  
  console.log('Copy assets');
  console.log(execSync(
      "xcopy " + sourceDirecrory + " " + targetDirectory + " /e /d /y /h /r /c",
      {
        maxBuffer: 1024*1024,
        cwd: basePath
      }).toString('utf8')
    );
};
