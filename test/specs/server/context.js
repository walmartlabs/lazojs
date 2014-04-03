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

    it('XHR POST request', function () {
        var ctx = new Context({
            _rawReq: {
                raw: {
                    req: {
                        headers: {
                            'x-requested-with': 'XMLHttpRequest'
                        }
                    }
                }
            }
        });

        chai.expect(ctx.isXHR).to.be.true;
    });

    it('standard GET request', function () {
        var ctx = new Context({
            _rawReq: {
                raw: {
                    req: {
                        headers: {}
                    }
                }
            }
        });

        chai.expect(ctx.isXHR).to.be.false;
    });

    it('common server', function () {
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

        chai.expect(ctx.location.pathname).to.be.equal('foo/bar/baz');
    });

});