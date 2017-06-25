# install-missing

[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://github.com/feross/standard)
[![Greenkeeper badge](https://badges.greenkeeper.io/JamesKyburz/install-missing.svg)](https://greenkeeper.io/)

No more typing ```npm install```

This module finds out the modules needed to be installed and saves to
`package.json`

*Intended for the lazy developer*

When paired with [hihat] it gives you a
[requirebin] like experience!

If `package.json` is missing it will be created with `{}`

# video

<a href="https://asciinema.org/a/33310?autoplay=1"><img src="https://asciinema.org/a/33310.png" width="380"/></a>

# cli usage
```
install-missing [file] default is entry file in package.json
```

# browserify plugin

This will allow you to browserify uninstalled modules!

```
browserify -p $(which install-missing)
```

or

use with [hihat]

```
hihat  index.js -- -p $(which install-missing)
```

The default argument sent to npm install is ```--save```, 
to change this set ```NPM_ARGS```

To exclude electron builtin modules run command with ```ELECTRON=true``` set

# install

With [npm] do:

```
npm install -g install-missing
```

# license

MIT

[hihat]:https://github.com/Jam3/hihat
[requirebin]:http://requirebin.com
[npm]:https://npmjs.org
