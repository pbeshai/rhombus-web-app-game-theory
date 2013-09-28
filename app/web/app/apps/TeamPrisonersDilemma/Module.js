define([
	"framework/App",

	"apps/TeamPrisonersDilemma/Base",
	"apps/TeamPrisonersDilemma/Views",
	"apps/TeamPrisonersDilemma/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});