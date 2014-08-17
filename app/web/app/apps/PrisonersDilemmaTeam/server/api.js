module.exports = {
	init: init
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../../../../../log/logger"),
	util = require("../../../../../../framework/server/api/util");

function init(site, initConfig) {
	site.post("/api/apps/pdteam/log", pdteamResults);
}


function pdteamResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		C: "C",
		D: "D",
	};

	util.teamPhaseMatrixResults(req, res, "pdteam", "Prisoner's Dilemma (team)", numPhases, choiceMap);
}
