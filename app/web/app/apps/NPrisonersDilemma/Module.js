define([
	"framework/App",

	"apps/NPrisonersDilemma/Base",
	"apps/NPrisonersDilemma/Views",
	"apps/NPrisonersDilemma/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});