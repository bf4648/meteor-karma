var path = Npm.require('path')
var fs = Npm.require('fs-extra')
var semver = Npm.require('semver')

log = loglevel.createPackageLogger('[sanjo:karma]', process.env.KARMA_LOG_LEVEL || 'info')

Karma = {
  start: function (id, options) {
    options = options || {}
    log.debug('Karma.start', id)

    Karma.setConfig(id, options)

    return KarmaInternals.startKarmaServer(id, options)
  },

  setConfig: function (id, options) {
    log.debug('Karma.setConfig', id)

    var oldConfig = KarmaInternals.readKarmaConfig(id)
    var newConfig = KarmaInternals.generateKarmaConfig(options)

    if (!oldConfig || newConfig !== oldConfig) {
      log.debug('New config is different from the old one.')
      log.debug(oldConfig)
      log.debug(newConfig)
      KarmaInternals.writeKarmaConfig(id, newConfig)

      // Restart running Karma server when config has changed
      var karmaChild = KarmaInternals.getKarmaChild(id)
      if (karmaChild.isRunning()) {
        log.debug('Restarting Karma server to reload config.')
        karmaChild.kill()
        KarmaInternals.startKarmaServer(id)
      }
    } else {
      log.debug('New config is exactly the same as the old one.')
    }
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
    var karmaPath = KarmaInternals.getKarmaPath();
    fs.chmodSync(karmaPath, parseInt('544', 8));
    var spawnOptions = {
      command: karmaPath,
      args: ['start', configPath]
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
      return null;
    }
  },

  getConfigPath: function (id) {
    return path.join(
      KarmaInternals.getAppPath(),
      '.meteor/local/karma/' + id + '.config.js'
    )
  },

  getAppPath: function () {
    return path.resolve(findAppDir())
  },

  getKarmaPath: function () {
    // TODO: Use sanjo:assets-path-resolver when available
    var meteorVersion = MeteorVersion.getSemanticVersion();
    var karmaPath = (meteorVersion && PackageVersion.lessThan(meteorVersion, '1.0.4')) ?
      '.meteor/local/build/programs/server/npm/sanjo:karma/node_modules/karma/bin/karma' :
      '.meteor/local/build/programs/server/npm/sanjo_karma/node_modules/karma/bin/karma'

    return path.join(
      KarmaInternals.getAppPath(),
      karmaPath
    )
  }
}
