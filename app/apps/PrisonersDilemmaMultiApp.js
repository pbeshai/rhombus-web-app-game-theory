/**

Multi-round Prisoner's Dilemma:

Attendance -> Prisoner's Dilemma Play -> Prisoner's Dilemma Results

play many rounds

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/Participant",
  "modules/Attendance",
  "modules/PrisonersDilemma",
  "modules/PrisonersDilemmaMulti"
],

function(app, StateApp, Participant, Attendance, PrisonersDilemma, PrisonersDilemmaMulti) {
	var PrisonersDilemmaMultiApp = function (options) {
		this.options = _.defaults({}, options, this.defaults);
		this.initialize();
	};

	PrisonersDilemmaMultiApp.prototype = new StateApp.App();
	_.extend(PrisonersDilemmaMultiApp.prototype, {
		defaults: {
			minRounds: 2,
			maxRounds: 5
		},

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var playState = new PrisonersDilemmaMulti.States.Play();
			var resultsState = new PrisonersDilemmaMulti.States.Results();

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
			console.log("pdm app initialize");
		},

		transitions: {
	  		attendance_play: function (output) {
	  			// take output from attendance and use it in grid
					console.log("going from attendance to play");
					// create PD Participants from these Participant Models
		      var pdParticipants = output.map(function (participant) {
		        return new PrisonersDilemma.Model({ alias: participant.get("alias") });
		      });
		      // ensure we have even number of participants by adding a bot
		      if (pdParticipants.length % 2 === 1) {
		        pdParticipants.push(new PrisonersDilemma.Bot());
		      }

		      var participants = new PrisonersDilemma.Collection(pdParticipants);

					// for each participant, set the number of rounds left.
					participants.each(function (participant) {
						if (participant.get("roundsLeft") === undefined) {
							var roundsLeft = Math.round(Math.random() * (this.options.maxRounds - this.options.minRounds)) + this.options.minRounds;
							participant.set("roundsLeft", roundsLeft);
							participant.get("partner").set("roundsLeft", roundsLeft);
						}
					}, this);

					this.round = 1;

		      return participants;
	  		},

	  		play_attendance: function () {
				  console.log("going from play to attendance");
				  this.options.participants.fetch(); // reset the participants that attendance uses
	  		},

	  		play_results: function () {
	  			console.log("going from play to results");
	  		},

	  		results_play: function (output) {
	  			output.each(function (participant) {
	  				participant.set("choice", undefined);
	  				if (participant.bot) {
	  					participant.delayedPlay();
	  				}
	  			});
	  			this.round += 1;
	  		}
		}
	});


  return PrisonersDilemmaMultiApp;
});