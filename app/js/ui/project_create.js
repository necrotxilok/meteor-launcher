/*
 *  Project Create UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */

 (function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var ProjectCreateUI = function() {

    // == PRIVATE ==============================================================

    var _self = this;
    var path = require('path');

    var createProjectTpl = tplManager.get('project_create');

    var showCreateProject = function() {
      var dialog = new Dialog('', createProjectTpl());

      var checkProjectSettings = function() {
        var projectName = dialog.find('#projectName').val().trim();
        var projectFolder = dialog.find('#projectFolderText').val().trim();

        dialog.find('.message').hide();
        dialog.find('.button-create').css('opacity', 0.5);
        dialog.find('.button-create').attr('disabled', true);

        if (projectName && projectFolder) {

          dialog.find('.messages').show();
          var folderName = projectName.toLowerCase().replace(' ', '-');
          var outputFolder = path.normalize(projectFolder + '/' + folderName);
          dialog.find('.output-folder').html(outputFolder);

          if (App.File.folderExists(projectFolder)) {
            if (App.File.folderExists(outputFolder)) {
              if (App.File.folderExists(outputFolder + '/.meteor/release')) {
                dialog.find('.folder-has-meteor-project').show();
              } else {
                if (App.File.folderIsEmpty(outputFolder)) {
                  dialog.find('.folder-ready').show();
                  dialog.find('.button-create').css('opacity', 1);
                  dialog.find('.button-create').removeAttr('disabled');
                } else {
                  dialog.find('.folder-not-empty').show();
                }
              }
            } else {
              dialog.find('.folder-ready').show();
              dialog.find('.button-create').css('opacity', 1);
              dialog.find('.button-create').removeAttr('disabled');
            }
          } else {
            dialog.find('.folder-not-exists').show();
          }

        } else {
          dialog.find('.messages').hide();
        }
      }

      dialog.on('click', '.button-create', function(event) {
        event.preventDefault();
        var projectName = dialog.find('#projectName').val().trim();
        var projectFolder = dialog.find('#projectFolderText').val().trim();
        if (projectName && projectFolder) {
          var $processOverlay = dialog.find('.creating-overlay');
          var $loading = $processOverlay.find('.loading');
          var $success = $processOverlay.find('.success');
          var $error = $processOverlay.find('.error');
          var $msg = $processOverlay.find('.msg');

          $processOverlay.show();
          $('.dialog .dialog-close-button').hide();
          $msg.html('Creating the new Meteor App...');

          App.Process.createProject(projectName, projectFolder, function(message, success, error) {
            $msg.html(message);

            if (error) {
              $loading.hide();
              $error.removeClass('hidden');
              return false;
            }
            if (success) {
              $loading.hide();
              $success.removeClass('hidden');
              if (success == 2) {
                dialog.close();
              }
              return true;
            }
          });
        }
      });

      dialog.on('keyup change', '#projectName, #projectFolderText', _.debounce(function(event) {
        event.preventDefault();
        checkProjectSettings();
      }, 300));

      dialog.on('change', '#projectFolder', function(event) {
        event.preventDefault();
        var $this = $(event.currentTarget);
        var folder = $this.val().trim();
        dialog.find('#projectFolderText').val(folder);
        checkProjectSettings();
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

    var bindEvents = function() {
      $('.tile-area-controls').on('click', '.create-project', function(e) {
        e.stopPropagation();
        e.preventDefault();
        showCreateProject();
      });
    }

    // == PUBLIC ==============================================================


    // == INITIALIZE ==============================================================

    bindEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.ProjectCreate = new ProjectCreateUI();
  });

})(document, window, jQuery);
