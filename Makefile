TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 1000

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(TESTS)

test-cov:
	@rm -rf ./lib-cov
	@$(MAKE) lib-cov
	@LOADER_COV=1 $(MAKE) test
	@LOADER_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage --encoding=utf8 lib $@

.PHONY: test-cov test lib-cov
