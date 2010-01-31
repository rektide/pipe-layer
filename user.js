var UserStoreFilter = function(store) {

	this.name = "UserStoreFilter";
	
	this.store = store;
	if(!this.store) 
		this.store = new Object();

	this.execute = function(ctx) {
	
		var cookie = ctx.cookie;
		var user = this.store[cookie];
		
		if(!user) 
		{
			user = this.store[cookie] = this.createUser(ctx,cookie);
			ctx.isNewUser = true;
		}
		
		ctx.user = user;
		return false;
	}
	
	this.createUser = function(ctx,cookie) {
		
		// build and install
		var user = new Object();
		
		// set
		user.created = new Date();
		user.cookie = cookie;
		user.responses = new Array();
		user.pipes = new Object();
		
		if(ctx.system_headers)
			user.system_headers = ctx.system_headers;
		else
			user.system_headers = {};
		
		return user;
	}
}

inherit.inherit(UserStoreFilter,DefaultBaseFilter);
