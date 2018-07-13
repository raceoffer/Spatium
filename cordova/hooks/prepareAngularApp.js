const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
  const basePath = context.opts.projectRoot;
  const baseWWW = basePath + '/www';

  const prod = context.opts.options && context.opts.options['production'];
  const noCore = context.opts.options && context.opts.options['nocore'];

  if (!noCore) {
    console.log('Building core bundle.');

    const webpackCommand = 'npm run webpack' + (prod ? '-prod' : '-dev');
    console.log('Command:', webpackCommand);

    console.log(execSync(
      webpackCommand,
      {
        maxBuffer: 1024 * 1024
      }).toString('utf8')
    );
  }

  console.log('Building Angular application into "./www" directory.');

  let baseHref = "/android_asset/www/";
  if (context.opts.cordova.platforms.length === 1) {
    switch (context.opts.cordova.platforms[0]) {
      case 'windows': baseHref = '/www/'; break;
      case 'ios': baseHref = '#'; break;
    }
  }
  const command = 'ng build --aot ' + (prod ? '--prod ' : '') + '--output-path cordova/www/ --base-href ' + baseHref;
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
