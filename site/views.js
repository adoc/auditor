define([
    'jquery',
    'underscore',
    'backbone',
    'elements',
    'text!play.html.tmpl',
    'text!pcollection.html.tmpl',
    'text!pcollection_admin.html.tmpl'
    ],
    function($, _, Backbone, Elements, play_tmpl, pcollection_tmpl, pcollection_admin_tmpl) {
        
        var renderTemplate = function (tmpl) {
            return _.template(tmpl, {
                view: this
            });
            
        }

        var PlayView = Backbone.View.extend({
            el: '.page',
            events: {
                'click button[name="new"]': 'newElemental',
                'click .elemental': 'select',
                'drag .elemental': 'drag',
                'drop .elemental': 'drop',
                'dragover .elemental': 'dragover'
            },
            initialize: function () {
                this.collection = new Elemental();
                this.selected = null;
                this.dragged = null;
            },
            newElemental: function (ev) {
                this.collection.addChild(new Elemental());
                this.renderOnly();
                return false;
            },
            select: function (ev) {
                if (this.selected && ev.target.id === this.selected.id) {
                    this.selected = null;
                }
                else {
                    this.selected = ev.target;
                }
                this.renderOnly();
                return false;
            },
            drag: function (ev) {
                this.dragged = ev.target;
                return false;
            },
            drop: function (ev) {
                ev.preventDefault();
                this.dragged = null;
                return false;
            },
            dragover: function (ev) {
                ev.preventDefault();

                var target = ev.target,
                    draggedEl = $(this.dragged.id).data('Elemental'),
                    targetEl = $(target).data('Elemental'),
                    draggedIdx = this.collection.children.indexOf(draggedEl),
                    targetIdx = this.collection.children.indexOf(targetEl);

                console.log(draggedEl);
                console.log(targetEl);

                return false;
            },
            renderOnly: function () {
                var t = _.template(play_tmpl, {
                v: this
            });
                //this.$el.html(renderTemplate.call(this, play_tmpl));
                this.$el.html(t);
            },
            render: function () {
                this.renderOnly();
            }
        });

        var PointCollectionAdminView = Backbone.View.extend({
            collapsed: true,
            el: '#collection_admin',
            events: {
                'click label[name="collection.label"]': 'edit',
                'click button[name="lockable"]': 'update',

                'click button[name="collapse"]': 'collapse',
                'click button[name="expand"]': 'expand',
            },
            // Colapse Admin View
            collapse: function (ev) {
                $(ev.currentTarget).addClass('hidden');
                $('button[name="expand"]' , this.$el).removeClass('hidden');
                $('form', this.$el).addClass('hidden');
                this.collapsed = true;
            },
            // Expand Admin View
            expand: function (ev) {
                $(ev.currentTarget).addClass('hidden');
                $('button[name="collapse"]' , this.$el).removeClass('hidden');
                $('form', this.$el).removeClass('hidden');
                this.collapsed = false;
            },
            // Event callback when an option is changed.
            update: function (ev) {
                var model = this.collection.toModel();
                var id = $(ev.currentTarget).attr('name');

                if (model.schema[id].type === 'bool') {
                    this.collection.objects[id].toggle();
                }

                this.render(); //?
                this.preview.render(); //?
            },
            // Edit element.
            // Expects a textbox, I believe immediately following the clicked
            //  label.
            edit: function (ev) {
                var that = this,
                    el = $(ev.currentTarget),
                    id = el.attr('name'),
                    textarea = el.next('textarea[name="' + id + '"]');
                el.addClass('hidden');
                textarea.removeClass('hidden');
                textarea.on('blur', function (ev) {
                    that.edit_blur(ev);
                });
                textarea.focus();
            },
            // Finish editing element
            // Expects the element name to contain a dotted notation name for
            //  the underlying object.
            edit_blur: function (ev) {
                var el = $(ev.currentTarget),
                    id = el.attr('name');
                el.off('blur');

                if (id === 'collection.label') {
                    // Kludgy
                    this.collection.label = el.val();
                    el.addClass('hidden');
                    
                    var label = $(ev.currentTarget).prev('label[name="collection.label"]');
                    label.removeClass('hidden');
                    label.html(el.val());

                    this.preview.collection = this.collection;
                    this.preview.render();
                }
            },
            initialize: function (consumer) {
                // Consumer Collection.
                this.consumer = new PointCollection().fromDef(consumer);
                // Admin Collection.
                this.collection = new PointCollection().fromDef(cmeta(this.consumer));
                // Preview View.
                this.preview = new PointCollectionView(null, this.consumer);
            },
            render: function () {
                this.renderOnly();
                this.preview.render();
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
            initialize: function (consumer, collection) {
                this.collection = collection || new PointCollection().fromDef(consumer);
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
                    if (err[0].startsWith('Invalid')) { // Bad, use error objects.
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
                    this.collection.objects[id].value = $(ev.currentTarget).val();
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
                    this.collection.locked = true;
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
                    view: this // Just pass the entire viewstate, it's useful.
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
            PlayView: PlayView,
            PointCollectionAdminView: PointCollectionAdminView,
            PointCollectionView: PointCollectionView};
    });