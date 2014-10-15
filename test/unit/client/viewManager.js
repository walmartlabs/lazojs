define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'lazoView',
    'viewManager'
], function (bdd, chai, expect, sinon, sinonChai, utils, LazoView, viewManager) {
    chai.use(sinonChai);

    with (bdd) {
        describe('View Manager', function () {

            it('should attach a view', function () {
                var dfd = this.async();
                utils.setUpApp(function () {
                    $('body').append('<div class="view-attach">');
                    var $view = $('.view-attach');
                    var view = new LazoView();
                    var afterRenderSpy = sinon.spy(view, 'afterRender');
                    var setElementSpy = sinon.spy(view, 'setElement');

                    viewManager.attachView(view, $view[0]);
                    expect($view[0]).to.be.equal(view.el);
                    expect(afterRenderSpy.calledOnce).to.be.true;
                    expect(setElementSpy.calledOnce).to.be.true;
                    dfd.resolve();
                });
            });

            it('should attach views in a tree', function () {
                var dfd = this.async();
                utils.setUpApp(function () {
                    utils.createCtlTree(function (ctl) {
                        var spy = sinon.spy(viewManager, 'attachView');

                        viewManager.attachViews(ctl, ctl.currentView.cid);
                        expect(spy.calledThrice).to.be.true;
                        dfd.resolve();
                    });
                });
            });

            it('should clean up a view', function () {
                var dfd = this.async();
                utils.setUpApp(function () {
                    $('body').append('<div class="view-cleanup">');
                    var $view = $('.view-cleanup');
                    var view = new LazoView({ el: $view });
                    var onRemoveSpy = sinon.spy(view, 'onRemove');
                    var stopListening = sinon.spy(view, 'stopListening');
                    var undelegateEvents = sinon.spy(view, 'undelegateEvents');

                    viewManager.cleanupView(view);
                    expect(onRemoveSpy.calledOnce).to.be.true;
                    expect(stopListening.calledOnce).to.be.true;
                    expect(undelegateEvents.calledOnce).to.be.true;
                    dfd.resolve();
                });
            });

            it('should clean up a tree branch', function () {
                var dfd = this.async();
                utils.setUpApp(function () {
                    utils.createCtlTree(function (ctl) {
                        var spy = sinon.spy(viewManager, 'cleanupView');

                        viewManager.cleanup(ctl, ctl.currentView.cid);
                        expect(spy.calledThrice).to.be.true;
                        dfd.resolve();
                    });
                });
            });

        });
    }
});