define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'utils/document'
], function (bdd, chai, expect, sinon, sinonChai, utils, doc) {
    chai.use(sinonChai);

    with (bdd) {
        describe('document utils', function () {

            it('set, get html tag', function () {
                var htmlTag = '<html lang="en">';

                expect(doc.getHtmlTag()).to.be.equal('');
                doc.setHtmlTag(htmlTag);
                expect(doc.getHtmlTag()).to.be.equal(htmlTag);
            });


            it('set, get body class', function () {
                var bodyClass = 'foobar';

                expect(doc.getBodyClass()).to.be.equal('');
                doc.setBodyClass(bodyClass);
                expect(doc.getBodyClass()).to.be.equal(bodyClass);
            });

            it('add tag', function () {
                var metaTag;
                var tags;

                expect(doc.getTags().length).to.be.equal(0);
                doc.addTag('meta', { name: 'description', content: 'the most awesome web page ever' }, 'tag content');
                tags = doc.getTags();
                expect(tags.length).to.be.equal(1);
                metaTag = tags[0];
                expect(metaTag.name).to.be.equal('meta');
                expect(metaTag.content).to.be.equal('tag content');
                expect(metaTag.attributes.name).to.be.equal('description');
                expect(metaTag.attributes.content).to.be.equal('the most awesome web page ever');
            });
        });
    }
});