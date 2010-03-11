
// router is just command with a particular semantic meaning, and a weak implication that it probably delegates to other command patterns

Router = function(f,r) {

	this.f = f
	this.r = r
	this.rf = typeof(r) == "function"
	this.execute = function(ctx) { 
		var k = this.f(r)
		// TODO: metaprogram this
		return (this.rf?this.r(k):this.r[k]).execute(ctx)
	}
}

RegexRouter = function(f, routes) {

	this.f = f

	this.routes = {}
	var i = 0
	for(var r in routes)
	{
		rgx = r
		if(r[0] == "/" && r[r.length] == "/")
			rgx = r.slice(1,r.length-1)
		this.routes[i++] = [RegExp(rgx), routes[r]]
	}
	
	this.r = function(item) {
		for(var i in this.routes)
			if(this.routes[i][0].match(item))
				return this.routes[i]
		return false
	}
}

Router.domain = function(ctx) {
	return ctx.request.headers.Host
}

/*
domainRoutes = {}
domainRoutes[/internal.voodoowarez.com/] = InternalRouter
domainRoutes[/pipe.voodoowarez.com/] = InternalRouter
domainRoutes[/content.voodoowarez.com/] = InternalRouter
domainRoutes[/user.voodoowarez.com/] = InternalRouter

domainRouter = new RegexRouter( domainRoutes, Router.domain )
*/


Router.path = function(ctx) {
	return ctx.request.uri.full
}

/*
pathRoutes = {}
pathRoutes[/home/] = HomeRouter
pathRoutes[/static/] = StaticRouter 

pathRouter = new RegexRouter( pathRoutes, Router.Path )
*/


