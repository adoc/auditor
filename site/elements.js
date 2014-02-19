"use strict";
// Enable strict for everything. Other modules should be strict anyway or don't
// use them...

// http://stackoverflow.com/a/105074
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};
function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

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
};

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
};
ValueError.prototype = new Error();

// When an argument or arguments for a method or function are invalid.
var ArgumentError = function (message) {
    this.name = "ArgumentError";
    this.message = (strf.apply(message, arguments) || "");
};
ArgumentError.prototype = new Error();

// Should be obvious, but when parent class method or prop is not implements.
var NotImplementedError = function (message) {
    this.name = "NotImplementedError";
    this.message = (strf.apply(message, arguments) || "");
};
NotImplementedError.prototype = new Error();

// Validation failures use this Error.
var Invalid = function (message) {
    this.name = "Invalid";
    this.message = (strf.apply(message, arguments) || "");
};
Invalid.prototype = new Error();

var Inconsistent = function (message) {
    this.name = "Inconsistent";
    this.message = (strf.apply(message, arguments) || "");
};
Inconsistent.prototype = new Error();


var pack = function (inobj) {
    var obj = _.clone(inobj),
        id = obj.id,
        outobj = {};
    delete obj.id;
    outobj[id] = obj;
    return outobj;
};

var unpack = function (inobj) {
    var obj;
    for (var key in inobj) {
        if (obj) {
            throw new ValueError("unpack(inobj) expected single property object.");
        }
        obj = inobj[key];
        obj.id = key;
    }
    return obj;
}

// an Elemental Object. This is the serializable data component of a
//  single "Elemental"

// Nope
var ElementalObject = function (opts) {
    _.extend(this, {
        type: 'elemental',
        id: undefined,
        label: undefined,
        value: undefined,
        show: undefined,
        required: undefined,
        lockable: undefined,
        locked: undefined,
        parents: [],
        children: [],
        collection: undefined
    });
}


