# install-missing

No more typing ```npm install```

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

This module finds out the modules needed to be installed and saves to
`package.json`

*Intended for the lazy developer

# usage
```
Usage: install-missing [file] default is entry file in package.json
```

The default argument sent to npm install is ```--save```, 
to change this set ```NPM_ARGS```

To exclude electron builtin modules run command with ```ELECTRON=true``` set

# install

With [npm](https://npmjs.org) do:

```
npm install -g install-missing
```

# license

MIT