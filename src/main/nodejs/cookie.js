var SessionCookieFilter = function() {

	this.name = "SessionCookieFilter"
	
	this.execute = function(ctx) {
		
		// insure session cookie
		var cookie = ctx.request.headers["cookie"]
		if(!cookie)
			cookie = this.buildCookie(ctx)

		// build context and continue chain	
		ctx.cookie = cookie
		return false
	}
	
	this.buildCookie = function(ctx) {
		
		// generate cookie
		var cookieCrumbs = []
		for(var i = 0; i < 2; ++i)
			cookieCrumbs[i] = new String(Math.random()).slice(2)
		var cookie = cookieCrumbs.join("")

		// set cookie -- user.system_headers has not been created yet!
		var headers = ctx.system_headers
		if(!headers)
			headers = ctx.system_headers = {}
		headers["Set-Cookie"] = cookie
		
		// return cookie
		return cookie
	}
	
	this.postProcess = function(ctx) {
	
		// first request must be replied to, so client has 	
		if(ctx.isNewUser) {
			var user = ctx.user
			if(!user.responses.length) return

			var headers = {"Content-Length": 0}
			this.import_system_headers(user,headers)
			
			var response = user.responses.shift()
			response.sendHeader(200,headers)
			response.close()
			
			sys.print("cookie.postProcess sent reply\n")
		}
			
	}
}

inherit.inherit(SessionCookieFilter,DefaultBaseFilter)
