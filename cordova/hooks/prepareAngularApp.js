const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;
  const baseWWW = basePath + '/www';

  const prod = context.opts.options && context.opts.options['production'];
  const noCore = context.opts.options && context.opts.options['nocore'];

  if (!noCore) {
    console.log('Building core bundle.');

    const webpackCommand = 'npm run webpack' + (prod ? '-min' : '');
    console.log('Command:', webpackCommand);

    console.log(execSync(
      webpackCommand,
      {
        maxBuffer: 1024 * 1024,
        cwd: basePath + '/../src/crypto-core-async'
      }).toString('utf8')
    );
  }

  console.log('Building Angular application into "./www" directory.');

  const command = 'ng build --aot ' + (prod ? '--prod ' : '') + '--output-path cordova/www/ --base-href /android_asset/www/';
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
