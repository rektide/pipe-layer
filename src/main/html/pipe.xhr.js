var worker_file = '/pl/worker.xhr.js',
	worker_salt = queries["salt"] || "",
	worker_name = 'xpipe'+worker_salt

var XMLHttpRequest = function(existing_xhr,claim_seq) {

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

	if(existing_xhr && existing_xhr._worker) {
		this._worker = existing_xhr._worker
		if(claim_seq !== false)
			this._seq = ++this._worker.port._seqTicker
	} else {
		this._worker = new SharedWorker(worker_file,worker_name)
		this._seq = this._worker.port._seqTicket = 1
	}

	this.open = function(method,url,async,user,password) {
	
		if(async == false)
			throw "XH async only"
		
		var req = this._req
		req.method = method || "GET"
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


	this.getResponseHeader = function(header) {
		if(!this.headers)
			return ""
		return this.headers[header.toLowerCase()]
	}

	this.getAllResponseHeaders = function() {
		if(!this.headers)
			return ""
		var hdrs = []
		for(var i in this.headers)
			hdrs.push(i,": ",this.headers[i],"\r\n")
		return hdrs.join("")
	}

	// listener to dispatch to XHR's
	var replicants = ["pipe","seq","rseq","readyState","headers","status","statustext","responseXML"]
	this.handler= function(e) {

		var xhrs = this._xhrs, // all pipe listeners
			xhr = this._xhr, // present pipe listener
			msg = e.data
		console.log("pipe-xhr handler",xhrs,msg)

		var notifyee
		if(msg.rseq) {
			// its an rseq event, not a specific XHR reply
			xhr = new XMLHttpRequest(xhr,false)

			// notify all onpush listeners of this pipe
			notifyee = function(xhr) {
				for(var i in xhrs)
					if(typeof xhrs[i].onpush == "function")
						xhrs[i].onpush.call(xhr)
			}
		}
		else {
			// if we have a new sequence
			if(msg.seq) {
				// find present xhr
				xhr = this._xhr = xhrs[msg.seq]
			}
			// get present XHR's notifyee
			notifyee = xhr.onreadystatechange
		}
		
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
		if(typeof notifyee == "function")
			notifyee.call(xhr)
	}
	
	// insure handler is running for all XHR's on this port
	var xhrs = this._worker.port._xhrs
	// initialize if we're the first XHR for the worker's port
	if(!xhrs) {
		// create xhrs collection
		this._worker.port._xhrs = xhrs = []
		
		// make a port listener to handle incoming data
		this._worker.port.addEventListener('message',this.handler)
	
		// make an error handler for pipe
		this._worker.onerror = function(e) {
			console.log("xhr worker-error "+e)
		}
	
		// capture this XHR
		xhrs[this._seq] = this
		
		// start worker port
		this._worker.port.start()
	}
	// capture this XHR on our workers port
	else if(this._seq)
		xhrs[this._seq] = this

}
