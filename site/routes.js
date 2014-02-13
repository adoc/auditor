define(['underscore', 'backbone', 'qunit', 'views', 'tests/test_elements', 'temp_objects'],
    function(_, Backbone, QUnit, Views, Tests) {

        // https://github.com/jashkenas/backbone/pull/494
        // (with modifications)
        // Fire custom 'beforeroute' event before a route is called.
        var BaseRouter = Backbone.Router.extend({
            route: function(route, name, callback) {
                // From backbone.js (Allows for route functions directly in `routes`)
                if (_.isFunction(name)) {
                    callback = name;
                    name = '';
                }
                return Backbone.Router.prototype.route.call(this, route, name, function() {
                    this.trigger.apply(this, ['beforeroute'].concat(_.toArray(arguments)));
                    callback.apply(this, arguments);
                });
            }
        });

        return {
            Router: function () {
                return BaseRouter.extend({
                    routes: {
                        '': function (){
                            $('.page').html('<hr /><div id="collection"></div>');
                            var preview = new Views.PointCollectionView(c1());
                            preview.render();
                        },
                        'edit': function() {
                            $('.page').html('<hr /><div id="collection_admin"></div><hr /><div id="collection"></div>');
                            var admin = new Views.PointCollectionAdminView(c1());
                            admin.render();
                        },
                        'tests': function () {
                            var that = this,
                                qunit_css = document.createElement('link');
                            // This could be put in to a view.
                            $('.page').html('<div id="qunit"></div><div id="qunit-fixture"></div>');
                            qunit_css.setAttribute('rel', 'stylesheet');
                            qunit_css.setAttribute('href', "//code.jquery.com/qunit/qunit-1.14.0.css");
                            $('head').append(qunit_css);
                            // Wait for .page element to be ready, then
                            //  execute tests.
                            $('.page').ready(function () {
                                QUnit.load();
                                QUnit.start();
                                Tests.run();
                                that.once('beforeroute', function (route) {
                                    $(qunit_css).remove();
                                    $('.page').html('');
                                    QUnit.stop();
                                });
                            });
                        }
                    }
                });
            }
        }
    });