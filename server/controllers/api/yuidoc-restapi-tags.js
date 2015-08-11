module.exports = function(data, options) {
	console.log('Start REST API filtering...');

	var apiTags = [
		'apiclass', 'apiversion', 'apibasepath', 'apiname',
		'apirequest', 'apiparam', 'apiresponse', 'apipostdata'
	];

	var filteredWarnings = [];

	for (var i in data.warnings) {
		var tag = data.warnings[i].message.replace('unknown tag: ', '');
		if (apiTags.indexOf(tag) < 0)
			filteredWarnings.push(data.warnings[i]);
	}

	data.warnings = filteredWarnings;
	console.log(filteredWarnings);

	for (var i in data.classitems) {
		console.log(data.classitems[i]);
	}
}

