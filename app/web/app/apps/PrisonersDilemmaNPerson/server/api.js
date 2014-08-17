module.exports = {
	init: init
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../../../../../log/logger"),
	util = require("../../../../../../framework/server/api/util");

function init(site, initConfig) {
	site.post("/api/apps/pdn/log", pdnResults);
}


function pdnResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;
	var payoff = req.body.payoff;
	var N = (payoff !== undefined) ? (parseInt(payoff.numCooperators, 10) + parseInt(payoff.numDefectors, 10)) : 0;

	if (!fs.existsSync("log/pdn")) {
		fs.mkdirSync("log/pdn"); // ensure the directory exists
	}
	var stream = fs.createWriteStream("log/pdn/results." + util.filenameFormat(now) + ".csv");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("N-Person Prisoner's Dilemma Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		if (config.Rratio) {
			output("Rratio," + config.Rratio + ",R,"+ (config.Rratio*(N-1)).toFixed(2));
		}
		if (config.H) {
			output("H," + config.H);
		}

		if (payoff) {
			output("N," + N);
			output("Cooperator Payoff," + payoff.cooperatorPayoff + ",# Cooperators," + payoff.numCooperators);
			output("Defector Payoff," + payoff.defectorPayoff + ",# Defectors," + payoff.numDefectors);
			output("Total Payoff," + payoff.totalPayoff);
			output("Max Possible Total Payoff," + payoff.maxPayoff);
		}

		output("Alias,Choice,Payoff");
		_.each(results, function (result) {
			output(result.alias + "," + result.choice + "," + result.score);
		});
		stream.end();
	});

	res.send(200);
}
