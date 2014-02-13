// http://stackoverflow.com/a/646643
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
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
    while ((match = r.exec(string)) !== null) {
        string = string.splice(match.index, match[0].length, arguments[i+1]);
        i++;
    }
    return string;
}

// Custom Errors
// =============
// Likened and use similarly to pythons ValueError.
var ValueError = function (message) {
    this.name = "ValueError";
    this.message = (strf.apply(message, arguments) || "");
}
ValueError.prototype = new Error();

// When an argument or arguments for a method or function are invalid.
var ArgumentError = function (message) {
    this.name = "ArgumentError";
    this.message = (strf.apply(message, arguments) || "");
}
ArgumentError.prototype = new Error();

// Should be obvious, but when parent class method or prop is not implements.
NotImplementedError = function (message) {
    this.name = "NotImplementedError";
    this.message = (strf.apply(message, arguments) || "");
}
NotImplementedError.prototype = new Error();

// Validation failures use this Error.
var Invalid = function (message) {
    this.name = "Invalid";
    this.message = (strf.apply(message, arguments) || "");
}
Invalid.prototype = new Error();


// Data Point Base object.
// The bulk of the "Point" implementation is here.
var Point = function (opts) {
    // Priveleged methods.
    _.extend(this, {
        // Another simple string formater that accepts {tokens} to retrieve properties
        //  of the same name.
        // example:
        //  var obj = {
        //      thing: 'foo',
        //      whatis: 'bar'
        //  };
        //  ._parse_def(obj, 'My {thing} is {whatis}.')
        //  ==="My foo is bar.";
        _parse_def: function (string, escape) { // *tested! (decent coverage)
            var match,
                reToken = new RegExp('\{([a-zA-Z0-9]+)\}', 'g'),
                that = this;

            return string.replace(reToken, function(match, text) {
                var val = that[text];
                if (escape === true) {
                    if (typeof val === 'string') {
                        val = '"' + val + '"';
                    }
                }
                return val;
            });
        },
        // Parse incoming conditions, replacing tokens.
        _parse_condition: function(def) { // *tested (decent coverage)
            // handle "in"
            var in_split = def.split(' in ');
            if (in_split.length == 2) {
                def = in_split[1] + '.indexOf(' + in_split[0] + ') >= 0';
            }
            def = def.replace('True', 'true');
            def = def.replace('False', 'false');
            if (def.indexOf('===') < 0) {
                def = def.replace('==', '===');
            }
            return def;
        },
        // Determines whether to retreive a property from the group or from
        // this point. (Used for `show` and `required`).
        _group_or_point_property: function (property) { // *tested (decent coverage)
            if (this[property] === undefined || this[property] === null) {
                var value;
                for (var i=0; i<this._groups.length; i++) {
                    var group = this._groups[i];
                    value = value || group[property];
                }
                return value;
            }
            else {
                return this[property];
            }
        },
        // _internal: Do actual addition of group.
        _add_group: function (group) { // *tested (ok coverage)
            if (this._groups.indexOf(group) < 0) {
                this._groups.push(group);
            }
            else {
                throw new ValueError("This point (id: %s) is already in Group (id: %s).", this.id, group.id);
            }
        },
        // Do actual delete of group.
        _del_group: function (group) { // *tested (ok coverage)
            var i = this._groups.indexOf(group);
            if (i >= 0) {
                this._groups.splice(i, 1);
            }
            else {
                throw new ValueError("This point (id: %s) is not in Group (id: %s).", this.id, group.id);
            }
        },
        // Pack and return the schema of this DataPoint.
        _toSchema: function(whitelist, includeAll) { // *tested (ok coverage)
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
                    else {
                        // Do something?
                    }
                }
            }
            return outobj;
        },
    });

    this.init(opts);
};

// This ensures that any child classes will have new objects to consume.
//
// (One drawback of JS inheritence is the Parent 'constructor' is only
//  fired when creating the child class, not when instantiating. In
//  essence, this is the true constructor.)
Point.prototype.init = function (opts) { // needs tests??
    _.extend(this, {
        id: undefined,
        _show: undefined,
        _required: undefined,
        update: {},
        // View properties.
        _value: undefined,
        _label: undefined,
        _groups: [],
        _collection: {}
    }, opts);
    return this; // for convenience only.
}

// Public Properties...
// --------------------
//
Object.defineProperty(Point.prototype, 'show', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: function () {
        var value = this._group_or_point_property('_show');
        if (value === undefined) {
            return null;
        }
        else {
            return value;
        }
    },
    set: function (value) {
        this._show = Boolean(value);
    }
});

//
Object.defineProperty(Point.prototype, 'required', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: function () {
        var value = this._group_or_point_property('_required');
        if (value === undefined) {
            return null;
        }
        else {
            return value;
        }
    },
    set: function (value) {
        this._required = Boolean(value);
    }
});

