#!/usr/bin/env node
var dependencyCheck = require('dependency-check')
var spawn = require('cross-spawn')
var fs = require('fs')
var packageJson = process.cwd() + '/package.json'
var path = require('path')
var through = require('through2')
var uuid = require('uuid')
var debug = require('debug')
var rimraf = require('rimraf')
var pkgConfig = require('pkg-config')

var leave = (pkgConfig('install-missing', { root: false, cwd: process.cwd() }) || { leave: [] }).leave

if (!module.parent) {
  var file = process.argv.slice(2)[0]
  var basedir = process.argv.slice(2)[1]
  if (file === '-') {
    var tmp = path.join(process.cwd(), basedir, `${uuid.v4()}.js`)
    var out = fs.createWriteStream(tmp)
    process.stdin.pipe(out)
    process.stdin.resume()
    out.on('finish', function () {
      installMissing(path.relative(process.cwd(), tmp), function () {
        rimraf(tmp, noop)
      })
    })
  } else {
    installMissing(file)
  }
} else {
  var first = true
  module.exports = function (file, opts) {
    if (first) {
      var tmp = path.join(process.cwd(), `${uuid.v4()}.js`)
      var out = fs.createWriteStream(tmp)
      return through(write, end)
    } else {
      return through()
    }
    function write (chunk, enc, cb) {
      this.push(chunk)
      out.write(chunk)
      cb()
    }

    function end (cb) {
      installMissing(path.relative(process.cwd(), path.basename(tmp)), function () {
        rimraf(tmp, cb)
      })
    }
  }
}

function noop () {}

function installMissing (file, cb) {
  var log = {
    info: debug('install-missing:info'),
    error: debug('install-missing:error')
  }

  log.info.log = console.log.bind(console)
  log.error.log = console.error.bind(console)

  log.info(`install-missing ${file}`)
  fs.stat(packageJson, function exists (err) {
    if (err) fs.writeFileSync(packageJson, '{}')
    dependencyCheck({ path: process.cwd(), entries: file, noDefaultEntries: !!file }, missing)
  })

  var npmOptions = {
    cwd: process.cwd(),
    stdio: cb ? 'ignore' : 'inherit'
  }

  cb = cb || noop

  function missing (err, installed) {
    if (assertError(err, cb)) return
    var pending = 2
    install(dependencyCheck.missing(installed.package, installed.used), done)
    uninstall(dependencyCheck.extra(installed.package, installed.used, { excludeDev: true }), done)

    function done (err) {
      if (assertError(err, cb)) return
      pending--
      if (!pending) cb(null)
    }
  }

  function install (modules, cb) {
    modules = modules.slice()
    var npmArgs = process.env.NPM_ARGS || '-S'
    if (!modules.length) {
      log.info('all modules installed')
      return cb()
    }
    log.info('installing missing modules', modules)
    modules.push(npmArgs)
    modules.unshift('install')
    var proc = spawn('npm', modules, npmOptions)
    proc.on('exit', exit)

    function exit (code) {
      var err = code === 0 ? null : ('npm install failed ' + code)
      if (assertError(err, cb)) return
      log.info('installed and saved to package.json as dependencies')
      cb(null)
    }
  }

  function uninstall (modules, cb) {
    modules = modules.slice()
    modules = modules.filter(function (x) { return leave.indexOf(x) === -1 })
    if (!modules.length) return cb()
    fs.readFile(packageJson, function (err, data) {
      if (assertError(err, cb)) return
      var json = JSON.parse(data)
      modules.forEach(function (module) {
        if (json.dependencies) delete json.dependencies[module]
      })
      fs.writeFile(packageJson, JSON.stringify(json, null, 2), function (err) {
        if (assertError(err, cb)) return
        log.info('removed dependencies from package.json')
        cb(err)
      })
    })
  }

  function assertError (err, cb) {
    if (err) {
      log.error(err)
      cb(err)
    }
    return !!err
  }
}
