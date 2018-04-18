### v1.2.2

- [Fixed](https://github.com/glacejs/glace-utils/commit/5e63be059687c412173652b22ffa51df5bd6487b) bug in download function in order to download only 200-response files.

### v1.2.1

- [Added](https://github.com/glacejs/glace-utils/commit/b92a06964e009c4ecbbdb19f6f282397c7041295) function to download files.

### v1.2.0

- [Provided](https://github.com/glacejs/glace-utils/commit/3b75715d5a932c2e16dc26806d013477555f50e8) logger options in config.

### v1.1.9

- [Expanded](https://github.com/glacejs/glace-utils/commit/e133363d3514d023ec388e9fb970866b1fa957f7) logs of processes killing.

### v1.1.8

- [Don't kill](https://github.com/glacejs/glace-utils/commit/4b7c7a28f9e5e8a891ece5abfe452c025b398db6) parent process.

### v1.1.7

- [Added](https://github.com/glacejs/glace-utils/commit/60280858c1b1ffa061ef22da7f1ea33ea62231d7) helper `textContains`.
- [Added](https://github.com/glacejs/glace-utils/commit/6d621e8ed44b88dd8c6239825d0b49e89adea3c3) infrastructure scripts.

### v1.1.6

- [Added](https://github.com/glacejs/glace-utils/commit/5743f4e6e6456fcaedc461457b04a9a40504a096) support for docstring style in `js` functions.
- [Added](https://github.com/glacejs/glace-utils/commit/d916638e64e8c3d3f853e36365cee99be155e054) helper `waitDuring`.

### v1.1.5

- [Expanded](https://github.com/glacejs/glace-utils/commit/7f826037af43f0fe86efe0e492bd68cf4f2ce032) list of autocomplete variants.

### v1.1.4

- [Fixed](https://github.com/glacejs/glace-utils/commit/57c88d88c36a6bc2a87dc511b0c18fb648972dff) bug that autocomplete didn't show full list of object properties.

### v1.1.3

- [Added](https://github.com/glacejs/glace-utils/commit/b344f15069fa4db53e1a57fecfbe893f832198e3) `GlaceError` class.

### v1.1.2

- [Fixed](https://github.com/glacejs/glace-utils/commit/bd372541597d983f989a9d022b64280af2fc6c16) bug that `killProcs` killed current process.

### v1.1.1

- [Fixed](https://github.com/glacejs/glace-utils/commit/103c356d9c12c5669562ffabe1b89e8fe82eddd3) bug that code completion showed variants which are started with numbers or contain non-alphanumeric symbols.

### v1.1.0

- [Fixed](https://github.com/glacejs/glace-utils/commit/2dce00942e3a4f1d12e5498f421dd394abd79124) bugs, that it wasn't possible to assign variables and not all object properties and methods were shown.

### v1.0.8

- [Added](https://github.com/glacejs/glace-utils/commit/326da491dc3ce2c2d5efc2014a466fead1fb47d9) interactive debugger.

### v1.0.7

- [Added](https://github.com/glacejs/glace-utils/commit/726b785a9037b322004ddced01171fe4805dc007) function [`waitFor`](module-index.html#.waitFor__anchor).

### v1.0.6

- [Added](https://github.com/glacejs/glace-utils/commit/5602ff75c6933e19840f7e99cd892cd73727a85f) function [`objOnScreenPos`](module-index.html#.objOnScreenPos__anchor).

### v1.0.5

- Added functions `isInScene` and `toKebab`.

### v1.0.4

- Supports recursive json load if key `__parent` with path to parent json is specified in json file. Arguments config file supports `__parent` key too.

### v1.0.3

- Fixed bug, that internal module variable `logger` was defined only if global variable `__glaceLogger` wasn't defined before.
