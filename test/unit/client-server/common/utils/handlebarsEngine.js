define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'handlebars',
    'utils/handlebarsEngine'
], function (bdd, chai, expect, sinon, sinonChai, utils, handlebars, hbsEng) {
    chai.use(sinonChai);

    with (bdd) {
        describe('handlebarsEngine', function () {
            it('should compile a template', function () {
                var template = hbsEng.compile('I am {{fname}} {{lname}}.');

                expect(template).to.be.function;
            });

            it('should precompile a template', function () {
                var template = hbsEng.precompile('I am {{fname}} {{lname}}.');

                expect(template).to.be.function;
            });

            it('should execute a template', function () {
                var context = {
                    fname: 'John',
                    lname: 'Doe'
                };
                var template = hbsEng.compile('I am {{fname}} {{lname}}.');

                expect(hbsEng.execute(template, context)).to.be.equal('I am John Doe.');
            });

            it('should get handlebars', function () {
                expect(hbsEng.engine.VERSION).to.be.equal(handlebars.default.VERSION);
            });

        });
    }
});