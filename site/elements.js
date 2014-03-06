"use strict";
// Enable strict for everything. Other modules should be strict anyway or don't
// use them...

// TODO:
//  We need to wrap this whole mess in a priv func. (function () { })();
//
//  Enable for require.
//
//  Clean up the inheritance (helper functions.)
//      There is no difference from the .prototype and what's happening with
//      extend. Perhaps for compatibility, we remove _.extend completely and
//      implement a simple version that works for us.
//
//      Check if the "functional" approach here
//      http://davidshariff.com/blog/javascript-inheritance-patterns/
//      will work. Some of it works for me, some of it doesn't.
//
//  Use aliases for commonly used large names? (space saving)


// http://stackoverflow.com/a/105074
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
}
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
        for (var i=0; i<keys.length; i++) {
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
        id = obj._id || obj.id,
        outobj = {};
    delete obj.id,
            obj._id;

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
};

// return a null value if undefined. 
var coerceValue = function (value) {
    if (value === undefined) {
        return null;
    }
    else {
        return value;
    }
};

// Ordered Set-like `Array` implementation.
var ElementalArray = function (owner, array) {

    // "constructor"
    if (owner && owner instanceof Elemental) {
        this._owner = owner;
    }
    if (array && array instanceof Array) {
        // Add manually instead of `concat`.
        // This allows for `add` method to handle Elemental
        // vs just an Elemental id.
        for (var i=0; i<array.length; i++) {
            this.add(array[i]);
        }
        //this.concat(array);
    }
};

ElementalArray.prototype = new Array;
ElementalArray.prototype.constructor = ElementalArray;

ElementalArray.prototype.toArray = function () {
    return Array.prototype.slice.call(this);
};

// Instead of an array of Elementals, we get an array of
//  Elemental `id`s (References).
ElementalArray.prototype.toRef = function () {
    var refArray = [],
        array = this.toArray();

    for (var i=0; i<array.length; i++) {
        var item = array[i];
        if (item.id) {
            refArray.push(item.id);
        }
        else {
            throw new ValueError("`ElementalArray.toRef`: Item was expected to have an `id` property.");
        }
    }
    return refArray;
};

ElementalArray.prototype.add = function (item) {
    if (!(item instanceof Elemental)) {
        if (__singletonCollection.has(item)) {
            item = __singletonCollection.get(item);
        }
        else {
            throw new ValueError("ElementalArray.add: `item` argument was not an Elemental nor was it an id to an Elemental in the Collection.");
        }
    }

    if (this.indexOf(item) < 0) {
        this.push(item);
        if (this._owner) {
            this._owner._distillEvent('addElemental', item);
        }
        // More events?? Kludgy.
        if (this.onUpdate) {
            this.onUpdate(item);
        }
    } 
    else {
        throw new ValueError("Elemental._add: already " +
            "has %s as a member.", item.toString());
    }
};

ElementalArray.prototype.del = function (item) {
    if (!(item instanceof Elemental)) {
        if (__singletonCollection.has(item)) {
            item = __singletonCollection.get(item);
        }
        else {
            throw new ValueError("ElementalArray.del: `item` argument was not an Elemental nor was it an id to an Elemental in the Collection.");
        }
    }

    var i = this.indexOf(item);
    if (i >= 0) {
        this.splice(i, 1);
        if (this._owner)
            this._owner._distillEvent('delElemental', item);
        if (this.onUpdate)
            this.onUpdate(item);
    }
    else {
        throw new ValueError("Elemenetal._del: doesn't " +
            "have %s as a member.", item.toString());
    }
};

ElementalArray.prototype.move = function (item, toIdx) {
    var i = this.indexOf(item);
    if (i >= 0) {
        this.splice(i, 1);
        this.splice(toIdx, 0, item);
        if (this._owner)
            this._owner._distillEvent('moveElemental', item);
        if (this.onUpdate) {
            this.onUpdate(item);
        }
    }
    else {
        throw new ValueError("Elemental._move: %s is not a member.", item.toString());
    }
};


var Collection = function (opts) {
    this._init(opts);
};

Collection.prototype._init = function (opts) {
    _.extend(this, {
        _: {}
    }, opts);
    return this;
};

Collection.prototype.has = function (id) {
    if (this._.hasOwnProperty(id)) {
        return true;
    }
    return false;
};

Collection.prototype.get = function (id) {
    return this._[id];
};

