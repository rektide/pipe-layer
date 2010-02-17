var sys = require("sys");

exports.inherit = function(target) {

	for(var i = 1 ; i < arguments.length; ++i) {
		var source = arguments[i];
		for(var j in source) {
			if(!target.prototype[j]) {
				target.prototype[j] = source[j];
			}
		}
	}
}
