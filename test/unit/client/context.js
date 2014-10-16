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

            it('common client', function () {
                var ctx = new Context({
                    _request: {
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

        });
    }
});