Collection.prototype.add = function (elemental) {
    if (elemental && elemental instanceof Elemental) {
        this._[elemental.id] = elemental;
    }
    else {
        throw new ValueError("Collection.add: expected an Elemental.");
    }
};

Collection.prototype.del = function (elemental) {
    if (typeof elemental === "string") {
        if (this._.hasOwnProperty(elemental)) {
            delete this._[elemental];
            return;
        }
    }
    if (elemental instanceof Elemental) {
        for (ela in this._) {
            if (elemental === this._[ela]) {
                delete this._[ela];
                return;
            }
        }
    }
    throw new ValueError('Collection.del: Elemental was not found in the collection.');
};

// We're going to keep a singleton here to reference all elements.
// This is useful when we want to work with compact reference id lists.
//
// TODO: This idea will have to be further thought out. Perhaps different
//      collection contexts like I wanted before? (Singletons bug me.)
var __singletonCollection = new Collection();

// Base Class for everything. Very magical.
// TODO:
//      `id` should end up being blank or whatever the user implements and
//          NOT used for internal reference.
//
//      To ensure uniqueness:
//      `guid` should be an additionial property that is using our
//          random generators. Most likely the back end will assign it's own
//          guids so this is all temporary reference anyway.
var Elemental = function (opts, noInit) {
    _.extend(this, {
        /*
        //
        _addChild: function (child) {
            if (this._children.indexOf(child) < 0) {
                this._children.push(child);
                this._distillEvent('addElemental', child);
            } 
            else {
                throw new ValueError("Elemental._addChild: %s already " +
                    "has %s as a member.", this.toString(), child.toString());
            }
        },
        //
        _delChild: function (child) {
            var i = this._children.indexOf(child);
            if (i >= 0) {
                this._children.splice(i, 1);
                this._distillEvent('delElemental', child);
            }
            else {
                throw new ValueError("Elemenetal._delChild: %s doesn't " +
                    "have %s as a member.", this.toString(), child.toString());
            }
        },
        _moveChild: function (child, toIdx) {
            var i = this._children.indexOf(child);
            if (i >= 0) {
                this._children.splice(i, 1);
                this._children.splice(toIdx, 0, child);
                this._distillEvent('moveChild', child);
            }
            else {
                throw new ValueError("Elemental._movechild: %s is not a member.", child.toString());
            }
        },
        //
        _addParent: function (parent) {
            if (this._parents.indexOf(parent) < 0) {
                this._parents.push(parent);
                this._distillEvent('addElemental', parent);
            }
            else {
                throw new ValueError("Elemental._addParent: %s already " +
                    "has %s as a parent.", this.toString(), parent.toString());
            }
        },
        //
        _delParent: function (parent) {
            var i = this._parents.indexOf(parent);
            if (i >= 0) {
                this._parents.splice(i, 1);
                this._distillEvent('delElemental', parent);
            }
            else {
                throw new ValueError("Elemenetal._delParent: %s doesn't " +
                    "have %s as a parent.", this.toString(), parent.toString());
            }
        },*/
        // Another simple string formater that accepts {tokens} to retrieve properties
        //  of the same name.
        // example:
        //  var obj = {
        //      thing: 'foo',
        //      whatis: 'bar'
        //  };
        //  ._parseDef(obj, 'My {thing} is {whatis}.')
        //  ==="My foo is bar.";
        _parseDef: function (string, escape) {
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
        _parseCondition: function(def) {
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
                emptyFunc = missingFunc;
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
        _getProps: function(propList, includeAll) {
            propList = propList || ['id'];
            var outobj = {};
            for (var w in propList) {
                var propName = propList[w];
                var val = this._getProp(propName);
                if (val !== undefined && val !== null) {
                    outobj[propName] = val;
                }
            }
            return outobj;
        },
        // Attempt to get local property value. If null or undefined,
        // Then distill up through the parents for the property..
        _distillProp: function (key) { // *tested (decent coverage)
            var that = this;
            function getter(key) {
                var value,
                    i = 0;
                while(i < that._parents.length && !value) {
                    var parent = that._parents[i];
                    value = parent._distillProp(key);
                    i++;
                }
                return value;
            }
            return this._getProp(key, getter);
        },
        // Attempt to get local property value. If null or undefined,
        // Then percolate down through the children for the property.
        _percolateProp: function (key) {
            var that = this;
            function getter(key) {
                var value,
                    i = 0;
                while(i < that._children.length && !value) {
                    var child = that._children[i];
                    value = child._percolateProp(key);
                    i++;
                }
                return value;
            }
            return this._getProp(key, getter);
        },
        // Collects this object and its `parents` and distills them in to an
        // object.
        // TODO: Refactor this badly...
        _distillMap: function (func, additional) {
            var outObj = {},
                obj = {},
                parents = {ord: []},
                additional = additional || [],
                ia = additional.indexOf('id');

            // Strip out 'id' if there.
            if (ia >= 0) {
                additional = additional.splice(ia, 1);
            }

            for (var i=0; i<this._parents.length; i++) {
                var parent = this._parents[i],
                    percolation = parent._distillMap.apply(parent, arguments);
                if (!isEmpty(percolation)) {
                    parents.ord.push(percolation);
                    _.extend(parents, percolation);
                }
            }

            if (!isEmpty(parents.ord)) {
                obj.parents = parents;
            }

            outObj[this.id] = _.extend(obj, func.call(this, additional || []));
            return outObj;
        },
        _distillEvent: function (event) {
            for (var i=0; i<this._parents.length; i++) {
                var parent = this._parents[i];
                parent._distillEvent.apply(parent, arguments);
            }
            this._triggerEvent.apply(this, arguments);
        },
        // Collects this object and its `children` and percolates them in to an
        // object.
        _percolateMap: function (func, additional) {
            var outObj = {},
                obj = {},
                children = {ord: []},
                additional = additional || [],
                ia = additional.indexOf('id');

            // Strip out 'id' if there.
            if (ia >= 0) {
                additional = additional.splice(ia, 1);
            }

            for (var i=0; i<this._children.length; i++) {
                var child = this._children[i],
                    distillation = child._percolateMap.apply(child, arguments);
                
                if (!isEmpty(distillation)) {
                    children.ord.push(distillation);
                    _.extend(children, distillation);
                }
            }

            // Lets only add children if there are.
            if (!isEmpty(children.ord)) {
                obj.children = children;
            }

            return _.extend(obj, func.call(this, additional || []));
        },
    });
    
    if (noInit !== true)
        this._init(opts);
};

Elemental.sub = function () {
    return new Elemental({}, true);
};

Elemental.prototype._init = function (opts) {
    _.extend(this, {
        _type: 'elemental',
        _id: guid(),
        _label: undefined,
        _value: undefined,
        _show: undefined,
        _required: undefined,
        _lockable: false,
        _locked: false,
        _parents: new ElementalArray(this),
        _children: new ElementalArray(this),
        _events: {},
        _collection: {},
    }, opts);

    // Every Elemental gets its place in the Collection.
    // Tests on memory consumption should be done.
    __singletonCollection.add(this);

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
Elemental.prototype._idGetter = function () {
    return this._id;
};
// Set `id`. Reserve some namespaces.
Elemental.prototype._idSetter = function (value) {
    var reserved = ['ord'],
        i = reserved.indexOf(value);
    if (i >= 0) {
        throw new ValueError('Invalid value for Elemental.id; "' + reserved[i] + '".');
    }
    else {
        this._id = value || guid();
    }
};
Object.defineProperty(Elemental.prototype, 'id', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._idGetter,
    set: Elemental.prototype._idSetter
});

Elemental.prototype._typeSetter = function (value) {
    throw new ValueError('Cannot set Elemental.type.');
};
Elemental.prototype._typeGetter = function () {
    return this._type;
};
Object.defineProperty(Elemental.prototype, 'type', {
    enumerable: true,
    configurable: true,
    writeable: false,
    set: Elemental.prototype._typeSetter,
    get: Elemental.prototype._typeGetter
});

// `label` property.
// `label` returns an expression-parsed representation of the label.
Elemental.prototype._labelGetter = function () {
    //return this._getValue(this._label) &&
    //        this._parseDef(this._label);
    return this._label && this._parseDef(this._label);
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
// `value`, when set, will execute the ._setValue method and trigger the
//  iternal 'updateValue' event.
Elemental.prototype._valueGetter = function () {
    // Invoke subclass ._getValue.
    return this._getValue(this._value);
};
Elemental.prototype._valueSetter = Elemental._decConsistent(
    function (value) {
        // Invoke subclass ._setValue.
        value = this._setValue(value);
        // Only if value has changed.
        if (value !== this._value) {
            this._value = value;
            this._distillEvent('updateValue', this, value);
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
    return coerceValue(this._show);
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
    return coerceValue(this._required);
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
Elemental.prototype._collectionSetter = function (collection) {
    if (collection instanceof PointCollection ||
            _.isEqual(collection, {})) {
        this._collection = collection;
    }
    else {
        throw new ValueError("Point.collection expected a `PointCollection` object.");
    }
};
Object.defineProperty(Elemental.prototype, 'collection', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    set: Elemental.prototype._collectionSetter
});

// `lockable` property.
Elemental.prototype._lockableGetter = function () {
    return coerceValue(this._lockable);
};
Elemental.prototype._lockableSetter = function (value) {
    this._lockable = value;
    if (value !== true) {
        this._locked = false;
    }
};
Object.defineProperty(Elemental.prototype, 'lockable', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._lockableGetter,
    set: Elemental.prototype._lockableSetter
});

// `locked` property.
Elemental.prototype._lockedGetter = function () {
    return coerceValue(this._locked);
};
Elemental.prototype._lockedSetter = function (value) {
    if (this.lockable === true) {
        this._locked = value;
        if (value !== true) {
            this._locked = false;
        }
    }
    else {
        this._locked = false;
    }
};
Object.defineProperty(Elemental.prototype, 'locked', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._lockedGetter,
    set: Elemental.prototype._lockedSetter
});

// `events` property.
Elemental.prototype._eventsGetter = function () {
    return this._events;
};
Elemental.prototype._eventsSetter = function (events) {
    for (var key in events) {
        var event = events[key];
        if (typeof event !== "function") {
            throw new ValueError("`Elemental._eventsSetter` requires events object of event callbacks.");
        }
    }
    _.extend(this._events, events);
};
Object.defineProperty(Elemental.prototype, 'events', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._eventsGetter,
    set: Elemental.prototype._eventsSetter
});


// `children` property implementation.
Elemental.prototype._childrenGetter = function () {
    return this._children.toArray();
};
Elemental.prototype._childrenSetter = function (value) {
    // Validate the input `value`. Expects an Array of Elemental objects.
    this._children = new ElementalArray(this);
    for (var i=0; i<value.length; i++) {
        var child = value[i];
        this.addChild(child); // Invoking public??
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
    return this._parents.toArray();
};
Elemental.prototype._parentsSetter = function (value) {
    // Validate the input `value`. Expects an Array of Elemental objects.
    this._parents = new ElementalArray(this);
    for (var i=0; i<value.length; i++) {
        var parent = value[i];
        this.addParent(parent);
    }
};
Object.defineProperty(Elemental.prototype, 'parents', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Elemental.prototype._parentsGetter,
    set: Elemental.prototype._parentsSetter
});

Elemental.prototype._getValue = coerceValue;

// Pass-through in the base class.
// (Check subclasses for actual implementations.)
Elemental.prototype._setValue = function (value) { // tested! (decent coverage)
    return value;
};

// Pack and return the schema of this DataPoint.
// Schema is the definition of this elemental. Unmodified.
Elemental.prototype._toSchema = function (additional) { // tested! (some coverage)
    return this._getProps(['_id', '_type', '_label', '_show',
                            '_required'].concat(additional || []));
}; 

// Render if shown.
Elemental.prototype._toRender = function (additional) {
    if (this.show === true) {
        return pack(this._getProps(['id', 'type', 'label', 'required',
                                'value'].concat(additional || [])));
    }
    else {
        return {};
    }
};

Elemental.prototype._triggerEvent = function (event) {
    // TODO: Also handle event if value is string.
    //      Similarly to Backbone events, we use that string as a key
    //      to a property on the Elemental.
    if (this.events[event]) {
        this.events[event].apply(this, arguments);
    } // Do nothing if event doesn't exist??
};

var _lookupExc = function (funcName) {
    throw new ArgumentError(funcName + ": expected an Elemental object or a " + 
        "string key to `collection.objects`.");
}

// Add a child Elemental.
Elemental.prototype.addChild = function (child) {
    if(!(child instanceof Elemental)) {
        _lookupExc(".addChild");
    }
    else if (typeof child === "string" && this._collection) { // untested. might refactor.
        child = this._collection[child];
    }
    child._parents.add(this);
    //child._addParent(this);
    this._children.add(child);
    //this._addChild(child);
};

// Delete a child Elemental.
Elemental.prototype.delChild = function (child) {
    if (!(child instanceof Elemental)) {
        _lookupExc(".delChild");
    }
    else if (typeof child === "string" && this._collection) { // untested. might refactor.
        child = this._collection[child];
    }
    child._parents.del(this);
    this._children.del(child);
};

// Add a parent Elemental.
Elemental.prototype.addParent = function (parent) {
    if(!(parent instanceof Elemental)) {
        _lookupExc(".addParent");
    }
    else if (typeof parent === "string" && this._collection) {
        parent = this._collection[parent];
    }
    parent._children.add(this);
    this._parents.add(parent);
};

// Delete a parent Elemental.
Elemental.prototype.delParent = function (parent) {
    if(!(parent instanceof Elemental)) {
        _lookupExc(".delParent");
    }
    else if (typeof parent === "string" && this._collection) {
        parent = this._collection[parent];
    }
    parent._children.del(this);
    this._parents.del(parent);
};

// Destroy this Elemental.
Elemental.prototype.destroy = function () {
    // Instruct children of the destruction of this Elemental.
    for (var i=0; i<this._children.length; i++) {
        var child = this._children[i];
        child._delParent(this);
    }
    // Instruct parents of the destruction of this Elemental.
    for (var i=0; i<this._parents.length; i++) {
        var parent = this._parents[i];
        parent._delChild(this);
    }
    this._init(); // Simply _init the object.
};

// Validate the object.
// (Implemented in sub-class prototypes.)
Elemental.prototype.validate = function () { // tested! (full coverage)
    // throw new NotImplementedError("Elemental.validate is not implemented.");
    return true;
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
    var statement = this._parseCondition(this._parseDef(condition, true));
    return eval(statement);
};

//
Elemental.prototype.toString = function () { // tested! (decent coverage)
    var id = this.id || ''
    return "Elemental(" + id + ")";
};

// Pack and return the schema of this DataPoint.
Elemental.prototype.toSchema = function (additional) { // tested! (some coverage)
    return this._percolateMap(this._toSchema, additional || []);
};

// Map the Elemental.toRender through all children.
Elemental.prototype.toRender = function (additional) {
    return this._percolateMap(this._toRender, additional || []);
};

Elemental.prototype.fromSchema = function (schema, collection) {
    throw new NotImplementedError("Temporarily not implemented.");
};

// Data Point Base object.
// The bulk of the "Point" implementation is here.
var Point = function (opts, noInit) {
    if (noInit !== true)
        this._init(opts);
};

Point.prototype = Elemental.sub();
Point.prototype.constructor = Point;

Point.sub = function () {
    return new Point({}, true);
};

// This ensures that any child classes will have new objects to consume.
//
// (One drawback of JS inheritence is the Parent 'constructor' is only
//  fired when creating the child class, not when instantiating. In
//  essence, this is the true constructor.)
Point.prototype._init = function (opts) {
    Elemental.prototype._init.call(this);
    _.extend(this, {
        _type: 'point'
    }, opts);
    return this; // for convenience only.
};

// Public Properties...
// --------------------
//
// 
Point.prototype._showGetter = function () {
    return this._distillProp('_show');
    // ?? return Elemental.prototype._getValue.call(this, value);
};
Object.defineProperty(Point.prototype, 'show', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Point.prototype._showGetter,
    set: Elemental.prototype._showSetter
});

//
Point.prototype._requiredGetter = function () {
    return this._distillProp('_required');
    //?? return Elemental.prototype._getValue.call(this, value);
}
Object.defineProperty(Point.prototype, 'required', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Point.prototype._requiredGetter,
    set: Elemental.prototype._requiredSetter
});

