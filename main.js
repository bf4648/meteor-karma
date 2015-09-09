var path = Npm.require('path')
var fs = Npm.require('fs-extra')

log = loglevel.createPackageLogger('[sanjo:karma]', process.env.KARMA_LOG_LEVEL || 'info')

Karma = {
  start: function (id, options) {
    options = options || {}
    log.debug('Karma.start', id)

    return Karma.restartWithConfig(id, options)
  },

  isRunning: function (id) {
    var karmaChild = KarmaInternals.getKarmaChild(id)
    return karmaChild.isRunning()
  },

  stop: function (id) {
    var karmaChild = KarmaInternals.getKarmaChild(id)
    if (karmaChild.isRunning()) {
      log.debug('Stopping Karma server.')
      karmaChild.kill()
    }
  },

  restartWithConfig: function (id, options) {
    log.debug('Karma.restartWithConfig', id)

    var oldConfig = KarmaInternals.readKarmaConfig(id)
    var newConfig = KarmaInternals.generateKarmaConfig(options)

    var hasConfigChanged = (!oldConfig || newConfig !== oldConfig)

    var karmaChild = KarmaInternals.getKarmaChild(id)
    var wasRunning = karmaChild.isRunning()

    // (re)start running Karma server when config has changed
    if (hasConfigChanged) {
      log.debug('New config is different from the old one.')
      log.debug(oldConfig)
      log.debug(newConfig)

      log.debug('Restarting Karma server to reload config.')
      if (wasRunning) {
        karmaChild.kill()
      }

      KarmaInternals.writeKarmaConfig(id, newConfig)

    } else {
      log.debug('New config is exactly the same as the old one.')
    }

    // start the server if it was killed due to config update
    // or if it's a first start (with unchanged config)
    if (!wasRunning || hasConfigChanged) {
      return KarmaInternals.startKarmaServer(id)
    } else {
      return karmaChild
    }
  },

  getConfigPath: function (id) {
    return KarmaInternals.getConfigPath(id)
  }
}

KarmaInternals = {
  karmaChilds: {},

  getKarmaChild: function (id) {
    var karmaChild = KarmaInternals.karmaChilds[id]
    if (!karmaChild) {
      karmaChild = new sanjo.LongRunningChildProcess(id)
      KarmaInternals.setKarmaChild(id, karmaChild)
    }

    return karmaChild
  },

  setKarmaChild: function (id, karmaChild) {
    KarmaInternals.karmaChilds[id] = karmaChild
  },

  startKarmaServer: function (id) {
    log.debug('KarmaInternals.startKarmaServer(' + id + ')')
    var karmaChild = KarmaInternals.getKarmaChild(id)
    var configPath = KarmaInternals.getConfigPath(id)
    var karmaPath = KarmaInternals.getKarmaPath()
    fs.chmodSync(karmaPath, parseInt('544', 8))
    var spawnOptions = {
      command: process.execPath,
      args: [karmaPath, 'start', configPath]
    }
    // It will only spawn when the process is not already running
    karmaChild.spawn(spawnOptions)

    return karmaChild
  },

  writeKarmaConfig: function (id, config) {
    var configPath = KarmaInternals.getConfigPath(id)
    fs.outputFileSync(configPath, config)

    return configPath
  },

  generateKarmaConfig: function (options) {
    return 'module.exports = function(config) {\n' +
      '  config.set(' +
      JSON.stringify(options, null, 2) +
      ');\n};'
  },

  readKarmaConfig: function (id) {
    var configPath = KarmaInternals.getConfigPath(id)
    try {
      return fs.readFileSync(configPath, {encoding: 'utf8'})
    } catch (error) {
      return null
    }
  },

  getConfigPath: function (id) {
    return path.join(
      MeteorFilesHelpers.getAppPath(),
      '.meteor/local/karma/' + id + '/config.js'
    )
  },

  getKarmaPath: function () {
    return path.join(MeteorFilesHelpers.getNodeModulePath('sanjo:karma', 'karma'), 'bin', 'karma')
  }
}
