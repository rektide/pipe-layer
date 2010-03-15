// uuid -- adapted from http://note19.com/2007/05/27/javascript-guid-generator/
var uuidY = [8,9,'a','b']
function S4() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1) }
function uuid() { return [S4(),S4(),"-",S4(),"-4",S4().substring(1),"-",uuidY[Math.floor(Math.random()*4)],S4().substring(1),"-",S4(),S4(),S4()].join("") }

// query parser -- adapted from http://stevenbenner.com/2010/03/javascript-regex-trick-parse-a-query-string-into-an-object/
var queries = {};
window.location.href.replace(
	new RegExp("([^?=&]+)(=([^&]*))?", "g"),
	function($0, $1, $2, $3) { queries[$1] = $3; }
);
