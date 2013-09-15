/**

N-Person Prisoner's Dilemma:

Attendance -> N-Person Prisoner's Dilemma Play -> N-Person Prisoner's Dilemam Results

*/
define([
	// Application.
	"framework/App",

	"framework/apps/StateApp",

	"framework/modules/common/CommonStateApps",
	"modules/Question"
],

function (App, StateApp, CommonStateApps, Question) {

	var QuestionApp = CommonStateApps.BasicApp.extend({
		id: "question",
		version: "1.0",
		config: Question.config,
		prepend: { attendance: false },
		States: [  ],

		initStateOptions: function () {
			_.each(this.config.questions, function (question, i) {
				this.stateOptions[i] = _.clone(question);
				if (this.options.numberQuestions) {
					this.stateOptions[i].question = (i + 1) + ". " + this.stateOptions[i].question;
					this.stateOptions[i].name = "question-" + (i + 1);
				}
			}, this);
		},

		loadQuestions: function (questions) {
			console.log("Loading questions", questions);
			this.States.length = 0;
			if (questions) {
				for (var i = 0; i < questions.length; i++) {
					this.States.push(Question.States.Question);
				}
			}

			this.config.questions = questions;
			this.initialize(null, this.options);
		},
	});

	// description for use in router
	QuestionApp.app = {
		instantiate: function (attrs) {
			return new QuestionApp(attrs, { writeLogAtEnd: false, numberQuestions: true });
		},
		AppControlsView: Question.Views.AppControls,
		title: "Question"
	};

	return QuestionApp;
});