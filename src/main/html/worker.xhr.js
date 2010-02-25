// utilities

// uuid -- adapted from http://note19.com/2007/05/27/javascript-guid-generator/
var uuidY = [8,9,'a','b']
function S4() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1) }
function uuid() { return [S4(),S4(),"-",S4(),"-4",S4().substring(1),"-",uuidY[Math.floor(Math.random()*4)],S4().substring(1),"-",S4(),S4(),S4()].join("") }


// main

var clientDb = {}

onconnect = function(e) {

	var port = e.ports[0]
	port.onmessage = onmessage
	
	var pipe = port._pipe = uuid()
	clientDb[pipe] = port
}

var onmessage = function(e) {

	var port = e.target
	var req = e.data

	var xhr = new XMLHttpRequest()
	xhr.open(req.method, req.url, true, req["user"], req["password"])
	for(var h in req.headers)
		xhr.setRequestHeader(h, req.headers[h])
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
	var msg = {readyState: this.readyState}

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
		
		// load sequence
		this._seq = headers["X-Seq"]
		this._rseq = headers["X-RSeq"]
	
		var pipe = headers["X-Create-Pipe-Id"]
		if(pipe !== undefined) {
			this._pipe = pipe
		}
		else
			this._pipe = headers["X-Pipe-Id"]
		
		// non- pipelined server, reply is to original request
		if(this._pipe === undefined)
			this._pipe = this._port._pipe
		
		// load status
		msg.status = this.status
		msg.statusText = this.statusText
		
		// headers are queued to send
		this._headersSent = true
	}
	
	// address outgoing message
	msg.pipe = this._pipe
	msg.seq = this._seq
	msg.rseq = this._rseq
	
	// read in body content
	var bodyLen = this["bodyLen"] || 0
	msg.responseDelta = this.responseText.substr(bodyLen)
	this.bodyLen = this.responseText.length
	
	// read in responseXML
	if(this.readyState == 4) {
		try {
			msg.responseXML = this.responseXML
		} catch (err) {}
	}
	
	// lookup port
	var port = clientDb[this._pipe]
	// send	
	port.postMessage(msg)
}


