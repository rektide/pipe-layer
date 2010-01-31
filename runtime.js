var http = require("http"),
    sys = require("sys"),
    evalFile = require("./eval_file"),
    inherit = require("./inherit");



var loadFiles = [
	"chain.js", "base.js",
	"cookie.js", "user.js", "xpipe.js", "reverse.js"
];

for(var f in loadFiles)
{
	sys.print("eval "+loadFiles[f]+"\n");
	evalFile.evalFile("./"+loadFiles[f]);
}


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


