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

        });
    }
});