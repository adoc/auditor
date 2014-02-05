// http://stackoverflow.com/a/646643
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

function evalCondition(condition) {
    // Add more as they become relevant.
    // Possibly find another way to do this than .replace, though
    // this seems sane.

    condition = condition.replace('{value}', this._value);
    condition = condition.replace('True', 'true');
    condition = condition.replace('False', 'false');
    condition = condition.replace('==', '===');

    return eval(condition);
}

function precise(float, precision) {
    // Oh god this is probably sooo wrong. (but it feels so right.)
    float *= Math.pow(10, precision);
    float = Math.round(float);
    return float / Math.pow(10, precision);
}

function keys_to_objects(keys, objects) {
    var out = [];
    if (keys && keys.length !== undefined) {
        for (i=0; i<keys.length; i++) {
            out.push(objects[keys[i]]);
        }  
    }
    return out;
}

// Data Point defaults.
var _Base = function (opts) {
    opts = opts || {};

    var _defaults = {
        id: undefined,  
        label: undefined,
        show: undefined,
        update: {},
        required: false,
        groups: [],
        collection: {},
        _value: undefined
    }

    var _methods = {

        is_shown: function () {
            // Nothing set here, so check the groups' state.
            if (this.show === undefined) {
                var group, show = false;
                for (i in this.groups) {
                    group = this.groups[i];
                    show = show || group.show;
                }
                return show;
            }
            else {
                return this.show;
            }
        },

        is_required: function () {
            if (this.required === undefined) {
                var group, required = false;
                for (i in this.groups) {
                    group = this.groups[i];
                    required = required || group.required;
                }
                return required;
            }
            else {
                return this.required;
            }
        },

        has_value: function () {
            return Boolean(this.get_value());
        },

        set_value: function (value) {
            if (value != this._value) {
                this._value = value;
                this.onupdate();
            }
        },
        get_value: function () {
            return this._value;
        },
        parse_value: function (value) {
            this.set_value(value);
        },

        add_group: function (group, recursed) {
            if (this.groups.indexOf(group) < 0) {
                this.groups.push(group);
                if (recursed !== true) {
                    group.add_point(this, true);
                }
            }
        },
        del_group: function (group, recursed) {
            var i = this.groups.indexOf(group);
            if (i >= 0) {
                this.groups.splice(i, 1);
                if (recursed !== true) {
                    group.del_point(this, true);
                }
            }
        },

        initialize: function () {
            var i, group, groups;

            groups = this.groups;
            this.groups = [];

            for (i in groups) {
                group = groups[i];

                if (group.id !== undefined) {
                    this.add_group(group);
                }
                else {
                    throw "Point.initialize: this.groups; Expected groups as array of objects.";
                }
            }

            return this;
        },

        validate: function () {
            return true; // Do we want this default??
        },
        render: function (output, force) {
            output = output || [];
            if (this.is_shown() || force === true) {
                output.push(this);
            }
            return output;
        },
        onupdate: function () {
            // Run "onupdate" on the collection if present.
            if (this.collection.onupdate) {
                this.collection.onupdate(this);
            }

            var group, i;

            // Run "onupdate" on any groups. This factor might be wrong.
            for (i in this.groups) {
                group = this.groups[i];
                group.onupdate(this);
            }
        },
    };

    return _.extend({}, _methods, _defaults, opts);
};

var Int = function (opts) {
    var _defaults = {
        _value: 0,
        min: 0,
        max: -1,
    
        parse_value: function(value) {
            this.set_value(parseInt(value));
        },
        validate: function() {
            if (typeof this._value === "number" &&
                    this._value >= this.min &&
                        (this.max < 0 || this._value <= this.max)) {
                return true;
            }
            else {
                throw "Invalid.Int: Value (" + this._value + ") did not validate.";
            }
        }
    };

    var _Int = _.extend({}, _Base(), _defaults, opts);
    return _Int.initialize(opts);
}

var Str = function (opts) {
    var _defaults = {
        _value: '',
        min: 0,
        max: -1,

        parse_value: function(value) {
            this.set_value(String(value));
        },
        validate: function() {
            if (typeof this._value === "string" &&
                    this._value.length >= this.min &&
                        (this.max < 0 || this._value.length <= this.max)) {
                return true;
            }
            else {
                throw ["Invalid.Str", "Value (" + this._value + ") did not validate. id:"+this.id];
            }
        }
    };

    var _Str = _.extend({}, _Base(), _defaults, opts);
    return _Str.initialize(opts);
}

var Float = function (opts) {
    var _defaults = {
        _value: 0.0,
        min: 0,
        max: -1,
        precision: 4,

        parse_value: function(value) {
            this.set_value(precise(value));
        },
        validate: function() {
            if (typeof this._value === "number" &&
                    this._value >= this.min &&
                        (this.max < 0 || this._value <= this.max)) {
                return true;
            }
            else {
                throw "Invalid.Float: Value (" + this._value + ") did not validate.";
            }
        }
    };

    var _Float = _.extend({}, _Base(), _defaults, opts);
    return _Float.initialize(opts);
}

var Bool = function (opts) {
    var _defaults = {
        _value: false,
        toggle: function() {
            this.set_value(!this.get_value());
        },
        parse_value: function (value) {
            this.set_value(value == true);
        },
        validate: function() {
            if (typeof this._value === "boolean") {
                return true;
            }
            else {
                throw "Invalid.Bool: Value(" + this._value + ") did not validate.";
            }
        }
    };

    //return _.extend({}, _Base(opts), _defaults);
    var _Bool = _.extend({}, _Base(), _defaults, opts);
    return _Bool.initialize(opts);
}

