/*global __dirname:false*/

define(['underscore', 'fs', 'moment', 'os', 'path', 'util'], function (_, fs, moment, os, path, util) {

    var DEFAULT_FILE_NAME = 'lazojs.log';

    var DEFAULT_FILE_PATH = path.join(process.cwd(), DEFAULT_FILE_NAME);

    var MB = 1024 * 1024;

    var DEFAULT_MAX_SIZE = 10 * MB;

    var DEFAULT = {
        filePath: DEFAULT_FILE_PATH,
        maxFiles: 10,
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

    var getNextFilePath = function (filePath, maxFiles) {
        var dirPath = path.dirname(filePath);
        var files = fs.readdirSync(dirPath);
        var fileName = getFilename(filePath);
        var regExp = new RegExp('^' + fileName + '\\.(\\d+)$');
        var filtered = _.filter(files, function (file) {
            return regExp.test(file);
        });
        var last = _.max(filtered, function (fileName) {
            var filePath = path.join(dirPath, fileName);
            return fs.existsSync(filePath) ? fs.statSync(filePath).mtime : 0;
        });
        var match = last && regExp.exec(last);
        var pointer = match && match[1] ? parseInt(match[1]) : 0;
        var sequence = pointer >= 1 && pointer < maxFiles ? pointer + 1 : 1;

        return util.format('%s.%d', filePath, sequence);
    };

    var rollFileSync = function (filePath, maxFiles) {
        try {
            if (!fs.existsSync(filePath)) {
                return;
            }

            var nextFilePath = getNextFilePath(filePath, maxFiles);
            fs.renameSync(filePath, nextFilePath);
        } catch (error) {
            console.error(util.format('FileSink, error while rolling file "%s": %s', filePath, error.message));
        }
    };

    var FileSink = function (options) {

        var _options = _.defaults({}, options, DEFAULT);

        // Check if directory exists

        var dirPath = path.dirname(_options.filePath);

        if (!fs.existsSync(dirPath)) {
            throw new Error(util.format('FileSink, given path does not exist: %s', dirPath));
        }

        // Check if can write file

        fs.closeSync(fs.openSync(_options.filePath, 'a'));

        // Initial status

        var stats = fs.statSync(_options.filePath);
        var fileSize = stats.size;
        var lastModified = stats.mtime;

        // Sink function

        return function (message) {
            var now = new Date();
            var messageBuffer = new Buffer(message + os.EOL);
            var messageLength = messageBuffer.length;

            if ((fileSize + messageLength) > _options.maxSize || (_options.roll && dateChanged(lastModified, now))) {
                rollFileSync(_options.filePath, _options.maxFiles);
                fileSize = 0;
            }


            fs.appendFile(_options.filePath, messageBuffer, function (error) {
                if (error) {
                    return console.error(util.format('FileSink, error while appending to "%s": %s', _options.filePath, error.message));
                }

                fileSize += messageLength;
                lastModified = now;
            });
        };
    };

    return FileSink;

});
