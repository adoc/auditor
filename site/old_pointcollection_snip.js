//
var PointCollection = function (opts) {
    _.extend(this, {
        _update_objects: function(objects) {
            var id;
            for (id in objects) {
                _.extend(this.objects[id], objects[id]);
            }
        },
        // Group definitions to Group objects.
        // @param   groups  Array   Group definitions.
        _addGroupDefs: function (groups) {
            for (var id in groups) {
                var group = groups[id];
                group.id = id;
                group.collection = this;
                this.objects[id] = new Group(group);
            }
        },
        // Point definitions to Point objects.
        // @param   points  Array   Point definitions.
        _addPointDefs: function (points) {
            for (var id in points) {
                var point = points[id];
                point.id = id;
                point.collection = this;
                point.groups = keys_to_objects(point.groups,
                                                    this.objects);
                // Build and store the point.
                if (point.type.startsWith('bool')) {
                    point = new Bool(point);
                }
                else if (point.type.startsWith('int')) {
                    point = new Int(point);
                }
                else if (point.type.startsWith('str')) {
                    point = new Str(point);
                }
                else if (point.type.startsWith('float')) {
                    point = new Float(point);
                }
                else if (point.type.startsWith('list')) {
                    point = new List(point);
                }
                else {
                    throw "Expected `point.type` in ['bool', 'int', 'str', 'float']. Got " + point.type;
                }
                this.objects[id] = point;
            }
        },
        _addCollectionDefs: function (collections) {
            for (var id in collections) {
                var collection = collections[id];
                collection.id = id;
                this.objects[id] = collection
                //this.collections[id] = collection;
            }
        },
        // Collection updated by group or point, check for update conditions.
        onupdate: function(object) {
            // Bind State processing.
            if (object && object.bind_states) {
                for (var condition in object.bind_states) {
                    var condition_eval = object.evaluate(condition);
                    var binds = object.bind_states[condition];
                    for (var id in binds) {
                        var obj = this.objects[id];
                        obj[binds[id]] = condition_eval;
                    }
                }
            }
        },
        //
        validate: function () {
            // Refactor this.
            var i, obj;
            for (i in this.objects) {
                obj = this.objects[i];
                if (obj.show &&
                    (obj.required || Boolean(obj.value))) {
                    obj.validate();
                }
            }
        },
        // PointCollection to Object.
        toDef: function() {
            return {};
        },
        // PointCollection from Object.
        fromDef: function(object) {
            this.label = object.label || '';
            // Parse groups in object.
            if (object.groups !== undefined) {
                this._addGroupDefs(object.groups);
            }
            // Parse points in object.
            if (object.points !== undefined) {
                this._addPointDefs(object.points);
            }
            if (object.collections !== undefined) {
                this._addCollectionDefs(object.collections);
            }
            // Update order list with actual objects (groups or points).
            if (object.order !== undefined) {
                for (var i=0; i<object.order.length; i++) {
                    this.order.push(this.objects[object.order[i]]);
                }
            }
            if (object.lockable !== undefined) {
                this.lockable = object.lockable;
            }

            return this;
        },
        // Render the collection to an array.
        toRender: function() {
            var output = [];
            for (var i in this.order) {
                var obj = this.order[i];
                output = output.concat(obj.toRender());
            }
            return output;
        },
        // Output PointCollection's schema.
        toSchema: function(render) {
            var outobj = {};
            for (var i in this.order) {
                var obj = this.order[i];
                outobj[obj.id] = obj.toSchema();
                // Get members' schema if object has.
                if (obj.members && obj.members.length) {
                    for(var m=0; m<obj.members.length; m++) {
                        var mobj = obj.members[m];
                        outobj[mobj.id] = mobj.toSchema();
                    }
                }
            }
            return outobj;
        },
        // Output PointCollection as a Backbone Model.
        toModel: function(render) {
            if (Backbone !== undefined) {
                var Model = Backbone.Model.extend({}), //??
                    model = new Model();
                model.render = render = render || this.toRender();
                for (var i in render) {
                    model.set(render[i].id, render[i].value);
                }
                model.schema = this.toSchema();
                return model;
            }
            else {
                throw "PointCollection.toModel requires Backbone.";
            }
        }
    });

    this._init(opts)
};

PointCollection.prototype = new Elemental();
PointCollection.prototype.constructor = PointCollection;

PointCollection.prototype._init = function (opts) {
    Elemental.prototype._init.call(this);
    _.extend(this, {
        _type: 'collection',
        name: '', // ????
        objects: {}, //?????
        collections: {}, //???
        order: [], // ughhhh fix!
    }, opts);
    return this;
};


// Definition of a Point.
// This is used to construct views to modify Point properties.
// (Cleverly using the existing Objects/Functions to implement the concept.)
var PointMeta = {
    points: {
        id: {
            label: 'Id',
            type: 'str',
            required: true,
            show: true
        },
        type: {
            label: 'Type',
            type: 'str',
            show: true,
            valid: ['str', 'bool', 'int', 'float'],
            bind_states: {
                '{value} in ["str", "int", "float"]': {
                    min: ['show'],
                    max: ['show']
                }
            }
        },
        label: {
            label: 'Label',
            type: 'str',
            show: true
        },
        required: {
            label: 'Required',
            type: 'bool',
            show: true
        },
        show: {
            label: 'Show',
            type: 'bool',
            show: true
        },
        min: {
            label: 'Min',
            type: 'int'
        },
        max: {
            label: 'Max',
            type: 'int'
        },
        valid: {
            label: 'Valid',
            type: 'list',
        },
        groups: {
            label: 'Groups',
            type: 'list'
        }
    }
};