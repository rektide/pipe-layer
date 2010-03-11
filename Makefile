
NODEJS_SRC=src/main/nodejs/*js

all: compile

compile:


run: compile
	node src/main/nodejs/runtime.js

