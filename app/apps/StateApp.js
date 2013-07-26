/**

	Base objects for creating state apps

*/
define([
  // Application.
  "app",
],

function(app) {

	// define the State prototype object
	var State = function (options, stateApp) {
		this.name = "untitled state";
		this.stateApp = stateApp;
		this.flow = { next: undefined, prev: undefined };
    this.options = _.defaults({}, options, this.defaults);
    this.view = this.view || this.options.view;
    this.config = this.options.config;
    this.initialize();
	};
	State.extend = Backbone.Model.extend; // use Backbone's extend for subclassing
	_.extend(State.prototype, Backbone.Events, {
		initialize: function () { },
		getOutput: function () { }, // no-op
		beforeRender: function () { }, // no-op
		afterRender: function () { }, // no-op

		setNext: function(nextState, mutual) {
			mutual = (mutual === undefined) ? true : mutual; // default to mutual
			this.flow.next = nextState;
			if (nextState && mutual) {
				nextState.flow.prev = this;
			}
		},

		setPrev: function(prevState, mutual) {
			mutual = (mutual === undefined) ? true : mutual; // default to mutual
			this.flow.prev = prevState;

			if (prevState && mutual) {
				prevState.flow.next = this;
			}
		},

		// enter the state
		enter: function (input) {
			if (input) {
				this.input = input;
			}

			this.render();
		},

		// called at the start of _render, and renderView (to be overridden by subclasses)
		setViewOptions: function () {
		/* this.options.viewOptions = { } */
		},

		render: function () {
			this.beforeRender();
			this.setViewOptions();
			this._render();
			this.afterRender();
		},

		// render the view of the state
		_render: function () {
			this.viewInstance = new this.view(this.options.viewOptions);
			app.layout.setView("#main-content", this.viewInstance);
			app.layout.render();
		},

		renderView: function () {
			if (this.viewInstance) {
				// update options
				this.setViewOptions();
				_.extend(this.viewInstance.options, this.options.viewOptions);
				console.log("VIEW OPTIONS", this.viewInstance.options, this.options.viewOptions);
				this.viewInstance.render();
			} else {
				throw "render view with no view instance";
			}
		},

		// go to the next state
		next: function () {
			if (!this.validateNext()) {
				return false;
			}

			if (this.flow.next) {
				this.flow.next.enter(this.getOutput());
			}
			return this.flow.next;
		},

		validateNext: function () { return true; },
		validatePrev: function () { return true; },

		// go to the previous state
		prev: function () {
			if (!this.validatePrev()) {
				return false;
			}


			if (this.flow.prev) {
				this.flow.prev.enter();
			}
			return this.flow.prev;
		},

	// commonly used to log results via an API call
		log: function (apiCall, data) {
      var logData = _.extend({
        config: this.config,
        version: this.stateApp.version,
      }, data);

      console.log("Logging", logData);
      app.api({ call: apiCall, type: "post", data: logData });
    },

		// can be called when a state app configures itself (perhaps a new config is set)
		handleConfigure: function () {}
	});

	/**
	 * State App - prototype object
	 */
	var StateApp = function (options) {
		this.options = options || {};
		if (this.options.autoInit !== false) {
			this.initialize();
		}
	};
	StateApp.extend = Backbone.Model.extend; // use Backbone's extend function for subclassing
	_.extend(StateApp.prototype, {
		initialize: function () {

			if (this.defineStates) {
				this.defineStates();
			} else {
				this.states = this.options.states;
			}
			var stateKeys = _.keys(this.states);

			// set up the states
			if (stateKeys.length > 0) {
				// save the key of the state in the name property
				// and add a reference to the state app
				_.each(stateKeys, function (key) {
					this.states[key].name = key;
					this.states[key].stateApp = this;
				}, this);

				this.initialState = this.currentState = this.states[stateKeys[0]];
			}

			if (this.options.initialize) {
				this.options.initialize.call(this);
			}

			this.loadState(this.initialState.name);
			var that = this;
		},

		loadState: function (name) {
			var state = this.states[name];
			if (state) {
				state.enter();
				this.currentState = state;
			} else {
				console.log("Could not load state ", name);
			}
		},

		next: function () {
			if (this.currentState.flow.next) {
				this.transition(this.currentState.flow.next.name);
			}
		},

		prev: function () {
			if (this.currentState.flow.prev) {
				this.transition(this.currentState.flow.prev.name);
			}
		},

		configure: function (config) {
			// don't just set = to config in case states are referencing the existing object,
			// and in the event the full config isn't being overwritten
			this.config = _.extend(this.config, config);
			this.handleConfigure();
		},

		handleConfigure: function () {
			this.currentState.handleConfigure();
		},

		// calls function this.transitions.<currentState>_<destinationState>(currentStateOutput);
		transition: function (destinationState) {
			var output = this.currentState.getOutput();
			var transitionFunc = this.transitions[this.currentState.name + "_" + destinationState];
			if (transitionFunc) {
				try {
					// allow updating the output via returning a value from a transition function
					var result = transitionFunc.apply(this, [output]);
					if (result !== undefined) {
						output = result;
					}
				} catch (e) {
					console.log("error transitioning " + e);
					return;
				}
			}
			this.currentState = this.states[destinationState];
			this.currentState.enter(output);
		},

		// register the app in the router. sets up controls and general nav
		register: function (router) {
			router.registerApp({
				id: "no-id",
				instantiate: function () { },
				controls: null
			});
		}
	});

	var defineApp = function (ParentApp, properties) {
		if (arguments.length === 1) { // ParentState is an optional first argument (defaults to State)
			properties = ParentApp;
			ParentApp = StateApp;
		}

		var DefApp = function (options) {
			this.options = options || {};
			this.config = _.extend(this.config || {}, this.options.config);
			console.log("initializing app", this);
			this.initialize();
	  };

	  DefApp.prototype = new ParentApp();
  	_.extend(DefApp.prototype, properties);
  	DefApp.extend = StateApp.extend;

  	return DefApp;
	}

	return {
		State: State,
		App: StateApp,
	};
});