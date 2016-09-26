# install-missing

No more typing ```npm install```

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

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
