define([
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/Common",

	"apps/Question/Base"
],
function (App, StateApp, Common, Question) {
	var QuestionViews = {};

	QuestionViews.QuestionSetSelect = App.BaseView.extend({
		template: "app/apps/Question/templates/set_select",
		className: "form-inline",
		events: {
			"change .question-set-select": "selectQuestionSet"
		},

		selectQuestionSet: function (evt) {
			var selectedSet = $(evt.target).val();
			if (selectedSet === "null") {
				this.trigger("questions-selected", null);
				return;
			}

			var that = this;
			console.log("Question set selected: ", selectedSet);
			App.api({ call: "apps/q/get/" + selectedSet, success: function (data) {
				that.trigger("questions-selected", data.questions);
			}});
		},

		serialize: function () {
			return {
				questionSets: this.questionSets
			};
		},

		initialize: function () {
			App.BaseView.prototype.initialize.apply(this, arguments);
			var that = this;
			App.api({ call: "apps/q/sets", success: function (data) {
				that.questionSetIds = data["question-sets"];
				that.questionSets = {};
				_.each(that.questionSetIds, function (id) {
					var label = _.map(id.split("_"), function (word) { return word[0].toUpperCase() + word.slice(1); }).join(" ");
					that.questionSets[id] = label;
				});

				that.render();
			}});
		}
	});

	QuestionViews.AppControls = Common.Views.AppControls.extend({
		beforeRender: function () {
			var questionSelect = new QuestionViews.QuestionSetSelect();
			this.insertView(".controls-pre", questionSelect);
			this.listenTo(questionSelect, "questions-selected", function (questions) {
				this.options.activeApp.loadQuestions(questions);
			});
			Common.Views.AppControls.prototype.beforeRender.call(this);
		},
	});

	QuestionViews.Participant = Common.Views.ParticipantAlias.extend({
		forceFade: true,
		cssClass: function (model) {
			if (!model.get("choice")) { // only show if a choice has been made
				return "hidden";
			}
		}
	});

	QuestionViews.ParticipantsList = Common.Views.ParticipantsList.extend({
		ParticipantView: QuestionViews.Participant
	});

	QuestionViews.Layout = App.registerView("q::layout", App.BaseView.extend({
		template: "app/apps/Question/templates/layout",
		className: "question-layout",

		beforeRender: function () {
			var instructionsView = new Common.Views.Instructions({
				model: new Question.Instructions(null, { config: this.options })
			});
			this.setView(".instructions-container", instructionsView);

			this.setView(".count-container", new Common.Views.Count({ participants: this.participants }));
			this.insertView(".count-container", new QuestionViews.ParticipantsList({ participants: this.participants }));
		},

		serialize: function () {
			return {
				question: this.options.question
			};
		}
	}));

	QuestionViews.End = App.registerView("q::end", App.BaseView.extend({
		afterRender: function () {
			this.$el.html("<h1>Thanks for participating!</h1>");
		}
	}));

  return QuestionViews;
});