/*
 *  CMD Library
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2016-10-23
 */


(function(document, window, $, undefined) {
  'use strict';

  var CMD = function() {

    // == PRIVATE ==============================================================
    var fs = require('fs');
    var exec = require('child_process').exec;

    var DS = '/';
    if (process.platform === 'win32') {
      DS = '\\';
    }

    var terminalApp = 'sh';
    if (process.platform === 'win32') {
      terminalApp = 'start "" "' + process.cwd() + DS + 'utils' + DS + 'Meteor Launcher Console"';
    } else {
      terminalApp = 'gnome-terminal -e "bash"';
    }

    var findProject = function(project_id) {
      return _.findWhere(App.projects, {id: project_id});
    }

    // == PUBLIC ==============================================================

    this.run = function(project_id) {
      var project = findProject(project_id);

      var shell = terminalApp;

      var child = exec(shell, {cwd: project.folder});

      child.on('error', function(error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log('Error code: ' + error.code);
          console.log('Signal received: ' + error.signal);
        }
      });

      child.on('exit', function (code) {
        if (code) {
          console.log('Child process exited with code ' + code);
        }
      });

      return child;
    }

    // == INITIALIZE ==============================================================

    return this;
  }

  App.cmd = new CMD();

})(document, window, jQuery);