var Group = function (opts) {

    var _defaults = {
        id: null,
        radio: false, // all members must be bool.
        show: false,
        required: false,
        members: [],
        collection: {}
    };

    var _methods = {

        is_shown: function () {
            if (this.show === undefined) {
                return false;
            } 
            else {
                return this.show;
            }
        },

        is_required: function() {
            if (this.required === undefined) {
                return false;
            }
            else {
                return this.required;
            }
        },

        has_value: function () {
            return true;
        },

        add_point: function(point, recursed) {
            if (this.members.indexOf(point) < 0) {
                this.members.push(point);
                if (recursed !== true) {
                    point.add_group(this, true);
                }
            }
        },

        del_point: function(point, recursed) {
            var i = this.members.indexOf(point);
            if (i >= 0) {
                this.members.splice(i, 1);
                if (recursed !== true) {
                    point.del_group(this, true);
                }
            }
        },

        onupdate: function (member) {
            var mod_member;

            // Check radio buttons.
            if (member._value && this.radio === true) { 
                member._lock = true;
                for (i=0; i<this.members.length; i++) {
                    mod_member = this.members[i];
                    if (mod_member._lock !== true) {
                        mod_member.set_value(false);
                    }
                }
                delete member._lock;
            }
        },

        validate: function () {
            var i, member, val = false;
            for (i in this.members) {
                member = this.members[i];
                
                val = val || member.get_value();

                if (member.is_shown() &&
                        (member.is_required() || member.has_value())) {
                    member.validate();
                }
            }

            if (this.is_required() && !val) {
                throw ['Invalid.Group', 'No values in group but group is required.'];
            }
        },

        render: function(output, force) {
            var member;
            output = output || [];
            if (this.is_shown() === true || force === true) {
                for (i=0; i<this.members.length; i++) {
                    member = this.members[i];
                    member.render(output, force);
                }
            }
            return output;
        }
    };

    return _.extend({}, _defaults, _methods, opts);
};

var PointCollection = function (opts) {

    var _defaults = {
        name: '',
        objects: {},
        order: []
    };

    var _methods = {
        _update_objects: function(objects) {
            var id;
            for (id in objects) {
                _.extend(this.objects[id], objects[id]);
            }
        },
        // Collection updated by group or point, check for update conditions.
        onupdate: function(object) {
            var id, source, dest;
            if (object && object.update && object.update.condition) {
                if (evalCondition.call(object, object.update.condition)) {
                    this._update_objects(object.update.then);
                }
                else if (object.update.hasOwnProperty('else')){
                    this._update_objects(object.update.else);
                }
            }
        },
        //
        validate: function () {
            var i, obj;
            for (i in this.objects) {
                obj = this.objects[i];
                if (obj.is_shown() &&
                    (obj.is_required() || obj.has_value())) {
                    obj.validate();
                }
            }
        },
        // Render the collection to an array.
        render: function(force) {
            var i, obj, output = [];
            for (i in this.order) {
                obj = this.order[i];
                output = obj.render(output, force);
            }
            return output;
        },
        // PointCollection to Object.
        toObject: function() {
            return {};
        },
        // PointCollection from Object.
        fromObject: function(object) {
            var group, point, objClass, id, obj;

            this.label = object.label || '';

            // Parse groups in object.
            if (object.groups !== undefined) {
                for (id in object.groups) {
                    group = object.groups[id];
                    group.id = id;
                    group.collection = this;
                    this.objects[id] = new Group(group);
                }
            }

            // Parse points in object.
            if (object.points !== undefined) {
                for (id in object.points) {
                    point = object.points[id];
                    point.id = id;
                    point.collection = this;
                    point.groups = keys_to_objects(point.groups,
                                                        this.objects);

                    // Build and store the point.
                    if (point.type.startsWith('bool')) {
                        objClass = Bool;
                    }
                    else if (point.type.startsWith('int')) {
                        objClass = Int;
                    }
                    else if (point.type.startsWith('str')) {
                        objClass = Str;
                    }
                    else if (point.type.startsWith('float')) {
                        objClass = Float;
                    }
                    else {
                        throw "Expected `point.type` in ['bool', 'int', 'str', 'float']. Got " + point.type;
                    }

                    point = new objClass(point);
                    this.objects[id] = point;
                }
            }

            // Update order list with actual objects (groups or points).
            if (object.order !== undefined) {
                for (var i=0; i<object.order.length; i++) {
                    this.order.push(this.objects[object.order[i]]);
                }
            }

            // Update event targets.
            /*for (var i in this.objects) {
                obj = this.objects[i];
                if (obj.update) {
                    for (var t in obj.update.then) {
                        var then = obj.update.then[t];

                    }
                }
            }*/

        },
        // Output PointCollection's schema.
        toSchema: function(render) {
            var wlist, i, inobj, w, outobj = {}, tmpobj;

            render = render || this.render(true);
            wlist = ['id', 'type', 'label', 'min', 'max', 'required'];

            for (i in render) {
                inobj = render[i];
                tmpobj = {};
                for (w in wlist) {
                    if (inobj.hasOwnProperty(wlist[w])) {
                        tmpobj[wlist[w]] = inobj[wlist[w]];
                    }
                }
                outobj[inobj.id] = tmpobj;
            }

            return outobj;
        },
        // Output PointCollection as a Backbone Model.
        toModel: function(render) {
            if (Backbone !== undefined) {
                var Model, model, i;

                Model = Backbone.Model.extend({});
                model = new Model();

                render = render || this.render();

                for (i in render) {
                    model.set(render[i].id, render[i].get_value());
                }

                model.schema = this.toSchema(render);

                return model;
            }
            else {
                throw "PointCollection.toModel requires Backbone.";
            }
        }
    };

    var _PointCollection = _.extend({}, _methods, _defaults);
    _PointCollection.fromObject(opts);
    return _PointCollection;
};