//
Point.prototype._lockableGetter = function () {
    return this._distillProp('_lockable');
    //?? return Elemental.prototype._getValue.call(this, value);
};
Object.defineProperty(Point.prototype, 'required', { // tested! (decent coverage)
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Point.prototype._requiredGetter,
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

Point.prototype._toSchema = function (additional) {
    return Elemental.prototype._toSchema.call(this,
                                ['groups'].concat(additional || []));
};

Point.prototype._toRender = function (additional) {
    return Elemental.prototype._toRender.call(this, additional || []);
};


// Public Methods...
// =================
//
// Add this 'point' to a group.
// @group   Group   Group object add the point to.
Point.prototype.addGroup = function (group, collection) { // Implement collection search later.
    if (group instanceof Group) {
        this.addParent(group);
    }
    else {
        throw new ValueError("Point.addGroup: expected a Group object.");
    }
};

// Delete this 'point' from group.
Point.prototype.delGroup = function (group, collection) { // Implement collection search later.
    if (group instanceof Group) {
        this.delParent(group);
    }
    else {
        throw new ValueError("Point.delGroup: expected a Group object.")
    }
};

Point.prototype.toString = function () { // tested! (decent coverage)
    var id = this.id || '';
    return "Point(" + id + ")";
};

var Numeric = function (opts, noInit) {
    if (noInit !== true)
        this._init(opts);
};

Numeric.prototype = Point.sub();
Numeric.prototype.constructor = Numeric;

// Used by children of the Numeric proto.
Numeric.sub = function () {
    return new Numeric({}, true);
};

Numeric.prototype._init = function (opts) {
    Point.prototype._init.call(this);
    _.extend(this, {
        _type: 'numeric',
        _min: 0,
        _max: -1,
    }, opts);
};

Numeric.prototype._minGetter = function () {
    return this._min;
};
Numeric.prototype._minSetter = function (value) {
    if (value < 0) {
        this._min = 0;
    }
    else {
        this._min = value;
    }
};
Object.defineProperty(Numeric.prototype, 'min', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Numeric.prototype._minGetter,
    set: Numeric.prototype._minSetter
});

Numeric.prototype._maxGetter = function () {
    return this._max;
};
Numeric.prototype._maxSetter = function (value) {
    if (value < -1) {
        this._max = -1;
    }
    else {
        this._max = value;
    }
};
Object.defineProperty(Numeric.prototype, 'max', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Numeric.prototype._maxGetter,
    set: Numeric.prototype._maxSetter
});

