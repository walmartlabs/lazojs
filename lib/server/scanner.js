// returns a hash used to determine if the base class should be loaded
var fs = require('fs');
var path = require('path');
var dir = require('node-dir');

function scan(appPath, callback) {
    var processed = 0;
    var retVal = {
        components: { subdir: '/components', filters: ['controller.js', path.sep + 'views' + path.sep, '.css', path.sep + 'imports' + path.sep] },
        models: { subdir: '/models', filters: ['model.js', 'collection.js'] },
        appViews: { subdir: '/app/views', filters: [] }
    };

    function getRelativePath(appPath, absolutePath) {
        return absolutePath.replace(appPath + path.sep, '').replace(/\\/g, '/');
    }

    console.log('Scanning application directory. Please wait...');

    for (var k in retVal) {
        (function (k, retVal) {
            var subdir = path.normalize(appPath + retVal[k].subdir);
            var filesHash = {};
            dir.files(subdir, function (err, files) {
                if (err) {
                    console.log('WARNING: ' + err.path + ' does not exist');
                } else {
                    files.forEach(function (file) {
                        if (retVal[k].filters.length) {
                            retVal[k].filters.forEach(function (filter) {
                                if (file.indexOf(filter) !== -1) {
                                    filesHash[getRelativePath(appPath, file)] = true;
                                }
                            });
                        } else {
                            filesHash[getRelativePath(appPath, file)] = true;
                        }
                    });
                }

                retVal[k] = filesHash;
                processed++;
                if (processed === 3) {
                    callback(retVal);
                }
            });
        })(k, retVal);
    }
}

module.exports = scan;