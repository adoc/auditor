define(['backbone', 'views', 'temp_objects'],
    function(Backbone, Views) {
        return {
            Router: function () {
                return Backbone.Router.extend({
                    routes: {
                        'edit': function() {
                            var admin = new Views.PointCollectionAdminView(c1);
                            admin.render();
                        },
                        'tests': function () {
                            console.log('tests!!');
                        }
                    }
                });
            }
        }
    });