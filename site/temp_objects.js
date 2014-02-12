// Temporary objects.
// These will be served via JSON later.

// Just a temporary collection.
function c1() {
    return {
        "id": "c1",
        "name": "Yes/No/N.A.",
        "label": "Did you do a good job?",
        "lockable": true,
        "points": {
            "yes": {
                "label": "Yes",
                "type": "bool",
                "groups": ["g1"]
            },
            "no": {
                "label": "No",
                "type": "bool",
                "groups": ["g1"],
                "bind_states": {
                    "{value}==true": {"notes_no": "show"}
                },
            },
            "na": {
                "label": "N/A",
                "type": "bool",
                "groups": ["g1"],
                "bind_states": {
                    "{value}==true": {"notes_na": "show"}
                }
            },
            "maybe": {
                "label": "Maybe",
                "type": "bool",
                "groups": ["g1"],
                "bind_states": {
                    "{value}==true": {"notes_maybe": "show"}
                }
            },
            "notes_no": {
                "label": "What went wrong? ({min} to {max} characters)",
                "type": "str",
                "min": 32,
                "max": 4096,
                "required": true
            },
            "notes_maybe": {
                "label": "How can you do better in the future? ({min} to {max} characters)",
                "type": "str",
                "min": 32,
                "max": 4096,
                "required": true
            },
            "notes_na": {
                "label": "Oh you don't work here? ({min} to {max} characters)",
                "type": "str",
                "min": 3,
                "max": 4096
            }
        },
        "groups": {
            "g1": {
                "radio": true,
                "show": true,
                "required": true
            }
        },
        "order": ["g1", "notes_no", "notes_maybe", "notes_na"]
    };
}

function cmeta(consume) {
    return {
        collections: {
            'consumer': consume
        },
        points: {
            'lockable': {
                label: "Lockable",
                type: "bool",
                show: true,
                value: consume.lockable,
                bind_states: {
                    '{value}==True': {'consumer': 'lockable'}
                }
            }
        },
        order: ['lockable']
    };
}