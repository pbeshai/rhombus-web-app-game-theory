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
		this.beforeRender();
		this.render();
		this.afterRender();
	};

	// render the view of the state
	State.prototype.render = function () {
		app.layout.setView("#main-content", new this.view(this.options.viewOptions));
		app.layout.render();
	};

	// go to the next state
	State.prototype.next = function () {
		if (this.flow.next) {
			this.flow.next.enter(this.getOutput());
		}
		return this.flow.next;
	};

	// go to the previous state
	State.prototype.prev = function () {
		if (this.flow.prev) {
			this.flow.prev.enter();
		}
		return this.flow.prev;
	};

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
		app.stateController.on("app-next", function () {
			console.log("next", that);
			that.next();
		});
		app.stateController.on("app-prev", function () {
			that.prev();
		})
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

	// calls function this.transitions.<currentState>_<destinationState>(currentStateOutput);
	StateApp.prototype.transition = function (destinationState) {
		var output = this.currentState.getOutput();
		var transitionFunc = this.transitions[this.currentState.name + "_" + destinationState];
		if (transitionFunc) {
			transitionFunc.apply(this, [output]);
		}
		this.currentState = this.states[destinationState];
		this.currentState.enter(output);
	};

	return {
		State: State,
		App: StateApp
	};
});