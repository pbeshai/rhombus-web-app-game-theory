module.exports = {
	init: init
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../../../../../log/logger"),
	util = require("../../../../../../framework/server/api/util");

function init(site, initConfig) {
	site.post("/api/apps/ultimatum/log", ultimatumResults);
}


function ultimatumResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;

	var flags = req.body.flags;

	if (flags && flags.round) {
		console.log("ROUND");
		util.roundResults(req, res, "ultimatum", "Ultimatum Game", null, participantDataFromRounds, false,
			[ "giverOffer", "giverScore", "giverPartner", "receiverOffer", "receiverScore", "receiverPartner"]);
		return;
	}

	var numPhases = 3;
	var offerMap = config.offerMap;
	var totals = {};

	if (!fs.existsSync("log/ultimatum")) {
		fs.mkdirSync("log/ultimatum"); // ensure the directory exists
	}
	var stream = fs.createWriteStream("log/ultimatum/results." + util.filenameFormat(now) + ".csv");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Ultimatum Game Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		output("Total Amount," + config.amount);
		output("Offer Map," + _.map(_.keys(offerMap), function (key) { return key + ":" + offerMap[key]; }).join(","));
		output("");

		// output results for each phase
		for (var i = 0 ; i < numPhases; i++) {
			outputPhase(i + 1);
		}

		// output totals
		output("");
		output("");
		output("Totals");
		output("======");
		var header = "Alias";
		for (i = 0; i < numPhases; i++) {
			header += ",Phase" + (i + 1) + "Total";
		}
		header += ",OverallTotal";
		output(header);

		_.each(_.keys(totals), function (alias) {
			var data = alias;
			for (var i = 0; i < numPhases; i++) {
				data += "," + (totals[alias]["phase" + (i + 1)] || 0);
			}
			data += "," + (totals[alias].total || 0);

			output(data);
		});


		function outputPhase(phaseNum) {
			var phase = req.body["phase" + phaseNum];

			output("");
			output("Phase " + phaseNum);
			output("-------");


			// output for each round
			var header = "Alias";
			for (var r = 1; r <= config.roundsPerPhase; r++) {
				header += ",P"+phaseNum+"R"+r+"GiverDemand,P"+phaseNum+"R"+r+"GiverScore,P"+phaseNum+"R"+r+"GiverPartner,P" +
									phaseNum+"R"+r+"ReceiverOffer,P"+phaseNum+"R"+r+"ReceiverScore,P"+phaseNum+"R"+r+"ReceiverPartner";
			}
			header += ",P"+phaseNum+"Total";
			output(header);



			// use last round of phase to catch as many latecomers as possible
			_.each(phase.results[phase.results.length - 1], function (participant, i) {
				var data = participant.alias;
				var giverOffer, giverScore, giverPartner, receiverOffer, receiverScore, receiverPartner;
				var phaseTotal = 0;

				var matchAlias = function (p) { return p.alias === participant.alias; };
				// for each round
				for (r = 0; r < config.roundsPerPhase; r++) {
					// may not match index in different rounds if a bot drops out in a phase or somebody is added, so look up by alias
					roundData = _.find(phase.results[r], matchAlias);

					if (roundData) {
						giverOffer = roundData.giverOffer;
						giverScore = roundData.giverScore;
						giverPartner = roundData.giverPartner;
						receiverOffer = roundData.receiverOffer;
						receiverScore = roundData.receiverScore;
						receiverPartner = roundData.receiverPartner;
					}	else { // missing (e.g. they were late and didn't play)
						giverOffer = "X";
						giverScore = 0;
						giverPartner = "X";
						receiverOffer = "X";
						receiverScore = 0;
						receiverPartner = "X";
					}
					data += "," + giverOffer + "," + giverScore + "," + giverPartner +
						"," + receiverOffer + "," + receiverScore + "," + receiverPartner;
					phaseTotal += parseInt(giverScore, 10) + parseInt(receiverScore, 10);
				}

				data += "," + phaseTotal;

				if (totals[participant.alias] === undefined) {
					totals[participant.alias] = {};
				}
				totals[participant.alias]["phase" + phaseNum] = phaseTotal;
				totals[participant.alias].total = (totals[participant.alias].total || 0) + phaseTotal;
				output(data);
			});
		}

		// output the totals

		stream.end();
	});

	res.send(200);
}
