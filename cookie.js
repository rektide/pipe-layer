var SessionCookieFilter = function() {
	
	this.execute = function(ctx) {
		
		// insure session cookie
		var cookie = ctx.request.headers["Cookie"];
		if(!cookie)
			return this.returnCookie(ctx);

		// build context and continue chain	
		ctx.cookie = cookie;
		return false;
	}
	
	this.returnCookie = function(ctx) {
		
		// generate cookie
		var cookieCrumbs = [];
		for(var i = 0; i < 3; ++i)
			cookieCrumbs[i] = new String(Math.random()).slice(2);
		var cookie = cookieCrumbs.join("");

		// return cookie
		var headers = ctx.system_headers;
		if(!headers)
			headers = ctx.system_headers = {};
		headers["Set-Cookie": cookie];
		
		return false;
	}


}
