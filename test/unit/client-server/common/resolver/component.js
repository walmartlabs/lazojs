define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'resolver/component'
], function (bdd, chai, expect, sinon, sinonChai, utils, component) {
    chai.use(sinonChai);

    with (bdd) {
        LAZO.files = {
            components: {
                'components/a/a.css': true,
                'components/a/b.css': true,
                'components/a/c.css': true,
                'components/b/1.css': true,
                'components/c/1.css': true,
                'components/d/1.css': true
            }
        };

        describe('component resolver', function () {

            it('should get a component definition', function () {
                var def;

                LAZO.app.defaultLayout = 'regular';
                LAZO.routes = {
                    '': 'home',
                    '/a': 'a#action',
                    '/b': { component: 'b' },
                    '/c': { component: 'c', layout: 'special' },
                    '/d': { component: 'd', layout: false }
                };

                def = component.getDef('');
                expect(def.name).to.be.equal('home');
                expect(def.action).to.be.equal('index');
                expect(def.layout).to.be.equal('regular');

                def = component.getDef('/a');
                expect(def.name).to.be.equal('a');
                expect(def.action).to.be.equal('action');
                expect(def.layout).to.be.equal('regular');

                def = component.getDef('/b');
                expect(def.name).to.be.equal('b');
                expect(def.action).to.be.equal('index');
                expect(def.layout).to.be.equal('regular');

                def = component.getDef('/c');
                expect(def.name).to.be.equal('c');
                expect(def.action).to.be.equal('index');
                expect(def.layout).to.be.equal('special');

                def = component.getDef('/d');
                expect(def.name).to.be.equal('d');
                expect(def.action).to.be.equal('index');
                expect(def.layout).to.be.null;
            });

            it('should get child components', function () {
                var def;

                LAZO.app.defaultLayout = 'regular';
                LAZO.routes = {
                    '/f': { component: 'f', layout: false, components: ['a', 'b'] }
                };

                def = component.getDef('/f');
                expect(def.name).to.be.equal('f');
                expect(def.action).to.be.equal('index');
                expect(def.layout).to.be.null;
                expect(def.components).to.include.members(['a', 'b']);
            });

            it('should get the CSS for a component', function () {
                var css = component.getCss('a');

                expect(css.length).to.be.equal(3);
                expect(css[0]).to.be.equal('components/a/a.css');
                expect(css[1]).to.be.equal('components/a/b.css');
                expect(css[2]).to.be.equal('components/a/c.css');
            });

        });
    }
});