/**

	Base objects for creating state apps

*/
define([
  // Application.
  "app",
],

function(app) {

	// define the State prototype object
	var State = function (view, stateApp) {
		this.name = "untitled state";
		this.view = view;
		this.flow = {};
		this.options = {};
		this.flow.next = undefined;
		this.flow.prev = undefined;
		this.stateApp = stateApp;
	};
	_.extend(State.prototype, Backbone.Events);
	State.prototype.initialize = function () { };
	State.prototype.getOutput = function () { }; // no-op
	State.prototype.beforeRender = function () { }; // no-op
	State.prototype.afterRender = function () { }; // no-op

	State.prototype.setNext = function(nextState, mutual) {
		mutual = (mutual === undefined) ? true : mutual; // default to mutual
		this.flow.next = nextState;
		if (nextState && mutual) {
			nextState.flow.prev = this;
		}
	};

	State.prototype.setPrev = function(prevState, mutual) {
		mutual = (mutual === undefined) ? true : mutual; // default to mutual
		this.flow.prev = prevState;

		if (prevState && mutual) {
			prevState.flow.next = this;
		}
	};

	// enter the state
	State.prototype.enter = function (input) {
		if (input) {
			this.input = input;
		}

		this.render();
	};

	// called at the start of _render, and renderView (to be overridden by subclasses)
	State.prototype.setViewOptions = function () {
		/* this.options.viewOptions = { } */
	}

	State.prototype.render = function () {
		this.beforeRender();
		this.setViewOptions();
		this._render();
		this.afterRender();
	};

	// render the view of the state
	State.prototype._render = function () {
		this.viewInstance = new this.view(this.options.viewOptions);
		app.layout.setView("#main-content", this.viewInstance);
		app.layout.render();
	};

	State.prototype.renderView = function () {
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
	State.prototype.next = function () {
		if (!this.validateNext()) {
			return false;
		}

		if (this.flow.next) {
			this.flow.next.enter(this.getOutput());
		}
		return this.flow.next;
	};

	State.prototype.validateNext = function () { return true; }
	State.prototype.validatePrev = function () { return true; }

	// go to the previous state
	State.prototype.prev = function () {
		if (!this.validatePrev()) {
			return false;
		}


		if (this.flow.prev) {
			this.flow.prev.enter();
		}
		return this.flow.prev;
	};

	// commonly used to log results via an API call
	State.prototype.log = function (apiCall, data) {
      var logData = _.extend({
        config: this.config,
        version: this.stateApp.version,
      }, data);

      console.log("Logging", logData);
      app.api({ call: apiCall, type: "post", data: logData });
    },

	// can be called when a state app configures itself (perhaps a new config is set)
	State.prototype.handleConfigure = function () {}

	/**
	 * State App - prototype object
	 */
	var StateApp = function (options) {
		this.options = options;
	};
	StateApp.prototype.initialize = function () {

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
	};
	StateApp.prototype.loadState = function (name) {
		var state = this.states[name];
		if (state) {
			state.enter();
			this.currentState = state;
		} else {
			console.log("Could not load state ", name);
		}
	};
	StateApp.prototype.next = function () {
		if (this.currentState.flow.next) {
			this.transition(this.currentState.flow.next.name);
		}
	};
	StateApp.prototype.prev = function () {
		if (this.currentState.flow.prev) {
			this.transition(this.currentState.flow.prev.name);
		}
	};
	StateApp.prototype.configure = function (config) {
		// don't just set = to config in case states are referencing the existing object,
		// and in the event the full config isn't being overwritten
		this.config = _.extend(this.config, config);
		this.handleConfigure();
	};
	StateApp.prototype.handleConfigure = function () {} // no-op, to be overridden

	// calls function this.transitions.<currentState>_<destinationState>(currentStateOutput);
	StateApp.prototype.transition = function (destinationState) {
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
	};

	// register the app in the router. sets up controls and general nav
	StateApp.prototype.register = function (router) {
		router.registerApp({
			id: "no-id",
			instantiate: function () { },
			controls: null
		});
	};

	// properties must include a view property e.g. view: CoinMatching.Views.Play.Layout
	// extendState([ParentState,] properties)
	var defineState = function (ParentState, properties) {
		if (arguments.length === 1) { // ParentState is an optional first argument (defaults to State)
			properties = ParentState;
			ParentState = State;
		}

		var DefState = function (options) {
			this.flow = { next: undefined, prev: undefined };
	    this.options = _.defaults({}, options, this.defaults);
	    this.config = this.options.config; // commonly passed option done here to avoid always overriding initialize
	    this.initialize();
	  };
	  DefState.prototype = new ParentState();
  	_.extend(DefState.prototype, properties);

  	return DefState;
	}

	return {
		State: State,
		App: StateApp,
		defineState: defineState
	};
});