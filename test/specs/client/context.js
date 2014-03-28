describe('Context', function () {

    var Context;
    beforeEach(function (done) {
        requirejs(['castle'], function (castle) { // TODO: fix pathing
            castle.test({
                module: 'context',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    Context = module;
                    done();
                }
            });
        });
    });


    it('common client', function () {
        var ctx = new Context({
            _rawReq: {
                url: {
                    pathname: 'foo/bar/baz'
                },
                raw: { // this is expected on the server
                    req: {
                        headers: {}
                    }
                }
            }
        });

        // this will be equal to whatever the clients path is when phantom runs or the file is opened in the browser
        chai.expect(ctx.location.pathname).to.not.be.equal('foo/bar/baz');
    });

    it('merge root context', function () {
        var ctx1 = new Context({
                _rootCtx: {
                    dependencies: {
                        css: ['a.css'],
                        modules: ['a.js']
                    },
                    data: {
                        a: 1,
                        b: 2
                    },
                    modules: ['a', 'b'],
                    foo: 1
                }
            }),
            ctx2 = new Context({
                _rootCtx: {
                    dependencies: {
                        css: ['b.css'],
                        modules: ['b.js']
                    },
                    data: {
                        a: 'foo',
                        b: 2,
                        c: 3
                    },
                    modules: ['c'],
                    foo: 'z'
                }
            });

        Context.mergeRoot(ctx1._rootCtx, ctx2._rootCtx);

        chai.expect(ctx1._rootCtx.dependencies.css[0]).to.be.equal('a.css');
        chai.expect(ctx1._rootCtx.dependencies.modules[0]).to.be.equal('a.js');
        chai.expect(ctx1._rootCtx.data.a).to.be.equal('foo');
        chai.expect(ctx1._rootCtx.data.c).to.be.equal(3);
        chai.expect(ctx1._rootCtx.modules.length).to.be.equal(3);
        chai.expect(ctx1._rootCtx.foo).to.be.equal('z');
    });

    it('merge global models', function () {
        var newCtx = {
                modelList: {
                    a: {}
                },
                modelInstances: {
                    a: { b: 1 }
                }
            },
            oldCtx = {
                modelList: {
                    a: {}
                },
                modelInstances: {
                    a: { b: 2 }
                }
            };

        Context.mergeGlobalModels(newCtx, oldCtx);
        chai.expect(newCtx.modelInstances.a.b).to.be.equal(2);
    });

});