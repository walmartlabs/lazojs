define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'resolver/route'
], function (bdd, chai, expect, sinon, sinonChai, utils, route) {
    chai.use(sinonChai);

    with (bdd) {
        describe('route resolver', function () {
            it('should transform routes', function () {
                var foo = route.transform('foo(/)');
                var bar = route.transform('bar');
                var baz = route.transform('');

                expect(foo.routeNoTrailingSlash).to.be.equal('/foo');
                expect(foo.route).to.be.equal('/foo/');
                expect(bar.routeNoTrailingSlash).to.be.null;
                expect(bar.route).to.be.equal('/bar');
                expect(baz.routeNoTrailingSlash).to.be.null;
                expect(baz.route).to.be.equal('/');

            });
        });
    }
});