// http://stackoverflow.com/a/646643
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

// Deprecated.
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
    // replce with toFixed(precision)
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

// modified from: http://stackoverflow.com/a/4994244
var isEmpty = function(obj) {
    // null and undefined are "empty"
    if (obj == null) return true;
    if (typeof obj === "object") {
        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length > 0)
            return false;
        if (obj.length === 0)
            return true;
        // Otherwise, does it have any properties of its own?
        // Note that obj doesn't handle
        // toString and toValue enumeration bugs in IE < 9
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }
        return true;
    }
}

// http://stackoverflow.com/a/4314050
String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};

// String formating. Similar operation to python string formatting.
// (Only %s implemented).
function strf(string) {
    var match,
        i=0,
        r = /%s/g;
    while ((match = r.exec(string)) != null) {
        string = string.splice(match.index, match[0].length, arguments[i+1]);
        i++;
    }
    return string;
}

// Custom Errors
// =============
// Likened and use similarly to pythons ValueError.
function ValueError(message) {
    this.name = "ValueError";
    this.message = (strf.apply(message, arguments) || "");
}
ValueError.prototype = new Error();


function ArgumentError(message) {
    this.name = "ArgumentError";
    this.message = (strf.apply(message, arguments) || "");
}
ArgumentError.prototype = new Error();


// Common Functions
// ================

var toSchema = function(whitelist, includeAll) {
    var outobj = {};
    
    if (!whitelist) {
        throw new ArgumentError("toSchema requires a `whitelist` of property names.");
    }

    for (var w in whitelist) {
        if (this.hasOwnProperty(whitelist[w])) {
            var propVal = this[whitelist[w]];
            if (includeAll || (propVal !== undefined && isEmpty(propVal) !== true)) {
                outobj[whitelist[w]] = propVal;
            }
        }
    }

    return outobj;
};


// Data Point Base object.
// The bulk of the "Point" implementation is here.
var Point = function (opts) {
    var _Point, 
        _defaults,
        _methods;

    opts = opts || {};

    _defaults = {
        id: undefined,  
        required: undefined,
        update: {},

        // View properties.
        show: undefined,

        // Reference properties.
        groups: [],
        collection: {},

        // Private properties
        _label: undefined,
        _value: undefined
    }

    _methods = {
        // Pass-through in the base class.
        // (Check subclasses for actual implementations.)
        _parse_value: function (value) {
            return value;
        },
        // Parse incoming definitions, replacing tokens.
        _parse_def: function(def) {
            def = def.replace('{value}', this._value);
            def = def.replace('{min}', this.min);
            def = def.replace('{max}', this.max);
            return def;
        },
        // Parse incoming conditions, replacing tokens.
        _parse_condition: function(def) {
            def = def.replace('True', 'true');
            def = def.replace('False', 'false');
            def = def.replace('==', '===');
            return def;
        },
        // Determines whether to retreive a property from the group or from
        // this point. (Used for `show` and `required`).
        _group_or_point_property: function (property) {
            if (this[property] === undefined) {
                var value = false;
                for (i in this.groups) {
                    var group = this.groups[i];
                    value = value || group[property];
                }
                return value;
            }
            else {
                return this[property];
            }
        },
        // _internal: Do actual addition of group.
        _add_group: function (group) {
            if (this.groups.indexOf(group) < 0) {
                this.groups.push(group);
            }
            else {
                throw new ValueError("This point (id: %s) is already in Group (id: %s).", this.id, group.id);
            }
        },
        // Do actual delete of group.
        _del_group: function (group) {
            var i = this.groups.indexOf(group);
            if (i >= 0) {
                this.groups.splice(i, 1);
            }
            else {
                throw new ValueError("This point (id: %s) is not in Group (id: %s).", this.id, group.id);
            }
        },
        // Pack and return the schema of this DataPoint.
        _toSchema: function (additional) {
            additional = additional || [];
            return toSchema.call(this, ['id'].concat(additional));
        },
        // Add this 'point' to a group.
        // @group   Group   Group object add the point to.
        add_group: function (group) {
            this._add_group(group);
            group._add_point(this);
        },
        // Delete this 'point' from group.
        del_group: function (group) {
            this._del_group(group);
            group._del_point(this, true);
        },
        //
        validate: function () {
            return false;
        },
        // Adhere to is_shown criteria. Returns schema and value.
        render: function (output) {
            if (this.is_shown() === true) {
                return [this._toSchema(['value', 'groups', 'type', 'label', 'min', 'max'])];
            } 
            else {
                return [];
            }
        },
        // Pack and return the schema of this DataPoint.
        toSchema: function (additional) {
            return this._toSchema(['type', 'groups', '_label', 'min', 'max', 'required', 'update', 'show']);
        },
        // Pack and return the schema as a Definition object.
        toDef: function (schema, additional) {
            var outObj = {};
            schema = schema || this.toSchema(additional);

            // Pack groups.
            schema['groups'] = [];
            for (var i in this.groups) {
                var group = this.groups[i];
                schema.groups.push(group.id);
            }

            delete schema.id;
            outObj[this.id] = schema;
            return outObj;
        },
        //
        fromSchema: function () {
        // Definitely implement this!!!! Replaces some stuff Collection is doing.
        },
        fromDef: function () {
        // Yess!!!
        },
        // Maybe turn these in to properties.
        // Is this Point shown?
        is_shown: function () {
            return this._group_or_point_property('show');
        },
        // Is a value on this point required?
        is_required: function () {
            return this._group_or_point_property('required');
        },
        // Does this point have a value? (This can porbably be removed.)
        has_value: function () {
            return Boolean(this.value);
        },
        // Events
        // ======
        // Onupdate event. Trigger Collection onupdate as well as the Group(s)
        onupdate: function () {
            // Run "onupdate" on the collection if present.
            if (this.collection.onupdate) {
                this.collection.onupdate(this);
            }
            // Run "onupdate" on any groups.
            for (var i in this.groups) {
                var group = this.groups[i];
                group.onupdate(this);
            }
        }
    };

    _Point = _.extend({}, _methods, _defaults);

    // Properties
    // ==========
    // `value` property. 
    Object.defineProperty(_Point, 'value', {
        enumerable : true,
        configurable : true,
        get: function () {
            return this._value;
        },
        set: function (value) {
            value = this._parse_value(value);
            // Only if value has changed.
            if (value != this._value) {
                this._value = value;
                this.onupdate();
            }
        }
    });

    // `label` property.
    Object.defineProperty(_Point, 'label', {
        enumerable : true,
        configurable : true,
        get: function () {
            if (this._label !== undefined) {
                return this._parse_def(this._label);
            }
        },
        set: function (value) {
            this._label = value;
        }
    });

    // Validate and update groups.
    for (var i in opts.groups) {
        var group = opts.groups[i];

        if (group.id !== undefined) {
            _Point.add_group(group);
        }
        else {
            throw "_Point.initialize: this.groups; Expected groups as array of objects.";
        }
    }

    // Bring in `value` separately from extend.
    if (opts.value !== undefined) {
        _Point.value = opts.value;
        delete opts.value;
    }

    // Bring in `label` separately from extend.
    if (opts.label !== undefined) {
        _Point.label = opts.label;
        delete opts.label;
    }
 
    return _.extend(_Point, opts);
};

