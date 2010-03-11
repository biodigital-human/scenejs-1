/**
 * SceneJS Example - Using the background node for skyboxing
 *
 * Lindsay Kay
 * lindsay.kay AT xeolabs.com
 * February 2010
 *
 * In this example we are using a stationary node to specify
 * a scene subtree that will rotate in accordance with the
 * higher lookAt view transform, but will never translate. Within
 * that subtree we'll define elements to make up a background that
 * will never move closer, no matter where the viewpoint moves to.
 *
 * Effectively, when defined as a sub-node of a lookAt, a stationary node
 * disables the effects of the lookAt's translation for its sub-nodes.
 *
 * One of the cool things about the stationary node is that you can
 * use it to created sophisticated animated backgrounds, because you
 * are free to populate it with the full gamut of model-space nodes
 * such as lights, geometry, modelling transforms, interpolators etc.
 *
 * You could also use it to create a gnomon that indicates the axii
 * of the view coordinate system.
 *
 */
with (SceneJS) {
    var exampleScene = scene({}, // node always has a config object

            renderer({
                canvasId: 'theCanvas',
                clearColor : { r:0, g:0, b:0.3, a: 1 },
                viewport: { x:0, y:0, width:1900, height:950 },
                clear : { depth : true, color : true} ,
                depthRange : { near: .5, far: 3000 }
            },
                    shader({ type: 'simple-shader' },

                            lights({
                                lights: [
                                    {
                                        pos: { x: 1000.0, y: 1000.0, z: 0.0 }
                                    }
                                ]},
                                    perspective({ fovy : 63.0, aspect : 2.0, near : .5, far : 2000.0
                                    },


                                        /* Viewing transform
                                         */
                                            lookAt(function(scope) {
                                                return{
                                                    eye : { x: 0.0, y: 0, z: scope.get("z")},
                                                    look : { x : 0.0, y : 0.0, z : 0 },
                                                    up : { x: 0.0, y: 1.0, z: 0.0 }
                                                };
                                            },
                                                    /* Stationary node - disables the lookAt node's
                                                     * translation for its subnodes
                                                     */
                                                    stationary({},
                                                            renderer({
                                                                enableTexture2D : true

                                                            },
                                                                    scale({ x:2000, y:100, z:2000 },
                                                                            objects.cube()
                                                                            )
                                                                    )

                                                            ),

                                                    material({
                                                        ambient:  { r:0.2, g:0.2, b:0.5 },
                                                        diffuse:  { r:0.6, g:0.6, b:0.9 }
                                                    },
                                                            generator(
                                                                    (function() {
                                                                        var elems = [];
                                                                        for (var i = 0; i < 150; i++) {
                                                                            elems.push({
                                                                                x: (150 * Math.random()) - 125.0,
                                                                                y: (150 * Math.random()) - 25.0,
                                                                                z: (1800 * Math.random()) - 250.0
                                                                            });
                                                                        }
                                                                        var j = 0;
                                                                        return function() {
                                                                            if (i < elems.length) {
                                                                                return { param: elems[i++] };
                                                                            } else {
                                                                                i = 0;
                                                                            }
                                                                        };
                                                                    })(),
                                                                    translate(function(scope) {
                                                                        return scope.get("param");
                                                                    },
                                                                            scale({ x:2, y:2, z:2 },

                                                                                    objects.teapot()

                                                                                    )
                                                                            )
                                                                    )

                                                            )
                                                    )
                                            )

                                    )
                            )
                    )

            ); // scene

    var zpos = -450;
    var p;

    function handleError(e) {
        if (e.message) {
            alert(e.message);
        } else {
            alert(e);
        }
        throw e;
    }

    function doit() {
        if (zpos > 500) {
            exampleScene.destroy();
            clearInterval(p);
        }

        zpos += 3.0;
        try {
            exampleScene.render({z:(zpos == 0 ? 0.1 : zpos)}); // Don't allow lookAt node's 'look' to equal its 'at'
        } catch (e) {
            clearInterval(p);
            handleError(e);
        }
    }

    /* Hack to get any scene definition exceptions up front.
     * Chrome seemed to absorb them in setInterval!
     */
    try {
        exampleScene.render({z:zpos});

        /* Continue animation
         */
        pInterval = setInterval("doit()", 10);
    } catch (e) {
        handleError(e);
    }


}