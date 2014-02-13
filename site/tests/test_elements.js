define(['qunit', 'elements'],
    function () { return {
        run: function () {
            // Unit tests...
            // =============
            // (Functional tests should go in another module??)

            // Point...
            // --------
            test("Constructor: `Point`...", function () {
                var p = new Point();
                deepEqual(p.id, undefined);
                deepEqual(p.type, undefined);
                deepEqual(p._required, undefined);
                deepEqual(p.required, null);
                deepEqual(p.update, {});
                deepEqual(p._show, undefined);
                deepEqual(p.show, null);
                deepEqual(Boolean(p._value), false);
                deepEqual(Boolean(p.value), false);
                deepEqual(p._groups, []);
                deepEqual(p.groups, []);
                deepEqual(p._collection, {});

                var p = new Point({value: '123'});
                deepEqual(p.value, '123');
                var p = new Point({value: 123});
                deepEqual(p.value, 123);
                var p = new Point({value: true});
                deepEqual(p.value, true);
                var p = new Point({value: 123.123, show: true, label: 'this'});
                deepEqual(p.value, 123.123);
                deepEqual(p.show, true);
                deepEqual(p.label, 'this');
            });
            test("...priv method: `Point._parse_def`...", function () {
                var p = new Point();
                p.value = 'value111';
                deepEqual(p._parse_def('{value}==={value}'),
                                'value111===value111');
                deepEqual(p._parse_def('{value}==={value}', true),
                                '"value111"==="value111"');
                p.label = 'wonky';
                deepEqual(p._parse_def('{label}==={label}'),
                                'wonky===wonky');
                deepEqual(p._parse_def('{label}==={label}', true),
                                '"wonky"==="wonky"');
                p.value = 123;
                deepEqual(p._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(p._parse_def('{value}==={value}', true),
                                '123===123');
                p.value = 123.123;
                deepEqual(p._parse_def('{value}==={value}'),
                                '123.123===123.123');
                deepEqual(p._parse_def('{value}==={value}', true),
                                '123.123===123.123');
                p.value = "123";
                deepEqual(p._parse_def('{value}==={value}'),
                                '123===123');
                deepEqual(p._parse_def('{value}==={value}', true),
                                '"123"==="123"');
                p.show = true;
                deepEqual(p._parse_def('{show}==={show}'),
                                'true===true');
                deepEqual(p._parse_def('{show}==={show}', true),
                                'true===true');
                p.required = false;
                deepEqual(p._parse_def('{required}==={required}'),
                                'false===false');
                deepEqual(p._parse_def('{required}==={required}', true),
                                'false===false');
            });
            test("...priv method: `Point._parse_condition`...", function () {
                var p = new Point();
                deepEqual(p._parse_condition('this==True'),
                            'this===true');
                deepEqual(p._parse_condition('this==False'),
                            'this===false');
                deepEqual(p._parse_condition('this in [1,2,3]'),
                            '[1,2,3].indexOf(this) >= 0');
                deepEqual(p._parse_condition('this===true'), 'this===true');
                deepEqual(p._parse_condition('this===false'), 'this===false');
            });
            test("...priv method: `Point._group_or_point_property`...", function () {
                var g1 = new Group({value: 'foobers'}),
                    g2 = new Group({show: true}),
                    p1 = new Point({groups: [g1, g2], required: true});
                deepEqual(p1._group_or_point_property('value'), 'foobers');
                deepEqual(p1._group_or_point_property('show'), true);
                deepEqual(p1._group_or_point_property('required'), true);

                var g1 = new Group({value: 'foobers'}),
                    g2 = new Group({value: 'boobers'}),
                    p1 = new Point({groups: [g1, g2]}),
                    p2 = new Point({groups: [g2, g1]}),
                    p3 = new Point({groups: [g1, g2], value: 'beep'});
                deepEqual(p1._group_or_point_property('value'), 'foobers');
                deepEqual(p2._group_or_point_property('value'), 'boobers');
                deepEqual(p3._group_or_point_property('value'), 'beep')
            });
            test("...priv method: `Point._add_group`...", function () {
                var p = new Point(),
                    g1 = new Group(),
                    g2 = new Group();
                p._add_group(g1);
                deepEqual(p.groups.indexOf(g1), 0);
                p._add_group(g2);
                deepEqual(p.groups.indexOf(g2), 1);
                deepEqual(p.groups.length, 2);
                throws(function() { p._add_group(g1); }, ValueError);
            });
            test("...priv method: `Point._del_group...`", function () {
                var g1 = new Group(),
                    g2 = new Group(),
                    p = new Point({groups: [g1, g2]});
                p._del_group(g1);
                deepEqual(p.groups[0], g2);
                p._del_group(g2);
                deepEqual(p.groups.length, 0);
                throws(function() { p._del_group(g1); }, ValueError);
            });
            test("...priv method: `Point._toSchema'...", function () {
                var p = new Point({id: 'foopoint',
                                    value: 1234});
                deepEqual(p._toSchema(['id', 'value']),
                            {id: "foopoint", value: 1234});
                var p = new Point({id: 'foopoint',
                                    value: 1234,
                                    show: true});
                deepEqual(p._toSchema(['id', '_id', 'value', '_value',
                                        'show', '_show']),
                            {show: true, _show: true,
                                id: "foopoint", value: 1234, _value: 1234});
            });
            test("...prop: `Point.show`..." , function () {
                var p = new Point({show: true});
                deepEqual(p.show, true);
                deepEqual(p._show, true);

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
                var p = new Point({required: true});
                deepEqual(p.required, true);
                deepEqual(p._required, true);

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
            test("...prop: `Point.value`...", function () {
                var p = new Point();
                deepEqual(p.value, null);
                deepEqual(p._value, undefined);
                var p = new Point({value: 1234});
                deepEqual(p.value, 1234);
                deepEqual(p._value, 1234);
                var p = new Point({value: '1234'});
                deepEqual(p.value, '1234');
                deepEqual(p._value, '1234');
                var p = new Point();
                p.value = '1234';
                deepEqual(p.value, '1234');
                deepEqual(p._value, '1234');
            });
            test("...prop: `Point.label`...", function () {
                var p = new Point();
                deepEqual(p.label, null);
                deepEqual(p._label, undefined);
                var p = new Point({label: 'Label'});
                deepEqual(p.label, 'Label');
                deepEqual(p._label, 'Label');
                var p = new Point();
                p.label = 'label';
                deepEqual(p.label, 'label');
                deepEqual(p._label, 'label');
                var p = new Point({value: 1234, label: '{value} in label.'});
                deepEqual(p.label, '1234 in label.');
                deepEqual(p._label, '{value} in label.');
            });
            test("...prop: `Point.groups`...", function() {
                var p = new Point();
                deepEqual(p.groups, []);
                var g1 = new Group(),
                    p = new Point({groups: [g1]});
                deepEqual(p.groups, [g1]);
                deepEqual(g1.members, [p]);
            });
            test("...prop: `Point.collection`...", function () {
                var p = new Point();
                deepEqual(p.collection, undefined);
                var c = new PointCollection(),
                    p = new Point({collection: c});
                deepEqual(p.collection, undefined);
                deepEqual(p._collection, c);
            });
            test("...pub method: `Point.hasOwnProperty`...", function () {
                var p = new Point();
                deepEqual(p.hasOwnProperty('value'), true);
                deepEqual(p.hasOwnProperty('show'), true);
                deepEqual(p.hasOwnProperty('groups'), true);
                deepEqual(p.hasOwnProperty('foo'), false);
            });
            test("...pub method: `Point.parseValue`...", function () {
                var p = new Point();
                deepEqual(p.parseValue('value'), 'value');
                deepEqual(p.parseValue(123), 123);
                deepEqual(p.parseValue(123.123), 123.123);
                deepEqual(p.parseValue(true), true);
                deepEqual(p.parseValue(false), false);
            });
            test("...pub method: `Point.validate`...", function () {
                var p = new Point();
                throws(p.validate, NotImplementedError);
            });
            test("...pub method: `Point.evaluate`...", function () {
                var p = new Point();
                deepEqual(p.evaluate('{value}===null'), true);
                var p = new Point({value: 1234});
                deepEqual(p.evaluate('{value}===1234'), true);
                var p = new Point({value: '1234'});
                deepEqual(p.evaluate('{value}==="1234"', true), true);
                var p = new Point({value: true});
                deepEqual(p.evaluate('{value}==True'), true);
            });
            test("...pub method: `Point.toString`...", function () {
                var p = new Point();
                deepEqual(p.toString(), 'Point()');
                var p = new Point({id: 'Mine'});
                deepEqual(p.toString(), 'Point(Mine)');
            });
            test("...pub method: `Point.toSchema`...", function () {
                var p = new Point();
                deepEqual(p.toSchema(), {});
                var p = new Point({value: 12345});
                deepEqual(p.toSchema(), {});
                var p = new Point({value: 12345, id: 'Mypoint', label: 'Hereitis'});
                deepEqual(p.toSchema(), {id: 'Mypoint', _label: 'Hereitis'});
            });
            test("...pub method: `Point.toDef`...", function () {
                var p = new Point();
                deepEqual(p.toDef(), {"undefined": {"groups": []}} );
                var p = new Point({id: 'id1', value: 'thisval'});
                deepEqual(p.toDef(), {"id1": {"groups": [], value: 'thisval'}} );
            });
            test("...pub method: `Point.render`...", function () {
                var p = new Point();
                deepEqual(p.render(), []);
                var p = new Point({id: 'id', value: 'value'});
                deepEqual(p.render(), []);
                var p = new Point({id: 'id', value: 'value', show: true});
                deepEqual(p.render(), [{id: 'id', value: 'value'}]);
            });
            test("...pub method: `Point.fromSchema`...", function () {
                var p = new Point();
                throws(p.fromSchema, NotImplementedError);
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
                deepEqual(i.id, undefined);
                deepEqual(i.type, 'int');
                deepEqual(i._required, undefined);
                deepEqual(i.required, null);
                deepEqual(i._show, undefined);
                deepEqual(i.show, null);
                deepEqual(Boolean(i.value), false);
                deepEqual(i.update, {});
                deepEqual(i.groups, []);
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
            test("...priv method: `Int._parse_condition`...", function () {
                var i = new Int();
                deepEqual(i._parse_condition('this==True'),
                            'this===true');
                deepEqual(i._parse_condition('this==False'),
                            'this===false');
                deepEqual(i._parse_condition('this in [1,2,3]'),
                            '[1,2,3].indexOf(this) >= 0');
                deepEqual(i._parse_condition('this===false'), 'this===false');
            });
            test("...priv method: `Int._group_or_point_property`...", function () {
                var g1 = new Group({value: 'foobers'}),
                    g2 = new Group({show: true}),
                    i = new Int({groups: [g1, g2], required: true});
                deepEqual(i._group_or_point_property('value'), 0);
                deepEqual(i._group_or_point_property('show'), true);
                deepEqual(i._group_or_point_property('required'), true);

                var g1 = new Group({required: true}),
                    g2 = new Group({required: false}),
                    p1 = new Int({groups: [g1, g2]}),
                    p2 = new Int({groups: [g2, g1]}),
                    p3 = new Int({groups: [g1, g2], required: false});
                deepEqual(p1._group_or_point_property('required'), true);
                deepEqual(p2._group_or_point_property('required'), true);
                deepEqual(p3._group_or_point_property('required'), false)
            });
            test("...priv method: `Int._add_group`...", function() {
                var i = new Int(),
                    g1 = new Group(),
                    g2 = new Group();
                i._add_group(g1);
                deepEqual(i.groups.indexOf(g1), 0);
                i._add_group(g2);
                deepEqual(i.groups.indexOf(g2), 1);
                deepEqual(i.groups.length, 2);
                throws(function() { i._add_group(g1); }, ValueError);
            });
            test("...priv method: `Int._del_group`...", function () {
                // `_del_group`
                var g1 = new Group(),
                    g2 = new Group(),
                    i = new Int({groups: [g1, g2]});
                i._del_group(g1);
                deepEqual(i.groups[0], g2);
                i._del_group(g2);
                deepEqual(i.groups.length, 0);
                throws(function() { i._del_group(g1); }, ValueError);
            });
            test("...priv method: `Int._toSchema'...", function () {
                var i = new Int({id: 'foopoint',
                                    value: '1234'});
                deepEqual(i._toSchema(['id', 'value']),
                            {id: "foopoint", value: 1234});
                var i = new Int({id: 'foopoint',
                                    value: 1234.11,
                                    show: true});
                deepEqual(i._toSchema(['id', '_id', 'value', '_value',
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
            test('...pub method: `Int.parseValue`...', function () {
                var i = new Int();
                deepEqual(i.parseValue('value'), NaN);
                deepEqual(i.parseValue(123), 123);
                deepEqual(i.parseValue(123.123), 123);
                deepEqual(i.parseValue(true), NaN);
            });
            test("...pub method: `Int.toSchema`...", function () {
                var i = new Int();
                deepEqual(i.toSchema(), {max: -1, min: 0,type: "int"});
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

            // Group...
            // --------
            test("Constructor: `Group`...", function () {
                var g1 = new Group();
                deepEqual(g1.id, undefined);
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
            test("...priv method: `Group._add_point`...", function () {
                var g1 = new Group(),
                    p1 = new Point();
                g1._add_point(p1);
                deepEqual(g1.members[0], p1);
                throws(function () { g1._add_point(p1); }, ValueError);
            });
            test("...priv method: `Group._del_point`...", function () {
                var g1 = new Group(),
                    p1 = new Point({groups: [g1]});
                g1._del_point(p1);
                deepEqual(g1.members.length, 0);
                throws(function () { g1._del_point(p1); }, ValueError);
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
                    _required: false,
                    _show: false,
                    show: false,
                    required: false,
                    radio: false});
            });

            test("...pub method: `Group.render`...", function () {
                var g1 = new Group();
                deepEqual(g1.render(), []);
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

                deepEqual(c.type, 'collection');
                deepEqual(c.name, '');
                deepEqual(c.objects, {});
                deepEqual(c.collections, {});
                deepEqual(c.order, []);
                deepEqual(c._lockable, false);
                deepEqual(c._locked, false);
            });
        }
    }
});