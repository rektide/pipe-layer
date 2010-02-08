// based on http://jsfromhell.com/array/search with sort added.
var search = function(o, v, s, i){
	
	if(!s) s= function(a,b){return a-b;};
	var h = o.length, l = -1, m;
	while(h - l > 1) {
		if(s(o[m = h + l >> 1],v,s)<0) l = m;
		else h = m;
	}
	return o[h] != v ? i ? h : -1 : h;
};

var orderedInsert = function(target,element,sort) {
	
	var i = search(target,elem,sort,true);
	target.splice(i,0,element);
	return i;
}
