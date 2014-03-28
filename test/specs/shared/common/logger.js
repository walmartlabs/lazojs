describe('logger', function () {

    var logger = null;

    var noop = function () {
    };

    before(function (done) {
        Date.prototype.toISOString = function () {
            return '2012-01-27T12:30:00.000Z';
        };

        requirejs(['castle'], function (castle) {
            castle.test({
                module: 'lib/common/logger',
                globals: [
                    { module: 'lazo', exports: 'LAZO' }
                ],
                callback: function (module) {
                    logger = module;
                    done();
                }
            });
        });
    });

    it('should have error as default level', function () {
        expect(logger.getLevel()).to.be.equal('error');
    });

    it('should have console as default sink', function () {
        var sinks = logger.getSinks();
        expect(sinks.console).to.exist;
        expect(sinks.console).to.be.a.function;
    });

    it('should format messages correctly', function (done) {
        sinon.stub(console, 'log');

        expect(logger.error('Lorem ipsum dolor sit amet')).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\tLorem ipsum dolor sit amet');
        expect(logger.error('Lorem ipsum dolor sit amet', {foo: 123, bar: 456})).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\tLorem ipsum dolor sit amet {"foo":123,"bar":456}');
        expect(logger.error('Lorem %s dolor %s amet', 'ipsum', 'sit')).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\tLorem ipsum dolor sit amet');
        expect(logger.error('Lorem %s dolor %s amet')).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\tLorem undefined dolor undefined amet');
        expect(logger.error('Lorem ipsum dolor sit amet %d %f', 3.14159, 3.14159)).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\tLorem ipsum dolor sit amet 3 3.14159');
        expect(logger.error(['TempoAssetUpload.UtilActions', 'upload'], 'Lorem ipsum dolor sit amet')).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\tLorem ipsum dolor sit amet\tTempoAssetUpload.UtilActions.upload');
        expect(logger.error(['TempoAssetUpload.UtilActions', 'upload'], 'Lorem ipsum dolor sit amet', {"foo": 123, "bar": 456})).to.be.equal('2012-01-27T12:30:00.000Z\tERROR\tLorem ipsum dolor sit amet {"foo":123,"bar":456}\tTempoAssetUpload.UtilActions.upload');

        setTimeout(function () {
            expect(console.log.callCount).to.be.equal(7);
            console.log.restore();
            done();
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

    it('should call new registered sink', function (done) {
        var stubSink = sinon.stub();

        logger.addSink('stub', stubSink);

        expect(logger.getSinks()['stub']).to.be.a.function;

        logger.error('Lorem ipsum dolor sit amet');

        setTimeout(function () {
            expect(stubSink).to.be.called.once;
            done();
        }, 0);
    });

    it('should remove registered sink', function () {
        expect(logger.getSinks()['stub']).to.be.a.function;
        logger.removeSink('stub');
        expect(logger.getSinks()['stub']).to.not.exist;
    });

});