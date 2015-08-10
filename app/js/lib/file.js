/*
 *  File Library
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var File = function() {

    // == PRIVATE ==============================================================
    var fs = require('fs');

    var DS = '/';
    if (process.platform === 'win32') {
      DS = '\\';
    }

    function getSettingsPath() {
      var userPath = process.env.USERPROFILE;
      var settingsPath = userPath + DS + '.meteor-launcher';

      if (!fs.existsSync(settingsPath)) {
        fs.mkdirSync(settingsPath);
      }

      return settingsPath;
    }

    // == PUBLIC ==============================================================

    this.getSettings = function() {
      var defaultSettings = {
        appVersion: App.version
      };

      var settingsFile = getSettingsPath() + DS + 'settings.json';
      var settings = defaultSettings;

      if (!fs.existsSync(settingsFile)) {
        fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings));
      } else {
        settings = JSON.parse(fs.readFileSync(settingsFile));
      }

      return settings;
    }

    this.getProjects = function() {
      var defaultProjects = [];

      var projectsFile = getSettingsPath() + DS + 'projects.json';
      var projects = defaultProjects;

      if (!fs.existsSync(projectsFile)) {
        fs.writeFileSync(projectsFile, JSON.stringify(defaultProjects));
      } else {
        projects = JSON.parse(fs.readFileSync(projectsFile));
      }

      return projects;
    }

    this.saveProjects = _.debounce(function() {
      var projectsFile = getSettingsPath() + DS + 'projects.json';

      fs.writeFile(projectsFile, JSON.stringify(App.projects));
    }, 1000);

    return this;
  }

  App.File = new File();

})(document, window, jQuery);