// `value` property implementation.
// `value` returns the value.
// `value`, when set, will execute the .parseValue method and trigger the
//  iternal onupdate event.
Object.defineProperty(Point.prototype, 'value', { // tested! (decent coverage)
    enumerable : true,
    configurable : true,
    writeable: false,
    get: function () {
        if (this._value === undefined) {
            return null;
        } 
        else {
            return this._value;
        }
    },
    set: function (value) {
        value = this.parseValue(value);
        // Only if value has changed.
        if (value !== this._value) {
            this._value = value;
            this.onupdate(this);
        }
    }
});

// `label` property.
// `label` returns an expression-parsed representation of the label.
Object.defineProperty(Point.prototype, 'label', { // tested! (decent coverage)
    enumerable : true,
    configurable : true,
    writeable: false,
    get: function () {
        if (this._label === undefined) {
            return null;
        }
        else {
            return this._parse_def(this._label);
        }
    },
    set: function (value) {
        this._label = value;
    }
});

// `groups` property implementation.    
// `groups` returns simply the list of groups.
// `groups` may be set with an Array of group names, provided a `collection`
//  has been assigned. It may also be set with an Array of Group objects, or
//  a mix of the two.
Object.defineProperty(Point.prototype, 'groups', { // tested! (1/2 coverage)
    enumerable: true,
    configurable: true,
    get: function () {
        return this._groups;
    },
    set: function (groups) {
        // Validate and update groups.
        for (var i=0; i<groups.length; i++) {
            var group = groups[i];

            // Group item is a `Group` object.
            if (group instanceof Group) {
                this.add_group(group);
            } // Group item is a string key.
            else if (typeof group === "string" && this._collection.objects) {
                this.add_group(this._collection.objects[group]);
            }
            else {
                throw new AttributeError("Point.groups expected groups as array of Group objects or an array of string keys to `collection.objects`.");
            }
        }
    }
});

// `collection` property implementation.
// `collection` simply returns the collection assigned.
// `collection` may be set with a `PointCollection` object.
Object.defineProperty(Point.prototype, 'collection', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    set: function (collection) {
        if (collection instanceof PointCollection) {
            this._collection = collection;
        }
        else {
            throw new ValueError("Point.collection expected a `PointCollection` object.");
        }
    }
});

// Public Methods...
// =================
// Monkeypatch hasOwnProperty. It's not picking up custom properties in Chrome.
Point.prototype.hasOwnProperty = function (propName) { // tested! (1/2 coverage)
    // This will return false if a prop exists but it's value is undefined.
    // This behavior is fine for what we're doing here.
    return (({}).hasOwnProperty.call(this, propName) ||
                this[propName] !== undefined);
};

// Pass-through in the base class.
// (Check subclasses for actual implementations.)
Point.prototype.parseValue = function (value) { // tested! (decent coverage)
    //
    return value;
};

// Validate the object.
// (Implemented in sub-classe prototypes.)
Point.prototype.validate = function () { // tested! (full coverage)
    //
    throw new NotImplementedError("Point.validate is not implemented.");
};

// Evaluate condition.
Point.prototype.evaluate = function (condition) { // tested! (decent coverage)
    var statement = this._parse_condition(this._parse_def(condition, true));
    return eval(statement);
};

//
Point.prototype.toString = function () { // tested! (decent coverage)
    var id = this.id || ''
    return "Point(" + id + ")";
};

// Pack and return the schema of this DataPoint.
Point.prototype.toSchema = function (additional) { // tested! (some coverage)
    additional = additional || [];
    return this._toSchema(['id', 'type', '_label', 'required', '_required',
                            'update', 'show', '_show', 'groups'].concat(additional));
};

// Pack and return the schema as a Opts object.
// Should be called `toOpts`??
Point.prototype.toDef = function (schema, additional) { // tested! (little coverage)
    var outObj = {};
    schema = schema || this.toSchema(['value'].concat(additional));

    // Pack groups.
    schema['groups'] = [];
    for (var i in this.groups) {
        var group = this.groups[i];
        schema.groups.push(group.id);
    }

    delete schema.id;
    outObj[this.id] = schema;
    return outObj;
};

// Adhere to is_shown criteria. Returns schema and value.
Point.prototype.render = function (additional) { // tested! (some coverage)
    if (this.show === true) {
        additional = additional || [];
        return [this._toSchema(['id', 'type', 'label', 'value', 'groups'].concat(additional))];
    } 
    else {
        return [];
    }
}

Point.prototype.fromSchema = function (schema, collection) {
    // Temporarily not implemented.
    throw new NotImplementedError("Point.fromSchema is not implemented.");
};

