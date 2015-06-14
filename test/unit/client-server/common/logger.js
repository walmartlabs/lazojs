define([
    'intern!bdd',
    'intern/chai!expect',
    'test/unit/utils',
    'sinon',
    'intern/chai!',
    'sinon-chai',
    'lib/common/logger'
], function (bdd, expect, utils, sinon, chai, sinonChai, logger) {
    chai.use(sinonChai);

    with (bdd) {

        describe('logger', function () {

            var noop = function () {
            };

            it('should have error as default level', function () {
                expect(logger.getLevel()).to.be.equal('error');
            });

            it('should have console as default sink', function () {
                var sinks = logger.getSinks();
                expect(sinks.console).to.exist;
                expect(sinks.console).to.be.a.function;
            });

            it('should format messages correctly', function () {
                this.skip();
                var dfd = this.async();
                sinon.stub(console, 'log');

                var error = new Error('consectetur adipiscing elit');
                error.stack = 'nullam vel tempus massa';

                expect(logger.error('Lorem ipsum dolor sit amet')).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\t-\tLorem ipsum dolor sit amet');
                expect(logger.error('Lorem ipsum dolor sit amet', {foo: 123, bar: 456})).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\t-\tLorem ipsum dolor sit amet {"foo":123,"bar":456}');
                expect(logger.error('Lorem ipsum dolor sit amet', error)).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\t-\tLorem ipsum dolor sit amet {"message":"consectetur adipiscing elit","stack":"nullam vel tempus massa"}');
                expect(logger.error('Lorem %s dolor %s amet', 'ipsum', 'sit')).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\t-\tLorem ipsum dolor sit amet');
                expect(logger.error('Lorem %s dolor %s amet')).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\t-\tLorem undefined dolor undefined amet');
                expect(logger.error('Lorem ipsum dolor sit amet %d %f', 3.14159, 3.14159)).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\t-\tLorem ipsum dolor sit amet 3 3.14159');

                setTimeout(function () {
                    expect(console.log.callCount).to.be.equal(6);
                    console.log.restore();
                    dfd.resolve();
                }, 0);
            });

            it('should change the log level', function () {
                logger.setLevel('warn');
                expect(logger.getLevel()).to.be.equal('warn');
                logger.setLevel('info');
                expect(logger.getLevel()).to.be.equal('info');
                logger.setLevel('debug');
                expect(logger.getLevel()).to.be.equal('debug');
            });

            it('should return structured log output', function () {
                var error = new Error('log error');
                var logEntry = logger.warn(error, 'message');
                expect(logEntry).to.have.property('error', error);
                expect(logEntry).to.have.property('message', 'message');
                expect(logEntry).to.have.property('level', 'WARN');
                expect(logEntry).to.have.property('timestamp');
                expect(logEntry).to.have.property('requestId');
            });

            it('should accept a structured log entry', function () {
                var logData = {
                    message: '1',
                    random: '2',
                    tags: ['test'],
                    toString: function () {
                        return 'prefix-' + this.message;
                    }
                };

                var logEntry = logger.warn(logData);
                expect(logEntry).to.have.property('error', null);
                expect(logEntry).to.have.property('message', logData.message);
                expect(logEntry).to.have.property('random', logData.random);
                expect(logEntry).to.have.property('level', 'WARN');
                expect(logEntry).to.have.property('timestamp');
                expect(logEntry).to.have.property('requestId');
                expect(logEntry.tags).to.have.length(2);
                expect(logEntry.tags).to.include.members(['test','WARN']);
                expect(logEntry.toString()).to.equal('prefix-1');
            });

            it('should assign error parameter to error property', function () {
                var error = new Error('log error');
                var logEntry = logger.warn('message', error);
                expect(logEntry).to.have.property('error', error);
                expect(logEntry).to.have.property('message');
                expect(logEntry).to.have.property('level', 'WARN');
                expect(logEntry).to.have.property('timestamp');
                expect(logEntry).to.have.property('requestId');
            });

            it('should remain backwards compatible', function () {

                // Account for difference in console.log() formatting (which is where the expectations have been copied from) to test for backwards compatibility
                var compatibilityFormatter = function (logEntry) {
                    // exclude timestamp for easier testing
                    var columns = [logEntry.level, logEntry.requestId + '   ', logEntry.toString()];
                    return columns.join('    ');
                };

                // expect(compatibilityFormatter(logger.warn({ message: 'this is a log entry' }))).to.equal('WARN    -       [object Object]'); // will not be equal
                // When 1st arg is an object, the original error output is [object Object]
                // This has been changed so a single object can be used to pass structured data

                expect(compatibilityFormatter(logger.warn(new Error('log error')))).to.equal('WARN    -       Error: log error');
                expect(compatibilityFormatter(logger.warn('message %d', 1))).to.equal('WARN    -       message 1');
                expect(compatibilityFormatter(logger.warn('message %i', 1))).to.equal('WARN    -       message 1');
                expect(compatibilityFormatter(logger.warn('message %f', 1.23))).to.equal('WARN    -       message 1.23');
                expect(compatibilityFormatter(logger.warn('message %j', { id: 1}))).to.equal('WARN    -       message {"id":1}');
                expect(compatibilityFormatter(logger.warn('message %s', '1'))).to.equal('WARN    -       message 1');
                var expectation = LAZO.app.isServer ? 'WARN    -       message. {"message":"log error","stack":"Error: log error' : '{}';
                expect(compatibilityFormatter(logger.warn('message.', new Error('log error')))).to.include(expectation);

            });

            it('should call new registered sink', function () {
                var dfd = this.async();
                var stubSink = sinon.stub();

                logger.addSink('stub', stubSink);

                expect(logger.getSinks()['stub']).to.be.a.function;

                logger.error('Lorem ipsum dolor sit amet');

                setTimeout(function () {
                    expect(stubSink).to.be.called.once;
                    dfd.resolve();
                }, 0);
            });

            it('should remove registered sink', function () {
                expect(logger.getSinks()['stub']).to.be.a.function;
                logger.removeSink('stub');
                expect(logger.getSinks()['stub']).to.not.exist;
            });

        });
    }
});