var port = process.argv[2]
var karmaPath = process.argv[3]

var path = require('path')
var Karma = require(karmaPath)
var parseConfig = require(path.resolve(karmaPath, 'lib/config')).parseConfig

var server = null
var config = null
var runner = Karma.runner

var handlers = {
  start: start,
  run: run,
  reloadFileList: reloadFileList
}

var apiServer = require('http').createServer(function (request, response) {
  var type = request.url.substr(1)

  if (handlers[type]) {
    console.log('Handling message type "' + type + '".')

    var dataBuffer = ''
    request.on('data', function (chunk) {
      dataBuffer += chunk.toString()
    })

    request.on('end', function () {
      try {
        var data = JSON.parse(dataBuffer)
        handlers[type](data)
      } catch (error) {
        console.error('Error while handling the request', error)
        console.error(error.stack)
        var body = JSON.stringify({status: 'error', data: {error: error.toString()}})
        response.writeHead(500, {
          'Content-Length': body.length,
          'Content-Type': 'application/json'
        })
        response.end(body)
        return
      }

      var body = JSON.stringify({status: 'success'})
      response.writeHead(200, {
        'Content-Length': body.length,
        'Content-Type': 'application/json'
      })
      response.end(body)
    })
  } else {
    console.error('No handler for message type "' + type + '" available.')
    var body = JSON.stringify({status: 'error'})
    response.writeHead(500, {
      'Content-Length': body.length,
      'Content-Type': 'application/json'
    })
    response.end(body)
  }
})

apiServer.listen(port, function (error) {
  if (error) {
    console.error(error);
  } else {
    console.log('Listening on port ' + port);
  }
})

function start(options) {
  if (!server) {
    if (!options) {
      throw new Error('Options missing. You need to start Karma with some options.')
    }
    config = parseConfig(null, options)
    console.log('Karma.start', config)
    server = new Karma.Server(config, function (exitCode) {
      console.log('Karma has exited with ' + exitCode)
      process.exit(exitCode)
    })
    server.start()
  }
}

function run() {
  console.log('Karma.run')
  runner.run(config, function (exitCode) {
    console.log('Karma run has exited with ' + exitCode)
  })
}

function reloadFileList(options) {
  if (!server) {
    console.error(
      'You need to start the server ' +
      'before you can reload the file list.'
    )
    return;
  }

  var tempConfig = parseConfig(null, {
    files: options.patterns || [],
    exclude: options.excludes || []
  })
  var pluginPatterns = server._fileList._patterns.filter(function (pattern) {
    return pattern.pattern.indexOf(path.sep + 'sanjo_karma' + path.sep) !== -1
  })
  tempConfig.files.unshift.apply(tempConfig.files, pluginPatterns)
  config.files = tempConfig.files
  config.exclude = tempConfig.exclude
  options = {
    patterns: tempConfig.files,
    excludes: tempConfig.exclude
  }
  console.log('Karma.reloadFileList', options)
  server._fileList.reload(options.patterns, options.excludes)
}
