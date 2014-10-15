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
                                css: ['a.css']
                            }
                        }
                    },
                    'test/b': {
                        state: {
                            dependencies: {
                                css: ['b.css']
                            }
                        }
                    }
                };
                history[window.location.pathname + window.location.search] = {
                        state: {
                            dependencies: {
                                css: ['c.css']
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
                        css: ['components/a.css', 'components/b.css']
                    }
                };
                var stateObj = state.createStateObj(ctx);

                expect(stateObj.dependencies.css.length).to.be.equal(2);
            });

            it('should get a state object', function () {
                expect(state.get('test/a').state.dependencies.css[0]).to.be.equal('a.css');
            });

            it('should set a state object', function () {
                var ctx = {
                    dependencies: {
                        css: ['components/a.css', 'components/a.1.css']
                    }
                };

                expect(state.get(window.location.pathname + window.location.search).state.dependencies.css.length).to.be.equal(1);
                state.set(ctx);
                expect(state.get(window.location.pathname + window.location.search).state.dependencies.css.length).to.be.equal(2);
            });

            it('should get the css to add and remove', function () {
                var css = state.getAddRemoveLinks();

                expect(css.add[0]).to.be.equal('c.css');
                expect(css.remove[0]).to.be.equal('a.css');
            });

        });
    }
});