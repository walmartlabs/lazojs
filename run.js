var fs = require('fs');
var path = require('path');
var lazoPath = path.dirname(module.filename);
var os = require('os');
var args = parseArgs();

// helper functions

function parseArgs() {
    return require('optimist')
        .options('c', {
            alias: 'cluster'
        })
        .options('d', {
            alias: 'daemon'
        })
        .options('p', {
            alias: 'port',
            default: '8080'
        })
        .options('r', {
            alias: 'robust'
        })
        .boolean(['d', 'r'])
        .string(['p', 'c'])
        .argv;
}

// get the current version of lazo
function getVersion() {
    var packageJson = JSON.parse(fs.readFileSync(path.normalize(lazoPath + '/package.json'), 'utf8'));
    return packageJson.version;
}

// get the application file repo dir
function getFileRepoDir() {
    var fileRepo = args._[1] ? path.resolve(args._[1]) : undefined;
    return fileRepo && fs.existsSync(fileRepo) ? fileRepo : 0;
}

// copy values from one object to another
function augment(receiver, giver) {
    for (var key in giver) {
        receiver[key] = giver[key];
    }

    return receiver;
}

// get the options for a lazo command
function getStartEnvOptions() {
    var options = {};

    for (var k in args) {
        switch (k) {
            case 'daemon':
            case 'robust':
                options[k] = args[k] === true ? '1' : '0';
                break;
            case 'cluster':
                options[k] = args[k] ? args[k] : os.cpus().length;
                break;
            case 'port':
                options[k] = args[k];
                break;
        }
    }

    return options;
}

// set up the env vars upon start
function setEnv() {
    var options = getStartEnvOptions(),
        lazoPath = path.dirname(module.filename);

    process.env['BASE_PATH'] = lazoPath;
    process.env['BASE_REPO_DIR'] = path.join(lazoPath, 'base');
    process.env['LAZO_VERSION'] = getVersion();
    process.env['FILE_REPO_DIR'] = getFileRepoDir();
    process.env['PORT'] = options.port;

    for (var key in options) {
        process.env[key.toUpperCase()] = options[key];
    }
}

// run lazo as daemon
function daemon() {
    var fsx = require('fs-extra'),
        forever = require('forever');

    fsx.mkdirs(lazoPath + '/logs', function (err) {
        if (!err) {
            forever.load({ root: lazoPath + '/logs', pidPath: lazoPath });
            forever.startDaemon('lib/server/app.js', {
                logFile: 'lazo.log',
                pidFile: 'lazo.pid',
                errFile: 'logs/lazo.err',
                sourceDir: lazoPath,
                a: true
            });
            console.log('Started Lazo! on port ' + process.env['PORT']);
        } else {
            console.error(err);
        }
    });
}

// public API

// lazo start application_directory [-c[=1]] [-d] [-p=port_number]
function start() {
    var lazo;

    setEnv(args);

    if (process.env['FILE_REPO_DIR'] === '0') {
        help('start');
        process.exit(1);
    }

    if (args.d) {
        daemon();
    } else {
        console.log('Starting Lazo! on port ' + process.env['PORT'] + '. Please wait...');
        lazo = require('./lib/server/app.js');
        console.log('Started Lazo! on port ' + process.env['PORT']);
    }
}

// lazo stop
function stop() {
    var forever = require('forever'),
        fsx = require('fs-extra');

    console.log('Stopping Lazo!...');
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
}

// lazo --help [command]
function help(command) {
    switch (command) {
        case 'start':
            console.log('\nUsage: lazo start app_dir -c [num] -d -p [num]\n');
            console.log('Options:\n');
            console.log('app_dir [required] application directory');
            console.log('-c [optional] cluster, value [optional]\n');
            console.log('-d [optional] daemonize process using forever\n');
            console.log('-p [optional] port, value [required]\n');
            break;
        case 'stop':
            console.log('\nUsage: lazo stop\n');
            break;
        case 'create':
            console.log('\nUsage: lazo create\n');
            console.log('not implemented\n');
            break;
        case 'add':
            console.log('\nUsage: lazo add\n');
            console.log('not implemented\n');
            break;
        default:
            console.log('\nUsage: lazo --help command\n');
            console.log('Available commands: start stop version create add\n');
            console.log('Options:\n');
            console.log('command [optional]\n');
            break;
    }
}

// lazo create application [target_directory/]application_directory
function create() {
    console.log('This feature has not been implemented. Would you care to implement it?');
    process.exit(0);

    if (!args._[1]) {

    } else {

    }
}

// lazo add compononent component_name -c -v -t[=foo.hbs] # default will be index.hbs & index.js
// lazo add model model_name -s -m
// lazo add collection collection_name -s -c
function add() {
    console.log('This feature has not been implemented. Would you care to implement it?');
    process.exit(0);

    if (!args._[1]) {

    } else {

    }
}

// entry point
function main() {
    if (args._.length) {
        switch (args._[0]) {
            case 'start':
                start();
                break;
            case 'stop':
                stop();
                break;
            case 'create':
                create();
                break;
            case 'add':
                add();
                break;
            default:
                help();
                break;
        }
    } else {
        if (args.version) {
            console.log('v' + getVersion());
        } else if (args.help) {
            help(args.help);
        } else {
            help();
        }
    }
}

module.exports = main;