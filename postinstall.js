const fs = require('fs');

console.log('running postinstall script to enable crypto');

fs.readFile('./node_modules/@angular/cli/models/webpack-configs/browser.js', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  const result = data.replace(/crypto: 'empty',/g, 'crypto: true,');
  fs.writeFile('./node_modules/@angular/cli/models/webpack-configs/browser.js', result, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
  });
});
