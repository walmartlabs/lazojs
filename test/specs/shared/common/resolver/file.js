describe('file resolver', function () {

    var file;
    beforeEach(function (done) {
        requirejs(['castle'], function (castle) {
            castle.test({
                module: 'resolver/file',
                globals: [{ module: 'lazo', exports: 'LAZO' }],
                callback: function (module) {
                    // mock; used by file.getTemplatePath
                    LAZO.app.getTemplateExt = function () {
                        return 'hbs';
                    };
                    file = module;
                    done();
                }
            });
        });
    });

    afterEach(function () {
        delete LAZO.app.getTemplateExt; // clean up test mock
    });

    it('get a view\'s path', function () {
        var cmpViewPath = file.getPath('module_foo', 'cmp_bar', 'view'),
            appViewPath = file.getPath('a:module_bar', 'cmp_bar', 'view');

        chai.expect(cmpViewPath).to.be.equal('components/cmp_bar/views/module_foo');
        chai.expect(appViewPath).to.be.equal('app/views/module_bar');

    });

    it('get a template\'s path', function () {
        var view1  = {
                templateName: 'view_tmp',
                ctl: {
                    name: 'cmp_name'
                }
            },
            view2  = {
                templateName: 'a:view_tmp',
                ctl: {
                    name: 'cmp_name'
                }
            },
            cmpTemplatePath = file.getTemplatePath(view1),
            appTemplatePath = file.getTemplatePath(view2);


        chai.expect(cmpTemplatePath).to.be.equal('components/cmp_name/views/view_tmp.hbs');
        chai.expect(appTemplatePath).to.be.equal('app/views/view_tmp.hbs');

    });

    it('get a template\'s name', function () {
        var view1  = {
                templateName: 'view_tmp',
                ctl: {
                    name: 'cmp_name'
                }
            },
            view2  = {
                templateName: function () { return 'a:view_tmp' },
                ctl: {
                    name: 'cmp_name'
                }
            },
            strTemplateName = file.getTemplateName(view1),
            fnTemplateName = file.getTemplateName(view2);

        chai.expect(strTemplateName).to.be.equal('view_tmp');
        chai.expect(fnTemplateName).to.be.equal('a:view_tmp');

    });

    it('get a view\'s base path', function () {
        var cmpViewPath = file.getBasePath('module_foo', 'cmp_bar', 'view'),
            appViewPath = file.getBasePath('a:module_bar', 'cmp_bar', 'view');

        chai.expect(cmpViewPath).to.be.equal('components/cmp_bar/views');
        chai.expect(appViewPath).to.be.equal('app/views');

    });

});