define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'resolver/assets'
], function (bdd, chai, expect, sinon, sinonChai, utils, assets) {
    chai.use(sinonChai);

    with (bdd) {
        var navLanguages = LAZO.isClient ? navigator.languages : [];

        describe('Asset Resolution Utils', function () {

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

            it('should get the locales', function () {
                var locales;
                // _request.raw.req.headers['accept-language']
                var ctx = getCtx();

                if (LAZO.isClient) {
                    locales = assets.getLocales(ctx);
                    expect(locales.length).to.be.equal(navLanguages.length);
                    for (var i = 0; i < locales.length; i++) {
                        expect(locales[i]).to.be.equal(navLanguages[i]);
                    }
                } else {
                    // en-US,en;q=0.8
                    locales = assets.getLocales(ctx);
                    expect(locales.length).to.be.equal(3);
                    expect(locales[0]).to.be.equal('en-US');
                    expect(locales[1]).to.be.equal('en');
                    expect(locales[2]).to.be.equal('defaults');

                    // en;q=0.8,en-US
                    ctx._request.raw.req.headers['accept-language'] = 'en;q=0.8,en-US';
                    locales = assets.getLocales(ctx);
                    expect(locales.length).to.be.equal(3);
                    expect(locales[0]).to.be.equal('en-US');
                    expect(locales[1]).to.be.equal('en');
                    expect(locales[2]).to.be.equal('defaults');

                    // en-GB;q=0.8,en;q=0.5,en-US
                    ctx._request.raw.req.headers['accept-language'] = 'en-GB;q=0.8,en;q=0.5,en-US';
                    locales = assets.getLocales(ctx);
                    expect(locales.length).to.be.equal(4);
                    expect(locales[0]).to.be.equal('en-US');
                    expect(locales[1]).to.be.equal('en-GB');
                    expect(locales[2]).to.be.equal('en');
                    expect(locales[3]).to.be.equal('defaults');
                }
            });

            it('should resolve component asset map', function () {
                var ctx = getCtx();
                var assetMap = {
                    'en-US': {
                        foo: 1
                    },
                    'en': {
                        foo: 2,
                        baz: 2
                    },
                    defaults: {
                        foo: 0,
                        bar: 0
                    }
                };
                var resolvedAssetMap = assets.resolveAssets(assetMap, ctx);

                // en-US,en;q=0.8
                expect(resolvedAssetMap.foo).to.be.equal(1);
                expect(resolvedAssetMap.bar).to.be.equal(0);
                expect(resolvedAssetMap.baz).to.be.equal(2);
            });

            it('should resolve assets map key name', function () {
                var ctx = getCtx();
                var key = assets.resolveAssetKey('en-US/img/foo.png', ctx);

                expect(key).to.be.equal('img/foo.png');

                key = assets.resolveAssetKey('en/img/icons/foo.png', ctx);
                expect(key).to.be.equal('img/icons/foo.png');

                key = assets.resolveAssetKey('foo.png', ctx);
                expect(key).to.be.equal('foo.png');
            });

            it('should resolve an asset path', function () {
                var ctx = getCtx();
                var path = assets.resolveAssetPath('foo.png', 'app', ctx);

                expect(path).to.be.equal('/app/assets/foo.png');


                path = assets.resolveAssetPath('foo.png', 'bar', ctx);
                expect(path).to.be.equal('/components/bar/assets/foo.png');

                path = assets.resolveAssetPath('en-US/foo.png', 'bar', ctx);
                expect(path).to.be.equal('/components/bar/assets/en-US/foo.png');
            });

            it('should resolve accept-language header to a sorted array', function () {
                var ctx = getCtx();
                var languages = assets.resolveAcceptLanguge('en-US,en;q=0.8', ctx);

                expect(languages[0]).to.be.equal('en-US');
                expect(languages[1]).to.be.equal('en');

                languages = assets.resolveAcceptLanguge('en-GB;q=0.8,en;q=0.5,en-US', ctx);
                expect(languages[0]).to.be.equal('en-US');
                expect(languages[1]).to.be.equal('en-GB');
                expect(languages[2]).to.be.equal('en');
            });

        });
    }
});