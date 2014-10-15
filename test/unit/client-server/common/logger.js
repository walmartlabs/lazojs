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