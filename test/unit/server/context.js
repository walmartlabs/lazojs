define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'context'
], function (bdd, chai, expect, sinon, sinonChai, utils, Context) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Context', function () {

            var ctxOptions = {
                _request: {
                    url: {
                        pathname: 'foo/bar/baz'
                    },
                    raw: { // this is expected on the server
                        req: {
                            headers: {
                                host: 'localhost:8080'
                            }
                        }
                    },
                    server: {
                        info: {
                            protocol: 'http'
                        }
                    }
                },
                headers: {},
                response: {
                    statusCode: null,
                    httpHeaders: [],
                    varyParams: []
                }
            };

            it('common server', function () {
                var ctx = new Context({
                    _request: {
                        url: {
                            pathname: 'foo/bar/baz'
                        },
                        raw: { // this is expected on the server
                            req: {
                                headers: {
                                    host: 'localhost:8080'
                                }
                            }
                        },
                        server: {
                            info: {
                                protocol: 'http'
                            }
                        }
                    },
                    headers: {
                        host: 'localhost:8080'
                    }
                });

                expect(ctx.location.pathname).to.be.equal('foo/bar/baz');
            });

            it('handles undefined host', function () {
                var ctx = new Context({
                    _request: {
                        url: {
                            pathname: 'foo/bar/baz'
                        },
                        raw: { // this is expected on the server
                            req: {
                                headers: {
                                    host: 'localhost:8080'
                                }
                            }
                        },
                        server: {
                            info: {
                                protocol: 'http'
                            }
                        }
                    },
                    headers: {}
                });

                expect(ctx.location.host).to.be.undefined;
            });

            it('should get/set http statusCode', function () {
                var ctx = new Context(ctxOptions);

                expect(ctx.getHttpStatusCode(302)).to.equal(302);
                expect(ctx.getHttpStatusCode()).to.equal(200);
                ctx.setHttpStatusCode(410);
                expect(ctx.getHttpStatusCode()).to.equal(410);
            });

            it('should get/add http headers', function () {
                var ctx = new Context(ctxOptions);

                expect(ctx.getHttpHeaders().length).to.equal(0);
                ctx.addHttpHeader('accept', 'text/plain');
                expect(ctx.getHttpHeaders().length).to.equal(1);
            });

            it('should get/add http vary params', function () {
                var ctx = new Context(ctxOptions);

                expect(ctx.getHttpVaryParams().length).to.equal(0);
                ctx.addHttpVaryParam('accept');
                expect(ctx.getHttpVaryParams().length).to.equal(1);
            });

        });
    }
});