// Base Class for everything. Very magical.
var Elemental = function (opts) {
    _.extend(this, {
        //
        _add_child: function (child) { // tested (decent coverage)
            if (this._children.indexOf(child) < 0) {
                this._children.push(child);
            } 
            else {
                throw new ValueError("Elemental._add_child: %s already " +
                    "has %s as a member.", this.toString(), child.toString());
            }
        },
        //
        _del_child: function (child) { // tested (decent coverage)
            var i = this._children.indexOf(child);
            if (i >= 0) {
                this._children.splice(i, 1);
            }
            else {
                throw new ValueError("Elemenetal._del_child: %s doesn't " +
                    "have %s as a member.", this.toString(), child.toString());
            }
        },
        //
        _add_parent: function (parent) { // tested (decent coverage)
            if (this._parents.indexOf(parent) < 0) {
                this._parents.push(parent);
            }
            else {
                throw new ValueError("Elemental._add_parent: %s already " +
                    "has %s as a parent.", this.toString(), parent.toString());
            }
        },
        //
        _del_parent: function (parent) { // tested (decent coverage)
            var i = this._parents.indexOf(parent);
            if (i >= 0) {
                this._parents.splice(i, 1);
            }
            else {
                throw new ValueError("Elemenetal._del_parent: %s doesn't " +
                    "have %s as a parent.", this.toString(), parent.toString());
            }
        },
        // Get a property value.
        // Empty, missing or null values requires a `nullGetter` to return something.
        //
        //  Example implementation to return null on missing values:
        //      return e._getProp(key, function() { return null; });
        //
        // Throws ValueError if value is null and `nullGetter` isn't callable.
        // Throws ValueError if property is a function.
        _getProp: function (propKey, missing, empty) {
            var propVal = this[propKey],
                missingFunc,
                emptyFunc;

            if (typeof missing === "function") {
                missingFunc = missing;
            }
            else {
                missingFunc = function () { return missing; };
            }

            if (typeof empty === "function") {
                emptyFunc = empty;
            }
            else if (empty) {
                emptyFunc = function () { return empty; }
            }
            else {
                emptyFunc = missing;
            }

            // Property is missing or otherwise undefined.
            if (propVal === undefined) {
                return missingFunc.call(this, propKey);
            }
            // Property is null or empty.
            else if (propVal === null || isEmpty(propVal)) {
                return emptyFunc.call(this, propKey);
            }
            // Property is a function.
            else if (typeof propVal === "function") {
                throw new ValueError("Elemental._getProp: Property `" +
                                        propKey + "` is a function.");
            }
            // Propety should be a value value.
            else {
                return propVal;
            }
        },
        // Return this object properties from `propList` Array of property keys.
        _getProps: function(propList, includeAll) { // *tested (ok coverage)
            propList = propList || ['id'];
            var outobj = {};
            for (var w in propList) {
                var propName = propList[w];
                outobj[propName] = this._getProp(propName);
            }
            return outobj;
        },
        // Attempt to get local property value. If null or undefined,
        // Then distill up through the parents for the property..
        _distillProperty: function (key) { // *tested (decent coverage)
            var that = this;
            function getter(key) {
                var value,
                    i = 0;
                while(i < that._parents.length && !value) {
                    var parent = that._parents[i];
                    value = parent._distillProperty(key);
                    i++;
                }
                return value;
            }
            return this._getProp(key, getter);
        },
        // Attempt to get local property value. If null or undefined,
        // Then percolate down through the children for the property.
        _percolateProperty: function (key) {
            var that = this;
            function getter(key) {
                var value,
                    i = 0;
                while(i < that._children.length && !value) {
                    var child = that._children[i];
                    value = child._percolateProperty(key);
                    i++;
                }
                return value;
            }
            return this._getProp(key, getter);
        },
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
        // Collects `children` and distills them in to `obj`.
        _distill: function (additional) {
            var obj = {},
                children = {ord: []};
            
            for (var i=0; i<this._children.length; i++) {
                var child = this._children[i],
                    distillation = child._distill.apply(child, arguments);
                children.ord.push(distillation);
                children[child.id] = distillation;
            }

            obj.children = children;
            return _.extend(obj, this._getProps(additional || []));
        },
        // Collects `parents` and percolates them in to an object.
        _percolate: function (additional) {
            var obj = {},
                parents = {ord: []};
            for (i=0; i<this._parents.length; i++) {
                var parent = this._parents[i],
                    percolation = child._percolate.apply(parent, arguments);
                parents.ord.push(percolation);
                parents[parent.id] = percolation;
            }
            obj.parents = parents;
            return _.extend(obj, this._getProps(additional || []));
        }
    });
    
    this.init(opts);
};

Elemental.prototype.init = function (opts) {
    _.extend(this, {
        _type: 'elemental',
        _id: guid(),
        _label: undefined,
        _value: undefined,
        _show: undefined,
        _required: undefined,
        _lockable: false,
        _locked: false,
        _parents: [],
        _children: [],
        _collection: {},
    }, opts);

    this._props = ['_type', '_id', '_label', '_value', '_show', '_required',
                    '_lockable', '_locked'];

    return this;
};

// Decorator classmethod to check for varying levels of consistency.
Elemental._decConsistent = function (func, errMessage) { // tested (decent coverage)
    function exc() {
        throw new Inconsistent(errMessage || 'Inconsistent Error in Elemental._decConsistent.');
    }

    return function () {
        // Throw exception on locked Elemental.
        if (this._locked === true) {
            exc();
        }
        // Throw exception on show/required mismatch.
        else if (this._show === false && this._required === true) {
            exc();
        }
        else {
            return func.apply(this, arguments);
        }
    }
};

// Properties...
// -------------
Object.defineProperty(Elemental.prototype, 'id', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: function () {
        return this._id;
    },
    // Set `id`. Reserve some namespaces.
    set: function (value) {
        var reserved = ['ord'],
            i = reserved.indexOf(value);
        if (i >= 0) {
            throw ValueError('Invalid value for Elemental.id; "' + reserved[i] + '".');
        }
        else {
            this._id = value || guid();
        }
    }
});

Object.defineProperty(Elemental.prototype, 'type', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: function () {
        return this._type;
    }
});

