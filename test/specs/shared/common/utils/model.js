describe('commonUtilsModel', function () {

    var utilModel,
        LazoModel;
    beforeEach(function (done) {
        requirejs(['castle'], function (castle) {

            castle.test({
                module: 'utils/model',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    utilModel = module;

                    requirejs(['lazoModel'], function (lazoModel) {
                        LazoModel = lazoModel;
                        done();
                    });
                }
            });
        });
    });

    describe('#create', function(){
        it('should create model but not call save', function (done) {
            LAZO.require = function (path, success, error) {
                success(LazoModel);
            };
            var saveSpy = sinon.spy(LazoModel.prototype, 'save'),
                ctx = {
                    _rootCtx: {
                        modelList: {},
                        modelInstances: {}
                    }
                };
            utilModel.create('foo',
                {abc:'xyz'},
                {
                    persist: false,
                    params: {
                        id: 'bar'
                    },
                    ctx: ctx,
                    success: function (m) {
                        expect(m).to.not.be.null;
                        expect(saveSpy).to.not.be.called;
                        saveSpy.restore();
                        done();
                    }
                },
                'model'
            );

        });

        it('should create model and call save', function (done) {
            LAZO.require = function (path, success, error) {
                success(LazoModel);
            };
            var saveSpy = sinon.stub(LazoModel.prototype, 'save', function (attrs, options) {
                    options.success({});
                }),
                ctx = {
                    _rootCtx: {
                        modelList: {},
                        modelInstances: {}
                    }
                };
            utilModel.create('foo',
                {abc:'xyz'},
                {
                    params: {
                        id: 'bar'
                    },
                    ctx: ctx,
                    success: function (m) {
                        expect(m).to.not.be.null;
                        expect(saveSpy).to.have.been.called;
                        saveSpy.restore();
                        done();
                    }
                },
                'model'
            );

        });

        it('should only call `options.success` once if the model is already loaded', function(done){
            var ctx = {
                    _rootCtx: {
                        modelList: {},
                        modelInstances: {
                            'GET:foo': 'blah'
                        }
                    }
                },
                successSpy,
                options = {
                    persist: false,
                    ctx: ctx,
                    success: function(model){
                        expect(successSpy).to.have.been.calledOnce;
                        done();
                    }
                };

            successSpy = sinon.spy(options, 'success');
            utilModel.create('foo', {}, options, 'model');
        });


    });
    describe('#process', function(){
        it('should process a model but not call fetch if fetch is false', function (done) {
            LAZO.require = function (path, success, error) {
                success(LazoModel);
            };
            var fetchSpy = sinon.spy(LazoModel.prototype, 'fetch'),
            ctx = {
                _rootCtx: {
                    modelList: {},
                    modelInstances: {}
                }
            };
            utilModel.process('foo',
                {
                    ctx: ctx,
                    fetch: false,
                    success: function (m) {
                        expect(m).to.not.be.null;
                        expect(fetchSpy).to.not.be.called;
                        fetchSpy.restore();
                        done();
                    }
                },
                'model'
            );

        });

    });
});
