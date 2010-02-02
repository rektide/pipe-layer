var BaseFilter = function() {

	this.name = "BaseFilter";
	
	this.failure = function(ctx,cause) {
		
		// load system headers
		var headers = {};
		var user = ctx.user || {};
		this.import_system_headers(user,headers);

		// load content length
		headers["Content-Length"] = cause.length;
	
		// send response	
		var resp = ctx.response;
		resp.sendHeader(400, headers);
		resp.sendBody(cause);
		resp.finish();
		
		return true;
	}

	this.import_system_headers = function(user,headers)
	{
		var system_headers = user.system_headers;
		user.system_headers = {};
		for(var header in system_headers)
			headers[header] = system_headers[header];
	
	}

	this.set_system_headers = function(user /*, headerN, valueN, ... */ )
	{
		var system_headers = user.system_headers;
		if(!system_headers)
			system_headers = user.system_headers = {};
		var len = arguments.length - 1;
		for(var i = 1; i < len; i += 2)
			system_headers[arguments[i]] = arguments[i+1];
	};
}

DefaultBaseFilter = new BaseFilter();
