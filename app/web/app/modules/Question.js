define([
	"framework/App",
	"framework/modules/common/Common"
],
function(App, Common) {
	var Question = App.module();

	Question.config = {
		questions: [
			{
				question: "It was easy to find myself on the screen.",
				answers: {
					"A": "Strongly Agree",
					"B": "Agree",
					"C": "Neutral",
					"D": "Disagree",
					"E": "Strongly Disagree"
				}
			},
			{
				question: "I understood the rules of the game.",
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
				"A": { description: config.answers.A },
				"B": { description: config.answers.B },
				"C": { description: config.answers.C },
				"D": { description: config.answers.D },
				"E": { description: config.answers.E },
			};
		}
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
	Question.States.Ask = Common.States.Play.extend({
		view: "q::layout",
		name: "ask",

		beforeRender: function () {
			Common.States.Play.prototype.beforeRender.call(this);
			this.listenTo(this.participants, "new-queued", function (model, collection) {
				collection.addNewParticipants();
			});
		},

		viewOptions: function () {
			return _.extend(Common.States.Play.prototype.viewOptions.call(this), {
				question: this.options.question,
				answers: this.options.answers
			});
		}
	});

  return Question;
});