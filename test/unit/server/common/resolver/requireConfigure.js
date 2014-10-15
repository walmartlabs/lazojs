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

            it('get server configuration', function (done) {
                var dfd = this.async();
                var config;
                var options = {
                    basePath: process.cwd(),
                    baseUrl: 'some/path'
                };

                conf.get('server', options, function (err, conf) {
                    config = conf;

                    expect(config.baseUrl).to.be.equal('some/path');
                    expect(config.context).to.be.equal('application');
                    expect(config.map['*'].s.indexOf('\/server\/')).to.not.be.equal(-1);

                    dfd.resolve();
                });
            });

        });
    }
});