// Pack and return the schema of this Integer DataPoint.
Numeric.prototype._toSchema = function (additional) { // tested! (decent coverage)
    return Point.prototype._toSchema.call(this,
                                    ['_min', '_max'].concat(additional || []));
};

// Pack and return the schema of this Integer DataPoint.
Numeric.prototype._toRender = function (additional) { // tested! (decent coverage)
    return Point.prototype._toRender.call(this,
                                    ['min', 'max'].concat(additional || []));
};

Numeric.prototype.validate = function () { // tested! (decent coverage)
    if (typeof this._value === "number" &&
            this._value >= this._min &&
                (this._max < 0 || this._value <= this._max)) {
        return true;
    }
    else {
        throw new Invalid("Numeric value (" + this._value + ") did not validate.");
    }
};


// Int Point Type.
var Int = function (opts) {
    Numeric.prototype._init.call(this);
    _.extend(this, {
        _type: 'int',
        value: 0,
    }, opts);
};

Int.prototype = Numeric.sub();
Int.prototype.constructor = Int;

Int.prototype._setValue = function (value) { // tested! (decent coverage)
    return parseInt(value);
};

// Float Point Type.
var Float = function (opts) {
    Numeric.prototype._init.call(this);
    _.extend(this, {
        _type: 'float',
        _value: 0.0,
        _precision: 6,
    }, opts);
};

