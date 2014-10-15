define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'utils/template'
], function (bdd, chai, expect, sinon, sinonChai, utils, template) {
    chai.use(sinonChai);

    with (bdd) {
        describe('template', function () {

            beforeEach(function () {
                // clean up any changes to structure in module closure
                template.setDefaultTemplateEngine('handlebars');
                template.setTemplateExt('handlebars', 'hbs');
            });

            function registerTemplateEngine() {
                template.registerTemplateEngine('nunjucks', 'nj', {
                    compile: function () { return 'compile'; },
                    execute: function () { return 'execute'; }
                }, 'nunjucks', 'nunjucks');
            }

            it('should get the default template engine extension', function () {
                expect(template.getDefaultExt('handlebars')).to.be.equal('hbs');
            });

            it('should get the default template engine extension', function () {
                template.setTemplateExt('handlebars', 'foo');
                expect(template.getTemplateExt('handlebars')).to.be.equal('foo');
            });

            it('should register a template engine', function () {
                var nunjucks;
                var def;

                registerTemplateEngine();
                nunjucks = template.getTemplateEngine('nunjucks');
                expect(nunjucks.compile()).to.be.equal('compile');
                expect(nunjucks.execute()).to.be.equal('execute');
                expect(template.getTemplateExt('nunjucks')).to.be.equal('nj');

                def = template.getTemplateEngineDef('nunjucks');
                expect(def).to.have.property('extension');
                expect(def).to.have.property('handler');
                expect(def).to.have.property('path');
                expect(def).to.have.property('exp');
            });

            it('should get a template engine', function () {
                var engine = template.getTemplateEngine('handlebars');
                expect(engine.engine).to.have.deep.property('HandlebarsEnvironment');
            });

            it('should get the template engine extension', function () {
                expect(template.getTemplateExt('handlebars')).to.be.equal('hbs');
            });

            it('should get the template engine definition', function () {
                var def = template.getTemplateEngineDef('handlebars');
                expect(def.extension).to.be.equal('hbs');
                expect(def).to.have.property('handler');
                expect(def.exp).to.be.equal('Handlebars');
            });

            it('should get the default template engine', function () {
                var engine = template.getDefaultTemplateEngine();
                expect(engine.engine).to.have.deep.property('HandlebarsEnvironment');
            });

            it('should get the default template engine name', function () {
                expect(template.getDefaultTemplateEngineName()).to.be.equal('handlebars');
            });

            it('should set the default template engine', function () {
                registerTemplateEngine();
                template.setDefaultTemplateEngine('nunjucks');
                expect(template.getDefaultTemplateEngineName()).to.be.equal('nunjucks');
            });

            it('should load a template engine', function (done) {
                var dfd = this.async();
                LAZO.require = requirejs;

                template.loadTemplateEngine({
                    name: 'micro',
                    extension: 'mt',
                    path: 'underscore',
                    handler: function (_) {
                        return {
                            compile: function (template) {
                                return _.template(template);
                            },
                            execute: function (compiledTemplate, data) {
                                return compiledTemplate(data);
                            },
                            engine: _.template
                        };
                    }
                }, {
                    success: function (engine) {
                        var eng = template.getTemplateEngine('micro');
                        expect(engine).to.be.equal(engine);
                        dfd.resolve();
                    }
                });
            });

        });
    }
});