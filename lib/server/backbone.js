define(['backboneServer'], function (Backbone) {

    var noop = function () {};

    // ignore client events on server
    Backbone.Events.on = noop;
    Backbone.Events.off = noop;
    Backbone.Events.trigger = noop;
    Backbone.Events.once = noop;
    Backbone.Events.listenTo = noop;
    Backbone.Events.stopListening = noop;
    Backbone.Events.listenToOnce = noop;

    Backbone.Model.prototype.on = noop;
    Backbone.Model.prototype.off = noop;
    Backbone.Model.prototype.trigger = noop;
    Backbone.Model.prototype.once = noop;
    Backbone.Model.prototype.listenTo = noop;
    Backbone.Model.prototype.stopListening = noop;
    Backbone.Model.prototype.listenToOnce = noop;

    Backbone.Collection.prototype.on = noop;
    Backbone.Collection.prototype.off = noop;
    Backbone.Collection.prototype.trigger = noop;
    Backbone.Collection.prototype.once = noop;
    Backbone.Collection.prototype.listenTo = noop;
    Backbone.Collection.prototype.stopListening = noop;
    Backbone.Collection.prototype.listenToOnce = noop;

    Backbone.View.prototype.on = noop;
    Backbone.View.prototype.off = noop;
    Backbone.View.prototype.trigger = noop;
    Backbone.View.prototype.once = noop;
    Backbone.View.prototype.listenTo = noop;
    Backbone.View.prototype.stopListening = noop;
    Backbone.View.prototype.listenToOnce = noop;

    // Do not use Backbone history on server
    Backbone.history.start = noop;

    // Disable view events on server
    Backbone.View.prototype._ensureElement = noop;
    Backbone.View.prototype.delegateEvents = noop;
    Backbone.View.prototype.undelegateEvents = noop;

    return Backbone;

});
