define(['qunit', 'elements'],
    function (){
        return {
            run: function () {
                test("Test `Point` base class...", function () {
                    // Set up a point.
                    var p = new Point();

                    // Just check basic initial state.
                    deepEqual(p.id, undefined);
                    deepEqual(p.type, undefined);
                    deepEqual(p.required, undefined);
                    deepEqual(p.update, {});
                    deepEqual(p.show, undefined);
                    deepEqual(p.groups, []);
                    deepEqual(p.collection, {});
                    deepEqual(p.min, undefined);
                    deepEqual(p.max, undefined);
                    deepEqual(p._label, undefined);
                    deepEqual(p._value, undefined);

                    // 
                    deepEqual(p.validate(), false);
                    deepEqual(p.is_shown(), undefined);
                    deepEqual(p.is_required(), undefined);
                    deepEqual(p.has_value(), false);

                    // Functions
                    // =========
                    var p = new Point();
                    // `_parse_value`
                    deepEqual(p._parse_value('value'), 'value');
                    deepEqual(p._parse_value(123), 123);
                    deepEqual(p._parse_value(123.123), 123.123);
                    deepEqual(p._parse_value(true), true);

                    // `_parse_def`
                    var p = new Point();
                    p.value = 'value111';
                    deepEqual(p._parse_def('{value}==={value}'),
                                    'value111===value111');
                    deepEqual(p._parse_def('{value}==={value}', true),
                                    '"value111"==="value111"');
                    p.value = 'wonky';
                    deepEqual(p._parse_def('{value}==={value}'),
                                    'wonky===wonky');
                    deepEqual(p._parse_def('{value}==={value}', true),
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
                    p.value = true;
                    deepEqual(p._parse_def('{value}==={value}'),
                                    'true===true');
                    deepEqual(p._parse_def('{value}==={value}', true),
                                    'true===true');
                    p.value = false;
                    deepEqual(p._parse_def('{value}==={value}'),
                                    'false===false');
                    deepEqual(p._parse_def('{value}==={value}', true),
                                    'false===false');

                    // `_parse_condition`
                    var p = new Point();
                    deepEqual(p._parse_condition('this==True'),
                                'this===true');
                    deepEqual(p._parse_condition('this==False'),
                                'this===false');
                    deepEqual(p._parse_condition('this in [1,2,3]'),
                                '[1,2,3].indexOf(this) >= 0');
                    deepEqual(p._parse_condition('this===false'), 'this===false');

                    // `_group_or_point_property`
                    var g1 = new Group({value: 'foobers'}),
                        g2 = new Group({show: true}),
                        p = new Point({groups: [g1, g2], required: true});
                    deepEqual(p._group_or_point_property('value'), 'foobers');
                    deepEqual(p._group_or_point_property('show'), true);
                    deepEqual(p._group_or_point_property('required'), true);

                    // `_add_group`
                    var p = new Point(),
                        g1 = new Group(),
                        g2 = new Group();
                    p._add_group(g1);
                    deepEqual(p.groups.indexOf(g1), 0);
                    p._add_group(g2);
                    deepEqual(p.groups.indexOf(g2), 1);
                    deepEqual(p.groups.length, 2);
                    throws(function() { p._add_group(g1); }, ValueError);

                    // `_del_group`
                    var g1 = new Group(),
                        g2 = new Group(),
                        p = new Point({groups: [g1, g2]});
                    p._del_group(g1);
                    deepEqual(p.groups[0], g2);
                    p._del_group(g2);
                    deepEqual(p.groups.length, 0);
                    throws(function() { p._del_group(g1); }, ValueError);

                    // `_toSchema`
                    var p = new Point();
                    deepEqual(p._toSchema(), {});
                    // MOAR...

                    // `add_group`
                    var g = new Group(),
                        p = new Point();
                    p.add_group(g);
                    deepEqual(p.groups[0], g);
                    deepEqual(g.members[0], p);

                    // `del_group`
                    p.del_group(g);
                    deepEqual(p.groups.length, 0);
                    deepEqual(g.members.length, 0);

                    // `render`
                    var p = new Point();
                    deepEqual(p.render(), []);
                    // MOAR


                    // `toSchema`
                    var p = new Point();
                    deepEqual(p.toSchema(), {});
                    // MOAR

                    // `toDef` (is this even in use??)
                    var p = new Point();

                    // `evaluate`
                    var p = new Point();
                    deepEqual(p.evaluate('{value}===undefined'), true);
                });

                test('Test `Int` class...', function () {
                    var i = Int();

                    // Just check basic initial state.
                    deepEqual(i.id, undefined);
                    deepEqual(i.type, 'int');
                    deepEqual(i.required, undefined);
                    deepEqual(i.update, {});
                    deepEqual(i.show, undefined);
                    deepEqual(i.groups, []);
                    deepEqual(i.collection, {});
                    deepEqual(i.min, 0);
                    deepEqual(i.max, -1);
                    deepEqual(i._label, undefined);
                    deepEqual(i._value, 0);
                    deepEqual(i.value, 0);

                    // 
                    deepEqual(i.validate(), true);
                    deepEqual(i.is_shown(), undefined);
                    deepEqual(i.is_required(), undefined);
                    deepEqual(i.has_value(), false);

                    // Functions
                    // =========
                    var i = new Int();
                    // `_parse_value`
                    deepEqual(i._parse_value('value'), NaN);
                    deepEqual(i._parse_value(123), 123);
                    deepEqual(i._parse_value(123.123), 123);
                    deepEqual(i._parse_value(true), NaN);

                    // `_parse_def`
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

                    // `_parse_condition`
                    var i = new Int();
                    deepEqual(i._parse_condition('this==True'),
                                'this===true');
                    deepEqual(i._parse_condition('this==False'),
                                'this===false');
                    deepEqual(i._parse_condition('this in [1,2,3]'),
                                '[1,2,3].indexOf(this) >= 0');
                    deepEqual(i._parse_condition('this===false'), 'this===false');


                    // `_group_or_point_property`
                    var g1 = new Group({value: 'foobers'}),
                        g2 = new Group({show: true}),
                        i = new Int({groups: [g1, g2], required: true});
                    deepEqual(i._group_or_point_property('value'), 0);
                    deepEqual(i._group_or_point_property('show'), true);
                    deepEqual(i._group_or_point_property('required'), true);

                    // `_add_group`
                    var i = new Int(),
                        g1 = new Group(),
                        g2 = new Group();
                    i._add_group(g1);
                    deepEqual(i.groups.indexOf(g1), 0);
                    i._add_group(g2);
                    deepEqual(i.groups.indexOf(g2), 1);
                    deepEqual(i.groups.length, 2);
                    throws(function() { i._add_group(g1); }, ValueError);

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

                test("Test Group class...", function () {
                    var g1 = new Group();
                    // Base properties.
                    deepEqual(g1.id, null);
                    deepEqual(g1.radio, false);
                    deepEqual(g1.show, false);
                    deepEqual(g1.required, false);
                    deepEqual(g1.members,[]);
                    deepEqual(g1.collection, {});

                    deepEqual(g1.is_shown(), false);
                    deepEqual(g1.is_required(), false);
                    deepEqual(g1.has_value(), true); //??

                    // `_add_point`
                    var p1 = new Point();
                    g1._add_point(p1);
                    deepEqual(g1.members[0], p1);
                    throws(function () { g1._add_point(p1); }, ValueError);

                    // `_del_point`
                    g1._del_point(p1);
                    deepEqual(g1.members.length, 0);
                    throws(function () { g1._del_point(p1); }, ValueError);

                    // `_toSchema`
                    var g1 = new Group();
                    deepEqual(g1._toSchema(), {});

                    // `add_point`
                    var g1 = new Group();
                    var p1 = new Point();
                    g1.add_point(p1);
                    deepEqual(g1.members[0], p1);
                    deepEqual(p1.groups[0], g1);
                    throws(function () { g1.add_point(p1)}, ValueError);

                    // `del_point`
                    g1.del_point(p1);
                    deepEqual(g1.members.length, 0);
                    deepEqual(p1.groups.length, 0);
                    throws(function () {g1.del_point(p1)}, ValueError);

                    // `validate`
                    var g1 = new Group();
                    deepEqual(g1.validate(), undefined);

                    // `render`
                    var g1 = new Group();
                    deepEqual(g1.render(), []);

                    // `toSchema`
                    var g1 = new Group();
                    deepEqual(g1.toSchema(), {show: false, required: false,
                                                radio: false});

                    // `toDef`
                    // ugh broken
                    // console.log(g1.toDef());

                    // Not ffffff done.
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