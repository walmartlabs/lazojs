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
        describe('Server Loader', function () {

            it('should not load client files', function () {
                var dfd = this.async();

                loader.load('foo/client/bar', null, function (module) {
                    expect(module).to.be.null;
                    dfd.resolve();
                }, {});

            });

        });
    }
});