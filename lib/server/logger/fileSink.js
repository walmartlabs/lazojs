/*global __dirname:false*/

define(['underscore', 'fs', 'moment', 'os', 'path', 'util'], function (_, fs, moment, os, path, util) {

    var DEFAULT_FILE_NAME = 'lazojs.log';

    var DEFAULT_FILE_PATH = path.join(process.cwd(), DEFAULT_FILE_NAME);

    var MB = 1024 * 1024;

    var DEFAULT_MAX_SIZE = 10 * MB;

    var DEFAULT = {
        filePath: DEFAULT_FILE_PATH,
        maxSize: DEFAULT_MAX_SIZE,
        roll: true
    };

    var dateChanged = function (a, b) {
        return a === null || b === null ||
            a.getUTCFullYear() !== b.getUTCFullYear() ||
            a.getUTCMonth() !== b.getUTCMonth() ||
            a.getUTCDate() !== b.getUTCDate();
    };

    var getFilename = function (filePath) {
        return _.last(filePath.split(path.sep));
    };

    var getNextFilePath = function (filePath) {
        var dirPath = path.dirname(filePath);
        var files = fs.readdirSync(dirPath);
        var fileName = getFilename(filePath);
        var regExp = new RegExp('^' + fileName + '\\.(\\d+)$');
        var filtered = _.filter(files, function (file) {
            return regExp.test(file);
        });
        var last = _.last(filtered.sort());
        var match = last && regExp.exec(last);
        var sequence = match && match[1] ? parseInt(match[1]) + 1 : 1;

        return util.format('%s.%d', filePath, sequence);
    };

    var rollFileSync = function (filePath) {
        fs.renameSync(filePath, getNextFilePath(filePath));
    };

    var FileSink = function (options) {

        var _options = _.defaults({}, options, DEFAULT);

        // Check if directory exists

        if (!fs.existsSync(path.dirname(_options.filePath))) {
            throw new Error('Given path does not exist.');
        }

        // Check if can write file

        fs.appendFileSync(_options.filePath, os.EOL);

        // Initial status

        var stats = fs.statSync(_options.filePath);
        var fileSize = stats.size;
        var lastModified = stats.mtime;

        return function (message) {
            var now = new Date();

            if (fileSize > _options.maxSize || (_options.roll && dateChanged(lastModified, now))) {
                rollFileSync(_options.filePath);
                fileSize = 0;
            }

            var messageBuffer = new Buffer(message + os.EOL);

            fs.appendFileSync(_options.filePath, messageBuffer);

            fileSize += messageBuffer.length;
            lastModified = now;
        };
    };

    return FileSink;

});
