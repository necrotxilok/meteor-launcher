/*
 *  File Library
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var File = function() {

    var meteorNotFoundMessage = '<span class="icon mif-warning"></span> Current project is not configured in a correct Meteor project directory! Please review if the path exists and have the correct files to run a Meteor Application.';

    // == PRIVATE ==============================================================
    var fs = require('fs');

    var DS = '/';
    if (process.platform === 'win32') {
      DS = '\\';
    }

    function getSettingsPath() {
      var userPath;

      if (process.platform == 'win32') {             // Windows
        userPath = process.env.USERPROFILE;
      } else {                                       // Linux and MAC
        userPath = process.env.HOME;
      }

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

    this.getMeteorVersion = function(projectPath) {
      var versionFile = projectPath + DS + '.meteor/release';

      if (fs.existsSync(versionFile)) {
        return fs.readFileSync(versionFile).toString();
      } else {
        return meteorNotFoundMessage;
      }
    }

    this.getMeteorPackages = function(projectPath) {
      var meteorPackagesFile = projectPath + DS + '.meteor/packages';
      var nodePackagesFile = projectPath + DS + 'package.json';
      var cordovaPackagesFile = projectPath + DS + '.meteor/cordova-plugins';
      if (fs.existsSync(meteorPackagesFile)) {
        var packages = {
          meteor: [],
          node: [],
          cordova: []
        };

        var meteor = fs.readFileSync(meteorPackagesFile).toString().replace(/#.*/gi, "").split("\n");
        _.each(meteor, function(p) {
          if (p && p.trim()) {
            var parts = p.trim().split("@");
            if (parts.length == 2 && parts[0]) {
              packages.meteor.push({
                name: parts[0],
                version: parts[1]
              });
            }
            if (parts.length == 1 && parts[0]) {
              packages.meteor.push({
                name: parts[0]
              });
            }
          }
        });

        if (fs.existsSync(nodePackagesFile)) {
          var nodePackages = JSON.parse(fs.readFileSync(nodePackagesFile));
          if (nodePackages && nodePackages.dependencies) {
            _.each(nodePackages.dependencies, function(version, name) {
              packages.node.push({
                name: name,
                version: version
              });
            });
          }
        }

        if (fs.existsSync(cordovaPackagesFile)) {
          var cordova = fs.readFileSync(cordovaPackagesFile).toString().replace(/#.*/gi, "").split("\n");
          _.each(cordova, function(p) {
            if (p && p.trim()) {
              var parts = p.trim().split("@");
              if (parts.length == 2 && parts[0]) {
                packages.cordova.push({
                  name: parts[0],
                  version: parts[1]
                });
              }
              if (parts.length == 1 && parts[0]) {
                packages.cordova.push({
                  name: parts[0]
                });
              }
            }
          });
        }

        return packages;
      } else {
        return meteorNotFoundMessage;
      }
    }

    this.getMeteorPlatforms = function(projectPath) {
      var platformsFile = projectPath + DS + '.meteor/platforms';

      if (fs.existsSync(platformsFile)) {
        var lines = fs.readFileSync(platformsFile).toString().split("\n");
        var platforms = {
          android: {
            active: false,
            name: "Android"
          },
          ios: {
            active: false,
            name: "iOS"
          }
        };
        _.each(lines, function(p) {
          if (p && platforms[p]) {
            platforms[p].active = true;
          }
        });
        return platforms;
      } else {
        return meteorNotFoundMessage;
      }
    }

    this.folderExists = function(folder) {
      if (fs.existsSync(folder)) {
        return true;
      }
      return false;
    }

    this.folderIsEmpty = function(folder) {
      var files = fs.readdirSync(folder);
      if (!files.length) {
        return true;
      }
      return false;
    }

    return this;
  }

  App.File = new File();

})(document, window, jQuery);
