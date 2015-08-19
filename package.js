Package.describe({
  name: 'sanjo:karma',
  summary: 'Integrates Karma into Meteor',
  version: '1.7.0',
  git: 'https://github.com/Sanjo/meteor-karma.git'
})

Npm.depends({
  // 0.13.9 + custom context.html and debug.html option
  'karma': 'https://github.com/Sanjo/karma/archive/1e843773b61f650223bd349cb48579418dd561f4.tar.gz',
  'karma-chrome-launcher': '0.2.0',
  'karma-firefox-launcher': '0.1.6',
  'karma-jasmine': '0.3.6',
  'karma-babel-preprocessor': '5.2.1',
  'karma-coffee-preprocessor': '0.3.0',
  'karma-phantomjs-launcher': '0.2.0',
  'karma-sauce-launcher': '0.2.14',
  'fs-extra': '0.22.1'
})

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.2')
  api.use('practicalmeteor:loglevel@1.1.0_3', 'server')
  api.use('sanjo:meteor-files-helpers@1.1.0_6', 'server')
  api.use('sanjo:long-running-child-process@1.1.1', 'server')

  api.addFiles('main.js', 'server')

  api.export('Karma')
  api.export('KarmaInternals')
})
