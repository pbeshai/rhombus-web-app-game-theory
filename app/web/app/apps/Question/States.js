define([
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/Common",

	"apps/Question/Base",
	"apps/Question/Views",
],
function (App, StateApp, Common, Question) {
	var QuestionStates = {};

	QuestionStates = {};
	QuestionStates.Question = Common.States.Play.extend({
		view: "q::layout",
		name: "question",
		addNewParticipants: function (render) {
      // no bots, no partners
      this.addNewParticipantsHelper({
        render: false,
        hasBots: false,
        pairModels: false,
        keepChoices: true
      });
    },

		viewOptions: function () {
			return _.extend(Common.States.Play.prototype.viewOptions.call(this), {
				question: this.options.question,
				answers: this.options.answers
			});
		},
		onExit: function () {
			var logData = {};
			logData[this.name] = _.chain(this.participants.models)
				.map(function (model) { return { alias: model.get("alias"), choice: model.get("choice") }})
				.value();
			this.log(logData);
		}
	});

	QuestionStates.End = StateApp.ViewState.extend({
		view: "q::end",
		name: "end"
	});

  return QuestionStates;
});