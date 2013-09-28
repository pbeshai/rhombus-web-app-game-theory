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

	UltimatumGameViews.PreParticipants = Backbone.View.extend({
		template: "apps/UltimatumGame/templates/pre_participants",
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
		template: "apps/UltimatumGame/templates/score",
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
		}
	});

	UltimatumGameViews.Results.Layout = App.registerView("ug::results", Common.Views.SimpleLayout.extend({
		header: "Results",
		className: "ultimatum-results",
		PreParticipantsView: UltimatumGameViews.PreParticipants,
		ParticipantView: UltimatumGameViews.Results.Score
	}));

	return UltimatumGameViews;
});