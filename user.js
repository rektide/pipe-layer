var UserStoreFilter = function(store) {
	
	this.store = store;
	if(!this.store) 
		this.store = new Object();

	var execute = function(ctx) {
	
		var cookie = ctx.cookie;
		var user = this.store[cookie];
		
		if(!user) 
			user = this.store[cookie] = this.createUser(ctx,cookie);
		
		ctx.user = user;
		return false;
	}
	
	this.createUser() = function(ctx,cookie) {
		
		// build and install
		var user = new Object();
		
		// set
		user.created = new Date();
		user.cookie = cookie;
		user.responses = new Array();
		user.pipes = new Object();
		
		return user;
	}
}
