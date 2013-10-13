define([
	"framework/App",

	"apps/PrisonersDilemmaTeam/Base",
	"apps/PrisonersDilemmaTeam/Views",
	"apps/PrisonersDilemmaTeam/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});