define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'forbidden'
], function (bdd, chai, expect, sinon, sinonChai, utils, forbidden) {
    chai.use(sinonChai);

    with (bdd) {
        describe('forbidden', function () {

            it('should not allow access to "server" directories', function () {
                expect(forbidden('/server/foo/bar')).to.be.true;
                expect(forbidden('/foo/server/bar')).to.be.true;
                expect(forbidden('/server')).to.be.true;
            });

            it('should not allow access to "node_modules" directories', function () {
                expect(forbidden('/node_modules/foo/bar')).to.be.true;
                expect(forbidden('/foo/node_modules/bar')).to.be.true;
                expect(forbidden('/node_modules')).to.be.true;
            });

            it('should allow access to common directories', function () {
                expect(forbidden('/lib/foo/bar')).to.be.false;
                expect(forbidden('/foo/client/bar')).to.be.false;
                expect(forbidden('/common')).to.be.false;
            });

        });
    }
});