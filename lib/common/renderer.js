define(['underscore'], function (_) {

    'use strict';

    return {

        // Matches an HTML tag in a string of HTML based on an attribute and value.
        getInsertIndex: function (attr, val, html) {
            var regex = new RegExp('<[^<]*' + attr + '+=["||\']' + val + '["||\']+.*?>');
            return html.match(regex);
        },

        // Gets the HTML based on a rendering directive or a view branch in the directive.
        getHtml: function (directive, key, nodeType) {
            var rootNode,
                self = this,
                html,
                buffer = '',
                isRootNodeContainer = nodeType === 'container',
                retVal,
                match;

            switch (nodeType) {
                case 'view':
                    rootNode = this.findView(directive, key).parent;
                    break;
                case 'container':
                    rootNode = this.findContainer(directive, key);
                    buffer = '<div ' + this._attrs.compContainerName + '="' + key + '"></div>'; // create wrapper; removed before return
                    break;
                default:
                    rootNode = directive;
                    break;
            }

            function processNode(node, htmlBuffer, nodeKey) {
                var children,
                    nodeType = self._getNodeType(node),
                    viewNode;

                if (!nodeKey) { // this condition only occurs on the first pass when a view or container is re-rendered on the client
                    htmlBuffer = self._getNodeHtml(node, htmlBuffer);
                }
                if (isRootNodeContainer && nodeKey) { // container re-render
                    children = node;
                }

                if (children || (children = self._getChildren(node)).length) {
                    if (isRootNodeContainer && nodeKey) { // reverse nodes on first pass for container re-render
                        children.reverse();
                    }
                    if (nodeType === 'component' && children.length > 1) {
                        viewNode = children.reverse().pop(); // need to reverse component order rendering and get view node
                        children.unshift(viewNode); // ensure view is rendered first
                    }

                    _.each(children, function (child) {
                        htmlBuffer = processNode(child, htmlBuffer);
                    });
                }

                return htmlBuffer;
            }

            retVal = processNode(_.extend(rootNode, { parent: this.getParent(rootNode) }), buffer, key);

            if (isRootNodeContainer) { // the wrapper was programmatically constructed, so it is safe to unwrap it
                match = this.getInsertIndex(this._attrs.compContainerName, key, retVal);
                retVal = retVal.substr(match[0].length, (retVal.length - (match[0].length + 6)));
            }

            return retVal;
        },

        attachViews: function (rootNode) {
            var views = this.getList('view', rootNode), // if rootNode is !specified then use last rendered stack
                self = this;

            _.each(views, function (view) {
                self.attachView(view, $('[' + self._attrs.viewId + '="' + view.cid + '"]')[0]);
                if (_.isFunction(view.attachItemViews)) {
                    view.attachItemViews();
                }
            });

            return this;
        },

        attachView: function (view, el) {
            view.setElement(el);
            view.afterRender();
        },

        getList: function (nodeType, rootNode) {
            var self = this,
                retVal,
                nodes = [];

            function flatten(nodeType, node, nodes) {
                var children;

                if (node && nodeType === self._getNodeType(node)) {
                    nodes.push(node);
                }

                if ((children = self._getChildren(node)).length) {
                    _.each(children, function (child) {
                        flatten(nodeType, child, nodes);
                    });
                }

                return nodes;
            }

            if (nodeType === 'container') {
                _.each(flatten('component', rootNode, []), function (component) {
                    if (component.children) {
                        _.each(component.children, function (container) {
                            nodes.push(_.extend(container, { parent: component }));
                        });
                    }
                });
                return nodes;
            } else {
                retVal = flatten(nodeType, rootNode, []);
            }

            return retVal;
        },

        findView: function (rootNode, viewKey) {
            return _.find(this.getList('view', rootNode), function (view) {
                return view.cid === viewKey;
            });
        },

        findContainer: function (rootNode, containerKey) {
            var containers = this.getList('container', rootNode),
                parentComponentChildren;

            for (var k in containers) {
                parentComponentChildren = containers[k].parent.children;

                if (containerKey in parentComponentChildren) {
                    return parentComponentChildren[containerKey];
                }
            }
        },

        getParent: function (node) {
            return node.parent;
        },

        // Clean up view DOM bindings and event listeners.
        cleanup: function (rootNode, viewKey) {
            var views = this.getList('view', this.findView(rootNode, viewKey)),
                self = this;

            _.each(views, function (view) {
                self.cleanupView(view);
            });

            return this;
        },

        cleanupView: function (view) {
            if (_.isFunction(view.onRemove)) {
                view.onRemove();
            }
            if (_.isFunction(view._onRemove)) {
                view._onRemove();
            }
            view.stopListening();
            view.undelegateEvents();
        },

        // Data attribute keys for related HTML tags.
        _attrs: {
            cmpName: 'lazo-cmp-name',
            cmpId: 'lazo-cmp-id',
            compContainerName: 'lazo-cmp-container',
            viewId: 'lazo-view-id'
        },

        // Inserts a node's html into an HTML string based on its position in the rendering directive.
        _insertNodeHtml: function (node, html) {
            var htmlOpen,
                htmlClose,
                match,
                i = 0,
                siblings,
                nodeType = this._getNodeType(node),
                errMsg;

            if (nodeType === 'component') {
                if ((siblings = this._getComponentSiblings(node))) {
                    while (!match && siblings.nodes[i]) { // find index of last cmp added to parent container
                        match = this.getInsertIndex(this._attrs.cmpId, siblings.nodes[i].name, html);
                        i++;
                    }
                }
                if (!match) {
                    match = this.getInsertIndex(this._attrs.compContainerName, siblings.container, html);
                }
            } else { // view
                if (!html.length) { // a view was re-rendered on the client, so it does not have any wrapping html
                    return node.html;
                }

                match = this.getInsertIndex(this._attrs.cmpId, node.parent.cid, html, 1);
            }

            if (!match) {
                errMsg = nodeType === 'component' ? ('component ' + node.name) : ('view ' + (node.name || node.cid));
                throw 'The parent node for ' + errMsg + ' was not found.';
            }

            htmlOpen = html.substr(0, match.index + match[0].length);
            htmlClose = html.substr(match.index + match[0].length);
            return htmlOpen + node.html + htmlClose;
        },

        // Gets the HTML string representation of a node.
        _getNodeHtml: function (node, html) {
            switch (this._getNodeType(node)) {
                case 'container':
                    return html; // parent node should contain this markup
                case 'component':
                    node.html = '<div ' + this._attrs.cmpName + '="' + node.name + '" ' + this._attrs.cmpId + '="' + node.cid + '"></div>';
                    if (!node.parent) { // root component
                        return node.html;
                    }
                    break;
                case 'view':
                    node.html = node.getHtml(); // TODO: possibly only getInnerHtml for root
                    if (node.root) { // get html for a view branch
                        return node.html;
                    }
                    break;
            }

            return this._insertNodeHtml(node, html);
        },

        // Gets the siblings of a component including the component passed.
        _getComponentSiblings: function (component) {
            var children = component.parent.children,
                siblings;

            for (var key in children) {
                if ((siblings = _.find(children[key], function (cmp) {
                    return cmp.cid === component.cid;
                }))) {
                    siblings = {
                        container: key,
                        nodes: children[key]
                    };
                    break;
                }
            }
            return siblings;
        },

        // Gets the children of a node.
        _getChildren: function (node) {
            var nodes = [],
                self = this,
                childrenKey,
                nodeType = this._getNodeType(node);
            if (!_.size(node)) {
                return nodes;
            }

            switch (nodeType) {
                case 'view':
                case 'container':
                    return nodes; // just return an empty array
                case 'component':
                    nodes.push(_.extend(node.currentView, { parent: node }));
                    if (node.children) {
                        _.each(node.children, function (container) {
                            nodes = nodes.concat(_.map(container, function (childComponent) {
                                return _.extend(childComponent, { parent: node });
                            }));
                        });
                    }
                    return nodes;
                default:
                    return nodes;
            }
        },

        _getNodeType: function (node) {
            var ret;

            if (!node) {
                ret = null;
            } else if (node.currentView) {
                ret = 'component';
            } else if (node.setElement) {
                ret = 'view';
            } else {
                ret = 'container';
            }

            return ret;
        }

    };

});