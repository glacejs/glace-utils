### v1.0.4

- Supports recursive json load if key `__parent` with path to parent json is specified in json file. Arguments config file supports `__parent` key too.

### v1.0.3

- Fixed bug, that internal module variable `logger` was defined only if global variable `__glaceLogger` wasn't defined before.
