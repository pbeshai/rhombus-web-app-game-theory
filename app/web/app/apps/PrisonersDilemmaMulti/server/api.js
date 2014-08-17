module.exports = {
	init: init
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../../../../../log/logger"),
	util = require("../../../../../../framework/server/api/util");

function init(site, initConfig) {
	site.post("/api/apps/pdm/log", pdmResults);
}


function pdmResults(req, res) {
	var numPhases = 1;
	var choiceMap = {
		"C" : "C",
		"D" : "D"
	};

	util.phaseMatrixResults(req, res, "pdm", "Prisoner's Dilemma (multiround)", numPhases, choiceMap);

	return;
}