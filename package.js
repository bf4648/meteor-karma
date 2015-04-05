Package.describe({
  name: 'sanjo:karma',
  summary: 'Integrates Karma into Meteor',
  version: '1.5.0',
  git: 'https://github.com/Sanjo/meteor-karma.git'
})

Npm.depends({
  // TODO: Remove chokidar as dependency when 1.0.0 is released
  'chokidar': '0.12.6', // Force to not use the release candidate version
  'karma': '0.12.31',
  'karma-chrome-launcher': '0.1.7',
  'karma-firefox-launcher': '0.1.4',
  'karma-jasmine': '0.3.5',
  'karma-coffee-preprocessor': '0.2.1',
  'karma-phantomjs-launcher': '0.1.4',
  'karma-sauce-launcher': '0.2.10',
  'fs-extra': '0.12.0'
})

Package.onUse(function (api) {
  api.versionsFrom('1.0.3.2')
  api.use('coffeescript', 'server')
  api.use('underscore', 'server')
  api.use('check', 'server')
  api.use('practicalmeteor:loglevel@1.1.0_2', 'server')
  api.use('sanjo:meteor-files-helpers@1.1.0_1', 'server')
  api.use('sanjo:long-running-child-process@1.0.2', 'server')

  api.addFiles('main.js', 'server')

  api.export('Karma')
  api.export('KarmaInternals')
})

Package.onTest(function(api){
  api.use('spacejamio:munit')
  api.use('sanjo:karma')
  api.addFiles(['specs/karma.js'], 'server')
})
