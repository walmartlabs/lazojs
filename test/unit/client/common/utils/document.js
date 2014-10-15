define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'jquery',
    'utils/document'
], function (bdd, chai, expect, sinon, sinonChai, utils, $, doc) {
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
            it('update css', function () {
                var add = ['../../mocks/css/b.css', '../../mocks/css/c.css', '../../mocks/css/d.css'];
                var remove = ['../../mocks/css/a.css'];
                var $head = $('head');
                var dfd = this.async();

                $head.append('<link href="../../mocks/css/a.css" rel="stylesheet" type="text/css" lazo-link="css"></link>');

                doc.updateCss(add, remove, function () {
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