// Add this 'point' to a group.
// @group   Group   Group object add the point to.
Point.prototype.add_group = function (group, collection) { // Implement collection search later.
    if (group instanceof Group) {
        this._add_group(group);
        group._add_point(this);
    }
    else {
        throw new ValueError("Point.add_group expected a Group object.");
    }
}

// Delete this 'point' from group.
Point.prototype.del_group = function (group, collection) { // Implement collection search later.
    if (group instanceof Group) {
        this._del_group(group);
        group._del_point(this, true);
    }
    else {
        throw new ValueError("Point.del_group expected a Group object.")
    }
}

// Onupdate event. Trigger Collection onupdate as well as the Group(s)
Point.prototype.onupdate = function () {
    // Run "onupdate" on the collection if present.
    if (this._collection.onupdate) {
        this._collection.onupdate(this);
    }
    // Run "onupdate" on any groups.
    for (var i in this._groups) {
        var group = this._groups[i];
        group.onupdate(this);
    }
};

// Int Point Type.
var Int = function (opts) {
    this.parent.init.call(this);
    _.extend(this, {
        type: 'int',
        value: 0,
        min: 0,
        max: -1,
    }, opts);
};

Int.prototype = new Point();
Int.prototype.constructor = Int;
Int.prototype.parent = Point.prototype;

Int.prototype.parseValue = function (value) { // tested! (decent coverage)
    return parseInt(value);
};

// Pack and return the schema of this Integer DataPoint.
Int.prototype.toSchema = function (additional) { // tested! (decent coverage)
    additional = additional || [];
    return this.parent.toSchema.call(this, ['min', 'max'].concat(additional));
};

Int.prototype.validate = function () { // tested! (decent coverage)
    if (typeof this.value === "number" &&
            this.value >= this.min &&
                (this.max < 0 || this.value <= this.max)) {
        return true;
    }
    else {
        throw new Invalid("Int value (" + this.value + ") did not validate.");
    }
};

// Str Point Type.
var Str = function (opts) {
    this.parent.init.call(this);
    _.extend(this, {
        type: 'str',
        value: '',
        min: 0,
        max: -1
    }, opts);
};

Str.prototype = new Point();
Str.prototype.constructor = Str;
Str.prototype.parent = Point.prototype;

Str.prototype.parseValue = function(value) {
    return String(value);
};

// Pack and return the schema of this Integer DataPoint.
Str.prototype.toSchema = function (additional) {
    additional = additional || [];
    return this.parent.toSchema.call(this, ['min', 'max'].concat(additional));
};

Str.prototype.validate = function () {
    if (typeof this.value === "string" &&
            this.value.length >= this.min &&
                (this.max < 0 || this.value.length <= this.max)) {
        return true;
    }
    else {
        throw new Invalid("Str value (" + this.value + ") did not validate. id:" + this.id);
    }
};

// Float Point Type.
var Float = function (opts) {
    this.parent.init.call(this);
    _.extend(this, {
        type: 'float',
        value: 0.0,
        min: 0,
        max: -1,
        precision: 4,
    }, opts);
};

Float.prototype = new Point();
Float.prototype.constructor = Float;
Float.prototype.parent = Point.prototype;

Float.prototype.parseValue = function (value) {
    return value.toFixed(this.precision);
}

// Pack and return the schema of this Float DataPoint.
Float.prototype.toSchema = function (additional) {
    additional = additional || [];
    return this.parent.toSchema.call(this, ['min', 'max',
                                        'precision'].concat(additional));
};

Float.prototype.validate = function () {
    if (typeof this.value === "number" &&
            this.value >= this.min &&
                (this.max < 0 || this.value <= this.max)) {
        return true;
    }
    else {
        throw new Invalid("Float value (" + this.value + ") did not validate.");
    }
};

// Bool Point Type;
var Bool = function (opts) {
    this.parent.init.call(this);
    _.extend(this, {
        type: 'bool',
        value: false
    }, opts);
};

Bool.prototype = new Point();
Bool.prototype.constructor = Bool;
Bool.prototype.parent = Point.prototype;

Bool.prototype.parseValue = function (value) {
    return Boolean(value);
};

Bool.prototype.toggle = function () {
    this.value = !this.value;
};

Bool.prototype.validate = function () {
    if (typeof this.value === "boolean") {
        return true;
    }
    else {
        throw new Invalid("Bool value(" + this.value + ") did not validate.");
    }
};

// List Point Type;
var List = function (opts) {
    this.parent.init.call(this);
    _.extend(this, {
        type: 'list',
        value: []
    }, opts);
}

List.prototype = new Point();
List.prototype.constructor = List;
List.prototype.parent = Point.prototype;

