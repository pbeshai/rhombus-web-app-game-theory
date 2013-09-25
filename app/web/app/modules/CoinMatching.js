/**

	Coin Matching for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/Participant",
	"framework/apps/StateApp",
	"framework/util/d3/rickshaw/graphs"
],
function (App, Common, Participant, StateApp, Graphs) {

	var CoinMatching = App.module();

	CoinMatching.config = {
		pointsPerRound: 1,
		roundsPerPhase: 10,
		group1Name: "Team 1",
		group2Name: "Team 2",
		playTime: 10 // seconds for a play round
	};

	CoinMatching.Instructions = Common.Models.Instructions.extend({
		buttonConfig: {
			"A": { description: "Human - Heads" },
			"B": { description: "Human - Tails" },
			"C": { description: "Computer - Heads" },
			"D": { description: "Computer - Tails" },
		}
	});

	CoinMatching.Util = {};
	CoinMatching.Util.labelChoice = function (choice) {
		if (choice === "A" || choice === "C") {
			return "H";
		} else if (choice === "B" || choice === "D") {
			return "T";
		}
		return "#";
	};

	CoinMatching.Views.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: _.extend({}, CoinMatching.config)
	});

	CoinMatching.Views.AppControls = Common.Views.AppControls.extend({
		AppConfigView: CoinMatching.Views.Configure
	});

	CoinMatching.Views.Play = {};

	CoinMatching.Views.Play.Participant = Common.Views.ParticipantHiddenPlay.extend({
		bottomText: function (model) {
			if (model.get("score") != null) {
				return "Prev. " + model.get("score");
			}
		}
	});

	function total(collection, attribute) {
		return collection.reduce(function (memo, p) {
			return memo + (p.get(attribute) || 0);
		}, 0);
	}

	CoinMatching.Views.Countdown = App.BaseView.extend({
		className: "countdown animated",
		afterRender: function () {
			var timeLeft = Math.max(parseInt((this.options.endTime / 1000) - (new Date().getTime() / 1000), 10), 0);

			var seconds = timeLeft % 60;
			var minutes = parseInt(timeLeft / 60, 10);
			function z(str) { // add leading zero
				return ("0"+str).slice(-2);
			}
			var formattedTime = z(minutes) + ":" + z(seconds);

			this.$el.html("<div class='countdown-highlight'>" + formattedTime + "</div>" + formattedTime);
			if (timeLeft < 10) {
				this.$(".countdown-highlight").css("opacity", 1 - (timeLeft / 10));
			}
			if (timeLeft <= 3) {
				this.$el.removeClass("pulse");
				this.restartCssAnimationFix();
				if (timeLeft === 0) {
					this.$(".countdown-highlight").addClass("animated flash");
				} else {
					this.$el.addClass("pulse");
				}
			}

			if (timeLeft > 0) {
				setTimeout(_.bind(this.render, this), 1000);
			}
		},
	});

	CoinMatching.Views.Play.Layout = App.registerView("coin-matching::play", Common.Mixins.rounds(Common.Views.GroupLayout.extend({
		header: "Play",
		ParticipantView: CoinMatching.Views.Play.Participant,
		InstructionsModel: CoinMatching.Instructions,
		PreGroupsView: CoinMatching.Views.Countdown,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); }
	})));

	CoinMatching.Views.Results = {};

	CoinMatching.Views.Results.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,

		mainText: function (model) {
			var choice = CoinMatching.Util.labelChoice(model.get("choice")),
					partnerChoice = CoinMatching.Util.labelChoice(model.get("partner").get("choice"));

			var outcome;
			if (model.get("role") === "row") {
				outcome = choice+partnerChoice;
			} else {
				outcome = partnerChoice+choice;
			}
			return outcome + " "+model.get("score");
		},
		bottomText: function (model) {
			if (model.get("phaseTotal") != null) {
				return "Total " + model.get("phaseTotal");
			}
		}
	}));

	CoinMatching.Views.Results.Layout = App.registerView("coin-matching::results", Common.Mixins.rounds(Common.Views.GroupLayout.extend({
		header: "Results",
		className: "coin-matching-results",
		ParticipantView: CoinMatching.Views.Results.Score,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); }
	})));


	CoinMatching.Views.PhaseResults = {};

	CoinMatching.Views.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,

		mainText: function (model) {
			return model.get("phaseTotal");
		},
	}));

	CoinMatching.Views.PhaseResults.Layout = App.registerView("coin-matching::phase-results", Common.Views.GroupLayout.extend({
		header: "Results for Phase ",
		className: "coin-matching-results",
		ParticipantView: CoinMatching.Views.PhaseResults.Score,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); }
	}));


	CoinMatching.Views.TotalResults = {};

	CoinMatching.Views.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,

		mainText: function (model) {
			return model.get("total");
		},
	}));

	CoinMatching.Views.TotalResults.Layout = App.registerView("coin-matching::total-results", Common.Views.GroupLayout.extend({
		header: "Total Results",
		className: "coin-matching-results",
		ParticipantView: CoinMatching.Views.TotalResults.Score,
		group1HeaderRight: function () { return total(this.model.get("group1"), "total"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "total"); }
	}));


	// To be used in StateApps
	CoinMatching.States = {};

	CoinMatching.States.Play = Common.States.GroupPlay.extend({
		view: "coin-matching::play",
		defaultChoice: null,
		validChoices: ["A", "B", "C", "D"],

		// TODO: this only needs to be done once at the start of the game.
		prepareParticipantGroup1: function (participant) {
			this.prepareParticipant(participant, "group1");
			participant.set("role", "row");
			participant.get("partner").set("role", "col");
		},

		viewOptions: function () {
			var viewOptions = Common.States.GroupPlay.prototype.viewOptions.apply(this, arguments);
			viewOptions.endTime = this.endTime;
			return viewOptions;
		},

		beforeRender: function () {
			Common.States.GroupPlay.prototype.beforeRender.call(this);
			this.endTime = new Date().getTime() + (this.config.playTime * 1000);
		},


		// called before running
		addNewParticipants: function (render) {
			var groupModel = this.input.groupModel;
			if (!groupModel.hasNewParticipants()) {
				return;
			}

			// store the new participants and clear them as we will add them later
			var newParticipants = groupModel.get("participants").clearNewParticipants();
			_.each(newParticipants, function (p) {
				p.set({ choice: null, played: false, score: null, phaseTotal: null, total: null });
			});
			// handles partnering with each other and shuffling
			var newParticipantsModel = new Common.Models.GroupModel({ participants: newParticipants }, { forceEven: true });

			// if there is an odd number of new participants and there is a bot currently playing, we need to replace it
			if (newParticipants.length % 2 === 1) {
				var bot = groupModel.get("participants").find(function (p) { return p.bot; });
				if (bot) { // replace the bot.
					var botPartnerGroup = groupModel.get("group1").contains(bot) ? 2 : 1;

					var newBot = newParticipantsModel.get("participants").find(function (p) { return p.bot; });
					var newBotPartnerGroup = newParticipantsModel.get("group1").contains(newBot) ? 2 : 1;

					var currentBotPartner = bot.get("partner");
					var newBotPartner = newBot.get("partner");
					currentBotPartner.set("partner", newBotPartner);
					newBotPartner.set("partner", currentBotPartner);

					// make sure they are in different groups
					if (newBotPartnerGroup === botPartnerGroup) {
						newParticipantsModel.switchGroups(newBotPartner);
					}

					groupModel.remove(bot);
					newParticipantsModel.remove(newBot);
				}
			}

			groupModel.addFromGroupModel(newParticipantsModel);

			if (render) {
				this.rerender();
			}
		}
	});

	CoinMatching.States.Score = Common.States.GroupScore.extend({
		assignScoreGroup2: function () { }, // do nothing (handled in group1)
		// group 1 is row, group2 is col
		assignScoreGroup1: function (participant) {
			var partner = participant.get("partner");
			var choice = participant.get("choice"), partnerChoice = partner.get("choice");
			var pairChoice = choice + partnerChoice;
			var score = 0, partnerScore = 0;
			var rowWin = [ "AA", "BB", "CC", "DD", "AC", "CA", "BD", "DB" ];
			var colWin = [ "AB", "BA", "CD", "DC", "AD", "DA", "CB", "BC" ];

			if (_.contains(rowWin, pairChoice) || (choice != null && partnerChoice == null)) {
				score = this.config.pointsPerRound;
			} else if (_.contains(colWin, pairChoice) || (choice == null && partnerChoice != null)) {
				partnerScore = this.config.pointsPerRound;
			}

			participant.set({ "score": score });
			partner.set({ "score": partnerScore });
		},

		onExit: function () {
			var result = Common.States.GroupScore.prototype.onExit.call(this);
			// save the phase total (we need to do this before results since we show the phase total there)
			this.groupModel.get("group1").each(function (participant, i) {
				// sum up total scores from rounds in this phase
				var phaseTotal = _.reduce(this.options.roundOutputs, function (memo, roundOutput) {
					var participantOutput = roundOutput.group1[i];
					if (participantOutput && participantOutput.alias === participant.get("alias")) {
						return participantOutput.score + memo;
					} else {
						return memo;
					}

				}, 0) + participant.get("score");
				participant.set("phaseTotal", phaseTotal);
			}, this);

			this.groupModel.get("group2").each(function (participant, i) {
				// sum up total scores from rounds in this phase
				var phaseTotal = _.reduce(this.options.roundOutputs, function (memo, roundOutput) {
					var participantOutput = roundOutput.group2[i];
					if (participantOutput && participantOutput.alias === participant.get("alias")) {
						return participantOutput.score + memo;
					} else {
						return memo;
					}
				}, 0) + participant.get("score");
				participant.set("phaseTotal", phaseTotal);
			}, this);

			return result;
		}
	});

	CoinMatching.States.Results = Common.States.GroupResults.extend({
		view: "coin-matching::results",
	});

	CoinMatching.States.Partner = Common.States.GroupPartner;


	CoinMatching.States.Round = StateApp.RoundState.extend({
		name: "phase",
		States: [ CoinMatching.States.Play, CoinMatching.States.Score, Common.States.Bucket, CoinMatching.States.Results ],
		numRounds: CoinMatching.config.roundsPerPhase,

		addNewParticipants: function (render) {
			if (this.currentState && this.currentState.addNewParticipants) {
				this.currentState.addNewParticipants(render);
			} else {
				console.log("Could not add in new participants to " + this.currentState);
			}
		},

		// what is saved between each round
		// output is a groupModel

		roundOutput: function (output) {
			var roundOutput = {
				group1: output.groupModel.get("group1").map(serialize),
				group2: output.groupModel.get("group2").map(serialize)
			};

			return roundOutput;

			function serialize(participant) {
				return {
					alias: participant.get("alias"),
					choice: participant.get("choice"),
					score: participant.get("score"),
					partner: participant.get("partner").get("alias"),
					total: participant.get("total")
				};
			}
		},

		onEntry: function (input, prevState) {
			input.groupModel.get("participants").each(function (participant) {
				participant.set({ "phaseTotal": 0});
			});

			StateApp.RoundState.prototype.onEntry.apply(this, arguments);
		},

		handleConfigure: function () {
			this.currentState.render();
		}
	});

	CoinMatching.States.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	CoinMatching.States.TotalBucket = Common.States.Bucket.extend({ bucketAttribute: "total" });

	CoinMatching.States.PhaseResults = Common.States.GroupResults.extend({
		name: "phase-results",
		view: "coin-matching::phase-results",
		beforeRender: function () {
			Common.States.GroupResults.prototype.beforeRender.call(this);

			// save the phaseTotal on the participant as phase#Total
			this.groupModel.get("participants").each(function (participant, i) {
				participant.set("phase" + this.options.phase + "Total", participant.get("phaseTotal"));
			}, this);
		},

		logResults: function () {
			var logData = {};
			logData["phase" + this.options.phase] = this.input.roundOutputs;
			return logData;
		}
	});

	CoinMatching.States.TotalResults = Common.States.GroupResults.extend({
		name: "total-results",
		view: "coin-matching::total-results",

		beforeRender: function () {
			Common.States.GroupResults.prototype.beforeRender.call(this);

			this.groupModel.get("participants").each(function (participant) {
				participant.set("total", 0);
				for (var i = 0; i < this.options.numPhases; i++) {
					var phaseTotal = participant.get("phase" + (i+1) + "Total");
					if (phaseTotal) {
						participant.set("total", participant.get("total") + phaseTotal);
					}
				}
			}, this);
			this.groupModel.get("participants").bucket("total", 6);
		},
	});

	return CoinMatching;
});