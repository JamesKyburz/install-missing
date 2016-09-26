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

var ignore = (pkgConfig('install-missing', { root: false, cwd: process.cwd() }) || { ignore: [] }).ignore

if (!module.parent) {
  installMissing(process.argv.slice(2)[0])
} else {
  var first = true
  module.exports = function (file, opts) {
    if (first) {
      var tmp = path.join(process.cwd(), `${uuid.v4().js}`)
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
      installMissing(path.relative(process.cwd(), tmp), function () {
        rimraf(tmp, cb)
      })
    }
  }
}

function noop () {}

function installMissing (file, cb) {
  fs.stat(packageJson, function exists (err) {
    if (err) fs.writeFileSync(packageJson, '{}')
    dependencyCheck({ path: process.cwd(), entries: file, noDefaultEntries: !!file }, missing)
  })

  var log = {
    info: debug('install-missing:info'),
    error: debug('install-missing:error')
  }

  log.info.log = console.log.bind(console)
  log.error.log = console.error.bind(console)

  var npmOptions = {
    cwd: process.cwd(),
    stdio: cb ? 'ignore' : 'inherit'
  }

  cb = cb || noop

  function missing (err, installed) {
    if (err) {
      log.error(err)
      return cb(err)
    }
    var pending = 2
    install(dependencyCheck.missing(installed.package, installed.used), done)
    uninstall(dependencyCheck.extra(installed.package, installed.used, { excludeDev: true }), done)

    function done (err) {
      if (err) {
        return cb(err)
      } else {
        pending--
        if (!pending) cb(err)
      }
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
      var error = code === 0 ? null : ('npm install failed ' + code)
      if (error) log.error(error)
      log.info('installed and saved to package.json as dependencies')
      cb(error)
    }
  }

  function uninstall (modules, cb) {
    modules = modules.slice()
    var npmArgs = process.env.NPM_ARGS || '-S'
    modules = modules.filter(function (x) { return ignore.indexOf(x) === -1 })
    if (!modules.length) return cb()
    modules.push(npmArgs)
    log.info('uninstalling missing modules', modules)
    modules.unshift('uninstall')
    var proc = spawn('npm', modules, npmOptions)
    proc.on('exit', exit)

    function exit (code) {
      var error = code === 0 ? null : ('npm uninstall failed ' + code)
      if (error) log.error(error)
      log.info('uninstalled and saved to package.json as dependencies')
      cb(error)
    }
  }
}
