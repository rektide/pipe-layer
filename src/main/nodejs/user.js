var UserStoreFilter = function(store,uriTemplate) {

	this.name = "UserStoreFilter";
	
	this.store = store;
	if(!this.store) 
		this.store = new Object();

	this.uriTemplate = uriTemplate;
	if(!this.uriTemplate)
		this.uriTemplate = "http://users.voodoowarez.com/{user}/{pipe}/"

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
	
		// load existing system headers	
		if(ctx.system_headers)
			user.system_headers = ctx.system_headers;
		else
			user.system_headers = {};

		// provide uri template
		this.set_system_headers(user,"X-Pipe-Uri-Template",this.uriTemplate);
		
		return user;
	}
}

inherit.inherit(UserStoreFilter,DefaultBaseFilter);
