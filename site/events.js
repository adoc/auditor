define(['underscore', 'backbone'],
    function (_, Backbone) {
        var Events = {};
        _.extend(Events, Backbone.Events);
        return Events;
    });

