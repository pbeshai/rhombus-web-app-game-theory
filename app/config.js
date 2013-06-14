// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file and the JamJS
  // generated configuration file.
  deps: ["../vendor/jam/require.config", "main"],

  paths: {
    // Use the underscore build of Lo-Dash to minimize incompatibilities.
    "lodash": "../vendor/jam/lodash/dist/lodash.underscore",

    socketio: "../socket.io/socket.io",

    // JavaScript folders.
    plugins: "../vendor/js/plugins",
    vendor: "../vendor",

    d3: "../vendor/d3/d3.v2"

  },

  map: {
    // Ensure Lo-Dash is used instead of underscore.
    "*": { "underscore": "lodash" }

    // Put additional maps here.
  },

  shim: {
    // Backbone.CollectionCache depends on Backbone.
    "plugins/backbone.collectioncache": ["backbone"],


    // Twitter Bootstrap depends on jQuery.
    "vendor/bootstrap/js/bootstrap": ["jquery"],

    // jQuery plugins
    "plugins/jquery.svg": ["jquery"],
    "plugins/jquery.psToggleButton": ["jquery"],
    "plugins/jquery.toggleButton": ["jquery"],

    "socketio": [],

    "d3": {
      exports: 'd3'
    },

    "plugins/d3/nv.d3.js": {
      deps: ['d3'],
      exports: 'nv'
    }

    // // Backbone.ioBind
    // "plugins/backbone.iobind": ["socketio", "backbone"],
    // "plugins/backbone.iosync": ["socketio", "backbone"]
  }

});
