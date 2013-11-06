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

	UltimatumGameViews.PreParticipants = App.BaseView.extend({
		template: "app/apps/UltimatumGame/templates/pre_participants",
		serialize: function () {
			return { total: this.options.config.amount };
		},
	});

	UltimatumGameViews.GiverPlay.Layout = App.registerView("ug::giver-play", Common.Views.SimpleLayout.extend({
		header: "Givers Play",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.GiverPlay.Giver,
		InstructionsModel: UltimatumGame.Instructions.GiverPlay
	}));

	UltimatumGameViews.ReceiverPlay = {};

	UltimatumGameViews.ReceiverPlay.Receiver = Common.Views.ParticipantMessagePlay.extend({
		messageAttribute: "offer"
	});

	UltimatumGameViews.ReceiverPlay.Layout = App.registerView("ug::receiver-play", Common.Views.SimpleLayout.extend({
		header: "Receivers Play",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.ReceiverPlay.Receiver,
		InstructionsModel: UltimatumGame.Instructions.ReceiverPlay
	}));

	UltimatumGameViews.Results = {};

	UltimatumGameViews.Results.Score = Common.Views.ParticipantDisplay.extend({
		template: "app/apps/UltimatumGame/templates/score",
		serialize: function () {
			return {
				alias: this.model.get("alias"),
				giverOffer: this.model.get("keep"),
				giverScore: this.model.get("giverScore"),
				giverScoreClass: (this.model.get("giverScore") === 0) ? "rejected" : "accepted",
				receiverOffer: this.model.get("offer"),
				receiverScore: this.model.get("receiverScore"),
				receiverScoreClass: (this.model.get("receiverScore") === 0) ? "rejected" : "accepted"
			};
		},
		overlay: function () {
			return "dark-dim no-animate";
		}
	});

	UltimatumGameViews.Results.Participant = Common.Views.ParticipantScoreChoiceDisplay.extend({
		overlay: function (model) {
			return "no-animate";
		}
	});

	UltimatumGameViews.Results.BucketParticipant = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		// labelChoice: UltimatumGame.Util.labelChoice,
	}));

	UltimatumGameViews.Results.GiverParticipant = UltimatumGameViews.Results.BucketParticipant.extend({
		scoreAttribute: "giverScore",

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

	UltimatumGameViews.Results.GiverLayout = App.registerView("ug::giver-results", Common.Views.SimpleLayout.extend({
		header: "Giver Results",
		className: "ultimatum-results",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.Results.GiverParticipant
	}));


	UltimatumGameViews.Results.ReceiverLayout = App.registerView("ug::receiver-results", Common.Views.SimpleLayout.extend({
		header: "Receiver Results",
		className: "ultimatum-results",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.Results.ReceiverParticipant
	}));


	UltimatumGameViews.Results.ScoreLayout = App.registerView("ug::score-results", Common.Views.SimpleLayout.extend({
		header: "Combined Results",
		className: "ultimatum-results",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.Results.BucketParticipant
	}));


	return UltimatumGameViews;
});