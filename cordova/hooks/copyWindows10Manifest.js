const fs = require('fs'),
  execSync = require('child_process').execSync,
  parseString = require('xml2js').parseString,
  xml2js = require('xml2js');

module.exports = function (context) {
  const basePath = context.opts.projectRoot;

  const config = basePath + '/config.xml',
    sourceFile = basePath + '/package.windows10.appxmanifest',
    targetFile = basePath + '/platforms/windows/package.windows10.appxmanifest';

  if (!fs.existsSync(basePath + '/platforms/windows')) {
    return;
  }

  console.log('Update package.windows10.appxmanifest');

  fs.readFile(config, 'utf-8', function (err, data) {
    if (err) throw new Error(err);

    parseString(data, function (err, json) {
      if (err) throw new Error(err);

      const version = json.widget.$.version;

      fs.readFile(sourceFile, 'utf-8', function (err, data) {
        if (err) throw new Error(err);

        parseString(data, function (err, json) {
          if (err) throw new Error(err);

          json.Package.Identity[0].$.Version = version;

          const builder = new xml2js.Builder();
          const xml = builder.buildObject(json);

          fs.writeFile(targetFile, xml, function (err, data) {
            if (err) throw new Error(err);

            console.log('package.windows10.appxmanifest updated');
          });
        });
      });
    });
  });
};
