var SessionCookieFilter = function() {
	
	this.execute = function(ctx) {
		
		// insure session cookie
		var cookie = ctx.request.headers["Cookie"];
		if(!cookie)
			cookie = this.buildCookie(ctx);

		// build context and continue chain	
		ctx.cookie = cookie;
		return false;
	}
	
	this.buildCookie = function(ctx) {
		
		// generate cookie
		var cookieCrumbs = [];
		for(var i = 0; i < 3; ++i)
			cookieCrumbs[i] = new String(Math.random()).slice(2);
		var cookie = cookieCrumbs.join("");

		// set cookie
		var headers = ctx.system_headers;
		if(!headers)
			headers = ctx.system_headers = {};
		headers["Set-Cookie"] = cookie;
		
		// return cookie
		return cookie
	}


}
