/**

	Coin Matching for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",
	"framework/apps/StateApp",

	"apps/CoinMatching/Base",
	"apps/CoinMatching/Views" // depends on Views to register themselves
],
function (App, Common, StateApp, CoinMatching) {


	// To be used in StateApps
	var CoinMatchingStates = {};

	CoinMatchingStates.Play = Common.States.GroupPlay.extend({
		view: "coin-matching::play",
		defaultChoice: null,
		validChoices: ["A", "B"],

		// TODO: this only needs to be done once at the start of the game.
		prepareParticipantGroup1: function (participant) {
			this.prepareParticipant(participant, "group1");
			participant.set("role", "row");
			participant.get("partner").set("role", "col");
		},

		viewOptions: function () {
			var viewOptions = Common.States.GroupPlay.prototype.viewOptions.apply(this, arguments);
			viewOptions.round = this.options.round;
			return viewOptions;
		},

		beforeRender: function () {
			Common.States.GroupPlay.prototype.beforeRender.call(this);
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

	CoinMatchingStates.Score = Common.States.GroupScore.extend({
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
				var phaseTotal = _.reduce(this.options.parentOptions.roundOutputs, function (memo, roundOutput) {
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
				var phaseTotal = _.reduce(this.options.parentOptions.roundOutputs, function (memo, roundOutput) {
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

	CoinMatchingStates.Results = Common.States.GroupResults.extend({
		view: "coin-matching::results",
		viewOptions: function () {
			var viewOptions = Common.States.GroupResults.prototype.viewOptions.apply(this, arguments);
			viewOptions.round = this.options.round;
			return viewOptions;
		},
	});

	CoinMatchingStates.Partner = Common.States.GroupPartner;


	CoinMatchingStates.Round = Common.States.Round.extend({
		States: [ CoinMatchingStates.Play, CoinMatchingStates.Score, Common.States.Bucket, CoinMatchingStates.Results ],
	});

	CoinMatchingStates.Phase = Common.States.Phase.extend({
		State: CoinMatchingStates.Round,
		numRounds: CoinMatching.config.roundsPerPhase,

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
					partner: participant.get("partner").get("alias")
				};
			}
		},

		onEntry: function (input, prevState) {
			input.groupModel.get("participants").each(function (participant) {
				participant.set({ "phaseTotal": 0});
			});

			StateApp.RepeatState.prototype.onEntry.apply(this, arguments);
		},
	});

	CoinMatchingStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	CoinMatchingStates.TotalBucket = Common.States.Bucket.extend({ bucketAttribute: "total" });

	CoinMatchingStates.PhaseResults = Common.States.GroupResults.extend({
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
			logData["phase" + this.options.phase] = {
				results: this.input.roundOutputs,
				config: this.config
			};
			return logData;
		}
	});

	CoinMatchingStates.TotalResults = Common.States.GroupResults.extend({
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

	return CoinMatchingStates;
});