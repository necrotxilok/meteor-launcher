/*
 *  Process Library
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var Process = function() {

    // == PRIVATE ==============================================================
    var fs = require('fs');
    var exec = require('child_process').exec;
    
    var procs = {};
    var logs = {};

    var findProject = function(project_id) {
      return _.findWhere(App.projects, {id: project_id});
    }

    var freeFolder = function(folder) {
      var folderStatus = true;
      _.each(procs, function(p) {
        if (folder.trim() == p.folder.trim()) {
          folderStatus = false;
        }
      });
      return folderStatus;
    }

    var freePort = function(port) {
      var portStatus = true;
      _.each(procs, function(p) {
        if (port == p.port || port == p.port + 1 || port + 1 == p.port) {
          portStatus = false;
        }
      });
      return portStatus;
    }

    // A simple function to get all children in Windows, Linux and OS-X
    function getAllChildrenProcesses(pid) {
      var execSync = require('child_process').execSync;
      var cmd_output;
      var enterCode;

      if (process.platform === 'win32') {       // Widows
        enterCode = '\r\n';
        try {
          cmd_output = execSync('wmic process where (ParentProcessId=' + pid + ') get ProcessId');
        } catch(err) {
          return [];
        }
      } else {                                  // Linux and OS-X
        enterCode = '\n';
        try {
          cmd_output = execSync('pgrep -P ' + pid);
        } catch(err) {
          return [];
        }
      }

      if (cmd_output) {
          var p_strings = cmd_output.toString().split(enterCode);
          var pids = [];

          _.each(p_strings, function(p) {
            p = p.trim();

            if ($.isNumeric(p)) {
              p = parseInt(p);
              pids.push(p);
              pids = _.union(pids, getAllChildrenProcesses(p));
            }
          });

          return pids;
      }

      return [];
    }

    var bindEvents = function() {
      App.win.on('close', function() {
        _.each(procs, function(meteor) {
          stopMeteorApp(meteor);
        });
        App.win.close(true);
      });
    }

    var stopMeteorApp = function(meteor) {
      _.each(meteor.c_procs, function(pid) {
        process.kill(pid);
      });
      meteor.proc.kill();
    }

    var startMeteorApp = function(project_id) {
      var project = findProject(project_id);
      var execFile;
      var meteor = {
        up: $.Deferred(),
        watch: $.Deferred(),
        port: project.port,
        folder: project.folder,
        proc: null,
        c_procs: []
      };

      var logMessage = function(message) {
        logs[project_id].push(message);
        //meteor.up.notify(message);
        meteor.watch.notify(message);
      }

      if (process.platform == 'win32') {
        execFile = 'meteor.bat';
      } else {
        execFile = 'meteor';
      }

      logs[project_id] = [];

      if (fs.existsSync(project.folder)) {
        if (freeFolder(project.folder)) {
          if (freePort(project.port)) {
            meteor.proc = exec(execFile + ' -p ' + project.port, {cwd: project.folder});

            logMessage('Launching ' + project.name + ' App...');
            logMessage('PORT: ' + project.port);
            logMessage('URL: <a href="http://localhost:' + project.port + '/" class="open-project">http://localhost:' + project.port + '/</a>');
            logMessage('&nbsp;');

            meteor.proc.stdout.on('data', function (data) {
              //console.log('>', data);
              if (data.match('App running')) {
                meteor.c_procs = getAllChildrenProcesses(meteor.proc.pid);
                logMessage('&nbsp;');
                logMessage('Meteor App started!!');
                //meteor.up.resolve();
              } else {
                if (!data.match('Control-C')) {
                  logMessage(data);
                }
              }
            });

            meteor.proc.stderr.on('data', function (error_info) {
              logMessage('ERROR: ' + error_info);
              //meteor.up.reject();
              delete procs[project_id];
            });

            meteor.proc.on('exit', function (code) {
              if (code) {
                logMessage('&nbsp;');
                logMessage('Meteor process exited with code ' + code);
                meteor.up.reject();
                meteor.watch.reject();
              } else {
                logMessage('&nbsp;');
                logMessage('Meteor App finished.');
                meteor.up.resolve();
                meteor.watch.resolve();
              }
              delete procs[project_id];
            });

            return meteor;
          } else {
            logMessage('The port ' + project.port + ' or ' + (project.port + 1) + ' is used by another Meteor App or by MongoDB.');
          }
        } else {
          logMessage('Another Meteor App is running in the folder "' + project.folder + '". Please, check if the settings are correct.');
        }
      } else {
        logMessage('The project cannot run in the path "' + project.folder + '". Please, check if the path exists and you have access to it.');
      }

      return false;
    }

    // == PUBLIC ==============================================================

    this.isRunning = function(project_id) {
      if (procs[project_id]) {
        return true;
      } else {
        return false;
      }
    }

    this.run = function(project_id) {
      if (!procs[project_id]) {
        var meteor = startMeteorApp(project_id);
        if (meteor) {
          procs[project_id] = meteor;
        } else {
          return false;
        }
      }

      return procs[project_id];
    }

    this.stop = function(project_id) {
      if (procs[project_id]) {
        stopMeteorApp(procs[project_id]);
        delete procs[project_id];
      }
    }

    this.getLog = function(project_id) {
      var log = logs[project_id];
      if (!log) {
        log = ['This app has not been launched yet.'];
      }
      return log;
    }

    // == INITIALIZE ==============================================================

    bindEvents();

    return this;
  }

  App.Process = new Process();

})(document, window, jQuery);
