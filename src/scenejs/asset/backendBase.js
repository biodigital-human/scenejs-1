/**
 * Base for backends for the asset scene node. This is extended for each file type.
 */
SceneJs.assetBackend = function(cfg) {

    if (!cfg.type) {
        throw new SceneJs.exceptions.NodeConfigExpectedException("Asset backend config missing: type");
    }

    if (!cfg.parse) {
        throw new SceneJs.exceptions.NodeConfigExpectedException("Asset backend config missing: parser");
    }

    return new (function() {
        this.type = cfg.type; // File extension type

        var ctx;

        this.install = function(_ctx) {
            ctx = _ctx;

            if (!ctx.assets) {  // Lazy-create parser registry

                ctx.assets = new function() {

                    var date = new Date(); // Used for generating unique JSONP callbacks
                    var importers = {}; // Backend extensions each create one of these
                    var entries = {}; // Nodes created by parsers, cached against file name
                    var evictionCountdown = 1000;

                    var evict = function() {
                        if (--evictionCountdown == 0) {
                            //                            for (var src in entries) {
                            //                                var entry = entries[src];
                            //                                if (--entry.timeToLive < 0) {
                            //                                    entries[src] = undefined;
                            //                                }
                            //                            }
                            evictionCountdown = 1000;
                        }
                    };

                    /** Installs parser function provided in extension's configs
                     */
                    this.installImporter = function(cfg) {
                        importers[cfg.type] = {
                            type: cfg.type,
                            parse: cfg.parse
                        };
                    };

                    var jsonp = function(fullUri, callback, callbackName) {
                        var head = document.getElementsByTagName("head")[0];
                        var script = document.createElement("script");
                        script.type = "text/javascript";
                        script.src = fullUri;
                        window[callbackName] = function(data) {
                            callback(data);
                            window[callbackName] = undefined;
                            try {
                                delete window[callbackName];
                            } catch(e) {
                            }
                            head.removeChild(script);
                            ctx.scenejs.processes.processStopped();   // Notify load is finished
                        };
                        ctx.scenejs.processes.processStarted(); // Notify load started
                        head.appendChild(script);
                    };

                    this.getAsset = function(uri) {
                        var entry = entries[uri];
                        if (entry) {
                            entry.timeToLive--;
                            //    evict();
                            return entry.node;
                        }
                        return null;
                    };

                    /** Imports file and returns node result. caches node against given file name.
                     */
                    this.loadAsset = function(proxy, uri, type, callback) {
                        var importer = importers[type];
                        if (!importer) {
                            throw "No asset node backend registered for file type: \"" + type + "\"";
                        }
                        var callbackName = "callback" + date.getTime();
                        jsonp(proxy + "?callback=" + callbackName + "&uri=" + uri,
                                function(data) {
                                    if (!data) { // TODO: be way more specific about asset load failures, but what can we determine here since it's asynch?
                                        throw new SceneJs.exceptions.AssetLoadFailureException("Asset load failed", uri, proxy);
                                    }
                                    var assetNode = importer.parse(data);
                                    if (!assetNode || (typeof assetNode != 'function')) {
                                        throw new SceneJs.exceptions.AssetLoadFailureException("Asset load failed - parser failure? ", uri, proxy);
                                    }
                                    entries[uri] = {
                                        node: assetNode,
                                        timeToLive : 1000
                                    };
                                    callback(assetNode);
                                },
                                callbackName);
                    };

                    /** Clears nodes cached from previous imports.
                     */
                    this.clearAssets = function() {
                        entries = {};
                    };
                };
            }

            /** Install parser function for backend extension
             */
            ctx.assets.installImporter(cfg);
        };

        // Methods for client asset node

        /** Looks for currently loaded asset, which may have been evicted after lack of recent use
         */
        this.getAsset = function(uri) {
            return ctx.assets.getAsset(uri);
        };

        /** Imports the given file and returns a new child for the client asset node
         */
        this.loadAsset = function(proxy, uri, callback) {
            return ctx.assets.loadAsset(proxy, uri, cfg.type, callback);
        };

        /** Frees resources held by this backend (ie. parsers and cached scene graph fragments)
         */
        this.reset = function() {
            ctx.assets.clearAssets();
        };
    }
            )
            ();
};