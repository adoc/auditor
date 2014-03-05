define([
    'jquery',
    'underscore',
    'backbone',
    'elements',
    'elementalViews',
    'text!play.html.tmpl',
    'text!pcollection.html.tmpl',
    'text!pcollection_admin.html.tmpl'
    ],
    function ($, _, Backbone, E, EV, play_tmpl, pcollection_tmpl,
                pcollection_admin_tmpl) {
        
        var renderTemplate = function (tmpl) {
            return _.template(tmpl, {
                view: this
            });
            
        }

        // Parent View for most Elemental manipulation.

        // Required properties to be implemented by subclasses:
        //  `parentElemental`
        //  `collection`
        var ManipulateElementals = Backbone.View.extend({
            // Selector for all manipulable elements.
            selAll: '.elemental',

            // Make sure to initialize from sub-classes that have their
            // own `initialize`.
            // OderingElementals.prototype.initialize.apply(this, arguments);
            // from child `initialize`.
            // Expects `collection` property
            initialize: function () {
                if (!this.parentElemental) {
                    throw "ManipulateElementals View must be initialized with " +
                            "an `order` array.";
                }
                if (!this.collection) {
                    throw "ManipulateElementals View requires Elemental " + 
                            "`collection` property.";
                }
                this.renderDelay = 100;
                // Set up our own events.
                var doEvents = ['drag', 'drop', 'dragOver', 'dragEnter', 'dragLeave'];
                /*
                _.extend(this.events, {
                    'drag ' + this.selAll: 'drag',
                    'drop ' + this.selAll: 'drop',
                    'dragover ' + this.selAll: 'dragOver',
                    'dragenter ' + this.selAll: 'dragEnter',
                    'dragleave ' + this.selAll: 'dragLeave',
                    'dragend ' + this.selAll: 'dragEnd'
                });*/
                this.reset();
            },
            reset: function () {
                this.renderLock = false;
                this.draggedEla = null;
                this.draggedIdx = null;
                this.overIdx = null;
            },
            // Gets event target elemental index in group.
            _getTargetIdx: function (ev){
                var target = ev.target,
                    targetEl = this.collection[target.id];
                return this.parentElemental.children.indexOf(targetEl);
            },
            _getOffset: function (ev) {
                var targetIdx = this.getTargetIdx(ev);
                if (targetIdx >= 0)
                    return targetIdx - this.draggedIdx;
            },
            // Pass-through events. (mainly for reference.)
            drag: function (ev) {
                ev.preventDefault();
                var dragged = ev.target;
                // Reference the `collection` to get the Elemental.
                this.draggedEla = this.collection[dragged.id];
                this.draggedIdx = this.parentElemental.children.indexOf(this.draggedEla);
                return false;
            },
            drop: function (ev) {
                console.log('drop...');
                ev.preventDefault();
                this.reset();
                this.renderOnly();
                return false;
            },
            dragOver: function (ev) { },
            dragEnter: function (ev) { },
            dragLeave: function (ev) { },
            dragEnd: function (ev) { }
        });

        var NestingElementals = ManipulateElementals.extend({
            dragOver: function (ev) {
                console.log('over');
                var that = this,
                    dropAllow = false,
                    skipRender = false,
                    targetIdx = this._getTargetIdx(ev);

                // Prevent the default 'dragover' action.
                ev.preventDefault();
                
                if (targetIdx >= 0 && this.overIdx !== targetIdx) {
                    this.overIdx = targetIdx;
                    dropAllow = true;
                }
                else {
                    skipRender = true;
                }

                // Render with delay because "dragover" is fired many
                // times per second.
                console.log(this.renderLock, skipRender);
                if (this.renderLock === false && skipRender !== true) {
                    console.log('render');
                    setTimeout(function () { that.renderLock = false; },
                                    this.renderDelay);
                    this.renderLock = true;
                    this.renderOnly();
                }

                return dropAllow;
            },
            drop: function (ev) {
                console.log('nest drop!');

                return ManipulateElementals.prototype.drop.apply(this, arguments);
            }

        });


        var PlayView = NestingElementals.extend({
            el: '.page',
            events: {
                'click button[name="new"]': 'newElemental',
                'click .elemental': 'select'
            },
            initialize: function () {
                this.parentElemental = new PointCollection();
                this.collection = this.parentElemental._collection;
                this.selected = null;
                ManipulateElementals.prototype.initialize.call(this, this.parentElemental.children);

                // Just add 10 elements.
                for (var i=0; i < 10; i++) {
                    this.newElemental();
                }


            },
            newElemental: function (ev) {
                var e = new Elemental();
                this.parentElemental.addChild(e);

                //new EV.ElementalView(this.el, e);

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