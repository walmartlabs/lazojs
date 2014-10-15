define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'resolver/requireConfigure'
], function (bdd, chai, expect, sinon, sinonChai, utils, conf) {
    chai.use(sinonChai);

    with (bdd) {
        describe('requirejs configure', function () {

            beforeEach(function () {
                LAZO.initConf = {}; // mock for test
            });

            afterEach(function () {
                delete LAZO.initConf; // clean up test mock
            });

            it('get client configuration', function () {
                this.skip();
                var dfd = this.async();
                var config;
                var options = {
                    basePath: 'base/path',
                    baseUrl: 'base/url'
                };

                conf.get('client', options, function (err, conf) {
                    config = conf;

                    expect(config.baseUrl).to.be.equal('base/url');
                    expect(config.context).to.be.equal('application');
                    expect(config.map['*'].s.indexOf('\/client\/')).to.not.be.equal(-1);

                    dfd.resolve();
                });
            });

        });
    }
});