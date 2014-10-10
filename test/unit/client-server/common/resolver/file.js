define([
    'intern!bdd',
    'intern/chai!expect',
    'test/utils',
    'lib/common/resolver/file'
], function (bdd, expect, utils, file) {
    with (bdd) {
        utils.stub('LAZO');

        describe('file resolver', function () {

            it('should get a view\'s path', function () {
                var cmpViewPath = file.getPath('module_foo', 'cmp_bar', 'view'),
                    appViewPath = file.getPath('a:module_bar', 'cmp_bar', 'view');

                expect(cmpViewPath).to.be.equal('components/cmp_bar/views/module_foo');
                expect(appViewPath).to.be.equal('app/views/module_bar');

            });

            it('should get a template\'s path', function () {
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

                expect(cmpTemplatePath).to.be.equal('components/cmp_name/views/view_tmp.hbs');
                expect(appTemplatePath).to.be.equal('app/views/view_tmp.hbs');

            });

            it('should get a template\'s name', function () {
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

                expect(strTemplateName).to.be.equal('view_tmp');
                expect(fnTemplateName).to.be.equal('a:view_tmp');

            });

            it('should get a view\'s base path', function () {
                var cmpViewPath = file.getBasePath('module_foo', 'cmp_bar', 'view'),
                    appViewPath = file.getBasePath('a:module_bar', 'cmp_bar', 'view');

                expect(cmpViewPath).to.be.equal('components/cmp_bar/views');
                expect(appViewPath).to.be.equal('app/views');

            });

        });
    }
});