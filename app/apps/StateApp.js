/**

	Base objects for creating state apps

*/
define([
  // Application.
  "app",
],

function(app) {
	var debug = true;

	// define the State prototype object
	var State = function (options, stateApp) {
		this.options = _.defaults({}, options, this.defaults);
    this.stateApp = stateApp;
		this.initialize();
	};
	State.extend = Backbone.Model.extend; // use Backbone's extend for subclassing
	_.extend(State.prototype, Backbone.Events, {
		type: "state",
		initialize: function () {
			this.id = undefined;
			this.flow = { next: undefined, prev: undefined };
	    if (this.options.enter) {
	    	this.onEntry = this.options.enter;
	    }
	    this.view = this.view || this.options.view;
	    this.config = this.options.config;
		},

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
			if (debug) { console.log("[state:"+this.toString()+"] enter" + ((prevState !== undefined) ? " from " + prevState.toString() : "" )); }
			var result = this.onEntry(input, prevState);
			if (result !== undefined) {
				input = result;
			}
			if (input) {
				this.input = input;
			}

			var autoFlow = this.run();
			console.log("autoflow is ", autoFlow, this.flow);
			if (autoFlow !== false) {
				if (prevState === this.flow.next) {
					return this.prev();
				} else {
					return this.next();
				}
			}

			return this;
		},

		run: function () { }, // return false to not automatically go to next state

		exit: function () {
			if (debug) { console.log("[state:"+this.toString()+"] exit"); }
			var output = this.onExit() || this.input;
			return output;
		},

		onExit: function () {  }, // this can return a value to modify the output (default is the input)

		beforeNext: function () { },
		beforePrev: function () { },
		validateNext: function () { return true; },
		validatePrev: function () { return true; },

		// go to the next state
		next: function () {
			if (!this.validateNext()) {
				return false;
			}
			this.beforeNext();

			if (this.flow.next) {
				return this.flow.next.enter(this.exit(), this);
			}
			return this.flow.next;
		},

		// go to the previous state
		prev: function () {
			if (!this.validatePrev()) {
				return false;
			}

			this.beforePrev();

			if (this.flow.prev) {
				return this.flow.prev.enter(undefined, this);
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
			return this.name || this.id;
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

	// a state with a view to render
	var ViewState = State.extend({
		type: "view-state",
		beforeRender: function () { }, // no-op
		afterRender: function () { }, // no-op

		// called at the start of _render after beforeRender
		setViewOptions: function () {
			this.options.viewOptions = _.extend(this.options.viewOptions || {}, this.viewOptions());
		},

		// called at the start of _render after beforeRender (to be overridden by subclasses)
		viewOptions: function () {
			/* return { }; */
		},

		run: function () {
			this.render();
			return false; // do not go to next state automatically
		},

		render: function () {
			// ignore any changes up until render since we will call loadView with the current set of participants
			app.controller.participantUpdater.ignore = true;
			this.beforeRender();
			this.setViewOptions();
			this._render();

			app.controller.participantUpdater.ignore = false;
			this.afterRender();
		},

		// render the view of the state
		_render: function () {
			// render the view on an external viewer
			// TODO: Viewer1 shouldn't be hardcoded
			app.controller.appController.loadView(this.view, this.options.viewOptions, "Viewer1");
		},
	});

	// a collection of states that is run through repeatedly before exiting
	var RoundState = ViewState.extend({
		initialize: function () {
			ViewState.prototype.initialize.apply(this, arguments);
			this.roundCounter = 0;
			this.config.round = 0;
			this.roundOutputs = [];
			this.numRounds || (this.numRounds = 1);

			this.stateCounter = 0;
			this.currentState = null;

			// initialize substates
			this.states = [];
			_.each(this.States, function (State, i) {
				var state = new State(_.extend({
					config: this.config,
					roundOutputs: this.roundOutputs,
				}, this.options.stateOptions[i]));

				this.states.push(state);

				// link the states
				if (i > 0) {
					state.setPrev(this.states[i - 1]);
				}
			}, this);
		},

		isFirstState: function () {
			return this.currentState === this.states[0];
		},

		isFirstRound: function () {
			return this.roundCounter === 1;
		},

		isLastState: function () {
			return this.currentState === this.states[this.states.length - 1];
		},

		isLastRound: function () {
			return this.roundCounter === this.numRounds;
		},

		// returns what is saved after each round
		roundOutput: function (output) { },

		next: function () {
			if (this.isLastState()) {
				this.endRound();

				// final state, final round -> leave the round state
				if (this.isLastRound()) {
					return State.prototype.next.apply(this, arguments);
				} else {
					// start new round
					this.newRound(this.lastOutput);
				}
			} else { // not final state in round, so go to next
				this.currentState = this.currentState.next();
			}

			return this;
		},

		prev: function () {
			if (this.isFirstState()) {
				this.undoEndRound();

				// first state, first round -> leave the round state
				if (this.isFirstRound()) {
					return State.prototype.prev.apply(this, arguments);
				} else {
					this.undoNewRound();
				}
			} else {
				this.currentState = this.currentState.prev();
			}

			return this;
		},

		// used when prev'ing into an old round
		undoEndRound: function () {
			// put lastOutput as the previous rounds output
			this.lastOutput = this.roundOutputs[this.roundOutputs.length - 2]

			if (this.roundOutputs.length) {
				// delete the old round output
				delete this.roundOutputs[this.roundOutputs.length - 1];
				this.roundOutputs.length -= 1;
			}
		},

		// after last state in round
		endRound: function () {
			// exit the final state
			this.lastOutput = this.currentState.exit();

			// save the round output
			this.roundOutputs.push(this.roundOutput(this.lastOutput));
		},

		// used when prev'ing into an old round
		undoNewRound: function () {
			this.roundCounter -= 1;
			this.config.round = this.roundCounter;
			this.currentState = this.states[this.states.length - 1];
			this.currentState.enter.call(this.currentState);
		},

		// start at first state of round
		newRound: function (input) {
			this.roundCounter += 1;
			this.config.round = this.roundCounter;
			this.currentState = this.states[0];
			this.currentState.enter.call(this.currentState, input);
		},

		run: function () {
			this.newRound(this.input);

			return false; // do not automatically flow to next state
		},

		// delegate to current state
		render: function () {
			this.currentState.render();
		},


		onExit: function () {
			return this.currentState.exit();
		},

		// for debugging / logging
		nextString: function () {
			if (this.isLastState()) {
				if (this.isLastRound()) {
					return State.prototype.nextString.call(this);
				}
			}
			var stateCounter = _.indexOf(this.states, this.currentState) + 1;

			var nextStateCounter = (stateCounter % this.states.length) + 1;
			var nextRoundCounter = (stateCounter < nextStateCounter) ? this.roundCounter : this.roundCounter + 1;

			var str = this.stateString(stateCounter, this.roundCounter)
					+ " -> " + this.stateString(nextStateCounter, nextRoundCounter);

			return str;
		},

		stateString: function (stateCounter, roundCounter) {
			return (this.name || this.id) + "[" + roundCounter + "][" + stateCounter + "] " + this.states[stateCounter - 1].toString();
		},

		// for debugging / logging
		prevString: function () {
			if (this.isFirstState()) {
				if (this.isFirstRound()) {
					return State.prototype.prevString.call(this);
				}
			}
			var stateCounter = _.indexOf(this.states, this.currentState);

			var prevStateCounter = (stateCounter === 1) ? this.states.length : stateCounter - 1;
			var prevRoundCounter = (stateCounter > prevStateCounter) ? this.roundCounter : this.roundCounter - 1;

			var str = this.stateString(prevStateCounter, prevRoundCounter)
					+ " <- " + this.stateString(stateCounter, this.roundCounter);

			return str;
		},

		toString: function () {
			return (this.name || this.id) + "["+this.numRounds+" rounds, "+this.states.length+" states]";
		},
	});

	/**
	 * State App - prototype object
	 */
	var StateApp = Backbone.Model.extend({
		initialize: function (attrs, options) {
			if (this.defineStates) {
				this.defineStates();
			} else {
				this.states = this.options.states;
			}
			var stateKeys = _.keys(this.states);

			// set up the states
			if (stateKeys.length > 0) {
				// save the key of the state in the id property
				// and add a reference to the state app
				_.each(stateKeys, function (key) {
					this.states[key].id = key;
					this.states[key].stateApp = this;
				}, this);

				this.initialState = this.states[stateKeys[0]];
				this.set("currentState", this.states[stateKeys[0]]);
				this.loadState(this.initialState.id);
			}
		},

		loadState: function (id) {
			var state = this.states[id];
			if (state) {
				state.enter();
				this.set("currentState", state);
			} else {
				console.log("Could not load state ", id);
			}
		},

		next: function () {
      console.log("Next State:" + this.get("currentState").nextString());
			var result = this.get("currentState").next();
			if (result) { // only update current state if we reached a state (not null/undefined)
				this.set("currentState", result);
			}
		},

		prev: function () {
			console.log("Prev State:" + this.get("currentState").prevString());
			var result = this.get("currentState").prev();
			if (result) {
				this.set("currentState", result);
			}
		},

		configure: function (config) {
			// don't just set = to config in case states are referencing the existing object,
			// and in the event the full config isn't being overwritten
			this.config = _.extend(this.config, config);
			this.handleConfigure();
		},

		handleConfigure: function () {
			this.get("currentState").handleConfigure();
		}
	});

	return {
		State: State,
		ViewState: ViewState,
		RoundState: RoundState,
		App: StateApp,
	};
});