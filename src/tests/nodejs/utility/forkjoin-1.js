var done = false;

var a = new events.Promise(), b = new events.Promise(), c = new events.Promise();
var co = new forkjoin(a,b,c).addListener('success',function(){sys.puts("forkjoin called");done= true});

sys.puts("a");
a.emitSuccess();
sys.puts("b");
b.emitSuccess();
sys.puts("c");
c.emitSuccess();

assert.ok(done);
sys.puts("done");
