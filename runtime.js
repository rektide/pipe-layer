var http = require("http"),
    sys = require("sys"),
    posix = require("posix"),
    evalFile = require("./eval_file"),
    inherit = require("./inherit");

var loadFiles = [
	"chain.js", "base.js",
	"cookie.js", "user.js", "xpipe.js", "reverse.js"
];

var readLength = 8 * 1024 * 1024;
for(var f in loadFiles)
{
	var filename = loadFiles[f];
	sys.print("evaluating "+filename+"\n");
	
	var file = posix.open(""+filename, process.O_RDONLY, 0).wait();
	var data = posix.read(file, readLength).wait()[0];
	var context = eval(data,context);
};


var userStore = new Object();

var chain = [ 
	new SessionCookieFilter(),
	new UserStoreFilter(userStore), 
	new XPipeFilter(),
	new ReverseHttpFilter()
];
process.mixin(chain,new Chain());


http.createServer(function(request,response) {
	var pc = new PipeContext(request,response);
	chain.execute(pc);
}).listen(8765);