// `label` property.
// `label` returns an expression-parsed representation of the label.
Elemental.prototype._labelGetter = function () {
    return this._prepValue(this._label) &&
            this._parse_def(this._label);
};
Elemental.prototype._labelSetter = Elemental._decConsistent(
    function (value) {
        this._label = value;
    }, "Elemental.label cannot be set because the Elemental is locked."
);
Object.defineProperty(Elemental.prototype, 'label', { // tested! (decent coverage)
    enumerable : true,
    configurable : true,
    writeable: false,
    get: Elemental.prototype._labelGetter,
    set: Elemental.prototype._labelSetter
});

// `value` property implementation.
// `value` returns the value.
// `value`, when set, will execute the ._parseValue method and trigger the
//  iternal onupdate event.
Elemental.prototype._valueGetter = function () {
    return this._prepValue(this._value);
};
Elemental.prototype._valueSetter = Elemental._decConsistent(
    function (value) {
        value = this._parseValue(value); // another way to do this??
        // Only if value has changed.
        if (value !== this._value) {
            this._value = value;
            this.onupdate(this);
        }
    }, "Elemental.value cannot be set, the Element is locked."
);
Object.defineProperty(Elemental.prototype, 'value', { // tested! (decent coverage)
    enumerable : true,
    configurable : true,
    writeable: false,
    get: Elemental.prototype._valueGetter,
    set: Elemental.prototype._valueSetter
});
//
Elemental.prototype._showGetter = function () {
    return this._prepValue(this._show);
};
Elemental.prototype._showSetter = Elemental._decConsistent(
    function (value) {
        this._show = Boolean(value);
    }, "Elemental.show cannot be set, the Element is locked."
);
Object.defineProperty(Elemental.prototype, 'show', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._showGetter,
    set: Elemental.prototype._showSetter
});

//
Elemental.prototype._requiredGetter = function () {
    return this._prepValue(this._required);
};
Elemental.prototype._requiredSetter = Elemental._decConsistent(
        function (value) {
            this._required = Boolean(value);
        }, "Elemental.required cannot be set, the Element is locked."
);
Object.defineProperty(Elemental.prototype, 'required', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._requiredGetter,
    set: Elemental.prototype._requiredSetter
});

// `collection` property implementation.
// `collection` simply returns the collection assigned.
// `collection` may be set with a `PointCollection` object.
Object.defineProperty(Elemental.prototype, 'collection', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    set: function (collection) {
        if (collection instanceof PointCollection || _.isEqual(collection, {})) {
            this._collection = collection;
        }
        else {
            throw new ValueError("Point.collection expected a `PointCollection` object.");
        }
    }
});

