define([
    'jquery',
    'underscore',
    'backbone',
    'text!pcollection.html.tmpl',
    'text!pcollection_admin.html.tmpl'
    ],
    function($, _, Backbone, pcollection_tmpl, pcollection_admin_tmpl) {

        var PointCollectionAdminView = Backbone.View.extend({
            collapsed: true,
            el: '#collection_admin',
            events: {
                'click label[name="collection.label"]': 'edit',
                'click button[name="collapse"]': 'collapse',
                'click button[name="expand"]': 'expand',
            },
            collapse: function (ev) {
                $(ev.currentTarget).addClass('hidden');
                $('button[name="expand"]' , this.$el).removeClass('hidden');
                $('form', this.$el).addClass('hidden');
            },
            expand: function (ev) {
                $(ev.currentTarget).addClass('hidden');
                $('button[name="collapse"]' , this.$el).removeClass('hidden');
                $('form', this.$el).removeClass('hidden');
            },
            edit: function (ev) {
                var id = $(ev.currentTarget).attr('name');

                if (id == 'collection.label') {
                    $(ev.currentTarget).addClass('hidden');
                    $(ev.currentTarget).next('textarea[name="collection.label"]').removeClass('hidden');
                }
            },
            initialize: function (collection) {
                this.collection = collection; 
            },
            render: function () {
                this.renderOnly();
            },
            renderOnly: function () {
                var template = _.template(pcollection_admin_tmpl, {
                    view: this
                });
                this.$el.html(template);
            },
        });

        var PointCollectionView = Backbone.View.extend({
            el: '#collection',
            invalid: false,
            locked: false,
            initialize: function (collection) {
                this.collection = collection;
            },
            _set_events: function () {
                var schema,
                    model = this.collection.toModel(),
                    events = {'click button[name="lock"]': 'lock'};
                for (i in model.schema) {
                    schema = model.schema[i];
                    if (schema.type=='bool') {
                        events['click button[name="'+schema.id+'"]'] = 'update';
                    } 
                    else if (schema.type=='str') {
                        events['keyup textarea[name="'+schema.id+'"]'] = 'soft_update';
                        events['change textarea[name="'+schema.id+'"]'] = 'update';
                    }
                }
                this.delegateEvents(events);
            },
            _set_view: function () {
                var el = $('.form-collection', this.$el);
                if (this.invalid) {
                    el.addClass('has-warning');
                }
                else {
                    el.removeClass('has-warning');
                } 
            },
            validate: function () {
                try {
                    this.collection.validate();
                    this.invalid = false;
                }
                catch (err) {
                    if (err[0].startsWith('Invalid')) {
                        this.invalid = true;
                    }
                    else {
                        throw err;
                    }
                }
            },
            soft_update: function (ev) {
                this.update(ev, true);
                this.validate();
                return false;
            },
            update: function (ev, norender) {
                var model = this.collection.toModel();
                var id = $(ev.currentTarget).attr('name');

                if (model.schema[id].type == 'bool') {
                    this.collection.objects[id].toggle();  
                }
                else if (model.schema[id].type == 'str') {
                    this.collection.objects[id].set_value($(ev.currentTarget).val());
                }
                if (!norender) {
                    this.render();
                }
                else {
                    this._set_events();
                    this.validate();
                    this._set_view();
                }   

                return false;
            },
            lock: function (ev) {
                if (this.invalid === false) {
                    this.locked = true;
                    this.events = {};
                    this.delegateEvents({});
                    this.renderOnly();
                }
                else {

                }
                return false;
            },
            renderOnly: function () {
                var template = _.template(pcollection_tmpl, {
                    view: this
                });
                this.$el.html(template);
            },
            render: function () {
                this._set_events();
                this.validate();
                this.renderOnly();
                this._set_view();
            }
        });

        return {
            PointCollectionAdminView: PointCollectionAdminView,
            PointCollectionView: PointCollectionView};

    });