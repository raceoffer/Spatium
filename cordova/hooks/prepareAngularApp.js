const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;
  const baseWWW = basePath + '/www';

  if (context.opts.options && context.opts.options['build-bcoin']) {
    console.log('Building bcoin bundle.');
    console.log(execSync(
        "npm run webpack",
        {
          maxBuffer: 1024*1024,
          cwd: basePath + '/../src/crypto-core-async'
        }).toString('utf8')
      );
  }

  let prod = '';
  if (context.opts.options && context.opts.options['production']) {
    prod = '--prod ';
  }

  console.log('Building Angular application into "./www" directory.');

  const command = "ng build --aot " + prod + "--output-path cordova/www/ --base-href /android_asset/www/";

  console.log('Command:', command);

  console.log(execSync(
    command,
    {
      maxBuffer: 1024*1024,
      cwd: basePath + '/..'
    }).toString('utf8')
  );

  const files = fs.readdirSync(baseWWW);
  for (let i = 0; i < files.length; i++) {
    if (files[i].endsWith('.gz')) {
      fs.unlinkSync(baseWWW + '/' + files[i]);
    }
  }
};
