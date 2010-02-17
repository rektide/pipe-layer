var makeSample = function(k){ 
	return function()
	{
		var rv = [];
		for(var i in k){rv[i]=k[i];}
		return rv;
	}; 
}
var sample1 = makeSample([3,3,6,9,15,24,39,63,102,165,267,432,699,1131,1830,2961,4092])

assert.equal(search(new sample1(),0,null,true), 0);
assert.equal(search(new sample1(),1,null,true), 0);
assert.equal(search(new sample1(),2,null,true), 0);
assert.equal(search(new sample1(),3,null,true), 0);
assert.equal(search(new sample1(),4,null,true), 2);
assert.equal(search(new sample1(),5,null,true), 2);
assert.equal(search(new sample1(),6,null,true), 2);
assert.equal(search(new sample1(),7,null,true), 3);
assert.equal(search(new sample1(),8,null,true), 3);
assert.equal(search(new sample1(),9,null,true), 3);
assert.equal(search(new sample1(),10,null,true), 4);

sys.puts("done");
