REPORTER = spec
TESTFILES = $(shell find test/ -name '*.test.js')

install:
	@echo "Installing production"
	@npm install --production
	@echo "Install complete"

docs:
	@jsdoc -c .jsdoc.conf index.js src/ tools/ Readme.md

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(TESTFILES)

lint:
	@echo "Linting..."
	@./node_modules/jshint/bin/jshint \
	  --config .jshintrc \
	  index.js src/*.js test/*.js

coverage:
	@echo "Generating coverage report.."
	@istanbul cover _mocha
	@echo "Done: ./coverage/lcov-report/index.html"

.PHONY: install docs test lint coverage
