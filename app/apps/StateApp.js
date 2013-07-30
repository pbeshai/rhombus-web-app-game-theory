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
    if (this.options.enter) {
    	this.onEntry = this.options.enter;
    }
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

		// return value becomes this.input
		onEntry: function (input, prevState) { },

		// enter the state
		enter: function (input, prevState) {
			var result = this.onEntry(input, prevState);
			if (result !== undefined) {
				input = result;
			}
			if (input) {
				this.input = input;
			}

			this.render();

			return this;
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
				this.viewInstance.render();
			} else {
				throw "render view with no view instance";
			}
		},

		beforeNext: function () { },
		beforePrev: function () { },
		validateNext: function () { return true; },
		validatePrev: function () { return true; },

		// go to the next state
		next: function (output) {
			if (!this.validateNext()) {
				return false;
			}
			this.beforeNext();

			if (this.flow.next) {
				this.flow.next.enter(output || this.getOutput(), this);
			}
			return this.flow.next;
		},

		// go to the previous state
		prev: function (output) {
			if (!this.validatePrev()) {
				return false;
			}

			this.beforePrev();

			if (this.flow.prev) {
				this.flow.prev.enter(output || this.getOutput(), this);
			}
			return this.flow.prev;
		},

		// for debugging / logging
		nextString: function () {
			var nextState = this.flow.next ? this.flow.next.toString() : "#";
	  	return this.toString() + " -> " + nextState;
		},

		// for debugging / logging
		prevString: function () {
			var prevState = this.flow.prev ? this.flow.prev.toString() : "#";
	  	return prevState + " <- " + this.toString();
		},

		toString: function () {
			return this.name;
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

	// a collection of states that is run through repeatedly before exiting
	var RoundState = State.extend({
		initialize: function () {
			this.stateCounter = 1;
			this.roundCounter = 1;
			this.currentState = null;
			this.roundOutputs = [];
			this.numRounds || (this.numRounds = 1);
		},

		isFirstState: function () {
			return this.stateCounter === 1;
		},

		isFirstRound: function () {
			return this.roundCounter === 1;
		},

		isLastState: function () {
			return this.stateCounter === this.states.length;
		},

		isLastRound: function () {
			return this.roundCounter === this.numRounds;
		},

		// returns what is saved after each round
		roundOutput: function (output) { },

		next: function () {
			this.currentState.beforeNext();
			var output = this.lastOutput = this.currentState.getOutput();

			if (this.isLastState()) {
				// save the round output
				this.roundOutputs[this.roundCounter] = this.roundOutput(output);

				if (this.isLastRound()) {
					return State.prototype.next.apply(this, arguments);
				} else {
					// start new round
					this.stateCounter = 1;
					this.roundCounter += 1;
					this.config.round = this.roundCounter;
				}
			} else {
				this.stateCounter += 1;
			}

			this.enter(output, this.currentState);
			return this;
		},

		prev: function () {
			this.currentState.beforePrev();
			if (this.isFirstState()) {
				// erase round output from this round before leaving it
				delete this.roundOutputs[this.roundCounter];

				if (this.isFirstRound()) {
					return State.prototype.prev.apply(this, arguments);
				} else {
					// return to previous round
					this.stateCounter = this.states.length;
					this.roundCounter -= 1;
					this.config.round = this.roundCounter;
				}
			} else {
				this.stateCounter -= 1;
			}

			this.enter(this.currentState.getOutput(), this.currentState);
			return this;
		},

		enter: function (input, prevState) {
			var result = this.onEntry(input, prevState);
			if (result) {
				input = result;
			}
			this.config.round = this.roundCounter;

			this.currentState = new this.states[this.stateCounter - 1](_.extend({
				config: this.config,
				roundOutputs: this.roundOutputs,
			}, this.options.stateOptions[this.stateCounter - 1]));
			this.currentState.enter.apply(this.currentState, arguments);

			return this;
		},

		// delegate to current state
		render: function () {
			this.currentState.render();
		},

		renderView: function () {
			this.currentState.renderView();
		},

		getOutput: function () {
			return this.currentState.getOutput();
		},

		// for debugging / logging
		nextString: function () {
			if (this.isLastState()) {
				if (this.isLastRound()) {
					return State.prototype.nextString.call(this);
				}
			}

			var nextStateCounter = (this.stateCounter % this.states.length) + 1;
			var nextRoundCounter = (this.stateCounter < nextStateCounter) ? this.roundCounter : this.roundCounter + 1;

			var str = this.stateString(this.stateCounter, this.roundCounter)
					+ " -> " + this.stateString(nextStateCounter, nextRoundCounter);

			return str;
		},

		stateString: function (stateCounter, roundCounter) {
			return this.name + "[" + roundCounter + "][" + stateCounter + "]";
		},

		// for debugging / logging
		prevString: function () {
			if (this.isFirstState()) {
				if (this.isFirstRound()) {
					return State.prototype.prevString.call(this);
				}
			}

			var prevStateCounter = (this.stateCounter === 1) ? this.states.length : this.stateCounter - 1;
			var prevRoundCounter = (this.stateCounter > prevStateCounter) ? this.roundCounter : this.roundCounter - 1;

			var str = this.stateString(prevStateCounter, prevRoundCounter)
					+ " <- " + this.stateString(this.stateCounter, this.roundCounter);

			return str;
		},

		toString: function () {
			return this.name + "["+this.numRounds+" rounds, "+this.states.length+" states]";
		},
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
			var result = this.currentState.next();
			if (result) { // only update current state if we reached a state (not null/undefined)
				this.currentState = result;
			}
		},

		prev: function () {
			var result = this.currentState.prev();
			if (result) {
				this.currentState = result;
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
		}
	});

	return {
		State: State,
		RoundState: RoundState,
		App: StateApp,
	};
});