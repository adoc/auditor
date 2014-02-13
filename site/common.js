require.config({
    paths: {
        jquery: 'lib/jquery-min',
        underscore: 'lib/underscore-min',
        backbone: 'lib/backbone-min',
        text: 'lib/text',
        jquery_serialize_object: 'lib/jquery.serialize-object.compiled',
        rng: 'lib/rng',
        persist: 'lib/persist-min',
        elements: 'elements',
        // Strip for production.
        qunit: '//code.jquery.com/qunit/qunit-1.14.0'
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
        },
        // Strip for production.
        qunit: {
            exports: 'QUnit',
            init: function() {
                QUnit.config.autoload = false;
                QUnit.config.autostart = false;
            }
        }
    },
    timeout: 60
});