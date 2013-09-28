define([
	"framework/App",

	"apps/PrisonersDilemma/Base",
	"apps/PrisonersDilemma/Views",
	"apps/PrisonersDilemma/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});