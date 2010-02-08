var a = new events.Promise(), b = new events.Promise(), c = new events.Promise();
var co = new coroutine(a,b,c).addCallback(function(){sys.puts("coroutine called")});

sys.puts("a");
a.emitSuccess();
sys.puts("b");
b.emitSuccess();
sys.puts("c");
c.emitSuccess();
sys.puts("done");
