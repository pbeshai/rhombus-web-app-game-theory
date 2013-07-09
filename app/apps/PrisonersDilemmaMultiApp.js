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
		this.options = options || {};
		this.config = _.extend({
			scoringMatrix: {
        CC: 3,
        CD: 0,
        DC: 5,
        DD: 1
      },
      minRounds: 2,
      maxRounds: 5,
      gameOver: false, // set to false when the game is over
		}, this.options.config);
		this.initialize();
	};

	PrisonersDilemmaMultiApp.prototype = new StateApp.App();
	_.extend(PrisonersDilemmaMultiApp.prototype, {
		version: "1.0",

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var playState = new PrisonersDilemmaMulti.States.Play({
				config: this.config
			});
			var resultsState = new PrisonersDilemmaMulti.States.Results({
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
			console.log("pdm app initialize");
		},

		handleConfigure: function () {
			// redraw if results are active
			if (this.currentState === this.states.results) {
				this.currentState.render();
			}
		},

		transitions: {
	  		attendance_play: function (output) {
	  			// take output from attendance and use it in grid

					// create PD Participants from these Participant Models
		      var pdParticipants = output.map(function (participant) {
		        return new PrisonersDilemma.Model({ alias: participant.get("alias") });
		      });
		      // ensure we have even number of participants by adding a bot
		      if (pdParticipants.length % 2 === 1) {
		        pdParticipants.push(new PrisonersDilemma.Bot());
		      }

		      var participants = new PrisonersDilemma.Collection(pdParticipants);

		      this.config.numRounds = Math.round(Math.random() * (this.config.maxRounds - this.config.minRounds)) + this.config.minRounds;

					// for each participant, set the number of rounds left.
					participants.each(function (participant) {
						if (participant.get("roundsLeft") === undefined) {
							var roundsLeft = this.config.numRounds;
							participant.set("roundsLeft", roundsLeft);
							participant.get("partner").set("roundsLeft", roundsLeft);
						}
					}, this);

					this.round = 1;
					this.config.gameOver = false;

		      return participants;
	  		},

	  		play_attendance: function () {
				  this.options.participants.fetch(); // reset the participants that attendance uses
	  		},

	  		play_results: function () {

	  		},

	  		results_play: function (output) {
	  			output.each(function (participant) {
	  				participant.set("choice", undefined);
	  				if (participant.bot) {
	  					participant.delayedPlay();
	  				}
	  			});
	  			if (this.config.numRounds > this.round) {
	  				this.round += 1;
	  			} else {
	  				this.config.gameOver = true;
	  			}
	  		}
		}
	});


  return PrisonersDilemmaMultiApp;
});