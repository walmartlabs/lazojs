var path = require('path');
var lazoPath = path.dirname(module.filename);

module.exports = function () {
    var forever = require('forever');
    var fsx = require('fs-extra');

    if (fsx.existsSync(lazoPath + '/lazo.pid')) {
        try {
            forever.stop('lib/server/app.js', true);
            forever.cleanUp();
            fsx.remove(lazoPath + '/lazo.pid');
            console.log('Lazo! stopped');
        } catch (err) {
            console.log('Error stopping Lazo!');
            process.exit(1);
        }
    }
};