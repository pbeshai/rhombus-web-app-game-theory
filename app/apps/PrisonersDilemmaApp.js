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
		this.options = options;
		this.initialize();
	};

	PrisonersDilemmaApp.prototype = new StateApp.App();
	_.extend(PrisonersDilemmaApp.prototype, {
		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants
			});

			var playState = new PrisonersDilemma.States.Play();

			var resultsState = new PrisonersDilemma.States.Results();

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