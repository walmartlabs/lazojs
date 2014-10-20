define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'lazoBundle'
], function (bdd, chai, expect, sinon, sinonChai, utils, Bundler) {
    chai.use(sinonChai);

    var supportsImports = (function () {
        return LAZO.isClient && 'import' in document.createElement('link');
    })();

    with (bdd) {
        describe('bundler', function () {

            var bundle = new Bundler();
            var expectedCssLinkProps = {
                rel: 'stylesheet',
                type: 'text/css',
                'lazo-link': 'css',
                'lazo-link-ctx': 'application'
            };
            var expectedImportLinkProps = {
                rel: 'import',
                'lazo-link': 'import',
                'lazo-link-ctx': 'application'
            };
            LAZO.conf = {
                libPath: '/lib'
            };

            it('should call success', function () {
                var dfd = this.async();
                var options = {
                    success: function () {
                        expect(spy).to.have.been.calledOnce;
                        dfd.resolve();
                    }
                };
                var spy = sinon.spy(options, 'success');

                bundle.response('/foo', '/foo?bar=baz', options);

            });

            it('should get the lazo library path', function () {
                expect(bundle.getLibPath()).to.equal(LAZO.conf.libPath);
            });

            it('should resolve a bundle url', function () {
                var url = 'a/b/c';
                expect(bundle.resolveBundleUrl(url)).to.equal(url);
            });

            it('should sort css', function () {
                var links = [{ href: 'a.css' }, { href: 'b.css' }, { href: 'c.css' }];
                var sorted = bundle.sortCss(links);
                expect(links[0]).to.equal(sorted[0]);
                expect(links[1]).to.equal(sorted[1]);
                expect(links[2]).to.equal(sorted[2]);
            });

            it('should sort imports', function () {
                var links = [{ href: 'a.html' }, { href: 'b.html' }, { href: 'c.html' }];
                var sorted = bundle.sortImports(links);
                expect(links[0]).to.equal(sorted[0]);
                expect(links[1]).to.equal(sorted[1]);
                expect(links[2]).to.equal(sorted[2]);
            });

            it('should resolve an import', function () {
                if (LAZO.app.isServer) {
                    var link = bundle.resolveImport('app/imports/a.html', 'application');
                    expect(link).to.be.null;
                } else {
                    var cmpImportLink = '/components/bar/imports/index.html';
                    var appImportLink = '/app/imports/index.html';
                    $('head').append('<link lazo-link="import" lazo-link-ctx="bar" rel="import" href="' + cmpImportLink + '">');
                    $('head').append('<link lazo-link="import" lazo-link-ctx="application" rel="import" href="' + appImportLink + '">');

                    var cmpImport = bundle.resolveImport('index.html', 'bar');
                    var appImport = bundle.resolveImport('app/imports/index.html', 'application');
                    if (supportsImports) {

                    } else {
                        expect(cmpImport.getAttribute('lazo-link')).to.be.equal('import');
                        expect(cmpImport.getAttribute('href')).to.be.equal(cmpImportLink);
                        expect(appImport.getAttribute('lazo-link')).to.be.equal('import');
                        expect(appImport.getAttribute('href')).to.be.equal(appImportLink);
                    }
                }
            });

            it('should create a css link object', function () {
                var linkStr = 'components/bar/a.css';
                var linkObj = { href: 'components/bar/a.css', media: '(max-width: 800px)' };
                var linkFromStr = bundle._createCSSLink(linkStr);
                var linkFromObj = bundle._createCSSLink(linkObj);

                expect(linkFromStr.href).to.be.equal(linkStr);
                for (var k in expectedCssLinkProps) {
                    expect(linkFromStr[k]).to.be.equal(expectedCssLinkProps[k]);
                }

                expect(linkFromObj.href).to.be.equal(linkObj.href);
                expect(linkFromObj.media).to.be.equal(linkObj.media);
                for (var k in expectedCssLinkProps) {
                    expect(linkFromObj[k]).to.be.equal(expectedCssLinkProps[k]);
                }
            });

            it('should create an import link object', function () {
                var linkStr = 'components/bar/imports/a.html';
                var linkObj = { href: 'components/bar/imports/a.html', type: 'text/html' };
                var linkFromStr = bundle._createImportLink(linkStr);
                var linkFromObj = bundle._createImportLink(linkObj);

                expect(linkFromStr.href).to.be.equal(linkStr);
                for (var k in expectedImportLinkProps) {
                    expect(linkFromStr[k]).to.be.equal(expectedImportLinkProps[k]);
                }

                expect(linkFromObj.href).to.be.equal(linkObj.href);
                expect(linkFromObj.media).to.be.equal(linkObj.media);
                for (var k in expectedImportLinkProps) {
                    expect(linkFromObj[k]).to.be.equal(expectedImportLinkProps[k]);
                }
            });

            it('should create an array of css link objects', function () {
                var links = ['components/bar/a.css', { href: 'components/bar/b.css', media: '(max-width: 800px)' }];
                var linkObjs = bundle._createCSSLinks(links);
                expect(linkObjs.length).to.be.equal(2);
            });

            it('should create an array of import link objects', function () {
                var links = ['components/bar/imports/a.html', { href: 'components/bar/imports/b.html', type: 'text/html' }];
                var linkObjs = bundle._createImportLinks(links);
                expect(linkObjs.length).to.be.equal(2);
            });

        });
    }
});