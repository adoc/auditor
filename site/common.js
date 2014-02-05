require.config({
    paths: {
        jquery: 'lib/jquery-min',
        underscore: 'lib/underscore-min',
        backbone: 'lib/backbone-min',
        text: 'lib/text',
        jquery_serialize_object: 'lib/jquery.serialize-object.compiled',
        rng: 'lib/rng',
        persist: 'lib/persist-min',
        elements: 'elements'
    },
    shim: {
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        underscore: {
            exports: '_'
        },
        jquery_serialize_object: {
            deps: ['jquery']
        },
        persist: {
            exports: 'Persist'
        },
        elements: {
            deps: ['underscore']
        }
    },
    timeout: 1
});