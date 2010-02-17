var done = false;

var a = new events.Promise(), b = new events.Promise(), c = 2;
var co = new forkjoin(a,b,c).addCallback(function(){sys.puts("forkjoin called");done= true});

sys.puts("a");
a.emitSuccess();
sys.puts("b");
b.emitSuccess();

sys.puts("c");
co.join();

assert.ok(done);
sys.puts("done");
