describe('Stream Handler Test', function () {

    var StreamHandler;
    var request = {};
    var lazoSpy;
    var handler = {
        "func" : function(req, options) {
            options.success("done");
        }
    };

    beforeEach(function (done) {
        requirejs(['castle'], function (castle) { // TODO: fix pathing
            castle.test({
                module: 'handlers/stream',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    LAZO.require = function(path, cb){
                        cb(handler);
                    };
                    lazoSpy = sinon.spy(LAZO, "require");
                    StreamHandler = module;
                    done();
                }
            });
        });
    });

    afterEach(function (done) {
       lazoSpy.reset();
       done();
    });

    it('Custom Action Without Callback and without component', function () {
        var req = {
            params : {
                componentName: null,
                action: "func"
            },
            paylood: null,
            reply : function(){}
        };

        var spy = sinon.spy(req, "reply");
        StreamHandler(req);
        chai.expect(JSON.stringify("done")).to.be.equal(spy.args[0][0]);
        chai.expect("app/server/utilActions").to.be.equal(lazoSpy.args[0][0][0]);
    });

    it('Custom Action Without Callback and with component', function () {
        var req = {
            params : {
                compName: "test",
                action: "func"
            },
            paylood: null,
            reply : function(){}
        };

        var spy = sinon.spy(req, "reply");
        StreamHandler(req);
        chai.expect(JSON.stringify("done")).to.be.equal(spy.args[0][0]);
        chai.expect("components/test/server/utilActions").to.be.equal(lazoSpy.args[0][0][0]);
    });


});