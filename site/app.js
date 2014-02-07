define(['underscore', 'backbone', 'events', 'config', 'views', 'elements'],
    function(_, Backbone, Events, Config, Views) {
        return {
            initialize: function(Router) {
                var c = new PointCollection().fromDef({
                    id: 'c1',
                    name: "Yes/No/N.A.",
                    label: "Did you do a good job?",
                    lockable: true,
                    points: {
                        'yes': {     
                            label: "Yes",
                            type: "bool",
                            groups: ["g1"],
                        },
                        'no': {
                            label: "No",
                            type: "bool",
                            groups: ["g1"],
                            update: {
                                condition: '{value}==True',
                                then: {
                                    'notes_no': {show: true}
                                },
                                else: {
                                    'notes_no': {show: false}
                                }
                            }
                        },
                        'na': {
                            label: "N/A",
                            type: "bool",
                            groups: ["g1"],
                            update: {
                                condition: '{value}==True',
                                then: {
                                    'notes_na': {show: true}
                                },
                                else: {
                                    'notes_na': {show: false}
                                }
                            }
                        },
                        'maybe': {
                            label: "Maybe",
                            type: "bool",
                            groups: ["g1"],
                            update: {
                                condition: '{value}==True',
                                then: {
                                    'notes_maybe': {show: true}
                                },
                                else: {
                                    'notes_maybe': {show: false}
                                }
                            }
                        },
                        'notes_no': {
                            label: "What went wrong? ({min} to {max} characters)",
                            type: "str",
                            min: 32,
                            max: 4096,
                            required: true
                        },
                        'notes_maybe': {
                            label: "How can you do better in the future? ({min} to {max} characters)",
                            type: "str",
                            min: 32,
                            max: 4096,
                            required: true
                        },
                        'notes_na': {
                            label: "Oh you don't work here? ({min} to {max} characters)",
                            type: "str",
                            min: 3,
                            max: 4096
                        }
                    },
                    groups: {
                        'g1': {
                            radio: true,
                            show: true,
                            required: true
                        }
                    },
                    order: ['yes', 'no', 'maybe', 'na', 'notes_no', 'notes_maybe', 'notes_na']
                });

                console.log(c.label);
                var preview = new Views.PointCollectionView(c);
                var admin = new Views.PointCollectionAdminView(c, preview);
                admin.render();


                preview.render();

                //console.log(c.objects['yes'].render());
                //console.log(c.objects['g1'].render());
                //console.log(c.objects['no'].toSchema());
                //console.log(c.objects['notes_na'].toSchema());
                //console.log(c.objects['yes'].toDef());
            }
        };
    });