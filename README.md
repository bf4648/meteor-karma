# Karma Runner integration for Meteor

See [Karma documentation](http://karma-runner.github.io/0.13/index.html) for more info on Karma Runner.

## API

* `Karma.start(id, options)`: Starts a long running Karma server that will close when the Meteor App is closed.
* `Karma.setConfig(id, options)`: Sets the config for the Karma server. A running Karma server will reload and use the new config.
* `Karma.getConfigPath(id)`: Returns the absolute path to the Karma config for the given id.

For possible options see [Karma documentation](http://karma-runner.github.io/0.13/config/configuration-file.html).

## Example

```javascript
var options = { ... }
Karma.start('my-karmer-server', options)
```

## License

MIT
