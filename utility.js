// based on http://jsfromhell.com/array/search with sort added.
var binarySearch = function(o, v, s, i){
	
	if(!s) s= function(a,b){return a-b;};
	var h = o.length, l = -1, m;
	while(h - l > 1) {
		if(s(o[m = h + l >> 1],v,s)<0) l = m;
		else h = m;
	}
	return o[h] != v ? i ? h : -1 : h;
};

var orderedInsert = function(target,element,sort) {
	
	var i = search(target,elem,sort,true);
	target.splice(i,0,element);
	return i;
}

var bind = function(f,ctx) {

	return new function(g,ctxb) {
		return function()
		{
			return g.apply(ctxb,arguments);
		}	
	}(f,ctx);
}

var coroutine = function()
{
	this.final = arguments.length;
	this.count = 0;

	this.join = function()
	{
		sys.debug("join "+sys.inspect(this));
		if(++this.count==this.final) this.emitSuccess();
	}

	for(var i in arguments)
	{
		sys.debug("arg "+i);
		if(arguments[i] instanceof events.Promise)
		{
			sys.debug("add callback");
			arguments[i].addCallback( bind(this.join,this) );
		}
	}
	
}
coroutine.prototype = new events.Promise();
