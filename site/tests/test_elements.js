define(['qunit', 'elements'],
    function () { return {
        run: function () {
            // Unit tests...
            // =============
            // (Functional tests should go in another module??)

            test("func: pack()...", function () {
                var obj = {id: 'object'};
                deepEqual(pack(obj), {'object': {}});

                var obj = {id: 'object', 'val': 'this'};
                deepEqual(pack(obj), {'object': {val: 'this'}});

                var obj = {val: 100, id: 'object', mine: {another:'object!'}};
                deepEqual(pack(obj), {'object': {val: 100, mine: {another: 'object!'}}});
            });

            test("func: unpack()...", function () {
                var obj = {'object': {}};
                deepEqual(unpack(obj), {id: 'object'});

                var obj = {'object': {val: 'this'}};
                deepEqual(unpack(obj), {id: 'object', 'val': 'this'});

                var obj = {'object': {val: 100, mine: {another: 'object!'}}};
                deepEqual(unpack(obj), {val: 100, id: 'object', mine: {another:'object!'}});

                var obj = {'object': {}, 'whatdo_object': 'ohnoes'};
                throws(function () { unpack(obj); }, ValueError)
            });

            // Element...
            test("Constructor: `Elemental`...", function () {
                var e = new Elemental();
                deepEqual(e.id.length, 36);
                deepEqual(e.type, 'elemental');
                deepEqual(e._required, undefined);
                deepEqual(e.required, null);
                deepEqual(e._show, undefined);
                deepEqual(e.show, null);
                deepEqual(Boolean(e._value), false);
                deepEqual(Boolean(e.value), false);
                deepEqual(e._collection, {});

                var e = new Elemental({value: '123'});
                deepEqual(e.value, '123');
                var e = new Elemental({value: 123});
                deepEqual(e.value, 123);
                var e = new Elemental({value: true});
                deepEqual(e.value, true);
                var e = new Elemental({value: 123.123, show: true, label: 'this'});
                deepEqual(e.value, 123.123);
                deepEqual(e.show, true);
                deepEqual(e.label, 'this');
            });

            // Test Class Methods
            test("...class method: `Elemental._decConsistent`...", function () {
                function _consistentFunction() {
                    this.dummy = 'Uh oh we did something';
                }

                var e = new Elemental({lockable: true, locked: true});
                consistentFunction = Elemental._decConsistent(_consistentFunction, 'Nope, its locked');
                throws(function () { consistentFunction.call(e); } , Inconsistent);

                var e = new Elemental();
                consistentFunction = Elemental._decConsistent(_consistentFunction, 'Nope, its locked');
                consistentFunction.call(e);
                deepEqual(e.dummy, 'Uh oh we did something');
            });
            
            // Test Private Methods
            test("...priv method: `Elemental._add_child`...", function () {
                var g1 = new Elemental(),
                    p1 = new Elemental();
                g1._add_child(p1);
                deepEqual(g1.children[0], p1);
                throws(function () { g1._add_child(p1); }, ValueError);
            });
            
            test("...priv method: `Elemental._del_child`...", function () {
                var g1 = new Elemental(),
                    p1 = new Elemental();
                g1._add_child(p1);
                g1._del_child(p1);
                deepEqual(g1.children.length, 0);
                throws(function () { g1._del_child(p1); }, ValueError);
            });

            test("...priv method: `Elemental._add_parent`...", function () {
                var p = new Elemental(),
                    g1 = new Elemental(),
                    g2 = new Elemental();
                p._add_parent(g1);
                deepEqual(p.parents.indexOf(g1), 0);
                p._add_parent(g2);
                deepEqual(p.parents.indexOf(g2), 1);
                deepEqual(p.parents.length, 2);
                throws(function() { p._add_parent(g1); }, ValueError);
            });

            test("...priv method: `Elemental._del_parent`...", function () {
                var g1 = new Elemental(),
                    g2 = new Elemental(),
                    p = new Elemental({parents: [g1, g2]});
                p._del_parent(g1);
                deepEqual(p.parents[0], g2);
                p._del_parent(g2);
                deepEqual(p.parents.length, 0);
                throws(function() { p._del_parent(g1); }, ValueError);
            });

            test("...priv method: `Elemental._getProp`...", function () {
                var e = new Elemental({tempyprop: "something here!!", nullprop: null});
                function simpleGetter(key) {
                    return key;
                }
                function nullGetter() {
                    return "null";
                }
                deepEqual(e._getProp('nothinghere', simpleGetter), 'nothinghere');
                deepEqual(e._getProp('nothingheres', simpleGetter), 'nothingheres');
                deepEqual(e._getProp('nullprop', simpleGetter), 'nullprop');
                deepEqual(e._getProp('tempyprop', simpleGetter), 'something here!!');
                deepEqual(e._getProp('id', simpleGetter), e.id);
                throws(function() { e._getProp('_getProp', simpleGetter); }, ValueError);

                deepEqual(e._getProp('nullprop', simpleGetter, nullGetter), "null");
            });
            test("...priv method: `Elemental._getProps'...", function () {
                var e = new Elemental({id: 'foopoint',
                                    value: 1234});
                deepEqual(e._getProps(['id', 'value']),
                            {id: "foopoint", value: 1234});
                var e = new Elemental({id: 'foopoint',
                                    value: 1234,
                                    show: true});
                deepEqual(e._getProps(['id', 'value', '_value',
                                        'show', '_show']),
                            {show: true, _show: true,
                                id: "foopoint", value: 1234, _value: 1234});

                throws(function() {e._getProps(['_getProps']); }, ValueError);
            });
            test("...priv method: `Elemental._distillProperty`...", function () {
                var e1 = new Elemental({prop1: 'property1'}),
                    e2 = new Elemental({prop2: 'property2', parents: [e1]}),
                    e3 = new Elemental({prop3: 'property3', parents: [e2]});

                deepEqual(e1._distillProperty('prop1'), 'property1');
                deepEqual(e2._distillProperty('prop1'), 'property1');
                deepEqual(e3._distillProperty('prop1'), 'property1');

                deepEqual(e1._distillProperty('prop2'), undefined);
                deepEqual(e2._distillProperty('prop2'), 'property2');
                deepEqual(e3._distillProperty('prop2'), 'property2');

                deepEqual(e1._distillProperty('prop3'), undefined);
                deepEqual(e2._distillProperty('prop3'), undefined);
                deepEqual(e3._distillProperty('prop3'), 'property3');

                var e3 = new Elemental({prop3: 'property3'}),
                    e2 = new Elemental({prop2: 'property2', children: [e3]}),
                    e1 = new Elemental({prop1: 'property1', children: [e2]});

                deepEqual(e1._distillProperty('prop1'), 'property1');
                deepEqual(e2._distillProperty('prop1'), 'property1');
                deepEqual(e3._distillProperty('prop1'), 'property1');

                deepEqual(e1._distillProperty('prop2'), undefined);
                deepEqual(e2._distillProperty('prop2'), 'property2');
                deepEqual(e3._distillProperty('prop2'), 'property2');

                deepEqual(e1._distillProperty('prop3'), undefined);
                deepEqual(e2._distillProperty('prop3'), undefined);
                deepEqual(e3._distillProperty('prop3'), 'property3');
            });

            test("...priv method: `Elemental._percolateProperty`...", function () {
                var e3 = new Elemental({prop3: 'property3'}),
                    e2 = new Elemental({prop2: 'property2', children: [e3]}),
                    e1 = new Elemental({prop1: 'property1', children: [e2]});

                deepEqual(e1._percolateProperty('prop1'), 'property1');
                deepEqual(e2._percolateProperty('prop1'), undefined);
                deepEqual(e3._percolateProperty('prop1'), undefined);

                deepEqual(e1._percolateProperty('prop2'), 'property2');
                deepEqual(e2._percolateProperty('prop2'), 'property2');
                deepEqual(e3._percolateProperty('prop2'), undefined);

                deepEqual(e1._percolateProperty('prop3'), 'property3');
                deepEqual(e2._percolateProperty('prop3'), 'property3');
                deepEqual(e3._percolateProperty('prop3'), 'property3');

                var e1 = new Elemental({prop1: 'property1'}),
                    e2 = new Elemental({prop2: 'property2', parents: [e1]}),
                    e3 = new Elemental({prop3: 'property3', parents: [e2]});

                deepEqual(e1._percolateProperty('prop1'), 'property1');
                deepEqual(e2._percolateProperty('prop1'), undefined);
                deepEqual(e3._percolateProperty('prop1'), undefined);

                deepEqual(e1._percolateProperty('prop2'), 'property2');
                deepEqual(e2._percolateProperty('prop2'), 'property2');
                deepEqual(e3._percolateProperty('prop2'), undefined);

                deepEqual(e1._percolateProperty('prop3'), 'property3');
                deepEqual(e2._percolateProperty('prop3'), 'property3');
                deepEqual(e3._percolateProperty('prop3'), 'property3');

            });
            test("...priv method: `Elemental._parse_def`...", function () {
                var e = new Elemental();
                e.value = 'value111';
                deepEqual(e._parse_def('{value}==={value}'),
                                'value111===value111');
                deepEqual(e._parse_def('{value}==={value}', true),
                                '"value111"==="value111"');
                e.label = 'wonky';
                deepEqual(e._parse_def('{label}==={label}'),
                                'wonky===wonky');
                deepEqual(e._parse_def('{label}==={label}', true),
                                '"wonky"==="wonky"');
                e.value = 123;
                deepEqual(e._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(e._parse_def('{value}==={value}', true),
                                '123===123');
                e.value = 123.123;
                deepEqual(e._parse_def('{value}==={value}'),
                                '123.123===123.123');
                deepEqual(e._parse_def('{value}==={value}', true),
                                '123.123===123.123');
                e.value = "123";
                deepEqual(e._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(e._parse_def('{value}==={value}', true),
                                '"123"==="123"');
                e.show = true;
                deepEqual(e._parse_def('{show}==={show}'),
                                'true===true');
                deepEqual(e._parse_def('{show}==={show}', true),
                                'true===true');
                e.required = false;
                deepEqual(e._parse_def('{required}==={required}'),
                                'false===false');
                deepEqual(e._parse_def('{required}==={required}', true),
                                'false===false');
            });
            test("...priv method: `Elemental._parse_condition`...", function () {
                var e = new Elemental();
                deepEqual(e._parse_condition('this==True'),
                            'this===true');
                deepEqual(e._parse_condition('this==False'),
                            'this===false');
                deepEqual(e._parse_condition('this in [1,2,3]'),
                            '[1,2,3].indexOf(this) >= 0');
                deepEqual(e._parse_condition('this===true'), 'this===true');
                deepEqual(e._parse_condition('this===false'), 'this===false');
            });

            test("...priv method: `Elemental._distill`...", function () {
                var e1 = new Elemental(),   
                    e2 = new Elemental(),
                    g1 = new Elemental({children: [e1, e2]});

                console.log(g1._distill(['id']));
            });

            test("...priv method: `Elemental._percolate`...", function () {
            });

            // Test Properties
            test("...prop: `Elemental.value`...", function () {
                var e = new Elemental();
                deepEqual(e.value, null);
                deepEqual(e._value, undefined);
                var e = new Elemental({value: 1234});
                deepEqual(e.value, 1234);
                deepEqual(e._value, 1234);
                var e = new Elemental({value: '1234'});
                deepEqual(e.value, '1234');
                deepEqual(e._value, '1234');
                var e = new Elemental();
                e.value = '1234';
                deepEqual(e.value, '1234');
                deepEqual(e._value, '1234');
            });
            test("...prop: `Elemental.label`...", function () {
                var e = new Elemental();
                deepEqual(e.label, null);
                deepEqual(e._label, undefined);
                var e = new Elemental({label: 'Label'});
                deepEqual(e.label, 'Label');
                deepEqual(e._label, 'Label');
                var e = new Elemental();
                e.label = 'label';
                deepEqual(e.label, 'label');
                deepEqual(e._label, 'label');
                var e = new Elemental({value: 1234, label: '{value} in label.'});
                deepEqual(e.label, '1234 in label.');
                deepEqual(e._label, '{value} in label.');
            });
            test("...prop: `Elemental.show`..." , function () {
                var e = new Elemental();
                deepEqual(e.show, null);
                deepEqual(e._show, undefined);

                var e = new Elemental({show: true});
                deepEqual(e.show, true);
                deepEqual(e._show, true);
            });
            test("...prop: `Elemental.required`..." , function () {
                var e = new Elemental();
                deepEqual(e.required, null);
                deepEqual(e._required, undefined);

                var e = new Elemental({required: true});
                deepEqual(e.required, true);
                deepEqual(e._required, true);
            });
            test("...prop: `Elemental.collection`...", function () {
                var e = new Elemental();
                deepEqual(e.collection, undefined);
                var c = new PointCollection(),
                    e = new Elemental({collection: c});
                deepEqual(e.collection, undefined);
                deepEqual(e._collection, c);
            });
            test("...pub method: `Elemental.hasOwnProperty`...", function () {
                var e = new Elemental();
                deepEqual(e.hasOwnProperty('value'), true);
                deepEqual(e.hasOwnProperty('show'), true);
                deepEqual(e.hasOwnProperty('foo'), false);
            });
            test("...pub method: `Elemental._parseValue`...", function () {
                var e = new Elemental();
                deepEqual(e._parseValue('value'), 'value');
                deepEqual(e._parseValue(123), 123);
                deepEqual(e._parseValue(123.123), 123.123);
                deepEqual(e._parseValue(true), true);
                deepEqual(e._parseValue(false), false);
            });
            test("...pub method: `Elemental.validate`...", function () {
                var e = new Elemental();
                throws(e.validate, NotImplementedError);
            });
            test("...pub method: `Elemental.evaluate`...", function () {
                var e = new Elemental();
                deepEqual(e.evaluate('{value}===null'), true);
                var e = new Elemental({value: 1234});
                deepEqual(e.evaluate('{value}===1234'), true);
                var e = new Elemental({value: '1234'});
                deepEqual(e.evaluate('{value}==="1234"', true), true);
                var e = new Elemental({value: true});
                deepEqual(e.evaluate('{value}==True'), true);
            });
            test("...pub method: `Elemental.toString`...", function () {
                var e = new Elemental();
                deepEqual(e.toString(), 'Elemental('+e.id+')');
                var e = new Elemental({id: 'Mine'});
                deepEqual(e.toString(), 'Elemental(Mine)');
            });
            test("...pub method: `Elemental.toSchema`...", function () {
                // base
                var e = new Elemental();
                deepEqual(e.toSchema(), {_type: 'elemental', _id: e.id});
                // add `id`
                var e = new Elemental({id: 'id1'});
                deepEqual(e.toSchema(), {_type: 'elemental', _id: 'id1'});
                // add `label`
                var e = new Elemental({type: 'elemental', id: 'id1', label: 'label1'});
                deepEqual(e.toSchema(), {_type: 'elemental', _id: 'id1', _label: 'label1'});
                // add `show`
                var e = new Elemental({type: 'elemental', id: 'id1', label: 'label1', show: true});
                deepEqual(e.toSchema(), {_type: 'elemental', _id: 'id1', _label: 'label1',
                                            _show: true});
                // add `required`
                var e = new Elemental({type: 'elemental', id: 'id1', label: 'label1', show: true,
                                        required: true});
                deepEqual(e.toSchema(), {_type: 'elemental', _id: 'id1', _label: 'label1',
                                            _show: true, _required: true});
                // Try extra properties.
                var e = new Elemental({type: 'elemental', id: 'id1', label: 'label1', show: true,
                                        required: true, value: 'nope'});
                deepEqual(e.toSchema(), {_type: 'elemental', _id: 'id1', _label: 'label1',
                                            _show: true, _required: true});
            });
            test("...pub method: `Elemental.toRender`...", function () {
                // Base Elemental
                var p = new Elemental();
                deepEqual(p.toRender(), []);
                // Unshown Elemental
                var p = new Elemental({id: 'id', value: 'value'});
                deepEqual(p.toRender(), []);
                // Shown Elemental
                var p = new Elemental({id: 'id1', show: true});
                deepEqual(p.toRender(), [{id: 'id1', type: "elemental"}]);
                // add `label`
                var p = new Elemental({id: 'id1', label: 'label1', show: true});
                deepEqual(p.toRender(), [{id: 'id1', label: 'label1', type: "elemental"}]);
                // add `required`
                var p = new Elemental({id: 'id1', label: 'label1', required: true, show: true});
                deepEqual(p.toRender(), [{id: 'id1', type: "elemental", label: 'label1', required: true}]);
                // add `value`
                var p = new Elemental({id: 'id1', label: 'label1', required: true, value: 'value', show: true});
                deepEqual(p.toRender(), [{id: 'id1', label: 'label1', required: true, value: 'value', type: "elemental"}]);
            });
            test("...pub method: `Elemental.fromSchema`...", function () {
                var p = new Elemental();
                throws(p.fromSchema, NotImplementedError);
            });




            // Point...
            // --------
            test("Constructor: `Point`...", function () {
                var p = new Point();
                deepEqual(p.type, 'point');
                deepEqual(p._parents, []);
                deepEqual(p.groups, []);
            });
            test("...priv method: `Point._distillProperty`...", function () {
                var g1 = new Group({value: 'foobers'}),
                    g2 = new Group({show: true}),
                    p1 = new Point({groups: [g1, g2], required: true});
                deepEqual(p1._distillProperty('value'), 'foobers');
                deepEqual(p1._distillProperty('show'), true);
                deepEqual(p1._distillProperty('required'), true);

                var g1 = new Group({value: 'foobers'}),
                    g2 = new Group({value: 'boobers'}),
                    p1 = new Point({groups: [g1, g2]}),
                    p2 = new Point({groups: [g2, g1]}),
                    p3 = new Point({groups: [g1, g2], value: 'beep'});
                deepEqual(p1._distillProperty('value'), 'foobers');
                deepEqual(p2._distillProperty('value'), 'boobers');
                deepEqual(p3._distillProperty('value'), 'beep')
            });
            test("...priv method: `Point._add_parent`...", function () {
                var p = new Point(),
                    g1 = new Group(),
                    g2 = new Group();
                p._add_parent(g1);
                deepEqual(p.groups.indexOf(g1), 0);
                p._add_parent(g2);
                deepEqual(p.groups.indexOf(g2), 1);
                deepEqual(p.groups.length, 2);
                throws(function() { p._add_parent(g1); }, ValueError);
            });
            test("...priv method: `Point._del_parent...`", function () {
                var g1 = new Group(),
                    g2 = new Group(),
                    p = new Point({groups: [g1, g2]});
                p._del_parent(g1);
                deepEqual(p.groups[0], g2);
                p._del_parent(g2);
                deepEqual(p.groups.length, 0);
                throws(function() { p._del_parent(g1); }, ValueError);
            });

            test("...prop: `Point.show`..." , function () {
                var g = new Group({show: true}),
                    p = new Point({groups: [g]});
                deepEqual(p.show, true);
                deepEqual(p._show, undefined);

                var g = new Group({show: false}),
                    p = new Point({groups: [g]});
                deepEqual(p.show, false);
                deepEqual(p._show, undefined);

                var g = new Group({show: false}),
                    p = new Point({groups: [g], show: true});
                deepEqual(p.show, true);
                deepEqual(p._show, true);

                var g = new Group({show: true}),
                    p = new Point({groups: [g], show: false});
                deepEqual(p.show, false);
                deepEqual(p._show, false);
            });
            test("...prop: `Point.required`..." , function () {
                var g = new Group({required: true}),
                    p = new Point({groups: [g]});
                deepEqual(p.required, true);
                deepEqual(p._required, undefined);

                var g = new Group({required: false}),
                    p = new Point({groups: [g]});
                deepEqual(p.required, false);
                deepEqual(p._required, undefined);

                var g = new Group({required: false}),
                    p = new Point({groups: [g], required: true});
                deepEqual(p.required, true);
                deepEqual(p._required, true);

                var g = new Group({required: true}),
                    p = new Point({groups: [g], required: false});
                deepEqual(p.required, false);
                deepEqual(p._required, false);
            });
            test("...prop: `Point.groups`...", function() {
                var p = new Point();
                deepEqual(p.groups, []);
                var g1 = new Group(),
                    p = new Point({groups: [g1]});
                deepEqual(p.groups, [g1]);
                deepEqual(g1.members, [p]);
            });
            test("...pub method: `Point.toString`...", function () {
                var p = new Point();
                deepEqual(p.toString(), 'Point('+p.id+')');
                var p = new Point({id: 'Mine'});
                deepEqual(p.toString(), 'Point(Mine)');
            });
            test("...pub method: `Point.toSchema`...", function () {
                // base
                var p = new Point();
                deepEqual(p.toSchema(), {_type: 'point', _id: p.id});
                // add `id`
                var p = new Point({id: 'id1'});
                deepEqual(p.toSchema(), {_type: 'point', _id: 'id1'});
                // add `label`
                var p = new Point({type: 'point', id: 'id1', label: 'label1'});
                deepEqual(p.toSchema(), {_type: 'point', _id: 'id1', _label: 'label1'});
                // add `show`
                var p = new Point({type: 'point', id: 'id1', label: 'label1', show: true});
                deepEqual(p.toSchema(), {_type: 'point', _id: 'id1', _label: 'label1',
                                            _show: true});
                // add `required`
                var p = new Point({type: 'point', id: 'id1', label: 'label1', show: true,
                                        required: true});
                deepEqual(p.toSchema(), {_type: 'point', _id: 'id1', _label: 'label1',
                                            _show: true, _required: true});
                // add `groups`
                var g = new Group(),
                    p = new Point({type: 'point', id: 'id1', label: 'label1', show: true,
                                        required: true, groups: [g]});
                deepEqual(p.toSchema(), {_type: 'point', _id: 'id1', _label: 'label1',
                                            _show: true, _required: true,
                                            groups: [g]});
                // Try extra properties.
                var p = new Point({type: 'point', id: 'id1', label: 'label1', show: true,
                                        required: true, groups: [g], value: 'nope'});
                deepEqual(p.toSchema(), {_type: 'point', _id: 'id1', _label: 'label1',
                                            _show: true, _required: true,
                                            groups: [g]});
            });
            test("...pub method: `Point.toDef`...", function () {
                var p = new Point(),
                    o = {};
                o[p.id] = {type: "point", "groups": []};

                deepEqual(p.toDef(), o);
                var p = new Point({id: 'id1', value: 'thisval'});
                deepEqual(p.toDef(), {"id1": {type: "point", "groups": [], value: 'thisval'}} );
            });
            test("...pub method: `Point.add_group`...", function () {
                var g = new Group(),
                    p = new Point();
                p.add_group(g);
                deepEqual(p.groups[0], g);
                deepEqual(g.members[0], p);
            });
            test("...pub method: `Point.del_group`...", function () {
                var g = new Group(),
                    p = new Point({groups: [g]});
                p.del_group(g);
                deepEqual(p.groups.length, 0);
                deepEqual(g.members.length, 0);
            });

            // Int...
            // ------
            test('Constructor: `Int`...', function () {
                var i = new Int();
                // Just check basic initial state.
                deepEqual(i.type, 'int');
                deepEqual(i.min, 0);
                deepEqual(i.max, -1);
                deepEqual(i.value, 0);
                deepEqual(i.validate(), true);

                var i = new Int({value: '123'});
                deepEqual(i.value, 123);
                var i = new Int({value: 123});
                deepEqual(i.value, 123);
                var i = new Int({value: 123.123});
                deepEqual(i.value, 123);
            });
            test("...priv method: `Int._parse_def`...", function () {
                var i = new Int();
                i.value = 'value111';
                deepEqual(i._parse_def('{value}==={value}'),
                                'NaN===NaN');
                deepEqual(i._parse_def('{value}==={value}', true),
                                'NaN===NaN');
                i.value = 123;
                deepEqual(i._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(i._parse_def('{value}==={value}', true),
                                '123===123');
                i.value = 123.123;
                deepEqual(i._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(i._parse_def('{value}==={value}', true),
                                '123===123');
                i.value = "123";
                deepEqual(i._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(i._parse_def('{value}==={value}', true),
                                '123===123');
                i.value = true;
                deepEqual(i._parse_def('{value}==={value}'),
                                'NaN===NaN');
                deepEqual(i._parse_def('{value}==={value}', true),
                                'NaN===NaN');
                i.value = false;
                deepEqual(i._parse_def('{value}==={value}'),
                                'NaN===NaN');
                deepEqual(i._parse_def('{value}==={value}', true),
                                'NaN===NaN');
            });
            test("...priv method: `Int._getProps'...", function () {
                var i = new Int({id: 'foopoint',
                                    value: '1234'});
                deepEqual(i._getProps(['id', 'value']),
                            {id: "foopoint", value: 1234});
                var i = new Int({id: 'foopoint',
                                    value: 1234.11,
                                    show: true});
                deepEqual(i._getProps(['id', 'value', '_value',
                                        'show', '_show']),
                            {show: true, _show: true,
                                id: "foopoint", value: 1234, _value: 1234});
            });
            test("...prop: `Int.value`...", function () {
                var i = new Int();
                deepEqual(i.value, 0);
                deepEqual(i._value, 0);
                var i = new Int({value: 1234});
                deepEqual(i.value, 1234);
                deepEqual(i._value, 1234);
                var i = new Int({value: '1234'});
                deepEqual(i.value, 1234);
                deepEqual(i._value, 1234);
                var i = new Int();
                i.value = '1234';
                deepEqual(i.value, 1234);
                deepEqual(i._value, 1234);
            });
            test('...pub method: `Int._parseValue`...', function () {
                var i = new Int();
                deepEqual(i._parseValue('value'), NaN);
                deepEqual(i._parseValue(123), 123);
                deepEqual(i._parseValue(123.123), 123);
                deepEqual(i._parseValue(true), NaN);
            });
            test("...pub method: `Int.toSchema`...", function () {
                var i = new Int();
                deepEqual(i.toSchema(), {id: i.id, max: -1, min: 0, type: "int"});
                var i = new Int({value: 1234.1234, id: 'Mine'});
                deepEqual(i.toSchema(), {max: -1, min: 0, id: 'Mine', type: "int"});
            });
            test("...pub method: `Int.validate`...", function () {
                var i = new Int();
                deepEqual(i.validate(), true);
                var i = new Int({value: 1234567});
                deepEqual(i.validate(), true);
                var i = new Int();
                i._value = 'abcs';
                throws(i.validate, Invalid);
                var i = new Int({min: 1, max: 1000});
                throws(i.validate, Invalid);
                i.value = 1;
                deepEqual(i.validate(), true);
                i.value = 100;
                deepEqual(i.validate(), true);
                i.value = 1000;
                deepEqual(i.validate(), true);
                i.value = 10000;
                throws(i.validate, Invalid);
            });

            // Str...
            // ------
            test('Constructor: `Str`...', function () {
                var s = new Str();
                // Just check basic initial state.
                deepEqual(s.type, 'str');
                deepEqual(s.min, 0);
                deepEqual(s.max, -1);
                deepEqual(s.value, '');
                deepEqual(s.validate(), true);

                var s = new Str({value: '123'});
                deepEqual(s.value, '123');
                var s = new Str({value: 123});
                deepEqual(s.value, '123');
                var s = new Str({value: 123.123});
                deepEqual(s.value, '123.123');
                var s = new Str({value: 'myVal'});
                deepEqual(s.value, 'myVal');
            });
            test("...priv method: `Str._parse_def`...", function () {
                var s = new Str();
                s.value = 'value111';
                deepEqual(s._parse_def('{value}==={value}'),
                                'value111===value111');
                deepEqual(s._parse_def('{value}==={value}', true),
                                '"value111"==="value111"');
                s.value = 123;
                deepEqual(s._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(s._parse_def('{value}==={value}', true),
                                '"123"==="123"');
                s.value = 123.123;
                deepEqual(s._parse_def('{value}==={value}'),
                                '123.123===123.123');
                deepEqual(s._parse_def('{value}==={value}', true),
                                '"123.123"==="123.123"');
                s.value = "123";
                deepEqual(s._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(s._parse_def('{value}==={value}', true),
                                '"123"==="123"');
                s.value = true;
                deepEqual(s._parse_def('{value}==={value}'),
                                'true===true');
                deepEqual(s._parse_def('{value}==={value}', true),
                                '"true"==="true"');
                s.value = false;
                deepEqual(s._parse_def('{value}==={value}'),
                                'false===false');
                deepEqual(s._parse_def('{value}==={value}', true),
                                '"false"==="false"');
            });
            test("...priv method: `Str._getProps'...", function () {
                var s = new Str({id: 'foopoint',
                                    value: '1234'});
                deepEqual(s._getProps(['id', 'value']),
                            {id: "foopoint", value: '1234'});
                var s = new Str({id: 'foopoint',
                                    value: 1234.11,
                                    show: true});
                deepEqual(s._getProps(['id', 'value', '_value',
                                        'show', '_show']),
                            {show: true, _show: true,
                                id: "foopoint", value: '1234.11', _value: '1234.11'});
            });
            test("...prop: `Str.value`...", function () {
                var s = new Str();
                deepEqual(s.value, '');
                deepEqual(s._value, '');
                var s = new Str({value: 1234});
                deepEqual(s.value, '1234');
                deepEqual(s._value, '1234');
                var s = new Str({value: '1234'});
                deepEqual(s.value, '1234');
                deepEqual(s._value, '1234');
                var s = new Str();
                s.value = '1234';
                deepEqual(s.value, '1234');
                deepEqual(s._value, '1234');
            });
            test('...pub method: `Str._parseValue`...', function () {
                var s = new Str();
                deepEqual(s._parseValue('value'), 'value');
                deepEqual(s._parseValue(123), '123');
                deepEqual(s._parseValue(123.123), '123.123');
                deepEqual(s._parseValue(true), 'true');
            });
            test("...pub method: `Str.toSchema`...", function () {
                var s = new Str();
                deepEqual(s.toSchema(), {id: s.id, max: -1, min: 0, type: "str"});
                var s = new Str({value: 1234.1234, id: 'Mine'});
                deepEqual(s.toSchema(), {max: -1, min: 0, id: 'Mine', type: "str"});
            });
            test("...pub method: `Str.validate`...", function () {
                var s = new Str();
                deepEqual(s.validate(), true);
                var s = new Str({value: 1234567});
                deepEqual(s.validate(), true);
                var s = new Str();
                s._value = 'abcs';
                throws(s.validate, Invalid);
                var s = new Str({min: 1, max: 10});
                throws(s.validate, Invalid);
                s.value = '0';
                deepEqual(s.validate(), true);
                s.value = '0123456789';
                deepEqual(s.validate(), true);
                s.value = '012345678901234567890';
                throws(s.validate, Invalid);
            });

            // Float...
            // ------
            test('Constructor: `Float`...', function () {
                var f = new Float();
                // Just check basic initial state.
                deepEqual(f.type, 'float');
                deepEqual(f.min, 0);
                deepEqual(f.max, -1);
                deepEqual(f.precision, 6);
                deepEqual(f.value, "0.00000");
                deepEqual(f.validate(), true);

                var f = new Float({value: '123'});
                deepEqual(f.value, "123.000");
                var f = new Float({value: 123});
                deepEqual(f.value, "123.000");
                var f = new Float({value: 123.123});
                deepEqual(f.value, "123.123");
                var f = new Float({value: 'myVal'});
                deepEqual(f.value, "NaN"); // Why string??
            });
            test("...priv method: `Float._parse_def`...", function () {
                var f = new Float();
                f.value = 'value111';
                deepEqual(f._parse_def('{value}==={value}'),
                                'NaN===NaN');
                deepEqual(f._parse_def('{value}==={value}', true),
                                '"NaN"==="NaN"');
                f.value = 123;
                deepEqual(f._parse_def('{value}==={value}'),
                                '123.000===123.000');
                deepEqual(f._parse_def('{value}==={value}', true),
                                '"123.000"==="123.000"');
                f.value = 123.123;
                deepEqual(f._parse_def('{value}==={value}'),
                                '123.123===123.123');
                deepEqual(f._parse_def('{value}==={value}', true),
                                '"123.123"==="123.123"');
                f.value = "123";
                deepEqual(f._parse_def('{value}==={value}'),
                                '123.000===123.000');
                deepEqual(f._parse_def('{value}==={value}', true),
                                '"123.000"==="123.000"');
                f.value = true;
                deepEqual(f._parse_def('{value}==={value}'),
                                'NaN===NaN');
                deepEqual(f._parse_def('{value}==={value}', true),
                                '"NaN"==="NaN"');
                f.value = false;
                deepEqual(f._parse_def('{value}==={value}'),
                                'NaN===NaN');
                deepEqual(f._parse_def('{value}==={value}', true),
                                '"NaN"==="NaN"');
            });
            test("...priv method: `Float._getProps'...", function () {
                var f = new Float({id: 'foopoint',
                                    value: '1234'});
                deepEqual(f._getProps(['id', 'value']),
                            {id: "foopoint", value: '1234.00'});
                var f = new Float({id: 'foopoint',
                                    value: 1234.11,
                                    show: true});
                deepEqual(f._getProps(['id', 'value', '_value',
                                        'show', '_show']),
                            {show: true, _show: true,
                                id: "foopoint", value: '1234.11', _value: 1234.11});
            });
            test("...prop: `Float.value`...", function () {
                var f = new Float();
                deepEqual(f.value, '0.00000');
                deepEqual(f._value, 0);
                var f = new Float({value: 1234});
                deepEqual(f.value, '1234.00');
                deepEqual(f._value, 1234);
                var f = new Float({value: '1234'});
                deepEqual(f.value, '1234.00');
                deepEqual(f._value, 1234);
                var f = new Float();
                f.value = '1234';
                deepEqual(f.value, '1234.00');
                deepEqual(f._value, 1234);
            });
            test('...pub method: `Float._parseValue`...', function () {
                var f = new Float();
                deepEqual(f._parseValue('value'), NaN);
                deepEqual(f._parseValue(123), 123);
                deepEqual(f._parseValue(123.123), 123.123);
                deepEqual(f._parseValue(true), NaN);
            });
            test("...pub method: `Float.toSchema`...", function () {
                var f = new Float();
                deepEqual(f.toSchema(), {id: f.id, max: -1, min: 0, precision: 6, type: "float"});
                var f = new Float({value: 1234.1234, id: 'Mine'});
                deepEqual(f.toSchema(), {max: -1, min: 0, id: 'Mine', precision: 6, type: "float"});
            });
            test("...pub method: `Float.validate`...", function () {
                var f = new Float();
                deepEqual(f.validate(), true);
                var f = new Float({value: 1234567});
                deepEqual(f.validate(), true);
                var f = new Float();
                f._value = 'abcs';
                throws(f.validate, Invalid);
                var f = new Float({min: 1, max: 1000});
                throws(f.validate, Invalid);
                f.value = '1';
                deepEqual(f.validate(), true);
                f.value = 1000;
                deepEqual(f.validate(), true);
                f.value = 1001;
                throws(f.validate, Invalid);
            });

            // Bool...
            // ------
            test('Constructor: `Bool`...', function () {
                var b = new Bool();
                // Just check basic initial state.
                deepEqual(b.type, 'bool');
                deepEqual(b.value, false);
                deepEqual(b.validate(), true);

                var b = new Bool({value: '123'});
                deepEqual(b.value, true);
                var b = new Bool({value: 123});
                deepEqual(b.value, true);
                var b = new Bool({value: 123.123});
                deepEqual(b.value, true);
                var b = new Bool({value: 'myVal'});
                deepEqual(b.value, true);
                var b = new Bool({value: false});
                deepEqual(b.value, false);
            });
            test("...priv method: `Bool._parse_def`...", function () {
                var b = new Bool();
                b.value = 'value111';
                deepEqual(b._parse_def('{value}==={value}'),
                                'true===true');
                deepEqual(b._parse_def('{value}==={value}', true),
                                'true===true');
                b.value = 123;
                deepEqual(b._parse_def('{value}==={value}'),
                                'true===true');
                deepEqual(b._parse_def('{value}==={value}', true),
                                'true===true');
                b.value = 123.123;
                deepEqual(b._parse_def('{value}==={value}'),
                                'true===true');
                deepEqual(b._parse_def('{value}==={value}', true),
                                'true===true');
                b.value = "123";
                deepEqual(b._parse_def('{value}==={value}'),
                                'true===true');
                deepEqual(b._parse_def('{value}==={value}', true),
                                'true===true');
                b.value = true;
                deepEqual(b._parse_def('{value}==={value}'),
                                'true===true');
                deepEqual(b._parse_def('{value}==={value}', true),
                                'true===true');
                b.value = false;
                deepEqual(b._parse_def('{value}==={value}'),
                                'false===false');
                deepEqual(b._parse_def('{value}==={value}', true),
                                'false===false');
            });
            test("...priv method: `Bool._getProps'...", function () {
                var b = new Bool({id: 'foopoint',
                                    value: '1234'});
                deepEqual(b._getProps(['id', 'value']),
                            {id: "foopoint", value: true});
                var b = new Bool({id: 'foopoint',
                                    value: 1234.11,
                                    show: true});
                deepEqual(b._getProps(['id', 'value', '_value',
                                        'show', '_show']),
                            {show: true, _show: true,
                                id: "foopoint", value: true, _value: true});
            });
            test("...prop: `Bool.value`...", function () {
                var b = new Bool();
                deepEqual(b.value, false);
                deepEqual(b._value, false);
                var b = new Bool({value: 1234});
                deepEqual(b.value, true);
                deepEqual(b._value, true);
                var b = new Bool({value: '1234'});
                deepEqual(b.value, true);
                deepEqual(b._value, true);
                var b = new Bool();
                b.value = '1234';
                deepEqual(b.value, true);
                deepEqual(b._value, true);
            });
            test('...pub method: `Bool._parseValue`...', function () {
                var b = new Bool();
                deepEqual(b._parseValue('value'), true);
                deepEqual(b._parseValue(123), true);
                deepEqual(b._parseValue(123.123), true);
                deepEqual(b._parseValue(true), true);
            });
            test("...pub method: `Bool.toSchema`...", function () {
                var b = new Bool();
                deepEqual(b.toSchema(), {id: b.id, type: "bool"});
                var b = new Bool({value: 1234.1234, id: 'Mine'});
                deepEqual(b.toSchema(), {id: 'Mine', type: "bool"});
            });
            test("...pub method: `Bool.validate`...", function () {
                var b = new Bool();
                deepEqual(b.validate(), true);
                var b = new Bool({value: 1234567});
                deepEqual(b.validate(), true);
                var b = new Bool();
                b._value = 'abcs';
                throws(b.validate, Invalid);
            });

            // List...
            // ------
            test('Constructor: `List`...', function () {

            });
            test("...priv method: `List._parse_def`...", function () {

            });
            test("...priv method: `List._getProps'...", function () {

            });
            test("...prop: `List.value`...", function () {

            });
            test('...pub method: `List._parseValue`...', function () {

            });
            test("...pub method: `List.toSchema`...", function () {

            });
            test("...pub method: `List.validate`...", function () {

            });



            // Group...
            // --------
            test("Constructor: `Group`...", function () {
                var g1 = new Group();
                deepEqual(g1.id.length, 36);
                deepEqual(g1.radio, false);
                deepEqual(g1._show, false);
                deepEqual(g1.show, false);
                deepEqual(g1._required, false);
                deepEqual(g1.required, false);
                deepEqual(Boolean(g1.value), false);
                deepEqual(g1.members,[]);
                deepEqual(g1._collection, {});

                var g1 = new Group({show: true});
                deepEqual(g1.show, true);
                deepEqual(g1._show, true);
                var g1 = new Group({required: true});
                deepEqual(g1.required, true);
                deepEqual(g1._required, true);
                var g1 = new Group({label: 'Group 1'});
                deepEqual(g1.label, 'Group 1');
                deepEqual(g1._label, 'Group 1');
            });
            test("...priv method: `Group._add_child`...", function () {
                var g1 = new Group(),
                    p1 = new Point();
                g1._add_child(p1);
                deepEqual(g1.members[0], p1);
                throws(function () { g1._add_child(p1); }, ValueError);
            });
            test("...priv method: `Group._del_child`...", function () {
                var g1 = new Group(),
                    p1 = new Point({groups: [g1]});
                g1._del_child(p1);
                deepEqual(g1.members.length, 0);
                throws(function () { g1._del_child(p1); }, ValueError);
            });
            test("...prop: `Group.members`...", function () {
                var g = new Group();
                deepEqual(g.members, []);

                var g1 = new Group(),
                    p1 = new Point({groups: [g1]});
                deepEqual(g1.members, [p1]);
            });
            test("...pub method: `Group.toSchema`...", function () {
                // `toSchema`
                var g1 = new Group();
                deepEqual(g1.toSchema(), {
                    id: g1.id,
                    _required: false,
                    _show: false,
                    show: false,
                    required: false,
                    radio: false,
                    type: 'group'});
            });
            test("...pub method: `Group.toRender`...", function () {
                var g1 = new Group();
                deepEqual(g1.toRender(), []);
            });
            test("...pub method: `Group.toDef`...", function () {
            });
            test("...pub method: `Group.validate`...", function () {
                var g1 = new Group();
                deepEqual(g1.validate(), undefined);
            });
            test("...pub method: `Group.add_point`...", function () {
                var g1 = new Group();
                var p1 = new Point();
                g1.add_point(p1);
                deepEqual(g1.members[0], p1);
                deepEqual(p1.groups[0], g1);
                throws(function () { g1.add_point(p1)}, ValueError);
            });
            test("...pub method: `Group.del_point`...", function () {
                var g1 = new Group(),
                    p1 = new Point({groups: [g1]});
                g1.del_point(p1);
                deepEqual(g1.members.length, 0);
                deepEqual(p1.groups.length, 0);
                throws(function () {g1.del_point(p1)}, ValueError);
            });


            test('Test `PointCollection` class...', function () {
                var c = new PointCollection();
                deepEqual(c.name, '');
                deepEqual(c.objects, {});
                deepEqual(c.collections, {});
                deepEqual(c.order, []);
                deepEqual(c._lockable, false);
                deepEqual(c._locked, false);

                var c = new PointCollection({
                    id: 'c1',
                    name: '',
                    lockable: true,
                    locked: true
                });
            });




        }
    }
});