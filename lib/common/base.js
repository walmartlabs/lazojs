/*global define:false*/

/**
 * Base object. Should be used to create all other objects.
 */
define(['backbone'], function (Backbone) {

    'use strict';

    var Base = function () {};

    Base.extend = Backbone.Model.extend;

    return Base;
});
