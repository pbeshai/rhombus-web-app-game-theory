/**

	Simple App for testing. Goes from Attendance -> Grid view.

*/
define([
  // Application.
  "app",

  "modules/Participant",
  "modules/Attendance",
  "modules/Grid"
],

function(app, Participant, Attendance, Grid) {

	// define the State prototype object
	var State = function (view, next, prev) {
		this.view = view;
		this.flow = {};
		this.flow.next = next;
		this.flow.prev = prev;
	};


	// define the StateApp prototype object
	var StateApp = function (options) {
		this.options = options;
	};
	StateApp.prototype.initialize = function () {
		this.states = this.options.states;
		var stateKeys = _.keys(this.states);

		if (stateKeys.length > 0) {
			// save the key of the state in the name property
			_.each(stateKeys, function (key) {
				this.states[key].name = key;
			}, this);

			this.initialState = this.currentState = this.states[stateKeys[0]];
		}

		if (this.options.initialize) {
			this.options.initialize.call(this);
		}
	};
	StateApp.prototype.loadState = function (name) {
		var state = this.states[name];
		console.log("state = ", state, this.options.participants);
		app.layout.setViews({
      "#main-content": new state.view({participants: this.options.participants})
    }).render();
	}
//        "#main-content": new Attendance.Views.Participants({participants: this.participants})

	var GridApp = new StateApp({
		states: {
	  	"attendance": new State(Attendance.Views.Participants, "grid", null),
	  	"grid": new State(Grid.Views.Participants, null, "attendance")
  	},

  	initialize: function () {
  		console.log("initializing grid app", this);
  		this.loadState(this.initialState.name);
  	}
  });

  return GridApp;
});