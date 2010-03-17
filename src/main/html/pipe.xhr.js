var worker_file = '/pl/worker.xhr.js',
	worker_salt = queries["salt"] || "",
	worker_name = 'xpipe'+worker_salt

var XMLHttpRequest = function() {

	// states
	this.UNSENT = 0
	this.OPENED = 1
	this.HEADERS_RECEIVED = 2
	this.LOADING = 3
	this.DONE = 4
	
	this.readyState = 0

	// response properties
	this.status = null
	this.statusText = null
	this.responseText = null
	this.responseXML = null

	// internal fields
	this._req = {}
	
	this._worker = new SharedWorker(worker_file,worker_name)
	this._worker.onerror = function(e) {
		console.log("xhr worker-error "+e)
	}
	
	this.open = function(method,url,async,user,password) {
	
		if(async == false)
			throw "XH async only"
		
		var req = this._req
		req.method = method
		req.url = url
		if(user)
			req.user = user
		if(password)
			req.password = password
		req.headers = {}
		
		this.readyState = 1
	}
	
	this.setRequestHeader = function(header,value) {
		
		if(this.readyState != 1)
			throw "INVALID_STATE_ERR"
		
		this._req.headers[header] = value
	}
	
	this.send = function(data) {
	
		if(this.readyState != 1)
			throw "INVALID_STATE_ERR"
		
		if(data !== undefined)
			this._req["data"] = data

		this._worker.port.postMessage(this._req)
	}
	
	this.abort = function() {
		
	}

	// capture this
	this._worker.port._xhr = this

	// bind a listener
	var replicants = ["pipe","seq","rseq","readyState","headers","status","statustext","responseXML"]
	this.handler= function(e) {

		var xhr = this._xhr
		var msg = e.data
		console.log("pipe-xhr handler",xhr,msg)

		// copy data into XHR
		for(var ri in replicants) {
			var r = replicants[ri]
			var tmp = msg[r]
			if(tmp !== undefined)
				xhr[r] = tmp
		}

		// spool in responseDelta
		xhr.responseText = (xhr.responseText || "") + msg.responseDelta

		// fire ready state handler
		var ready = xhr.onreadystatechange
		if(ready !== undefined)
			ready.call(xhr)
	}
	this._worker.port.addEventListener('message',this.handler)

	this._worker.port.start()
}
