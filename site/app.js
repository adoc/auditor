define(['underscore', 'backbone', 'events', 'config', 'views', 'elements'],
    function(_, Backbone, Events, Config, Views) {
        return {
            initialize: function(Router) {
                var c = new PointCollection({
                    id: 'c1',
                    name: "Yes/No/N.A.",
                    label: "Did you do a good job?",
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
                            label: "What went wrong? (32 to 4096 characters)",
                            type: "str",
                            min: 32,
                            max: 4096,
                            required: true
                        },
                        'notes_maybe': {
                            label: "How can you do better in the future? (32 to 4096 characters)",
                            type: "str",
                            min: 32,
                            max: 4096,
                            required: true
                        },
                        'notes_na': {
                            label: "Oh you don't work here? (32 to 4096 characters)",
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

                var admin = new Views.PointCollectionAdminView(c);
                admin.render();

                var preview = new Views.PointCollectionView(c);
                preview.render();
            }
        };
    });