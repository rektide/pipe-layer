var SessionCookieFilter = function() {
	
	this.store = store;
	// default store
	if(!this.store) this.store = new Object();
	
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
		var resp = ctx.response;	
		resp.sendHeader(200, {"Content-Type": "text/plain", "Set-Cookie:": cookie});
		resp.sendBody("");
		resp.finish();
	
		return true;
	}


}
