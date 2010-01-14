
# router is just command with a particular semantic meaning, and a weak implication that it probably delegates to other command patterns

Router = function()
{
	this.execute = function(ctx) { return false; }
};

RegexRouter = function(routes, ctxMap)
{
	this.routes = {};
	var i = 0;
	for(var r in routes)
	{
		rgx = r;
		if(r[0] == "/" && r[r.length] == "/")
			rgx = r.slice(1,r.length-1)
		this.routes[i++] = [RegExp(rgx), routes[r]];
	}
	
	this.execute = function(ctx)
	{
		var str = ctxMap(ctx);
		for(var i in routes)
		{
			var route = routes[i];
			if(str.match(route[0])) 
				return route[1];
		}
		return false;
	}

}

domainFunction = function(ctx) {
	return ctx.request.headers.Host;
}
domainRoutes = {};
domainRoutes[/internal.voodoowarez.com/] = InternalRouter;
domainRoutes[/pipe.voodoowarez.com/] = InternalRouter;
domainRoutes[/content.voodoowarez.com/] = InternalRouter;
domainRoutes[/user.voodoowarez.com/] = InternalRouter;

domainRouter = new RegexRouter( domainRoutes, domainFunction );



pathFuntion = function(ctx) {
	return ctx.request.uri.full;
}
pathRoutes = {};
pathRoutes[/home/] = HomeRouter;
pathRoutes[/static/] = StaticRouter; 

pathRouter = new RegexRouter( pathRoutes, domainRoutes );