Float.prototype = Numeric.sub();
Float.prototype.constructor = Float;

Float.prototype._precisionGetter = function () {
    return this._precision;
};
Float.prototype._precisionSetter = function (value) {
    if (value > 0) {
        this._precision = 0;
    }
    else {
        this._precision = value;
    }
};
Object.defineProperty(Float.prototype, 'precision', {
    enumerable: true,
    configurable: true,
    writeable: false,
    get: Float.prototype._precisionGetter,
    set: Float.prototype._precisionSetter
});

// Pack and return the schema of this Integer DataPoint.
Float.prototype._toSchema = function (additional) { // tested! (decent coverage)
    return Numeric.prototype._toSchema.call(this,
                                    ['_precision'].concat(additional || []));
};

// Pack and return the schema of this Integer DataPoint.
Float.prototype._toRender = function (additional) { // tested! (decent coverage)
    return Numeric.prototype._toRender.call(this,
                                    [].concat(additional || []));
};

//
Float.prototype._setValue = function (value) {
    return parseFloat(value);
};

//
Float.prototype._getValue = function (value) {
    return value.toPrecision(this.precision);
};


// Bool Point Type;
var Bool = function (opts) {
    Point.prototype._init.call(this);
    _.extend(this, {
        _type: 'bool',
        _value: false
    }, opts);
};

