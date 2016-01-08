#!/usr/bin/env node
var dependencyCheck = require('dependency-check')
var spawn = require('cross-spawn')
var fs = require('fs')
var packageJson = process.cwd() + '/package.json'
var electronBuiltins = require('./electron_builtins.js')
var path = require('path')

if (!module.parent) {
  installMissing()
} else {
  module.exports = function(browserify, options) {
    browserify.on('file', function (file) {
      if (/node_modules/.test(file)) return
      installMissing(path.relative(__dirname, file))
    })
  }
}

function installMissing (entries) {
  fs.stat(packageJson, function exists (err) {
    if (err) fs.writeFileSync(packageJson, '{}')
    dependencyCheck({path: process.cwd(), entries: entries || process.argv.slice(2)}, missing)
  })

  function missing (err, installed) {
    if (err) return console.error(err)
    install(dependencyCheck.missing(installed.package, installed.used))
  }

  function install (modules) {
    var npmArgs = process.env.NPM_ARGS || '-S'
    if (process.env.ELECTRON) modules = modules.filter(function (x) { return electronBuiltins.indexOf(x) === -1 })
    if (!modules.length) return console.log('all modules installed')
    console.log('installing missing modules', modules)
    modules.push(npmArgs)
    modules.unshift('install')
    var proc = spawn('npm', modules, {stdio: 'inherit', cwd: process.cwd()})
    proc.on('exit', exit)

    function exit (code) {
      if (code !== 0) return console.error('npm install failed', code)
      console.log('installed and saved to package.json as dependencies')
    }
  }
}
