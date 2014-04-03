describe('document utils', function () {

    var doc,
        $;
    beforeEach(function (done) {
        requirejs(['castle', 'jquery'], function (castle, jQuery) {
            castle.test({
                module: 'utils/document',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    doc = module;
                    $ = jQuery;
                    done();
                }
            });
        });
    });

    it('set page title', function () {
        var $title = $('title');

        chai.expect($title.text()).to.be.equal('test');
        doc.setTitle('foobar');
        chai.expect($title.text()).to.be.equal('foobar');
    });

    // link.onload is not being called when test is executed in phantomjs because it
    // is not supported by the version of webkit phantomjs is running
    it.skip('update css', function (done) {
        var add = ['../../mocks/css/b.css', '../../mocks/css/c.css', '../../mocks/css/d.css'],
            remove = ['../../mocks/css/a.css'],
            $head = $('head');

        $head.append('<link href="../../mocks/css/a.css" rel="stylesheet" type="text/css"></link>');

        doc.updateCss(add, remove, function () {
            done();
        });
    });

});