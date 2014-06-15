module.exports = function(config) {
  config.set({
    autoWatch: false,
    singleRun: true,
    logLevel: config.LOG_INFO,
    logColors: true,
    browsers: ['Chrome'],
    files: [
      'components/angular/angular.js',
      'components/angular-mocks/angular-mocks.js',
      'src/*.js',
      'test/*Spec.js'
    ],
    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    },
    frameworks: ['jasmine']
  });
};
