/*
 *  Project Build UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */

 (function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var ProjectBuildUI = function() {

    // == PRIVATE ==============================================================

    var _self = this;
    var path = require('path');

    var buildProjectTpl = tplManager.get('project_build');

    var showBuildProject = function(project) {
      var dialog = new Dialog('', buildProjectTpl(project));

      if (project.serverArchitecture) {
        dialog.find('#serverArchitecture').val(project.serverArchitecture);
      }

      var saveBuildSettings = function() {
        var outputFolder = dialog.find('#outputFolderText').val().trim();
        var serverArchitecture = dialog.find('#serverArchitecture').val();
        var serverName = dialog.find('#serverName').val().trim();

        dialog.find('.button-build').css('opacity', 0.5);
        dialog.find('.button-build').attr('disabled', true);

        if (outputFolder && serverArchitecture) {
          dialog.find('.button-build').css('opacity', 1);
          dialog.find('.button-build').removeAttr('disabled');

          project.outputFolder = outputFolder;
          project.serverArchitecture = serverArchitecture;
          project.serverName = serverName;

          App.File.saveProjects();
        }
      }
      saveBuildSettings();

      dialog.on('click', '.button-build', function(event) {
        event.preventDefault();

        App.UI.ProjectView.startBuild();

        dialog.close();
      });

      dialog.on('keyup change', '#serverName, #outputFolderText', _.debounce(function(event) {
        event.preventDefault();
        saveBuildSettings();
      }, 300));

      dialog.on('change', '#outputFolder', function(event) {
        event.preventDefault();
        var $this = $(event.currentTarget);
        var folder = $this.val().trim();
        dialog.find('#outputFolderText').val(folder);
        saveBuildSettings();
      });

      dialog.on('change', '#serverArchitecture', function(event) {
        event.preventDefault();
        saveBuildSettings();
      });

      dialog.on('click', '.close', function(event) {
        dialog.close();
      });

      dialog.open();
      setTimeout(function() {
        dialog.$el.css('top', '10%');
      }, 1);

      setTimeout(function() {
        dialog.find('#projectName').focus();
      }, 100);
    }

    /*var bindEvents = function() {
    }*/

    // == PUBLIC ==============================================================

    this.open = function(project) {
      showBuildProject(project);
    }

    // == INITIALIZE ==============================================================

    //bindEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.ProjectBuild = new ProjectBuildUI();
  });

})(document, window, jQuery);
