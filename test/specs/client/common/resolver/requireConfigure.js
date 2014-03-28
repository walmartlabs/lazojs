describe('requirejs configure', function () {

    var conf;
    beforeEach(function (done) {
        requirejs(['castle'], function (castle) {
            castle.test({
                module: 'resolver/requireConfigure',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    LAZO.initConf = {}; // mock for test
                    conf = module;
                    done();
                }
            });
        });
    });

    afterEach(function () {
        delete LAZO.initConf; // clean up test mock
    });

    it.skip('get client configuration', function (done) {
        var config,
            options = {
                basePath: 'base/path',
                baseUrl: 'base/url'
            };

        conf.get('client', options, function (err, conf) {
            config = conf;

            chai.expect(config.baseUrl).to.be.equal('base/url');
            chai.expect(config.context).to.be.equal('application');
            chai.expect(config.map['*'].s.indexOf('\/client\/')).to.not.be.equal(-1);

            done();
        });
    });

});