define(['underscore', 'l!loggerUtils'], function (_, loggerUtils) {

    'use strict';

    // Constant

    var LogLevels = {
        DEBUG: 'debug',
        ERROR: 'error',
        INFO: 'info',
        WARN: 'warn'
    };

    // Private functions

    var consoleSink = function () {
        if (console && typeof console.log === 'function') {
            var logEntry = arguments[0];
            var columns = [logEntry.timestamp, logEntry.level, logEntry.requestId, logEntry.toString()];
            console.log.apply(console, [columns.join('\t')]);
        }
    };

    var noop = function () {
    };

    var unshift = function (args, level) {
        var array = loggerUtils._convertArgsToArray(args);
        array.unshift(level);
        return array;
    };

    // Constructor

    var Logger = function (options) {

        // Private variables

        var self = this,

            level = options && options.level,

            sinks = (options && options.sinks) || {console: consoleSink},

        // Protected methods

            log = function () {
                var args = loggerUtils._convertArgsToArray(arguments);
                var appendLevelTag = function (logEntry) {
                    if (!_.isArray(logEntry.tags)) {
                        logEntry.tags = [logEntry.tags];
                    }

                    logEntry.tags.push(logEntry.level);
                };

                var logEntry = {
                    timestamp: (new Date()).toISOString(),
                    level: args.shift().toUpperCase(),
                    requestId: loggerUtils.getRequestId(),
                    tags: [],
                    message: null,
                    error: null,
                    toString: function () {
                        return this.message;
                    }
                };

                if (args[0] instanceof Error) {
                    _.extend(logEntry, { error: args[0] });
                    if (args.length > 1) {
                        // If a message is provided, do not include the error message in the log entry message
                        args.shift();
                    }

                    logEntry.message = loggerUtils.formatter.apply(self, args); // strip the error arg from the front of the array
                    appendLevelTag(logEntry);
                }
                else if (_.isObject(args[0])) {
                    // assume JSON. Apply default values
                    logEntry = _.defaults(args[0], logEntry);
                    appendLevelTag(logEntry);
                }
                else {
                    // Default for backwards compatibility
                    _.extend(logEntry, { message: loggerUtils.formatter.apply(self, args) });

                    // Extract the last error parameters, if one exists
                    for (var argIdx = args.length; argIdx >= 0; argIdx--) {
                        if (args[argIdx] instanceof Error) {
                            logEntry.error = args[argIdx];
                            break;
                        }
                    }

                    appendLevelTag(logEntry);
                }

                for (var sink in sinks) {
                    if (sinks.hasOwnProperty(sink)) {
                        (function (sink) {
                            setTimeout(function () {
                                sinks[sink] && sinks[sink](logEntry);
                            }, 0);
                        }(sink));
                    }
                }

                return logEntry;
            },

            debugLog = function () {
                return log.apply(self, unshift(arguments, LogLevels.DEBUG));
            },

            errorLog = function () {
                return log.apply(self, unshift(arguments, LogLevels.ERROR));
            },

            infoLog = function () {
                return log.apply(self, unshift(arguments, LogLevels.INFO));
            },

            warnLog = function () {
                return log.apply(self, unshift(arguments, LogLevels.WARN));
            };

        // Public methods

        self.addSink = function (name, instance) {
            if (typeof name !== 'string' || typeof instance !== 'function') {
                throw new TypeError();
            }

            sinks[name] = instance;
        };

        self.consoleSink = consoleSink;

        self.getLevel = function () {
            return level;
        };

        self.getSinks = function () {
            return sinks;
        };

        self.removeSink = function (name) {
            if (sinks[name]) {
                delete sinks[name];
            }
        };

        self.setLevel = function (newLevel) {
            switch (newLevel) {
                case LogLevels.DEBUG:
                    self[LogLevels.DEBUG] = debugLog;
                    self[LogLevels.ERROR] = errorLog;
                    self[LogLevels.INFO] = infoLog;
                    self[LogLevels.WARN] = warnLog;
                    break;
                case LogLevels.ERROR:
                    self[LogLevels.DEBUG] = noop;
                    self[LogLevels.INFO] = noop;
                    self[LogLevels.WARN] = noop;
                    self[LogLevels.ERROR] = errorLog;
                    break;
                case LogLevels.INFO:
                    self[LogLevels.DEBUG] = noop;
                    self[LogLevels.INFO] = infoLog;
                    self[LogLevels.WARN] = warnLog;
                    self[LogLevels.ERROR] = errorLog;
                    break;
                case LogLevels.WARN:
                    self[LogLevels.DEBUG] = noop;
                    self[LogLevels.INFO] = noop;
                    self[LogLevels.WARN] = warnLog;
                    self[LogLevels.ERROR] = errorLog;
                    break;
                default:
                    return self.setLevel(LogLevels.ERROR);
            }

            infoLog('[common.logger.setLevel] Changing logging level to %s', newLevel);

            return level = newLevel;
        };

        // Init

        self.setLevel(level);
    };

    // Export singleton

    return new Logger();

});
