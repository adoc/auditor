define(['backbone', 'routes'],
    function(Backbone, Routes) {
        return {
            initialize: function() {
                var Router = Routes.Router();
                var router = new Router();
                Backbone.history.start();
            }
        };
    });