// `lockable` property.
Object.defineProperty(Elemental.prototype, 'lockable', {
    enumerable: true,
    configurable: true,
    writeable: false,
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
Object.defineProperty(Elemental.prototype, 'locked', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: function () {
        return this._locked;
    },
    set: function (value) {
        if (this.lockable === true) {
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

// `children` property implementation.
Elemental.prototype._childrenGetter = function () {
    return this._children;
};
Elemental.prototype._childrenSetter = function (value) {
    // Validate the input `value`. Expects an Array of Elemental objects.
    this._children = [];
    for (var i=0; i<value.length; i++) {
        var child = value[i];
        this.add_child(child);
    }
};
Object.defineProperty(Elemental.prototype, 'children', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._childrenGetter,
    set: Elemental.prototype._childrenSetter
});

// `parents` property implementation.
Elemental.prototype._parentsGetter = function () {
    return this._parents;
};
Elemental.prototype._parentsSetter = function (value) {
    // Validate the input `value`. Expects an Array of Elemental objects.
    this._parents = [];
    for (var i=0; i<value.length; i++) {
        var parent = value[i];
        this.add_parent(parent);
    }
};
Object.defineProperty(Elemental.prototype, 'parents', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._parentsGetter,
    set: Elemental.prototype._parentsSetter
});

Elemental.prototype._prepValue = function (value) {
    if (value === undefined) {
        return null;
    }
    else {
        return value;
    }
};

// Pass-through in the base class.
// (Check subclasses for actual implementations.)
Elemental.prototype._parseValue = function (value) { // tested! (decent coverage)
    return value;
};

var _lookupExc = function (funcName) {
    throw new AttributeError(funcName + ": expected an Elemental object or a " + 
        "string key to `collection.objects`.");
}

// Add a child Elemental.
Elemental.prototype.add_child = function (child) {
    if(!(child instanceof Elemental)) {
        _lookupExc(".add_child");
    }
    else if (typeof child === "string" && this._collection.objects) {
        child = this._collection.objects[child];
    }
    child._add_parent(this);
    this._add_child(child);
};

// Delete a child Elemental.
Elemental.prototype.del_child = function (child) {
    if (!(child instanceof Elemental)) {
        _lookupExc(".del_child");
    }
    else if (typeof child === "string" && this._collection.objects) {
        child = this._collection.objects[child];
    }
    child._del_parent(this);
    this._del_child(child);
};

// Add a parent Elemental.
Elemental.prototype.add_parent = function (parent) {
    if(!(parent instanceof Elemental)) {
        _lookupExc(".add_parent");
    }
    else if (typeof parent === "string" && this._collection.objects) {
        parent = this._collection.objects[parent];
    }
    parent._add_child(this);
    this._add_parent(parent);
};

// Delete a parent Elemental.
Elemental.prototype.del_parent = function (parent) {
    if(!(parent instanceof Elemental)) {
        _lookupExc(".del_parent");
    }
    else if (typeof parent === "string" && this._collection.objects) {
        parent = this._collection.objects[parent];
    }
    parent._del_child(this);
    this._del_parent(parent);
};

// Destroy this Elemental.
Elemental.prototype.destroy = function () {
    // Instruct children of the destruction of this Elemental.
    for (var i=0; i<this._children.length; i++) {
        var child = this._children[i];
        child._del_parent(this);
    }
    // Instruct parents of the destruction of this Elemental.
    for (var i=0; i<this._parents.length; i++) {
        var parent = this._parents[i];
        parent._del_child(this);
    }
    this.init(); // Simply init the object.
}

// Validate the object.
// (Implemented in sub-class prototypes.)
Elemental.prototype.validate = function () { // tested! (full coverage)
    throw new NotImplementedError("Elemental.validate is not implemented.");
};

// Monkeypatch hasOwnProperty. It's not picking up custom properties in Chrome.
Elemental.prototype.hasOwnProperty = function (propName) { // tested! (1/2 coverage)
    // This will return false if a prop exists but it's value is undefined.
    // This behavior is fine for what we're doing here.
    return (({}).hasOwnProperty.call(this, propName) ||
                this[propName] !== undefined);
};

// Evaluate condition.
Elemental.prototype.evaluate = function (condition) { // tested! (decent coverage)
    var statement = this._parse_condition(this._parse_def(condition, true));
    return eval(statement);
};

//
Elemental.prototype.toString = function () { // tested! (decent coverage)
    var id = this.id || ''
    return "Elemental(" + id + ")";
};

// Pack and return the schema of this DataPoint.
// Schema is the definition of this elemental. Unmodified.
Elemental.prototype.toSchema = function (additional) { // tested! (some coverage)
    additional = additional || [];
    return this._getProps(['_id', '_type', '_label', '_show', '_required'].concat(additional));
};

// Adhere to is_shown criteria. Returns schema and value.
Elemental.prototype.toRender = function (additional) { // tested! (some coverage)
    if (this.show === true) {
        return [this._getProps(['id', 'type', 'label', 'required', 'value'].concat(additional || []))];
    } 
    else {
        return [];
    }
};

// Initiate a render and distill upward through the chain.
Elemental.prototype.distill = function (additional) {
    if (this.show === true) {
        var thisobj = this._getProps(['id', 'type', 'label', 'required', 'value'].concat(additional || []));

    }
    else {
        return [];
    }
};

// Initiate a render and percolate downward through the chain.
Elemental.prototype.percolate = function (additional) {
    if (this.show === true) {

    }
    else {
        return [];
    }
};

Elemental.prototype.fromSchema = function (schema, collection) {
    throw new NotImplementedError("Temporarily not implemented.");
};

Elemental.prototype.onupdate = function () {
    // pass
};

// Data Point Base object.
// The bulk of the "Point" implementation is here.
var Point = function (opts) {
    this.init(opts);
};

Point.prototype = new Elemental();
Point.prototype.constructor = Point;

// This ensures that any child classes will have new objects to consume.
//
// (One drawback of JS inheritence is the Parent 'constructor' is only
//  fired when creating the child class, not when instantiating. In
//  essence, this is the true constructor.)
Point.prototype.init = function (opts) { // needs tests??
    Elemental.prototype.init.call(this);
    _.extend(this, {
        _type: 'point'
    }, opts);
    return this; // for convenience only.
};

// Public Properties...
// --------------------
//
Object.defineProperty(Point.prototype, 'show', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: function () {
        var value = this._distillProperty('_show');
        return Elemental.prototype._prepValue.call(this, value);
    },
    set: Elemental.prototype._showSetter
});

//
Object.defineProperty(Point.prototype, 'required', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: function () {
        var value = this._distillProperty('_required');
        return Elemental.prototype._prepValue.call(this, value);
    },
    set: Elemental.prototype._requiredSetter
});

// Synonym to Elemental.parents.
Object.defineProperty(Point.prototype, 'groups', { // tested
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._parentsGetter,
    set: Elemental.prototype._parentsSetter
});

// Public Methods...
// =================
//
Point.prototype.toString = function () { // tested! (decent coverage)
    var id = this.id || ''
    return "Point(" + id + ")";
};

// Pack and return the schema of this DataPoint.
Point.prototype.toSchema = function (additional) { // tested! (some coverage)
    additional = additional || [];
    return Elemental.prototype.toSchema.call(this, ['groups'].concat(additional));
};

// Pack and return the schema as a Opts object.
// What in the even fuck is this? and is it even needed???
// (I hate this function)
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

// Add this 'point' to a group.
// @group   Group   Group object add the point to.
Point.prototype.add_group = function (group, collection) { // Implement collection search later.
    if (group instanceof Group) {
        this.add_parent(group);
    }
    else {
        throw new ValueError("Point.add_group: expected a Group object.");
    }
};

// Delete this 'point' from group.
Point.prototype.del_group = function (group, collection) { // Implement collection search later.
    if (group instanceof Group) {
        this.del_parent(group);
    }
    else {
        throw new ValueError("Point.del_group: expected a Group object.")
    }
};

// Onupdate event. Trigger Collection onupdate as well as the Group(s)
Point.prototype.onupdate = function () {
    // Run "onupdate" on the collection if present.
    if (this._collection.onupdate) {
        this._collection.onupdate(this);
    }
    // Run "onupdate" on any groups.
    for (var i in this._parents) {
        var group = this._parents[i];
        group.onupdate(this);
    }
};

// Int Point Type.
var Int = function (opts) {
    Point.prototype.init.call(this);
    _.extend(this, {
        _type: 'int',
        value: 0,
        min: 0,
        max: -1,
    }, opts);
};

Int.prototype = new Point();
Int.prototype.constructor = Int;

Int.prototype._parseValue = function (value) { // tested! (decent coverage)
    return parseInt(value);
};

// Pack and return the schema of this Integer DataPoint.
Int.prototype.toSchema = function (additional) { // tested! (decent coverage)
    additional = additional || [];
    return Point.prototype.toSchema.call(this, ['min', 'max'].concat(additional));
};

Int.prototype.validate = function () { // tested! (decent coverage)
    if (typeof this._value === "number" &&
            this._value >= this.min &&
                (this.max < 0 || this._value <= this.max)) {
        return true;
    }
    else {
        throw new Invalid("Int value (" + this._value + ") did not validate.");
    }
};

// Str Point Type.
var Str = function (opts) {
    Point.prototype.init.call(this);
    _.extend(this, {
        _type: 'str',
        value: '',
        min: 0,
        max: -1
    }, opts);
};

Str.prototype = new Point();
Str.prototype.constructor = Str;

Str.prototype._parseValue = function(value) {
    return String(value);
};

// Pack and return the schema of this Integer DataPoint.
Str.prototype.toSchema = function (additional) {
    additional = additional || [];
    return Point.prototype.toSchema.call(this, ['min', 'max'].concat(additional));
};

Str.prototype.validate = function () {
    if (typeof this._value === "string" &&
            this._value.length >= this.min &&
                (this.max < 0 || this._value.length <= this.max)) {
        return true;
    }
    else {
        throw new Invalid("Str value (" + this._value + ") did not validate. id:" + this.id);
    }
};

// Float Point Type.
var Float = function (opts) {
    Point.prototype.init.call(this);
    _.extend(this, {
        _type: 'float',
        value: 0.0,
        min: 0,
        max: -1,
        precision: 6,
    }, opts);
};

Float.prototype = new Point();
Float.prototype.constructor = Float;

Float.prototype._parseValue = function (value) {
    return parseFloat(value);
};

Float.prototype._prepValue = function (value) {
    return value.toPrecision(this.precision);
};

// Pack and return the schema of this Float DataPoint.
Float.prototype.toSchema = function (additional) {
    additional = additional || [];
    return Point.prototype.toSchema.call(this, ['min', 'max',
                                        'precision'].concat(additional));
};

Float.prototype.validate = function () {
    if (typeof this._value === "number" &&
            this._value >= this.min &&
                (this.max < 0 || this._value <= this.max)) {
        return true;
    }
    else {
        throw new Invalid("Float value (" + this._value + ") did not validate.");
    }
};

// Bool Point Type;
var Bool = function (opts) {
    Point.prototype.init.call(this);
    _.extend(this, {
        _type: 'bool',
        value: false
    }, opts);
};

Bool.prototype = new Point();
Bool.prototype.constructor = Bool;

Bool.prototype._parseValue = function (value) {
    return Boolean(value);
};

Bool.prototype.toggle = function () {
    this.value = !this._value;
};

Bool.prototype.validate = function () {
    if (typeof this._value === "boolean") {
        return true;
    }
    else {
        throw new Invalid("Bool value(" + this._value + ") did not validate.");
    }
};

// List Point Type;
var List = function (opts) {
    Point.prototype.init.call(this);
    _.extend(this, {
        _type: 'list',
        value: []
    }, opts);
};

List.prototype = new Point();
List.prototype.constructor = List;

List.prototype.validate = function () {
    if (typeof this.value === "object" &&
            this.value.length !== undefined) {
        return true;
    }
    else {
        throw new Invalid("List!");
    }
};

//
var Group = function (opts) {
    _.extend(this, {

    });
    this.init(opts);
};

Group.prototype = new Elemental();
Group.prototype.constructor = Group;

//
Group.prototype.init = function (opts) {
    Elemental.prototype.init.call(this);
    _.extend(this, {
        _type: 'group',
        radio: false, // all members must be bool. ?? why?
        show: false,
        required: false
    }, opts);
    return this; // for convenience only.
};

// Public Properties...
// --------------------
Object.defineProperty(Group.prototype, 'members', { // tested (some coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._childrenGetter,
    set: Elemental.prototype._childrenSetter
});

// Pack and return the schema of this DataPoint.
Group.prototype.toSchema = function (additional) { // tested (some coverage)
    additional = additional || [];
    return Elemental.prototype.toSchema.call(this, ['radio'].concat(additional));
};

//
Group.prototype.toRender = function () { // tested (light coverage)
    if (this.show === true) {
        var output = [];
        for (i=0; i<this.members.length; i++) {
            var member = this.members[i];
            output = output.concat(member.toRender());
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
        this._add_child(point);
        point._add_parent(this);
    } 
    else {
        throw new ArgumentError('Group.add_point expected a `Point` object.');
    }
};
//
Group.prototype.del_point = function (point) { // tested (decent coverage)
    if (point instanceof Point) {
        this._del_child(point);
        point._del_parent(this, true);
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

    this.init(opts)
};

PointCollection.prototype = new Elemental();
PointCollection.prototype.constructor = PointCollection;

PointCollection.prototype.init = function (opts) {
    Elemental.prototype.init.call(this);
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