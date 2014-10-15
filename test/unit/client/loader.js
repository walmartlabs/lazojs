define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'l'
], function (bdd, chai, expect, sinon, sinonChai, utils, loader) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Client Loader', function () {

            it('should not load server files', function () {
                var dfd = this.async();
                loader.load('foo/server/bar', null, function (module) {
                    expect(module).to.be.null;
                    dfd.resolve();
                }, {});

            });

        });
    }
});