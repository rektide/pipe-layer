// utilities

// uuid -- adapted from http://note19.com/2007/05/27/javascript-guid-generator/
var uuidY = [8,9,'a','b']
function S4() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1) }
function uuid() { return [S4(),S4(),"-",S4(),"-4",S4().substring(1),"-",uuidY[Math.floor(Math.random()*4)],S4().substring(1),"-",S4(),S4(),S4()].join("") }


// main

var clientDb = {}

onconnect = function(e) {

	// capture port
	var port = e.ports[0]
	port.onmessage = onmessage

	// port is a new pipe; build pipe.
	var pipe = uuid()
	port._pipe = pipe // pipe id
	port._rseq = 1
	port._seq = 1
	port._seqTicket = 1
	port._deferred = []
	clientDb[pipe] = port
}

var onmessage = function(e) {

	var port = e.target
	var req = e.data

	var xhr = new XMLHttpRequest()
	xhr.open(req.method, req.url, true, req["user"], req["password"])

	// set imported headers
	for(var h in req.headers)
		xhr.setRequestHeader(h, req.headers[h])
	// add x-pipe and x-seq headers 
	xhr.setRequestHeader("X-Pipe", port._pipe)
	xhr.setRequestHeader("X-Seq", port._seqTicket++)

	// used only if server doesnt end up supporting x-pipe
	// otherwise, we look up the clientDb from the x-pipe
	xhr._port = port
	
	xhr.onreadystatechange = xhrHandler
	xhr.send(req["data"])
}

var headerValueChomp = /^:\s*(\w.*?)\s*\r?$/m
var xhrHandler = function(e,h) {
	
	// require at least headers to be done
	if(this.readyState < 2)
		return
	
	// prepare a response
	var msg = this["_message"]
	var continuation = msg === undefined // are we the continuation of another deferred message?
	if(msg == undefined)
		msg = {}
	msg.readyState = this.readyState // 3 may be around for a while

	// lookup pipe
	var pipe = this._pipe
	if(pipe === undefined) {
	
		pipe = headers["X-Pipe"] || headers["x-pipe"]
		if(pipe === undefined) return

		msg.pipe = pipe
	}
	if(pipe === undefined) {
		
		// ok this is a really weird context-- the server is asking to create its own pipe to us.
		pipe = headers["X-Create-Pipe"] || headers["x-create-pipe"]
		if(pipe === undefined) return

		msg.pipe = pipe
		
		// need to set up a router & global event dispatcher to figure out who (which pages) gets to talk to the new pipe
	
		// create a clientDb[pipe] entry to handle
		// this ought be another rhttp gateway
	}
	// non- pipelined server, reply is to original request
	if(pipe === undefined) {

		pipe = this._port._pipe
	}
	this._pipe = pipe

	// lookup port
	var port = clientDb[pipe]
	

	// initial XHR handle call
	if(this.readyState == 2 || this["_headersSent"] == undefined) {
		
		// parse headers
		var headers = {}
		var headerText = this.getAllResponseHeaders()
		var headerRows = headerText.split("\n")
		for(var rowIndex in headerRows) {

			var row = headerRows[rowIndex]
			var headerKey = row.split(":",1)[0]
			if(headerKey.length >= row.length)
				continue
			var headerValue = row.substr(headerKey.length)

			// clean headerValue
			headerValue = headerValueChomp.exec(headerValue)[1]
			
			// attach to existing header
			if(headers[headerKey] != undefined)
				headerValue = headers[headerKey]+","+headerValue
			
			// write complete header line to headers
			headers[headerKey] = headerValue
		}
	
		// install headers		
		msg.headers = headers
	
		// load status
		msg.status = this.status
		msg.statusText = this.statusText
	
		// load sequence
		msg.seq = headers["X-Seq"] || headers["x-seq"]
		msg.rseq = headers["X-RSeq"] || headers["x-rseq"]
	
		// headers are queued to send
		this._headersSent = true
	}
	
	// read in body content
	var bodyLen = this["_bodyLen"] || 0
	
	msg.responseDelta = this.responseText.substr(bodyLen)
	this._bodyLen = this.responseText.length
	
	// read in responseXML
	if(this.readyState == 4) {

		try {
			msg.responseXML = this.responseXML
		} catch (err) {}
	}
	
	// check whether we should defer
	if(msg.seq == port._seq) {

		// we are the current -- dont defer, send
		port.postMessage(msg)

		// check for deferred to send
		while(port._deferred.length && port._deferred[0].seq == port._seq) {

			// send the next message
			var msg = port._deferred.shift()
			postMessage.send(msg)

			// advance if the message was at the end
			if(msg.readyState == 4) {
				
				++port._seq
			}
			
		}
	}
	else if(!continuation) {
			
		// havent already queued/deferred a message, and we're further down the queue
		orderedInsert(port._deferred, msg, function(a,b) { return a.seq - b.seq })
		// since we're deferring, build any future xhr state upon this existing message
		this._message = msg
	} 
	// otherwise, we've been building a message and its queued to send.  we've updated state, so we're done.
}
