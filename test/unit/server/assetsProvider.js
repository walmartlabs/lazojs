define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'intern/dojo/node!path',
    'assetsProvider'
], function (bdd, chai, expect, sinon, sinonChai, utils, path, assetsProvider) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Assets Provider', function () {

            before(function () {
                LAZO.FILE_REPO_PATH = path.resolve('test/application');
            });

            function getCtx() {
                return {
                    _request: {
                        raw: {
                            req: {
                                headers: {
                                    'accept-language': 'en-US,en;q=0.8'
                                }
                            }
                        }
                    }
                };
            }

            it('should get the assets for a list of components', function () {
                var ctx = getCtx();
                var dfd = this.async();
                assetsProvider.get(['foo', 'bar', 'baz'], ctx, {
                    success: function (assets) {
                        expect(assets.foo).to.be.empty;
                        expect(assets.baz).to.be.empty;
                        expect(assets.bar['info.pdf']).to.be.equal('/components/bar/assets/info.pdf');

                        expect(assets.bar.name).to.be.equal('Käthe Kollwitz');
                        expect(assets.bar['img/logo.png']).to.be.equal('/components/bar/assets/en-US/img/logo.png');
                        dfd.resolve();
                    }
                });
            });

            it('should get the assets for an application', function () {
                var ctx = getCtx();
                var dfd = this.async();
                assetsProvider.get(['app'], ctx, {
                    success: function (assets) {
                        expect(assets.app['info.pdf']).to.be.equal('/app/assets/info.pdf');
                        expect(assets.app.name).to.be.equal('Käthe Kollwitz');
                        expect(assets.app['img/logo.png']).to.be.equal('/app/assets/en-US/img/logo.png');
                        dfd.resolve();
                    }
                });
            });

        });
    }
});