define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'utils/document',
    'jquery'
], function (bdd, chai, expect, sinon, sinonChai, utils, doc, $) {
    chai.use(sinonChai);

    with (bdd) {
        describe('document utils', function () {

            it('set page title', function () {
                var $title = $('title');
                doc.setTitle('foobar');
                expect($title.text()).to.be.equal('foobar');
            });

            // link.onload is not being called when test is executed in phantomjs because it
            // is not supported by the version of webkit phantomjs is running
            it('should update css', function () {
                if (window.navigator.userAgent.indexOf('PhantomJS') !== -1 || window.lazoLocalTesting) {
                    this.skip();
                }

                var add = [{ href: '../../test/mocks/css/b.css' }, { href: '../../test/mocks/css/c.css' }, { href: '../../test/mocks/css/d.css' }];
                var remove = [{ href: '../../test/mocks/css/a.css' }];
                var $head = $('head');
                var dfd = this.async();

                $head.append('<link href="../../test/mocks/css/a.css" rel="stylesheet" type="text/css" lazo-link="css"></link>');

                doc.updateLinks(add, remove, 'css', function () {
                    var $links = $('link[lazo-link="css"]');
                    expect($links.length).to.be.equal(3);
                    $links.each(function (i) {
                        expect($(this).attr('href')).to.be.equal(add[i]);
                    });
                    dfd.resolve();
                });
            });

        });
    }
});