var Int = function (opts) {
    var _defaults = {
        value: 0,
        min: 0,
        max: -1,
        _parse_value: function(value) {
            return parseInt(value);
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

    var _Int = _.extend({}, Point(), _defaults, opts);
    return _Int.initialize(opts);
};

var Str = function (opts) {
    var _defaults = {
        value: '',
        min: 0,
        max: -1,
        _parse_value: function(value) {
            return String(value);
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

    return Point(_.extend({}, _defaults, opts));
};

var Float = function (opts) {
    var _defaults = {
        value: 0.0,
        min: 0,
        max: -1,
        precision: 4,
        _parse_value: function(value) {
            return precise(value, this.precision);
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

    var _Float = _.extend({}, Point(), _defaults, opts);
    return _Float.initialize(opts);
};

var Bool = function (opts) {
    var _defaults = {
        value: false,
        toggle: function() {
            this.value = !this.value;
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
    return Point(_.extend({}, _defaults, opts));
};

var Group = function (opts) {
    var _defaults,
        _methods;

    _defaults = {
        id: null,
        radio: false, // all members must be bool.
        show: false,
        required: false,
        members: [],
        collection: {}
    };

    _methods = {
        //
        _add_point: function (point) {
            if (this.members.indexOf(point) < 0) {
                this.members.push(point);
            } 
            else {
                throw new ValueError("Group (id: %s) already has Point (id: %s) as a member", this.id, point.id);
            }
        },
        //
        _del_point: function (point) {
            var i = this.members.indexOf(point);
            if (i >= 0) {
                this.members.splice(i, 1);
            }
            else {
                throw new ValueError("Group (id: %s) doesn't have Point (id: %s) as a member.", this.id, point.id);
            }
        },
        // Pack and return the schema of this DataPoint.
        _toSchema: function (additional) {
            additional = additional || [];
            var whitelist = ['id'].concat(additional);
            return toSchema.call(this, whitelist);
        },
        //
        add_point: function (point) {
            this._add_point(point);
            point._add_group(this);
        },
        //
        del_point: function (point) {
            this._del_point(point);
            point._del_group(this, true);
        },
        //
        onupdate: function (member) {
            var mod_member;
            // Check radio buttons.
            if (member._value && this.radio === true) { 
                member._lock = true;
                for (i=0; i<this.members.length; i++) {
                    mod_member = this.members[i];
                    if (mod_member._lock !== true) {
                        mod_member.value = false;
                    }
                }
                delete member._lock;
            }
        },
        //
        validate: function () {
            var i, member, val = false;
            for (i in this.members) {
                member = this.members[i];
                val = val || member.value;
                if (member.is_shown() &&
                        (member.is_required() || member.has_value())) {
                    member.validate();
                }
            }
            if (this.is_required() && !val) {
                throw ['Invalid.Group', 'No values in group but group is required.'];
            }
        },
        //
        render: function () {
            if (this.is_shown() === true) {
                var output = [];
                for (i=0; i<this.members.length; i++) {
                    var member = this.members[i];
                    output = output.concat(member.render());
                }
                return output;
            } 
            else {
                return [];
            }
        },
        // Pack and return the schema of this DataPoint.
        toSchema: function (additional) {
            return this._toSchema(['label', 'show', 'required', 'update', 'radio'])
        },
        // Pack and return the schema as a Definition object.
        toDef: function (schema, additional) {
            var outObj = {};
            schema = schema || this.toSchema(additional);

            // Pack groups.
            schema['groups'] = [];
            for (var i in this.groups) {
                var group = this.groups[i];
                schema.groups.push(group.id);
            }

            delete schema.id;
            outObj[this.id] = schema;
            return outObj;
        },
        //
        is_shown: function () {
            if (this.show === undefined) {
                return false;
            } 
            else {
                return this.show;
            }
        },
        //
        is_required: function() {
            if (this.required === undefined) {
                return false;
            }
            else {
                return this.required;
            }
        },
        //
        has_value: function () {
            return true;
        },
    };
    return _.extend({}, _defaults, _methods, opts);
};

var PointCollection = function (opts) {

    var _defaults = {
        name: '',
        objects: {},
        order: [],
        _lockable: false,
        _locked: false
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
            // Refactor this.
            var i, obj;
            for (i in this.objects) {
                obj = this.objects[i];
                if (obj.is_shown() &&
                    (obj.is_required() || obj.has_value())) {
                    obj.validate();
                }
            }
        },
        // Group definitions to Group objects.
        // @param   groups  Array   Group definitions.
        addGroupDefs: function (groups) {
            for (id in groups) {
                var group = groups[id];
                group.id = id;
                group.collection = this;
                this.objects[id] = new Group(group);
            }
        },
        // Point definitions to Point objects.
        // @param   points  Array   Point definitions.
        addPointDefs: function (points) {
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
                else {
                    throw "Expected `point.type` in ['bool', 'int', 'str', 'float']. Got " + point.type;
                }
                this.objects[id] = point;
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
                this.addGroupDefs(object.groups);
            }
            // Parse points in object.
            if (object.points !== undefined) {
                this.addPointDefs(object.points);
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
        render: function() {
            var output = [];
            for (var i in this.order) {
                var obj = this.order[i];
                output = output.concat(obj.render());
            }
            return output;
        },
        // Output PointCollection's schema.
        toSchema: function(render) {
            var outobj = {};
            for (var i in this.order) {
                var obj = this.order[i];
                outobj[obj.id] = obj.toSchema();
            }
            return outobj;
        },
        // Output PointCollection as a Backbone Model.
        toModel: function(render) {
            if (Backbone !== undefined) {
                var Model = Backbone.Model.extend({}),
                    model = new Model();
                model.render = render = render || this.render();
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
    };
    _PointCollection = _.extend({}, _methods, _defaults);

    // `lockable` property.
    Object.defineProperty(_PointCollection, 'lockable', {
        enumerable : true,
        configurable : true,
        get: function () {
            return this._lockable;
        },
        set: function (value) {
            this._lockable = value;
            if (value !== true) {
                this._locked = false;
            }
        }
    });

    // `locked` property.
    Object.defineProperty(_PointCollection, 'locked', {
        enumerable : true,
        configurable : true,
        get: function () {
            return this._locked;
        },
        set: function (value) {
            if (this.lockable) {
                this._locked = value;
            }
            else {
                this._locked = false;
            }
        }
    });

    return _PointCollection;
};