List.prototype.validate = function () {
    if (typeof this.value === "object" &&
            this.value.length !== undefined) {
        return true;
    }
    else {
        throw new Invalid("List!");
    }
};


var Group = function (opts) {
    _.extend(this, {
        //
        _add_point: function (point) { // tested (decent coverage)
            if (this.members.indexOf(point) < 0) {
                this.members.push(point);
            } 
            else {
                throw new ValueError("Group (id: %s) already has Point (id: %s) as a member", this.id, point.id);
            }
        },
        //
        _del_point: function (point) { // tested (decent coverage)
            var i = this.members.indexOf(point);
            if (i >= 0) {
                this.members.splice(i, 1);
            }
            else {
                throw new ValueError("Group (id: %s) doesn't have Point (id: %s) as a member.", this.id, point.id);
            }
        },
    });
    this.init(opts);
};

Group.prototype = new Point();
Group.prototype.constructor = Group;
Group.prototype.parent = Point.prototype;

// Public Properties...
// --------------------
Object.defineProperty(Group.prototype, 'members', { // tested (some coverage)
    enumerable: true,
    configurable: true,
    get: function () {
        return this._members;
    },
    set: function (members) {
        for (var i=0; i<members.length; i++) {
            var member = members[i];

            if(member instanceof Point) {
                this.add_point(member);
            }
            else if (typeof member === "string" && this._collection.objects) {
                this.add_point(this._collection.objects[member])
            }
            else {
                throw new AttributeError("Group.members expected an array of Point objects or an array of string keys to `collection.objects'.");
            }
        }
    }
});

//
Group.prototype.init = function (opts) {
    this.parent.init.call(this);
    _.extend(this, {
        radio: false, // all members must be bool. ?? why?
        show: false,
        required: false,
        _members: []
    }, opts);
    return this; // for convenience only.
}

// Pack and return the schema of this DataPoint.
Group.prototype.toSchema = function (additional) { // tested (some coverage)
    additional = additional || [];
    return this.parent.toSchema.call(this, ['radio'].concat(additional));
}

//
Group.prototype.render = function () { // tested (light coverage)
    if (this.show === true) {
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
};

// Pack and return the schema as a Definition object.
Group.prototype.toDef = function (schema, additional) { // tested (no coverage)
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
};

//
Group.prototype.validate = function () { // tested (light coverage)
    var i, member, val = false;
    for (i in this.members) {
        member = this.members[i];
        val = val || member.value;
        if (member.show &&
                (member.required || Boolean(member.value))) {
            member.validate();
        }
    }
    if (this.required && !val) {
        throw Invalid('Group: No values in group but group is required.');
    }
};

//
Group.prototype.add_point = function (point, collection) { // tested (decent coverage)
    if (point instanceof Point) {
        this._add_point(point);
        point._add_group(this);
    } 
    else {
        throw new ArgumentError('Group.add_point expected a `Point` object.');
    }
};
//
Group.prototype.del_point = function (point) { // tested (decent coverage)
    if (point instanceof Point) {
        this._del_point(point);
        point._del_group(this, true);
    }
    else {
        throw new ArgumentError('Group.del_point expected a `Point` object.');
    }
};
//
Group.prototype.onupdate = function (member) {
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

var PointCollection = function (opts) {

    var _defaults = {
        type: 'collection',
        name: '',
        objects: {},
        collections: {},
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
            // Deprecated "update" processing.
            if (object && object.update && object.update.condition) {
                if (object.evaluate(object.update.condition)) {
                    this._update_objects(object.update.then);
                }
                else if (object.update.hasOwnProperty('else')) {
                    this._update_objects(object.update.else);
                }
            }

            // '{value}==True': {'notes_no': 'show'}
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
                else if (point.type.startsWith('list')) {
                    point = new List(point);
                }
                else {
                    throw "Expected `point.type` in ['bool', 'int', 'str', 'float']. Got " + point.type;
                }
                this.objects[id] = point;
            }
        },
        addCollectionDefs: function (collections) {
            for (var id in collections) {
                var collection = collections[id];
                collection.id = id;
                this.objects[id] = collection
                //this.collections[id] = collection;
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
            if (object.collections !== undefined) {
                this.addCollectionDefs(object.collections);
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

    _.extend(this, _methods, _defaults);

    // `lockable` property.
    Object.defineProperty(this, 'lockable', {
        enumerable: true,
        configurable: true,
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
    Object.defineProperty(this, 'locked', {
        enumerable: true,
        configurable: true,
        get: function () {
            return this._locked;
        },
        set: function (value) {
            if (this.lockable) {
                this._locked = value;
                if (value !== true) {
                    this._locked = false;
                }
            }
            else {
                this._locked = false;
            }
        }
    });
};