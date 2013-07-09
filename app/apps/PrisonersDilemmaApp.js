/**

Prisoner's Dilemma:

Attendance -> Prisoner's Dilemma Play -> Prisoner's Dilemam Results

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/Participant",
  "modules/Attendance",
  "modules/PrisonersDilemma"
],

function(app, StateApp, Participant, Attendance, PrisonersDilemma) {

	/**
	 *  Prisoner's Dilemma App
	 */
	var PrisonersDilemmaApp = function (options) {
		this.options = options || {};
		this.config = _.extend({
			scoringMatrix: {
        CC: 3,
        CD: 0,
        DC: 5,
        DD: 1
      }
		}, this.options.config);
		this.initialize();
	};

	PrisonersDilemmaApp.prototype = new StateApp.App();
	_.extend(PrisonersDilemmaApp.prototype, {
		version: "1.0",

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var playState = new PrisonersDilemma.States.Play();

			var resultsState = new PrisonersDilemma.States.Results({
				config: this.config
			});

			this.states = {
		  	"attendance": attendanceState,
		  	"play": playState,
		  	"results": resultsState
	  	};

			attendanceState.setNext(playState);
			playState.setNext(resultsState);
		},

		initialize: function () {
			StateApp.App.prototype.initialize.call(this);
			console.log("pd app initialize");
		},

		handleConfigure: function () {
			// redraw if results are active
			if (this.currentState === this.states.results) {
				this.currentState.render();
			}
		},

		transitions: {
	  		attendance_play: function () {
	  			// take output from attendance and use it in grid
					console.log("going from attendance to play");

	  		},

	  		play_attendance: function () {
				  console.log("going from play to attendance");
				  this.options.participants.fetch(); // reset the participants that attendance uses
	  		},

	  		play_results: function () {
	  			console.log("going from play to results");
	  		}
		}
	});


  return PrisonersDilemmaApp;
});