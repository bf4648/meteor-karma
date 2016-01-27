var path = Npm.require('path')
var fs = Npm.require('fs-extra')
var readFile = Meteor.wrapAsync(fs.readFile, fs)
var outputFile = Meteor.wrapAsync(fs.outputFile, fs)
var requestRetry = Npm.require('requestretry')
var freeport = Meteor.wrapAsync(Npm.require('freeport'))

var packageName = 'sanjo:karma';

log = loglevel.createPackageLogger(
  '[' + packageName + ']',
  process.env.KARMA_LOG_LEVEL || 'info'
)

Karma = {
  start: function (id, options) {
    options = options || {}
    log.debug('Karma.start', id)

    return KarmaInternals.startKarmaServer(id, options)
  },

  isRunning: function (id) {
    var karmaChild = KarmaInternals.getKarmaChild(id)
    return karmaChild.isRunning()
  },

  stop: function (id) {
    log.debug('Karma.stop', id)
    var karmaChild = KarmaInternals.getKarmaChild(id)
    if (karmaChild.isRunning()) {
      karmaChild.kill()
    }
  },

  run: function (id) {
    log.debug('Karma.run', id)
    KarmaInternals.apiRequest(id, 'run')
  },

  reloadFileList: function (id, patterns, excludes) {
    log.debug('Karma.reloadFileList', id, patterns, excludes)

    KarmaInternals.apiRequest(
      id,
      'reloadFileList',
      {
        patterns: patterns,
        excludes: excludes
      }
    )
  }
}

KarmaInternals = {
  karmaChilds: {},

  apiRequest: function (id, type, data) {
    data = data || {}
    var karmaChild = KarmaInternals.getKarmaChild(id)

    if (karmaChild.isRunning()) {
      var request = requestRetry({
        url: 'http://127.0.0.1:' + this.getPort(id) + '/' + type,
        method: 'POST',
        json: true,
        body: data,
        maxAttempts: 5,
        retryDelay: 1000
      }, function (error, response, body) {
        if (error) {
          log.error(type + ' request failed', error)
        } else if (response.statusCode === 500) {
          log.error(type + ' request failed', body.data.error)
        }
      })
    } else {
      throw new Error(
        'You need to start the Karma server ' +
        'before you can make an API request.'
      )
    }
  },

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

  startKarmaServer: function (id, options) {
    log.debug('KarmaInternals.startKarmaServer(' + id + ')')
    var karmaChild = KarmaInternals.getKarmaChild(id)
    var karmaRunnerPath = KarmaInternals.getKarmaRunnerPath()
    fs.chmodSync(karmaRunnerPath, parseInt('544', 8))
    var apiServerPort = this.createPort(id)
    var spawnOptions = {
      command: process.execPath,
      args: [
        karmaRunnerPath,
        apiServerPort,
        this.getPortFilePath(id),
        this.getKarmaModulePath()
      ]
    }
    // It will only spawn when the process is not already running
    karmaChild.spawn(spawnOptions)
    KarmaInternals.apiRequest(id, 'start', options)

    return karmaChild
  },

  getKarmaRunnerPath: function () {
    return MeteorFilesHelpers.getPackageServerAssetPath(
      packageName, 'karma_runner.js'
    )
  },

  getKarmaModulePath: function () {
    return MeteorFilesHelpers.getNodeModulePath(packageName, 'karma')
  },

  getPortFilePath: function (id) {
    return path.resolve(MeteorFilesHelpers.getAppPath(),
      '.meteor/local/run/' + id + '.port')
  },

  createPort: function (id) {
    var port = freeport()
    outputFile(this.getPortFilePath(id), port)

    return port
  },

  getPort: _.memoize(function (id) {
    return parseInt(readFile(this.getPortFilePath(id), {encoding: 'utf8'}), 10)
  })
}
