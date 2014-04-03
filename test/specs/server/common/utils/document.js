describe('document utils', function () {

    var doc;
    beforeEach(function (done) {
        requirejs(['castle'], function (castle) {
            castle.test({
                module: 'utils/document',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    doc = module;
                    done();
                }
            });
        });
    });

    it('set, get html tag', function () {
        var htmlTag = '<html lang="en">';

        chai.expect(doc.getHtmlTag()).to.be.equal('');
        doc.setHtmlTag(htmlTag);
        chai.expect(doc.getHtmlTag()).to.be.equal(htmlTag);
    });


    it('set, get body class', function () {
        var bodyClass = 'foobar';

        chai.expect(doc.getBodyClass()).to.be.equal('');
        doc.setBodyClass(bodyClass);
        chai.expect(doc.getBodyClass()).to.be.equal(bodyClass);
    });

    it('add tag', function () {
        var metaTag,
            tags;
        chai.expect(doc.getTags().length).to.be.equal(0);
        doc.addTag('meta', { name: 'description', content: 'the most awesome web page ever' }, 'tag content');
        tags = doc.getTags();
        chai.expect(tags.length).to.be.equal(1);
        metaTag = tags[0];
        chai.expect(metaTag.name).to.be.equal('meta');
        chai.expect(metaTag.content).to.be.equal('tag content');
        chai.expect(metaTag.attributes.name).to.be.equal('description');
        chai.expect(metaTag.attributes.content).to.be.equal('the most awesome web page ever');
    });
});