define([
	"framework/App",

	"apps/PrisonersDilemmaNPerson/Base",
	"apps/PrisonersDilemmaNPerson/Views",
	"apps/PrisonersDilemmaNPerson/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});