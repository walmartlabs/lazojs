describe('requirejs configure', function () {

    var conf;
    beforeEach(function (done) {
        requirejs(['castle'], function (castle) {
            castle.test({
                module: 'resolver/requireConfigure',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    conf = module;
                    done();
                }
            });
        });
    });

    it('get server configuration', function (done) {
        var config,
            options = {
                basePath: process.cwd(),
                baseUrl: 'some/path'
            };

        conf.get('server', options, function (err, conf) {
            config = conf;

            chai.expect(config.baseUrl).to.be.equal('some/path');
            chai.expect(config.context).to.be.equal('application');
            chai.expect(config.map['*'].s.indexOf('\/server\/')).to.not.be.equal(-1);

            done();
        });
    });

});