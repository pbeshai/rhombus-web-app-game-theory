define([
	"framework/App",
	"framework/modules/common/Common"
],
function(App, Common) {
	var Question = App.module();

	Question.config = {
		questions: [
			{
				question: "Initializing...",
				answers: {
					"A": "Strongly Agree",
					"B": "Agree",
					"C": "Neutral",
					"D": "Disagree",
					"E": "Strongly Disagree"
				}
			}
		]
	};

	Question.Instructions = Common.Models.Instructions.extend({
		header: "Answers",
		configInit: function (config) {
			this.attributes.buttonConfig = {
				"A": config.answers.A == null ? null : { description: config.answers.A },
				"B": config.answers.B == null ? null : { description: config.answers.B },
				"C": config.answers.C == null ? null : { description: config.answers.C },
				"D": config.answers.D == null ? null : { description: config.answers.D },
				"E": config.answers.E == null ? null : { description: config.answers.E },
			};

		}
	});
	Question.Views.QuestionSetSelect = App.BaseView.extend({
		template: "app/templates/question/set_select",
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

	Question.Views.AppControls = Common.Views.AppControls.extend({
		beforeRender: function () {
			var questionSelect = new Question.Views.QuestionSetSelect();
			this.insertView(".controls-pre", questionSelect);
			this.listenTo(questionSelect, "questions-selected", function (questions) {
				this.options.activeApp.loadQuestions(questions);
			});
			Common.Views.AppControls.prototype.beforeRender.call(this);
		},
	});

	Question.Views.ParticipantAlias = Common.Views.ParticipantPlay.extend({
		className: "participant-alias",
		playedSelector: ".id-text",
		forceFade: true,
		mainText: function () { },
		cssClass: function (model) {
			if (!model.get("choice")) { // only show if a choice has been made
				return "hidden";
			}
		}
	});

	Question.Views.ParticipantsList = Common.Views.ParticipantsGrid.extend({
		className: null,
		ParticipantView: Question.Views.ParticipantAlias
	});

	Question.Views.Count = App.BaseView.extend({
		className: "count",

		beforeRender: function () {
			// count those that have answered
			this.count = this.participants.reduce(function(memo, p) {
				if (p.get("choice")) {
					return memo + 1;
				}
				return memo;
			}, 0);
		},

		afterRender: function () {
			this.el.innerHTML = this.count;
		},

		initialize: function () {
			App.BaseView.prototype.initialize.apply(this, arguments);
			this.listenTo(this.participants, "update", this.render);
		}
	});

	Question.Views.Layout = App.registerView("q::layout", App.BaseView.extend({
		template: "app/templates/question/layout",
		className: "question-layout",

		beforeRender: function () {
			var instructionsView = new Common.Views.Instructions({
				model: new Question.Instructions(null, { config: this.options })
			});
			this.setView(".instructions-container", instructionsView);

			this.setView(".count-container", new Question.Views.Count({ participants: this.participants }));
			this.insertView(".count-container", new Question.Views.ParticipantsList({ participants: this.participants }));
		},

		serialize: function () {
			return {
				question: this.options.question
			};
		}
	}));

	Question.States = {};
	Question.States.Question = Common.States.Play.extend({
		view: "q::layout",
		name: "question",

		viewOptions: function () {
			return _.extend(Common.States.Play.prototype.viewOptions.call(this), {
				question: this.options.question,
				answers: this.options.answers
			});
		}
	});

  return Question;
});