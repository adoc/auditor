define([
    'jquery',
    'underscore',
    'elements',
    'backbone',
    'text!elemental.html.tmpl'
    ],
    function ($, _, E, Backbone, elemental_tmpl) {
        var renderTemplate = function (tmpl, opts) {
            return _.template(tmpl,
                _.extend({
                    view: this
                }, opts || {})
            );
        }

        // No. I think the Elemental should implement the view...
        var ElementalView = Backbone.View.extend({
            initialize: function (el, elemental) {
                if (el) {
                    this.el = el;
                }
                else {
                    throw new E.ArgumentError("ElementalView.initialize requires an `el` parameter.");
                }
                // Should this instantiate its own Elemental??
                if (elemental instanceof E.Elemental) {
                    this.elemental = elemental;
                }
                else {
                    this.elemental = new E.Elemental(elemental);
                }
            },
            render: function () {
                this.$el.append(
                    renderTemplate.call(this, elemental_tmpl,
                                        {e: this.elemental}));
            }
        });

        return {ElementalView: ElementalView};
    });