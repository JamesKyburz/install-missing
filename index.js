#!/usr/bin/env node
var dependencyCheck = require('dependency-check')
var spawn = require('cross-spawn')
var fs = require('fs')
var packageJson = process.cwd() + '/package.json'
var electronBuiltins = require('./electron_builtins.js')
var path = require('path')
var through = require('through2')
var debug = require('debug')

if (!module.parent) {
  installMissing(process.argv.slice(2)[0])
} else {
  module.exports = function (browserify, options) {
    var first = true
    browserify.pipeline.get('deps').unshift(through.obj(function record (deps, enc, next) {
      this.push(deps)
      if (!first) return next()
      installMissing(path.relative(process.cwd(), deps.file), next)
      first = false
    }))
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
    if (process.env.ELECTRON) modules = modules.filter(function (x) { return electronBuiltins.indexOf(x) === -1 })
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
    if (process.env.ELECTRON) modules = modules.filter(function (x) { return electronBuiltins.indexOf(x) === -1 })
    if (!modules.length) return cb()
    log.info('uninstalling missing modules', modules)

    fs.readFile(packageJson, (err, data) => {
      if (err) return cb(err)
      var json = JSON.parse(data)
      modules.forEach((module) => {
        delete json.dependencies[module]
      })
      fs.writeFile(packageJson, JSON.stringify(json, null, 2), (err) => {
        if (err) return cb(err)
        log.info('uninstalled and saved to package.json as dependencies')
        cb(null)
      })
    })
  }
}
