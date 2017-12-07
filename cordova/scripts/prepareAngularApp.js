const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;
  const baseWWW = basePath + '/www';

  if (context.opts.options['build-bcoin']) {
    console.log('Building bcoin bundle.');
    console.log(execSync(
        "npm run webpack",
        {
          maxBuffer: 1024*1024,
          cwd: basePath + '/../src/bcoinlib'
        }).toString('utf8')
      );
  }

  console.log('Building Angular application into "./www" directory.');

  var target = 'dev';
  if (context.opts.options['target']) {
    target = context.opts.options['target'];
  }

  console.log(execSync(
    "ng build --" + target + "--output-path cordova/www/ --base-href",
    {
      maxBuffer: 1024*1024,
      cwd: basePath + '/..'
    }).toString('utf8')
  );

  var files = fs.readdirSync(baseWWW);
  for (var i = 0; i < files.length; i++) {
    if (files[i].endsWith('.gz')) {
      fs.unlinkSync(baseWWW + '/' + files[i]);
    }
  }
};
