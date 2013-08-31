// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file and the JamJS
  // generated configuration file.
  // deps: ["../vendor/jam/require.config", "main"],
  deps: ["main"],

  packages: [
    {
      "name": "backbone",
      "location": "../vendor/jam/backbone",
      "main": "backbone.js"
    },
    {
      "name": "backbone.layoutmanager",
      "location": "../vendor/jam/backbone.layoutmanager",
      "main": "backbone.layoutmanager.js"
    },
    {
      "name": "jquery",
      "location": "../vendor/jam/jquery",
      "main": "dist/jquery.js"
    },
    {
      "name": "lodash",
      "location": "../vendor/jam/lodash",
      "main": "./dist/lodash.compat.js"
    },
    {
      "name": "underscore",
      "location": "../vendor/jam/underscore",
      "main": "underscore.js"
    }
  ],

  paths: {
    // Use the underscore build of Lo-Dash to minimize incompatibilities.
    "lodash": "../vendor/jam/lodash/dist/lodash.underscore",

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
    "backbone": {
      "deps": [
        "underscore",
        "jquery"
      ],
      "exports": "Backbone"
    },
    "backbone.layoutmanager": {
      "deps": [
        "jquery",
        "backbone",
        "underscore"
      ],
      "exports": "Backbone.LayoutManager"
    },
    "underscore": {
      "exports": "_"
    },

    // Backbone.CollectionCache depends on Backbone.
    "plugins/backbone.collectioncache": ["backbone"],


    // Twitter Bootstrap depends on jQuery.
    "vendor/bootstrap/js/bootstrap": ["jquery"],

    "socketio": [],

    "d3": {
      exports: 'd3'
    },

    "plugins/d3/d3.layout": ["d3"],

    "plugins/d3/rickshaw": {
      deps: ['d3', 'plugins/d3/d3.layout'],
      exports: 'Rickshaw'
    }
  },
});