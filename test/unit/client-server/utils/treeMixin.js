define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'utils/treeMixin'
], function (bdd, chai, expect, sinon, sinonChai, utils, treeMixin) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Tree Mixin', function () {

            it('should get a list of nodes', function () {
                var dfd = this.async();

                utils.setUpApp(function () {
                    utils.createCtlTree(function (ctl) {
                        var views = treeMixin.getList('view', ctl);
                        var components = treeMixin.getList('component', ctl);
                        var i;

                        expect(views.length).to.be.equal(3);
                        for (i = 0; i < 3; i++) {
                            expect(views[i].setElement).to.be.function;
                        }

                        expect(components.length).to.be.equal(3);
                        for (i = 0; i < 3; i++) {
                            expect(components[i].currentView).to.be.defined;
                        }

                        dfd.resolve();
                    });
                });
            });

            it('should get a node\'s type', function () {
                utils.createCtlTree(function (ctl) {
                    expect(treeMixin.getNodeType(ctl.currentView)).to.be.equal('view');
                    expect(treeMixin.getNodeType(ctl)).to.be.equal('component');
                });
            });

            it('should get a node\'s children', function () {
                utils.createCtlTree(function (ctl) {
                    var children = treeMixin.getNodeChildren(ctl);
                    expect(children.length).to.be.equal(2);
                });
            });

        });
    }
});