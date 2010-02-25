var worker_file = 'worker.xhr.js',
	worker_name = 'xpipe'

var XMLHttpRequest = function() {
	
	this.worker = new SharedWorker(worker_file,worker_name)

	this.worker.onerror = function(e) {
		console.log("xhr worker-error "+e)
	}

	this.open = function(method,url,async,user,password) {
	
		console.log("xhr open")	
		if(async == false)
			throw "XH async only"
		this.method = method
		this.url = url
		if(user)
			this.user = user
		if(password)
			this.password = password
		this.headers = {}
	}
	
	this.setRequestHeader = function(header,value) {
		
		console.log("xhr set-request-header")	
		this.headers[header] = value
	}
	
	this.send = function(data) {
		
		console.log("xhr send")
		if(data !== undefined)
			this.req["data"] = data

		var resp = this.resp = {readyState:0, responseText:""}
		this.worker.port._resp = resp
		this.worker.port._ready = this.onreadystatechange

		this.worker.port.postMessage(this.req)
		
		return resp
	}
	
	this.abort = function() {
		
	}

	// bind a listener
	this.worker.port.addEventListener('message',function(e){
	
		debugger
	
		console.log("xhr got-back")	
		var msg = e.data
		var resp = this._resp
		
		resp.readyState = msg.readyState
	
		var headers	= msg["headers"]
		if(headers !== undefined)
			resp.headers = headers
		var status = msg["status"]
		if(status !== undefined)
			resp.status = status
		var statusText = msg["statusText"]
		if(statusText !== undefined)
			resp.statusText = statusText
		
		resp.pipe = msg.pipe
		resp.seq = msg.seq
		resp.rseq = msg.rseq

		resp.responseText = this.responseText + msg.responseDelta 

		var responseXML = this["responseXML"]
		if(responseXML !== undefined)
			resp.responseXML = responseXML

		var ready = this._ready
		if(ready !== undefined)
			ready.call(resp)
		
	}, false)
	
	this.worker.port.start()
}
