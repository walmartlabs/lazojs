define([
    'underscore',
    'intern!bdd',
    'intern/chai!expect',
    'test/unit/utils',
    'sinon',
    'intern/chai!',
    'sinon-chai',
    'lib/common/config'
], function (_, bdd, expect, utils, sinon, chai, sinonChai, config) {
    chai.use(sinonChai);

    with (bdd) {

        describe('config', function () {

            config.addPlugin(new function(){
                return {
                    data: {"key": "value"},

                    get: function (key, options) {
                        var ret;
                        if (options && options.context) {
                            ret = options.context[key];
                        } else if (this.data && key in this.data) {
                            ret = this.data[key];
                        }

                        return (options && _.isFunction(options.success)) ? options.success(ret) : ret;
                    }
                }
            });


            it('should return the value for a given key', function () {
                expect(config.get("key")).to.be.equal('value');
            });

            it('should return the value for a given key in the provided context', function () {
                expect(config.get("key", {context:{"key":"contextValue"}})).to.be.equal('contextValue');
            });

            it('should return the value for a given key via a success callback', function () {
                var dfd = this.async();

                config.get("key",{
                    success: function(value){
                        expect(value).to.be.equal('value');
                        dfd.resolve();
                    }
                });
            });

            it('should return the value for a given key in the provided context via a success callback', function () {
                var dfd = this.async();

                config.get("key",{
                    context: {"key":"contextValue"},
                    success: function(value){
                        expect(value).to.be.equal('contextValue');
                        dfd.resolve();
                    }
                });
            });

        });
    }
});