define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/UltimatumGame/Base",
	"apps/UltimatumGame/Views"
],
function (App, Common, StateApp, UltimatumGame) {

	var UltimatumGameStates = {};

	UltimatumGameStates.GiverPlay = Common.States.Play.extend({
		name: "giver-play",
		view: "ug::giver-play",
		validChoices: _.keys(UltimatumGame.config().offerMap),

		onExit: function () {
			var result = Common.States.Play.prototype.onExit.call(this);

			UltimatumGame.Util.assignOffers(this.participants,
				this.config.amount, this.config.offerMap);

			return result;
		}
	});

	UltimatumGameStates.ReceiverPlay = Common.States.Play.extend({
		name: "receiver-play",
		view: "ug::receiver-play",
		validChoices: ["A", "B"],
	});

	UltimatumGameStates.Score = Common.States.RoundScore.extend({
		assignScore: function (participant) {
			var receiver = participant;
			var giver = receiver.get("partner");
			if (receiver.get("choice") === "A") {
				receiver.set("receiverScore", receiver.get("offer"));
				giver.set("giverScore", giver.get("keep"));
			} else {
				receiver.set("receiverScore", 0);
				giver.set("giverScore", 0);
			}

			// store the total
			giver.set("score", giver.get("score") + giver.get("giverScore"));
			receiver.set("score", receiver.get("score") + receiver.get("receiverScore"));
		},

		assignScores: function (participants) {
			// reset their score
			participants.each(function (p) { p.set("score", 0); });

			// assign a new score
			participants.each(this.assignScore, this);
		}
	});

	UltimatumGameStates.GiverBucket = Common.States.Bucket.extend({
		bucketAttribute: "giverScore",
	});

	UltimatumGameStates.ReceiverBucket = Common.States.Bucket.extend({
		bucketAttribute: "receiverScore",
	});

	UltimatumGameStates.ScoreBucket = Common.States.Bucket;

	UltimatumGameStates.GiverResults = Common.States.Results.extend({
		name: "giver-results",
		view: "ug::giver-results"
	});

	UltimatumGameStates.ReceiverResults = Common.States.Results.extend({
		name: "receiver-results",
		view: "ug::receiver-results"
	});

	UltimatumGameStates.ScoreResults = Common.States.Results.extend({
		view: "ug::score-results",

		logResults: function () {
			var results = this.participants.map(function (model) {
				return {
					alias: model.get("alias"),
					score: model.get("score"),
					giverOffer: model.get("keep"),
					giverScore: model.get("giverScore"),
					giverPartner: model.get("partner").get("alias"),
					receiverOffer: model.get("offer"),
					receiverScore: model.get("receiverScore"),
					receiverPartner: model.get("partnerBackward").get("alias")
				};
			});

			return { results: results };
		}
	});

	UltimatumGameStates.Partner = Common.States.Partner.extend({

	});


	UltimatumGameStates.Round = Common.States.Round.extend({
		States: [
			UltimatumGameStates.Partner,
			UltimatumGameStates.GiverPlay,
			UltimatumGameStates.ReceiverPlay,
			UltimatumGameStates.Score,
			UltimatumGameStates.GiverBucket,
			UltimatumGameStates.GiverResults,
			UltimatumGameStates.ReceiverBucket,
			UltimatumGameStates.ReceiverResults,
			UltimatumGameStates.ScoreBucket,
			UltimatumGameStates.ScoreResults,
		],
	});

	UltimatumGameStates.Phase = Common.States.Phase.extend({
		State: UltimatumGameStates.Round,
		numRounds: UltimatumGame.config().roundsPerPhase,

		// how to save a participant in round output
    serializeParticipant: function (participant) {
      return {
        alias: participant.get("alias"),
				score: participant.get("score"),
				giverOffer: participant.get("keep"),
				giverScore: participant.get("giverScore"),
				giverPartner: participant.get("partner").get("alias"),
				receiverOffer: participant.get("offer"),
				receiverScore: participant.get("receiverScore"),
				receiverPartner: participant.get("partnerBackward").get("alias")
      };
    },
	});

	UltimatumGameStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	UltimatumGameStates.PhaseResults = Common.States.PhaseResults.extend({
		view: "ug::phase-results",
	});

	UltimatumGameStates.TotalResults = Common.States.TotalPhaseResults.extend({
		view: "ug::total-results",
	});


	return UltimatumGameStates;
});