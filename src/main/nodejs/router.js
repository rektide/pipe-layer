
// router is just command with a particular semantic meaning, and a weak implication that it probably delegates to other command patterns

var Router = function(f,r,opt) {

	this.name = "Router"
	this.f = f
	this.r = r
	this.issueNotFound = false

	for(var i in opt)
		this[i] = opt[i]

	this.execute = function(ctx) { 
		
		if(typeof(this.r) == "function")
			this.execute = this.executeFunction
		else
			this.execute = this.executeArray
		this.execute(ctx)
	}
	
	this.executeFunction = function(ctx) {
		
		sys.debug("ROUTE BEGIN")
		var t = this.f(ctx)
		if(!t)
			return this.returnNotFound(ctx)
		t = this.r(t,ctx)
		if(!t)
			return this.returnNotFound(ctx)
		sys.debug("ROUTE EXECUTE")
		ctx.chain.setChain(t)
		return false
	}
	
	this.executeArray = function(ctx) {
		
		sys.debug("ROUTE BEGIN")
		var t = this.f(ctx)
		if(!t)
			return this.returnNotFound(ctx)
		t = this.r[t]
		if(!t)
			return this.returnNotFound(ctx)
		sys.debug("ROUTE EXECUTE")
		ctx.chain.setChain(t)
		return false
	}
	
	this.returnNotFound = function(ctx) {
		
		sys.debug("ROUTE NOT FOUND")
		if(this.issueNotFound) {
			
			this.failure(ctx,"route not found",404)
			// already handled and dealt with request
			return "defer"
		}
		return false
	}
}
inherit.inherit(Router,DefaultBaseFilter)

var RegexRouter = function(f, routes, opt) {

	this.name = "RegexRouter"
	this.f = f

	// read in route database
	this.routes = []
	for(var r in routes)
	{
		rgx = r
		// strip // off regex string
		if(r[0] == "/" && r[r.length-1] == "/")
			rgx = r.slice(1,r.length-1)
		// write route entry
		this.routes.push([RegExp(rgx), routes[r]])
	}

	for(var i in opt)
		this[i] = opt[i]
	
	this.r = function(item,ctx) {
		for(var i in this.routes)
		{
			var match = this.routes[i][0].exec(item)
			if(match) {
				ctx.regexContext = match
				return this.routes[i][1]
			}
		}
		return false
	}
}
inherit.inherit(RegexRouter,new Router())

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
	return ctx.request.url
}

/*
pathRoutes = {}
pathRoutes[/home/] = HomeRouter
pathRoutes[/static/] = StaticRouter 

pathRouter = new RegexRouter( pathRoutes, Router.Path )
*/


