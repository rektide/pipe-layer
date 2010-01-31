var posix = require("posix"),
    sys = require("sys");

var readLength = 8 * 1024 * 1024;

exports.evalFile = function(context,filename)
{
	var file = posix.open(filename, process.O_RDONLY, 0).wait();
	var data = posix.read(file, readLength).wait()[0];
	eval(data,context);
}
