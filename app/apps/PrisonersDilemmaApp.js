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
	 console.log("PD?", PrisonersDilemma)
	var PrisonersDilemmaApp = function (options) {
		this.options = options;
		this.initialize();
	};

	PrisonersDilemmaApp.prototype = new StateApp.App();
	_.extend(PrisonersDilemmaApp.prototype, {
		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants
			});

			var playState = new PrisonersDilemma.States.Play({
				participants: this.options.participants
			});

			this.states = {
		  	"attendance": attendanceState,
		  	"play": playState
	  	};

			attendanceState.setNext(playState);
		},

		initialize: function () {
			StateApp.App.prototype.initialize.call(this);
			console.log("pd app initialize");
		},

		transitions: {
	  		attendance_play: function () {
	  			// take output from attendance and use it in grid
					console.log("going from attendance to play");

	  		},

	  		play_attendance: function () {
				  console.log("going from play to attendance");
				  this.options.participants.fetch();
	  		},

	  		play_results: function () {
	  			console.log("going from play to results");
	  		}
		}
	});


  return PrisonersDilemmaApp;
});