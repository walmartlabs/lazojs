define(['base'], function (Base) {

    /**
     * By extending the Syncher class developers are able write code that can directly
     * interact with any data store.  All methods on the Syncher are expected to be asynchronous.
     *
     * If a Syncher exists it will be used by the framework to back a Backbone model or collection.
     * Essentially becoming the sync for the model or collection.
     *
     * If you need to connect to a standard REST endpoint consider using {{#crossLink "LazoModel"}}{{/crossLink}}
     * or {{#crossLink "LazoCollection"}}{{/crossLink}}.
     *
     * @class Syncher
     * @constructor
     */
    var Syncher = Base.extend({

        /**
         * Handle to service proxy which can be used to fetch data from services. See {{#crossLink "ServiceProxy"}}{{/crossLink}}
         *
         * @property proxy
         * @type ServiceProxy
         */

        /**
         * The fetch method will be called when the LAZO.app's or LazoController's loadModel or loadCollection method is executed.
         * @method fetch
         * @param {Object} options The options specified in a call to loadModel or loadCollection
         *      @param {Function} options.success Callback function to be called when fetch succeeds, passed <code>(response)</code> as argument.
         *      @param {Function} options.error Callback function to be called when fetch fails, passed <code>(response)</code> as argument.
         * @return must call the success or error callback passing the response
         */
        fetch: function(options) {
            throw new Error('fetch method not implemented provided');
        },

        /**
         * The add method will be called when the LAZO.app's or LazoController's create method is executed.
         * @method add
         * @param {Object} attributes A hash of the model's state that will be the attributes a new model
         * @param {Object} options  The options specified in a call to a model's save method
         *      @param {Function} options.success Callback function to be called when add succeeds, passed <code>(response)</code> as argument.
         *      @param {Function} options.error Callback function to be called when add fails, passed <code>(response)</code> as argument.
         * @return must call the success or error callback passing the response
         */
        add: function(attributes, options) {
            throw new Error('add method not implemented provided');
        },

        /**
         * The update method will be called when the LazoModel's save method is executed.
         * @method update
         * @param {Object} attributes A hash of the model's state that will update the attributes of a model
         * @param {Object} options  The options specified in a call to a model's save method
         *      @param {Function} options.success Callback function to be called when update succeeds, passed <code>(response)</code> as argument.
         *      @param {Function} options.error Callback function to be called when update fails, passed <code>(response)</code> as argument.
         * @return must call the success or error callback passing the response
         */
        update: function(attributes, options) {
            throw new Error('update method not implemented provided');
        },

        /**
         * The destroy method will be called when the LazoModel's destroy method is executed.
         * @method destroy
         * @param {Object} options  The options specified in a call to a model's destroy method
         *      @param {Function} options.success Callback function to be called when destroy succeeds, passed <code>(response)</code> as argument.
         *      @param {Function} options.error Callback function to be called when destroy fails, passed <code>(response)</code> as argument.
         * @return must call the success or error callback passing the response
         */
        destroy: function(options) {
            throw new Error('destroy method not implemented provided');
        }
    });

    return Syncher;
});