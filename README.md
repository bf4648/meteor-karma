# Karma Runner integration for Meteor

See [Karma documentation](http://karma-runner.github.io/0.13/index.html) for more info on Karma Runner.

## API

* `Karma.start(id, options)`: Starts a long running Karma server that will close when the Meteor App is closed.
* `Karma.isRunning(id)`
* `Karma.stop(id)`
* `Karma.run(id)`: Starts a Karma test run manually.
* `Karma.reloadFileList(id, patterns, [excludes]`: Reloads the file list with the new patterns and excludes.

For possible options see [Karma documentation](http://karma-runner.github.io/0.13/config/configuration-file.html).

## Example

```javascript
var options = { ... }
Karma.start('my-karmer-server', options)
```

## Limitations

* Proxies can only be set on the server start (relevant for serving new client assets).

## License

MIT
