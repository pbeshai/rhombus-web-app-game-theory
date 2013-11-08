define([
	"framework/App",
	"framework/modules/common/Common",

	"apps/UltimatumGame/Base"
],
function (App, Common, UltimatumGame) {

	var UltimatumGameViews = {};


	UltimatumGameViews.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: _.extend({}, UltimatumGame.config)
	});

	UltimatumGameViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: UltimatumGameViews.Configure
	});

	UltimatumGameViews.GiverPlay = {};

	UltimatumGameViews.GiverPlay.Giver = Common.Views.ParticipantHiddenPlay;

	UltimatumGameViews.GiverPlay.Layout = App.registerView("ug::giver-play", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Givers Play",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.GiverPlay.Giver,
		InstructionsModel: UltimatumGame.Instructions.GiverPlay
	})));

	UltimatumGameViews.ReceiverPlay = {};

	UltimatumGameViews.ReceiverPlay.Receiver = Common.Views.ParticipantMessagePlay.extend({
		messageAttribute: "offer"
	});

	UltimatumGameViews.ReceiverPlay.Layout = App.registerView("ug::receiver-play", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Receivers Play",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.ReceiverPlay.Receiver,
		InstructionsModel: UltimatumGame.Instructions.ReceiverPlay
	})));

	UltimatumGameViews.Results = {};

	UltimatumGameViews.Results.Participant = Common.Views.ParticipantScoreChoiceDisplay.extend({
		overlay: function (model) {
			return "no-animate";
		}
	});

	UltimatumGameViews.Results.BucketParticipant = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreChoiceDisplay.extend({
		totalAttribute: "phaseTotal",
		mainText: function (model) {
			return this.getScore(model);
		}
	}));

	UltimatumGameViews.Results.GiverParticipant = UltimatumGameViews.Results.BucketParticipant.extend({
		scoreAttribute: "giverScore",
		totalAttribute: null,

		overlay: function (model) {
			var overlay = UltimatumGameViews.Results.BucketParticipant.prototype.overlay.apply(this, arguments);
			var offer = model.get("keep"), score = this.getScore(model);
			if (offer === score) {
				overlay += " bucket-green";
			} else {
				overlay += " bucket-red";
			}
			return overlay;
		},

		mainText: function (model) {
			var offer = model.get("keep"), score = this.getScore(model);
			if (offer === score) {
				return score;
			}
			return offer + " &rarr; " + score;
		}
	});

	UltimatumGameViews.Results.ReceiverParticipant = UltimatumGameViews.Results.BucketParticipant.extend({
		scoreAttribute: "receiverScore",
		totalAttribute: null,

		overlay: function (model) {
			var overlay = UltimatumGameViews.Results.BucketParticipant.prototype.overlay.apply(this, arguments);
			var offer = model.get("offer"), score = this.getScore(model);
			if (offer === score) {
				overlay += " bucket-green";
			} else {
				overlay += " bucket-red";
			}
			return overlay;
		},

		mainText: function (model) {
			var offer = model.get("offer"), score = this.getScore(model);
			if (offer === score) {
				return score;
			}
			return offer + " &rarr; " + score;
		}
	});

	UltimatumGameViews.Results.GiverLayout = App.registerView("ug::giver-results", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Giver Results",
		className: "ultimatum-results",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.Results.GiverParticipant
	})));


	UltimatumGameViews.Results.ReceiverLayout = App.registerView("ug::receiver-results", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Receiver Results",
		className: "ultimatum-results",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.Results.ReceiverParticipant
	})));


	UltimatumGameViews.Results.ScoreLayout = App.registerView("ug::score-results", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Combined Results",
		className: "ultimatum-results",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.Results.BucketParticipant
	})));


	UltimatumGameViews.PhaseResults = {};

	UltimatumGameViews.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "phaseTotal"
	}));

	UltimatumGameViews.PhaseResults.Layout = App.registerView("ug::phase-results", Common.Views.SimpleLayout.extend({
		header: "Phase Total Results",
		className: "ug-results",
		ParticipantView: UltimatumGameViews.PhaseResults.Score,
	}));


	UltimatumGameViews.TotalResults = {};

	UltimatumGameViews.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "total"
	}));

	UltimatumGameViews.TotalResults.Layout = App.registerView("ug::total-results", Common.Views.SimpleLayout.extend({
		header: "Total Results",
		className: "ug-results",
		ParticipantView: UltimatumGameViews.TotalResults.Score,
	}));


	return UltimatumGameViews;
});