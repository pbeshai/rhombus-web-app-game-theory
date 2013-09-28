define([
	"framework/App",

	"apps/PrisonersDilemmaMulti/Base",
	"apps/PrisonersDilemmaMulti/Views",
	"apps/PrisonersDilemmaMulti/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});