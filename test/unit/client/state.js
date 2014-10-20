define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'lib/client/state'
], function (bdd, chai, expect, sinon, sinonChai, utils, state) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Client State', function () {

            function stubClientRouter(LAZO) {
                var history = {
                    'test/a': {
                        state: {
                            dependencies: {
                                css: [{ href: 'a.css' }],
                                imports: [{ href: 'a.html' }]
                            }
                        }
                    },
                    'test/b': {
                        state: {
                            dependencies: {
                                css: [{ href: 'b.css' }],
                                imports: [{ href: 'b.html' }]
                            }
                        }
                    }
                };
                history[window.location.pathname + window.location.search] = {
                        state: {
                            dependencies: {
                                css: [{ href: 'c.css' }],
                                imports: [{ href: 'c.html' }]
                            }
                        }
                };

                LAZO.router = {
                    getItem: function (url) {
                        return history[url];
                    },
                    updateState: function (stateObj, url) {
                        history[url] = { state: stateObj };
                    },
                    getPreviousUrl: function () {
                        return 'test/a';
                    }
                };
            }

            beforeEach(function () {
                stubClientRouter(LAZO);
            });

            it('should create a state object', function () {
                var ctx = {
                    dependencies: {
                        css: [{ href: 'components/a.css' }, { href: 'components/b.css' }],
                        imports: [{ href: 'components/a.html' }, { href: 'components/b.html' }]
                    }
                };
                var stateObj = state.createStateObj(ctx);

                expect(stateObj.dependencies.css.length).to.be.equal(2);
                expect(stateObj.dependencies.imports.length).to.be.equal(2);
            });

            it('should get a state object', function () {
                expect(state.get('test/a').state.dependencies.css[0].href).to.be.equal('a.css');
            });

            it('should set a state object', function () {
                var ctx = {
                    dependencies: {
                        css: [{ href: 'components/a.css' }, { href: 'components/a.1.css' }],
                        imports: [{ href: 'components/a.html' }, { href: 'components/a.1.html' }]
                    }
                };

                expect(state.get(window.location.pathname + window.location.search).state.dependencies.css.length).to.be.equal(1);
                expect(state.get(window.location.pathname + window.location.search).state.dependencies.imports.length).to.be.equal(1);
                state.set(ctx);
                expect(state.get(window.location.pathname + window.location.search).state.dependencies.css.length).to.be.equal(2);
                expect(state.get(window.location.pathname + window.location.search).state.dependencies.imports.length).to.be.equal(2);
            });

            it('should get the css to add and remove', function () {
                var css = state.getAddRemoveLinks('css');
                var imports = state.getAddRemoveLinks('imports');

                expect(css.add[0].href).to.be.equal('c.css');
                expect(css.remove[0].href).to.be.equal('a.css');
                expect(imports.add[0].href).to.be.equal('c.html');
                expect(imports.remove[0].href).to.be.equal('a.html');

            });

        });
    }
});