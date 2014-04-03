describe('route resolver', function () {

    var route;
    beforeEach(function (done) {
        requirejs(['castle'], function (castle) {
            castle.test({
                module: 'resolver/route',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    route = module;
                    done();
                }
            });
        });
    });

    it('transform routes', function () {
        var foo = route.transform('foo(/)'),
            bar = route.transform('bar'),
            baz = route.transform('');

        chai.expect(foo.routeNoTrailingSlash).to.be.equal('/foo');
        chai.expect(foo.route).to.be.equal('/foo/');
        chai.expect(bar.routeNoTrailingSlash).to.be.null;
        chai.expect(bar.route).to.be.equal('/bar');
        chai.expect(baz.routeNoTrailingSlash).to.be.null;
        chai.expect(baz.route).to.be.equal('/');

    });

});