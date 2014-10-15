define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'handlers/stream'
], function (bdd, chai, expect, sinon, sinonChai, utils, StreamHandler) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Stream Handler Test', function () {

            var request = {};
            var lazoSpy;
            var handler = {
                'func' : function (req, options) {
                    options.success("done");
                }
            };

            LAZO.require = function(path, cb){
                cb(handler);
            };
            lazoSpy = sinon.spy(LAZO, 'require');

            afterEach(function (done) {
               lazoSpy.reset();
               done();
            });

            it('Custom Action Without Callback and without component', function () {
                this.skip();
                var req = {
                    params : {
                        componentName: null,
                        action: "func"
                    },
                    paylood: null,
                    reply : function(){}
                };

                var spy = sinon.spy();
                StreamHandler(req, spy);
                expect(JSON.stringify("done")).to.be.equal(spy.args[0][0]);
                expect("app/server/utilActions").to.be.equal(lazoSpy.args[0][0][0]);
            });

            it('Custom Action Without Callback and with component', function () {
                this.skip();
                var req = {
                    params : {
                        compName: "test",
                        action: "func"
                    },
                    paylood: null,
                    reply : function(){}
                };

                var spy = sinon.spy();
                StreamHandler(req, spy);
                expect(JSON.stringify("done")).to.be.equal(spy.args[0][0]);
                expect("components/test/server/utilActions").to.be.equal(lazoSpy.args[0][0][0]);
            });


        });
    }
});