Bool.prototype = Point.sub();
Bool.prototype.constructor = Bool;

Bool.prototype._setValue = function (value) {
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

// Str Point Type.
var Str = function (opts) {
    Point.prototype._init.call(this);
    _.extend(this, {
        _type: 'str',
        _value: '',
        _min: 0,
        _max: -1
    }, opts);
};

Str.prototype = Point.sub();
Str.prototype.constructor = Str;

Object.defineProperty(Str.prototype, 'min', {
    enumerable: true,
    configurable: true,
    writeable: false,
    // Use Numerics min getter/setter. Identical code.
    get: Numeric.prototype._minGetter,
    set: Numeric.prototype._minSetter
});


Object.defineProperty(Str.prototype, 'max', {
    enumerable: true,
    configurable: true,
    writeable: false,
    // Use Numerics max getter/setter. Identical code.
    get: Numeric.prototype._maxGetter,
    set: Numeric.prototype._maxSetter
});

Str.prototype._setValue = function(value) {
    return String(value);
};

// Pack and return the schema of this Integer DataPoint.
Str.prototype.toSchema = function (additional) {
    return this._percolateMap(Point.prototype.toSchema,
                ['_min', '_max'].concat(additional || []));
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

// List Point Type;
var List = function (opts) {
    Point.prototype._init.call(this);
    _.extend(this, {
        _type: 'list',
        value: []
    }, opts);
};

List.prototype = Point.sub();
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
    this._init(opts);
};

Group.prototype = Elemental.sub();
Group.prototype.constructor = Group;

//
Group.prototype._init = function (opts) {
    Elemental.prototype._init.call(this);
    _.extend(this, {
        _type: 'group',
        radio: false, // all members must be bool. ?? why?
        show: false,
        required: false,
        events: {
            updateValue: function (ev, member) {
                // Check radio buttons.
                if (member._value && this.radio === true) { 
                    member._lock = true;
                    for (var i=0; i<this.members.length; i++) {
                        var mod_member = this.members[i];
                        if (mod_member._lock !== true) {
                            mod_member.value = false;
                        }
                    }
                    delete member._lock;
                }
            }
        }
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

// alias to addChild.
Group.prototype.addPoint = Elemental.prototype.addChild;

/*function (point) { // tested (decent coverage)
    if (point instanceof Point) {
        this._addChild(point);
        point._addParent(this);
    } 
    else {
        throw new ArgumentError('Group.addPoint expected a `Point` object.');
    }
};*/

// alias to delChild.
Group.prototype.delPoint = Elemental.prototype.delChild;

//
var PointCollection = function (opts) {
    this._init(opts);
};

PointCollection.prototype = Elemental.sub();
PointCollection.prototype.constructor = PointCollection;

PointCollection.prototype._init = function (opts) {
    Elemental.prototype._init.call(this);
    _.extend(this, {
        _type: 'collection',
        events: {
            // Event fired when a parent or child is added.
            addElemental: function (ev, el) {
                if (el instanceof Elemental) {
                    this._collection[el.id] = el;
                }
            },
            // Event fired when a parent or child is removed.
            delElemental: function (ev, el) {
                /*
                // We need to also check to see if this elemental is used elsewhere.
                if (el instanceof Elemental) {
                    delete this._collection[el.id];
                }*/ 
            }
        }
    }, opts);
    return this;
};


// Backbone plugin
// TODO: Move to separate file/namespace.
//          Do this when handling require-compatible packaging, etc.
if (Backbone && Backbone.VERSION) {

    // Dyanmically set up properties with Model persistence.
    // These properties were variables and now will go in to a
    // Backbone.Model for further persistence.
    var modelHookProp = function (propName, opts) {
        var privPropName = '_'+propName,
            getterName = privPropName+'Getter',
            setterName = privPropName+'Setter',
            tmpProp = this[propName];

        opts = _.extend({enumerable: true,
                        configurable: true,
                        writeable: false}, opts || {});

        // "Persist" the property in to the Model.
        // (This performs no API calls as we're just preparing for
        // persistence by putting the data in the Backbone.Model).
        var persistProp = function (propVal) {
            if (propVal instanceof ElementalArray) {
                this.set(propName, propVal.toRef());
            }
            else {
                this.set(propName, propVal);
            }
        };

        // Get the property from the Backbone.Model.
        var retreiveProp = function () {
            var propVal = this.get(propName),
                that = this;

            // Handle array "type".
            if (propVal && propVal instanceof Array) {
                var elementalArray = new ElementalArray(this, propVal);
                elementalArray.onUpdate = function () {
                    persistProp.call(that, this);
                };
                return elementalArray;
            }
            // Just a val.
            else if (propVal) {
                return propVal;
            }
            // No undefined returned from here.
            else {
                return null;
            }
        };

        this[getterName] = function () {
            console.log('getter');
            return retreiveProp.call(this);
        };
        this[setterName] = function (propVal) {
            console.log('setter');
            persistProp.call(this, propVal);
        };

        delete this[propName];

        Object.defineProperty(this, propName, _.extend({
            get: this[getterName],
            set: this[setterName]
        }, opts));

        // Let's set the property again.
        // This is wrong and buggy.
        // this[setterName](tmpProp);
    };

    var resetProp = function (propName, opts) {
        var tmpProp = this[propName];
        /*
        var getterName = propName+'Getter',
            setterName = propName+'Setter',
            Proto = Object.getPrototypeOf(this);
        */

        // This should just re-define the property with existing options.
        /*
        Object.defineProperty(this, propName, {
            get: this[getterName],
            set: this[setterName]
        });*/
        this.unset(propName);
        delete this[propName];
        this[propName] = tmpProp;
    }

    // Mix a Backbone.Model in to an Elemental instance.
    // Also mixes in Backbone.Events.
    //
    // `Model` argument is optional as `Backbone.Model` will be used if
    // undefined or not a `Backbone.Model` sub-proto.
    var mixElementalModel = function (elemental, Model) {
        var ElementalModel,
            ModelProto,
            // This allows us to mix in any Elemental sub-proto as well.
            ElementalProto = Object.getPrototypeOf(elemental);

        // I believe this is correct. Some simple tests seem to indicate
        // it is.
        if (Model && Backbone.Model.prototype.isPrototypeOf(Model.prototype)) {
            ElementalModel = Model;
        }
        else {
            ElementalModel = Backbone.Model;
        }

        ModelProto = ElementalModel.prototype;
        
        // Also cloning the elemental here.
        elemental = _.extend({}, elemental);

        _.extend(elemental, new ElementalModel);

        // We're using Backbone.Events since we know it's available.
        _.extend(elemental, Backbone.Events);

        // Extend `_triggerEvent` to include a Backbone.Event trigger as well. 
        elemental._triggerEvent = function (event) {
            ElementalProto._triggerEvent.apply(this, arguments);
            // Trigger backbone event as well since we may have subs.
            this.trigger(event);
        };

        // Handle methods that overlap between `Elemental` and
        // `Backbone.Model`. (Or other comonly used Backbone methods.)
        //
        // Extend `destroy` to fire both the Elemental destroy
        elemental.destroy = function () {
            ElementalProto.destroy.apply(this, arguments);
            ModelProto.destroy.apply(this, arguments);
        };

        elemental.validate = function () {
            // TODO: Will have to handle model validation later.
            // This method will have to be significantly
            // changed in order to handle errors thrown by Elemental.
            // This is gooood.
            var _ev = ModelProto.validate,
                modelValidate = _ev && _ev.apply(this, arguments),
                // Inverse because Backbone.Model validate requires
                // a "false" for valid whereas Elemental uses "true".
                elaValidate = !ElementalProto.validate.apply(this, arguments);
            return elaValidate;
        };

        // Use Backbone to store "private" data props.
        modelHookProp.call(elemental, '_id');
        modelHookProp.call(elemental, '_value');

        return elemental;
    };

    // Mix a Backbone.Model in with the Elemental instance Schema.
    var mixSchema = function (elemental) {
        elemental = mixElementalModel.apply(this, arguments);

        modelHookProp.call(elemental, '_label');
        modelHookProp.call(elemental, '_input');
        modelHookProp.call(elemental, '_show');
        modelHookProp.call(elemental, '_required');
        modelHookProp.call(elemental, '_lockable');
        modelHookProp.call(elemental, '_locked');
        modelHookProp.call(elemental, '_parents');
        modelHookProp.call(elemental, '_children');

        //resetProp.call(elemental, '_value');

        return elemental;
    };
}