var worker_file = 'worker.xhr.js',
	worker_name = 'xpipe'

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
		console.log("xhr open")	
		
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
		console.log("xhr set-request-header")
		
		this._req.headers[header] = value
	}
	
	this.send = function(data) {
	
		if(this.readyState != 1)
			throw "INVALID_STATE_ERR"
		console.log("xhr send")
		
		if(data !== undefined)
			this._req["data"] = data

		this._worker.port.postMessage(this._req)
	}
	
	this.abort = function() {
		
	}

	// bind a listener
	function handler(e) {
	
		console.log("xhr got-back")
		var msg = e.data
	
		var pipe = msg["pipe"]
		if(pipe !== undefined)
			this.pipe = pipe
		var seq = msg["seq"]
		if(seq !== undefined)
			this.seq = seq
		var rseq = msg["rseq"]
		if(rseq !== undefined)
			this.rseq = rseq
	
		// non message response	
		this.readyState = msg.readyState
		if(msg["readyState"] === undefined) return
	
		var headers = msg["headers"]
		if(headers !== undefined)
			this.headers = headers
		var status = msg["status"]
		if(status !== undefined)
			this.status = status
		var statusText = msg["statusText"]
		if(statusText !== undefined)
			this.statusText = statusText
		
		this.responseText = this.responseText || "" + msg.responseDelta 

		var responseXML = this["responseXML"]
		if(responseXML !== undefined)
			this.responseXML = responseXML

		var ready = this.onreadystatechange
		if(ready !== undefined)
			ready.call(this)
		
	}, false)
	this._worker.port.addEventListener('message',handler)

	this._worker.port.start()
}
