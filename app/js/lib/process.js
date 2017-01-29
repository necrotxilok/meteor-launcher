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
    var execSync = require('child_process').execSync;

    var procs = {};
    var logs = {};

    var meteorExec;

    if (process.platform == 'win32') {
      meteorExec = 'meteor.bat';
    } else {
      meteorExec = 'meteor';
    }

    var findProject = function(project_id) {
      return _.findWhere(App.projects, {id: project_id});
    }

    var freeFolder = function(project) {
      var folder = project.folder;
      var folderStatus = true;
      _.each(procs, function(meteor, project_id) {
        if (meteor.run && project_id != project.id) {
          var p = meteor.project;
          if (folder.trim() == p.folder.trim()) {
            folderStatus = false;
          }
        }
      });
      return folderStatus;
    }

    var freePort = function(project) {
      var port = project.port;
      var portStatus = true;
      _.each(procs, function(meteor, project_id) {
        if (meteor.run && project_id != project.id) {
          var p = meteor.project;
          if (port == p.port || port == p.port + 1 || port + 1 == p.port) {
            portStatus = false;
          }
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
      if (meteor.proc) {
        var c_procs = getAllChildrenProcesses(meteor.proc.pid);
        _.each(c_procs, function(pid) {
          process.kill(pid);
        });
        meteor.proc.kill();
        meteor.proc = null;
        delete meteor.run;
        delete meteor.project;
      }
    }

    var startMeteorApp = function(project_id, platform) {
      var project = findProject(project_id);
      var command;
      var localip = null;
      var meteor = procs[project_id];
      meteor.run = $.Deferred();
      meteor.project = project;

      var logMessage = function(message) {
        message = message.replace(/\[[0-9]{2}m/g, '');
        message = message.replace(/W.*?\(STDERR\)\s*/g, 'ERR > ').trim();
        message = message.replace(/I.*?\)(\?| )\s*/g, '').trim();
        if (message) {
          var msgs = message.split("\n");
          _.each(msgs, function(msg) {
            msg = msg.trim();
            logs[project_id].push(msg);
            meteor.watch.notify(msg, project_id);
          });
        }
      }

      logs[project_id] = [];

      if (fs.existsSync(project.folder)) {
        if (freeFolder(project)) {
          if (freePort(project)) {

            // SETUP METEOR RUN
            command = meteorExec;

            if (platform) {
              command += ' run ' + platform
            }

            command += ' -p ' + project.port;

            if (platform) {
              var os = require('os');
              var ifaces = os.networkInterfaces();

              _.each(ifaces, function (ifList, ifname) {
                _.each(ifList, function (iface) {
                  if ('IPv4' !== iface.family || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                  }
                  if (iface.address.match("192.168")) {
                    localip = iface.address;
                  }
                });
              });

              if (localip) {
                command += ' --mobile-server=http://' + localip + ':' + project.port;
              }
            }

            logMessage('Launching ' + project.name + ' App...');
            logMessage('PORT: ' + project.port);
            if (platform) {
              logMessage('Running on ' + platform);
            }
            if (localip) {
              logMessage('Mobile Server: <a href="http://' + localip + ':' + project.port + '/" class="open-external">http://' + localip + ':' + project.port + '/</a>');
            } else {
              logMessage('URL: <a href="http://localhost:' + project.port + '/" class="open-external">http://localhost:' + project.port + '/</a>');
            }
            logMessage('&nbsp;');

            if (platform == 'android-device') {
              var devices = [];
              var data = execSync('adb devices', {cwd: project.folder});
              var lines = data.toString().split("\n");
              _.each(lines, function(text) {
                if (text.trim() && !text.match('List of devices attached')  && !text.match('adb server version') && !text.match(/\*/)) {
                  devices.push(text.trim());
                }
              });
              if (!devices.length) {
                logMessage('No devices connected for running the app.');
              } else {
                logMessage('Available devices:');
                _.each(devices, function(device) {
                  logMessage(' * ' + device);
                });
              }
              logMessage('&nbsp;');
            }

            // RUN METEOR
            meteor.proc = exec(command, {cwd: project.folder});

            // WATCH METEOR
            meteor.proc.stdout.on('data', function (data) {
              //console.log('>', data);
              if (data.match('App running')) {
                logMessage('&nbsp;');
                logMessage('Meteor App started!!');
              } else {
                if (!data.match('Control-C')) {
                  logMessage(data);
                }
              }
            });

            meteor.proc.stderr.on('data', function (error_info) {
              if (error_info) {
                logMessage(error_info);
              }
            });

            meteor.proc.on('exit', function (code) {
              if (code) {
                logMessage('&nbsp;');
                logMessage('Meteor process exited with code ' + code);
                meteor.run.reject();
              } else {
                logMessage('&nbsp;');
                logMessage('Meteor App finished.');
                meteor.run.resolve();
              }
              meteor.proc = null;
              delete meteor.run;
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


    var changePlatform = function(project_id, action, platform) {
      var project = findProject(project_id);
      var command;
      var meteor = procs[project_id];

      if (!logs[project_id]) {
        logs[project_id] = [];
      }

      var logMessage = function(message) {
        if (message) {
          logs[project_id].push(message);
          meteor.watch.notify(message, project_id);
        }
      }

      if (action == 'add') {
        command = meteorExec + ' add-platform ' + platform;
        logMessage('Adding ' + platform + ' platform...');
      }
      if (action == 'remove') {
        command = meteorExec + ' remove-platform ' + platform;
        logMessage('Removing ' + platform + ' platform...');
      }

      if (command) {
        // RUN METEOR PLATFORM PROCESS
        var proc = exec(command, {cwd: project.folder});

        // WATCH METEOR PLATFORM PROCESS
        proc.on('exit', function (code) {
          if (code) {
            if (action == 'add') {
              logMessage('ERROR: Platform ' + platform + ' could not be added, please try again.');
            }
            if (action == 'remove') {
              logMessage('ERROR: Platform ' + platform + ' could not be removed, please try again.');
            }
          } else {
            if (action == 'add') {
              logMessage('Success!! ' + platform + ' platform was added to project.');
            }
            if (action == 'remove') {
              logMessage('Success!! ' + platform + ' platform was removed from project.');
            }
          }
        });
      }
    }

    var changePackage = function(project_id, action, type, name) {
      var project = findProject(project_id);
      var command;
      var cmdAction = action;
      var meteor = procs[project_id];

      var typeNames = {
        'meteor': 'Meteor Package',
        'node': 'Node Module',
        'cordova': 'Cordova Plugin'
      };

      if (!logs[project_id]) {
        logs[project_id] = [];
      }

      var logMessage = function(message) {
        if (message) {
          logs[project_id].push(message);
          meteor.watch.notify(message, project_id);
        }
      }

      logMessage('&nbsp;');
      if (action == 'add') {
        logMessage('Adding "' + name + '" ' + typeNames[type] + '...');
      }
      if (action == 'remove') {
        logMessage('Removing "' + name + '" ' + typeNames[type] + '...');
      }

      if (type == 'node') {
        if (action == 'add') cmdAction = 'npm install';
        if (action == 'remove') cmdAction = 'npm uninstall';
      }

      if (type == 'cordova') {
        name = 'cordova:' + name;
      }

      command = meteorExec + ' ' + cmdAction + ' ' + name;

      if (type == 'node') {
        command += ' --save';
      }

      // RUN METEOR PACKAGE PROCESS
      var proc = exec(command, {cwd: project.folder});

      // WATCH METEOR PACKAGE PROCESS
      proc.stdout.on('data', function (data) {
        //console.log('>', data);
        logMessage(data);
      });

      proc.stderr.on('data', function (error_info) {
        if (error_info) {
          logMessage(error_info);
        }
      });

      proc.on('exit', function (code) {
        logMessage('&nbsp;');
        if (code) {
          if (action == 'add') {
            logMessage('ERROR: Package "' + name + '" could not be added, please try again.');
          }
          if (action == 'remove') {
            logMessage('ERROR: Package "' + name + '" could not be removed, please try again.');
          }
        } else {
          if (action == 'add') {
            logMessage('Success!! "' + name + '" ' + typeNames[type] + ' was added to project.');
          }
          if (action == 'remove') {
            logMessage('Success!! "' + name + '" ' + typeNames[type] + ' was removed from project.');
          }
        }
        logMessage('&nbsp;');
      });
    }

    var createProject = function(projectName, projectFolder, sendMessage) {
      var path = require('path');
      var folderName = projectName.toLowerCase().replace(' ', '-');
      var outputFolder = path.normalize(projectFolder + '/' + folderName);
      var command = meteorExec + ' create ' + folderName;

      // RUN METEOR CREATE PROCESS
      var proc = exec(command, {cwd: projectFolder});

      // WATCH METEOR CREATE PROCESS
      proc.on('exit', function (code) {
        if (code) {
          sendMessage('ERROR! The project could not be created. Please, check if you have write access in the selected root folder.', false, code);
        } else {
          // RUN METEOR DEPENDENCIES PROCESS
          var dependencies = exec(meteorExec + ' npm install', {cwd: outputFolder});

          sendMessage('Installing dependencies...');

          // WATCH METEOR DEPENDENCIES PROCESS
          dependencies.on('exit', function (code) {
            if (code) {
              sendMessage('ERROR! Unable to install dependencies for this project. Try to install from terminal using "meteor npm install" and add the project manually.', false, code);
            } else {
              sendMessage('Project successfully created!', 1);
              setTimeout(function() {
                // ADD PROJECT AND SAVE
                var newProject = {
                  id: App.uniqueId(),
                  name: projectName,
                  folder: outputFolder,
                  port: 3000,
                  color: 'bg-grayLight',
                  image: '',
                  size: 0,
                  x: 1000,
                  y: 1000
                };
                App.projects.push(newProject);
                App.UI.Grid.addItem(newProject);
                App.File.saveProjects();
                sendMessage('', 2);
              }, 1500);
            }
          });
        }
      });
    }

    var buildProject = function(project) {
      var meteor = procs[project.id];
      meteor.build = $.Deferred();
      meteor.project = project;

      var command = meteorExec + ' build "' + project.outputFolder + '"';

      if (project.serverArchitecture) {
        command += ' --architecture ' + project.serverArchitecture;
      }

      if (project.serverName) {
        command += ' --server ' + project.serverName;
      }

      var logMessage = function(message) {
        message = message.replace(/\[[0-9]{2}m/g, '');
        message = message.replace(/W.*?\(STDERR\)\s*/g, 'ERR > ').trim();
        message = message.replace(/I.*?\)(\?| )\s*/g, '').trim();
        if (message) {
          var msgs = message.split("\n");
          _.each(msgs, function(msg) {
            msg = msg.trim();
            logs[project.id].push(msg);
            meteor.watch.notify(msg, project.id);
          });
        }
      }

      logs[project.id] = [];

      if (fs.existsSync(project.folder)) {
        logMessage('Building ' + project.name + ' App...');

        // RUN METEOR BUILD
        meteor.proc = exec(command, {cwd: project.folder});

        // WATCH METEOR
        meteor.proc.stdout.on('data', function (data) {
          //console.log('>', data);
          if (data) {
            logMessage(data);
          }
        });

        meteor.proc.stderr.on('data', function (error_info) {
          if (error_info) {
            logMessage(error_info);
          }
        });

        meteor.proc.on('exit', function (code) {
          if (code) {
            logMessage('&nbsp;');
            logMessage('Meteor process exited with code ' + code);
            meteor.build.reject();
          } else {
            logMessage('&nbsp;');
            logMessage('Meteor build completed!!');
            meteor.build.resolve();
          }
          meteor.proc = null;
          delete meteor.build;
        });

        return meteor;
      } else {
        logMessage('The project cannot run in the path "' + project.folder + '". Please, check if the path exists and you have access to it.');
      }

      return false;
    }


    // == PUBLIC ==============================================================

    this.connectTerminal = function(project_id) {
      var meteor = procs[project_id];

      if (!meteor) {
        var meteor = {
          watch: $.Deferred(),
          proc: null
        };
        procs[project_id] = meteor;
      }

      meteor.watch = $.Deferred();

      return meteor;
    }

    this.isRunning = function(project_id) {
      var meteor = procs[project_id];
      if (meteor.run) {
        return true;
      } else {
        return false;
      }
    }

    this.isBuilding = function(project_id) {
      var meteor = procs[project_id];
      if (meteor.build) {
        return true;
      } else {
        return false;
      }
    }

    this.run = function(project_id, platform) {
      var meteor = procs[project_id];

      if (!meteor) {
        meteor = this.connectTerminal(project_id);
      }

      if (!meteor.proc) {
        var meteor = startMeteorApp(project_id, platform);
        if (!meteor) {
          return false;
        }
      }

      return meteor;
    }

    this.stop = function(project_id) {
      var meteor = procs[project_id];
      if (meteor) {
        stopMeteorApp(meteor);
      }
    }

    this.getLog = function(project_id) {
      var log = logs[project_id];
      if (!log) {
        log = [];
      }
      return log;
    }

    this.clearLog = function(project_id) {
      logs[project_id] = [];
    }

    this.stopAll = function() {
      _.each(procs, function(meteor, project_id) {
        if (project_id) {
          stopMeteorApp(meteor);
        }
      });
    }

    this.addPlatform = function(project_id, platform) {
      changePlatform(project_id, 'add', platform);
    }

    this.removePlatform = function(project_id, platform) {
      changePlatform(project_id, 'remove', platform);
    }

    this.addPackage = function(project_id, type, name) {
      changePackage(project_id, 'add', type, name);
    }

    this.removePackage = function(project_id, type, name) {
      changePackage(project_id, 'remove', type, name);
    }

    this.createProject = function(projectName, projectFolder, sendMessage) {
      createProject(projectName, projectFolder, sendMessage);
    }

    this.buildProject = function(project) {
      var meteor = procs[project.id];

      if (!meteor) {
        meteor = this.connectTerminal(project.id);
      }

      if (!meteor.proc) {
        var meteor = buildProject(project);
        if (!meteor) {
          return false;
        }
      }

      return meteor;
    }

    // == INITIALIZE ==============================================================

    bindEvents();

    return this;
  }

  App.Process = new Process();

})(document, window, jQuery);
