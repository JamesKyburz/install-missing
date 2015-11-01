#!/usr/bin/env node
var dependencyCheck = require('dependency-check')
var spawn = require('win-spawn')
var fs = require('fs')
var packageJson = process.cwd() + '/package.json'

fs.stat(packageJson, function exists (err) {
  if (err) fs.writeFileSync(packageJson, '{}')
  dependencyCheck({path: process.cwd(), entries: process.argv.slice(2)}, missing)
})

function missing (err, installed) {
  if (err) return console.error(err)
  install(dependencyCheck.missing(installed.package, installed.used))
}

function install (modules) {
  if (!modules.length) return console.log('all modules installed')
  console.log('installing missing modules', modules)
  modules.unshift('install')
  var npmArgs = process.env.NPM_ARGS || '-S'
  modules.push(npmArgs)
  var proc = spawn('npm', modules, {stdio: 'inherit', cwd: process.cwd()})
  proc.on('exit', exit)

  function exit (code) {
    if (code !== 0) return console.error('npm install failed', code)
    console.log('installed and saved to package.json as dependencies')
  }
}
