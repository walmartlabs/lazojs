define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'lazoCtl',
    'lazoView'
], function (bdd, chai, expect, sinon, sinonChai, utils, LazoController, LazoView) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Lazo Controller', function () {

            var controller;
            var getTemplate;

            var getController = function (options) {
                var ctlOptions = {
                    name: 'home',
                    ctx: {
                        response: {
                            statusCode: null,
                            httpHeaders: [],
                            varyParams: []
                        },
                        getHttpHeaders: function () {
                            return [];
                        },
                        getHttpVaryParams: function () {
                            return [];
                        }
                    }
                };

                var MyController = LazoController.extend({});
                MyController.create('home', ctlOptions, options);
            };

            it('should have empty http header values', function () {
                var dfd = this.async();
                getController({
                    success: function (myController) {
                        controller = myController;
                        expect(controller.getHttpHeaders().length).to.equal(0);
                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                });
            });

            it('should add a child component', function () {
                var dfd = this.async();
                var getTemplate = LazoView.prototype.getTemplate;
                var renderSpy = sinon.spy(LazoView.prototype, 'render');

                // override so that addChild doesn't try to load the template file
                LazoView.prototype.getTemplate = function (options) {
                    options.success('I am the view!');
                };

                LazoController.create(LazoController.extend({}), { name: 'parent' }, {
                    success: function (ctl) {
                        ctl.ctx = {};
                        LAZO.require = requirejs;

                        ctl.addChild('all-my-children', 'foo', {
                            params: { foo: true, bar: false },
                            render: true,
                            success: function (childCtl) {
                                expect(ctl.children['all-my-children'].length).to.equal(1);
                                expect(ctl.children['all-my-children'][0].ctx.params.foo).to.be.true;
                                expect(ctl.children['all-my-children'][0].ctx.params.bar).to.be.false;
                                if (LAZO.app.isClient) {
                                    expect(renderSpy.calledOnce).to.be.true;
                                }
                                LazoView.prototype.getTemplate = getTemplate;
                                renderSpy.restore();
                                dfd.resolve();
                            },
                            error: dfd.reject
                        });
                    },
                    error: dfd.reject
                });
            });

            it('should remove a child component', function () {
                var dfd = this.async();

                utils.setUpApp(function () {
                    utils.createCtlTree(function (_ctl) {
                        LazoController.create(LazoController.extend({}), { name: 'parent' }, {
                            success: function (ctl) {
                                var removeSpy = sinon.spy(ctl, 'onChildRemove');
                                _.extend(ctl, _ctl);

                                expect(ctl.children.foo.length).to.equal(2);
                                ctl.removeChild(ctl.children.foo[0], {
                                    success: function () {
                                        expect(removeSpy.calledOnce).to.be.true;
                                        expect(ctl.children.foo.length).to.equal(1);
                                        dfd.resolve();
                                    },
                                    error: dfd.reject
                                });
                            },
                            error: dfd.reject
                        });
                    });
                });
            });

            it('should remove self', function () {
                var dfd = this.async();

                utils.setUpApp(function () {
                    utils.createCtlTree(function (_ctl) {
                        LazoController.create(LazoController.extend({}), { name: 'parent' }, {
                            success: function (ctl) {
                                var removeSpy = sinon.spy(ctl, 'onChildRemove');
                                _.extend(ctl, _ctl);

                                expect(ctl.children.foo.length).to.equal(2);

                                // convert component mock to component
                                LazoController.create(LazoController.extend({}), { name: 'foo' }, {
                                    success: function (childCtl) {
                                        ctl.children.foo[0] = _.extend(childCtl, ctl.children.foo[0]);
                                        ctl.children.foo[0].parent = ctl;
                                        ctl.children.foo[0].remove({
                                            success: function () {
                                                expect(removeSpy.calledOnce).to.be.true;
                                                expect(ctl.children.foo.length).to.equal(1);
                                                dfd.resolve();
                                            },
                                            error: dfd.reject
                                        });
                                    },
                                    error: dfd.reject
                                });
                            },
                            error: dfd.reject
                        });
                    });
                });
            });

            it('on child remove callback should call success', function () {
                var dfd = this.async();

                LazoController.create(LazoController.extend({}), { name: 'parent' }, {
                    success: function (ctl) {
                        ctl.onChildRemove({}, {
                            success: function () {
                                dfd.resolve();
                            }
                        });
                    },
                    error: dfd.reject
                });
            });

        });
    }
});