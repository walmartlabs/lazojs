describe('ServiceProxy', function () {

    var ServiceProxy;

    beforeEach(function (done) {
        requirejs(['castle'], function (castle) {
            castle.test({
                module: 'serviceProxy',
                mocks: ['request'],
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    ServiceProxy = module;
                    done();
                }
            });
        });
    });

    it.skip('should call request with correct options', function(done) {
        global.requestStub = function (options, callback) {
            expect(options.uri).to.equal('http://some.endpoint.com/bar');
            expect(options.method).to.equal('POST');
            expect(options.headers['Content-Type']).to.equal('application/json');
            var body = JSON.parse(options.body);
            expect(body.abc).to.equal('xyz');
            callback(null, {statusCode:200, headers:{fakeHeader: 'fakeHeaderValue'}}, '{"foo2":"bar2"}');
        }

        var sp = new ServiceProxy(),
            fakeModel = {
                url: 'http://some.endpoint.com/{{foo}}',
                params: {foo: 'bar'},
                toJSON: function() {
                    return {abc: 'xyz'}
                }
            };
        sp.sync('create',
            fakeModel,
            {
                headers: {'Content-Type': 'application/json'},
                success: function(result) {
                    expect(result.foo2).to.equal('bar2');
                    expect(fakeModel.responseHeaders.fakeHeader).to.not.be.null;
                    expect(fakeModel.responseHeaders.fakeHeader).to.equal('fakeHeaderValue');
                    done();
                },
                error: function(result) {
                    done(new Error(result.data));
                }
            }
        );
    });

    it('should not parse the response', function(done) {
        global.requestStub = function (options, callback) {
            callback(null, {statusCode:200}, '{"foo2":"bar2"}');
        }

        var sp = new ServiceProxy(),
            fakeModel = {
                url: 'http://some.endpoint.com/{{foo}}',
                params: {foo: 'bar'},
                toJSON: function() {
                    return {abc: 'xyz'}
                }
            };
        sp.sync('create',
            fakeModel,
            {
                raw: true,
                success: function(result) {
                    expect(result).to.equal('{"foo2":"bar2"}');
                    done();
                },
                error: function(result) {
                    done(new Error(result.data));
                }
            }
        );
    });

    it('should call error when no url specified', function(done) {
        var sp = new ServiceProxy();
        sp.sync('read',
            {
                params: {foo: 'bar'}
            },
            {
                error: function(error) {
                    expect(error.error).to.match(/No url or urlRoot/);
                    done();
                }
            }
        );
    });

    it('should call error when it thinks it is a base class model', function(done) {
        var sp = new ServiceProxy();
        sp.sync('read',
            {
                _default: true
            },
            {
                error: function(error) {
                    expect(error.error).to.match(/No model defined in repo for/);
                    done();
                }
            }
        );
    });

    it('should call sync with read', function(done) {
        var syncSpy = sinon.stub(ServiceProxy.prototype, 'sync', function(method, model, options) {
            expect(method).to.equal('read');

            expect(model.name).to.equal('http://localhost');
            expect(model.ctx.foo).to.equal('bar');
            expect(model.url).to.equal('http://localhost');
            expect(model.params.abc).to.equal('xyz');
            expect(options.headers['Content-Type']).to.equal('application/json');
            expect(options.raw).to.be.true;

            syncSpy.restore();
            done();
        });
        var sp = new ServiceProxy({foo: 'bar'});
        sp.get('http://localhost',
            {
                success: function(){},
                headers:{'Content-Type': 'application/json'},
                raw: true,
                params: {abc: 'xyz'}
            });
    });

    it('should throw an error when no success function is passed in as an option', function(done) {
        var sp = new ServiceProxy({foo: 'bar'});
        expect(sp.get).to.throw(/Success callback undefined for service call svc: /);
        done();
    });

    it('get should call error', function(done) {
        global.requestStub = function (options, callback) {
            callback(new Error('error'), {statusCode:200}, '{"foo2":"bar2"}');
        }

        var sp = new ServiceProxy({foo: 'bar'});
        sp.get('http://localhost',
            {
                success: function(){},
                error: function() {
                    expect(true).to.be.true
                    done();
                }
            });
    });

    it('should call sync with create', function(done) {
        var syncSpy = sinon.stub(ServiceProxy.prototype, 'sync', function(method, model, options) {
            expect(method).to.equal('create');

            expect(model.name).to.equal('http://localhost');
            expect(model.ctx.foo).to.equal('bar');
            expect(model.url).to.equal('http://localhost');
            expect(model.params.abc).to.equal('xyz');
            expect(options.headers['Content-Type']).to.equal('application/json');
            expect(options.raw).to.be.true;

            syncSpy.restore();
            done();
        });
        var sp = new ServiceProxy({foo: 'bar'});
        sp.post('http://localhost',
            {
                name: 'theName'
            },
            {
                success: function(){},
                headers:{'Content-Type': 'application/json'},
                raw: true,
                params: {abc: 'xyz'}
            });
    });

    it('post should throw an error when no success function is passed in as an option', function(done) {
        var sp = new ServiceProxy({foo: 'bar'});
        expect(sp.post).to.throw(/Success callback undefined for service call svc: /);
        done();
    });

    it('post should call error', function(done) {
        global.requestStub = function (options, callback) {
            callback(new Error('error'), {statusCode:200}, '{"foo2":"bar2"}');
        }

        var sp = new ServiceProxy({foo: 'bar'});
        sp.post('http://localhost',
            {
                name: 'theName'
            },
            {
                success: function(){},
                error: function() {
                    expect(true).to.be.true
                    done();
                }
            });
    });

    it('should call sync with update', function(done) {
        var syncSpy = sinon.stub(ServiceProxy.prototype, 'sync', function(method, model, options) {
            expect(method).to.equal('update');

            expect(model.name).to.equal('http://localhost');
            expect(model.ctx.foo).to.equal('bar');
            expect(model.url).to.equal('http://localhost');
            expect(model.params.abc).to.equal('xyz');
            expect(options.headers['Content-Type']).to.equal('application/json');
            expect(options.raw).to.be.true;

            syncSpy.restore();
            done();
        });
        var sp = new ServiceProxy({foo: 'bar'});
        sp.put('http://localhost',
            {
                name: 'theName'
            },
            {
                success: function(){},
                headers:{'Content-Type': 'application/json'},
                raw: true,
                params: {abc: 'xyz'}
            });
    });

    it('put should throw an error when no success function is passed in as an option', function(done) {
        var sp = new ServiceProxy({foo: 'bar'});
        expect(sp.put).to.throw(/Success callback undefined for service call svc: /);
        done();
    });

    it('put should call error', function(done) {
        global.requestStub = function (options, callback) {
            callback(new Error('error'), {statusCode:200}, '{"foo2":"bar2"}');
        }

        var sp = new ServiceProxy({foo: 'bar'});
        sp.put('http://localhost',
            {
                name: 'theName'
            },
            {
                success: function(){},
                error: function() {
                    expect(true).to.be.true
                    done();
                }
            });
    });

    it('should call sync with delete', function(done) {
        var syncSpy = sinon.stub(ServiceProxy.prototype, 'sync', function(method, model, options) {
            expect(method).to.equal('delete');

            expect(model.name).to.equal('http://localhost');
            expect(model.ctx.foo).to.equal('bar');
            expect(model.url).to.equal('http://localhost');
            expect(model.params.abc).to.equal('xyz');
            expect(options.headers['Content-Type']).to.equal('application/json');
            expect(options.raw).to.be.true;

            syncSpy.restore();
            done();
        });
        var sp = new ServiceProxy({foo: 'bar'});
        sp.destroy('http://localhost',
            {
                id: 'theId'
            },
            {
                success: function(){},
                headers:{'Content-Type': 'application/json'},
                raw: true,
                params: {abc: 'xyz'}
            });
    });

    it('destroy should throw an error when no success function is passed in as an option', function(done) {
        var sp = new ServiceProxy({foo: 'bar'});
        expect(sp.destroy).to.throw(/Success callback undefined for service call svc: /);
        done();
    });

    it('destroy should call error', function(done) {
        global.requestStub = function (options, callback) {
            callback(new Error('error'), {statusCode:200}, '{"foo2":"bar2"}');
        }

        var sp = new ServiceProxy({foo: 'bar'});
        sp.destroy('http://localhost',
            {
                id: 'theId'
            },
            {
                success: function(){},
                error: function() {
                    expect(true).to.be.true
                    done();
                }
            });
    });

});