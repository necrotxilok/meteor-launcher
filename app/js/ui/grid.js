/*
 *  Grid UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var ProjectItem = App.Components.ProjectItem;

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var GridUI = function() {

    // == PRIVATE ==============================================================

    var _self = this;
    var $grid = $('#grid');

    var currentSize = 3;

    var items = {};

    var createProjectTpl = tplManager.get('create_project');

    var buildElements = function(projects) {
      _.each(projects, function(project) {
        items[project.id] = new ProjectItem($grid, project);
      });
    }

    var resize = function(size) {
      if (size) {
        _self.currentSize = size;
      }
      $grid.gridList('resize', _self.currentSize);
      resizeContainer();
    }

    var storeChanges = function(items) {
      _.each(items, function(item) {
        var $item = item.$element;
        var project_id = $item.data('id');
        var itemView = _self.getItem(project_id);
        itemView.update(item);
      });
    }

    var resizeContainer = function() {
      setTimeout(function() {
        $('.tile-area').width($grid.width() - 200);
      }, 200);
    }

    var showCreateProject = function() {
      var path = require('path');
      var dialog = new Dialog('', createProjectTpl());
      var checkProjectSettings = function() {
        var projectName = dialog.find('#projectName').val().trim();
        var projectFolder = dialog.find('#projectFolderText').val().trim();

        dialog.find('.message').hide();
        dialog.find('.button-create').hide();

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
                  dialog.find('.button-create').show();
                } else {
                  dialog.find('.folder-not-empty').show();
                }
              }
            } else {
              dialog.find('.folder-ready').show();
              dialog.find('.button-create').show();
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
          App.Process.createProject(projectName, projectFolder);
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

    var render = function() {
      $grid.gridList({
        rows: currentSize,
        heightToFontSizeRatio: 0.25,
        onChange: function(changedItems) {
          storeChanges(changedItems);
          resizeContainer();
        }
      },{
        delay: 100
      });

      $grid.find('.item .action a').off('mousedown').on('mousedown', function(e) {
        e.stopPropagation();
      });

      resize();
    }

    var bindEvents = function() {
      $(window).resize(function(){
        var height = $(this).height();

        if (height > 1000) {
          resize(5);
        } else if (height > 800) {
          resize(4);
        } else if (height > 600) {
          resize(3);
        } else {
          resize(2);
        }

        resizeContainer();
      });

      $(window).trigger('resize');

      $('.tile-area-controls').on('click', '.create-project', function(e) {
        e.stopPropagation();
        e.preventDefault();
        showCreateProject();
      });

      $("body").mousewheel(function(event, delta, deltaX, deltaY){
          var page = $('.app-container');
          var scroll_value = delta * 50;
          page.scrollLeft(page.scrollLeft() - scroll_value);
          return false;
      });
    }



    // == PUBLIC ==============================================================

    this.addItem = function(project) {
      items[project.id] = new ProjectItem($grid, project);
      render();
    }

    this.removeItem = function(project_id) {
      var itemView = this.getItem(project_id);
      itemView.remove();
      delete items[project_id];
      render();
    }

    this.getItem = function(project_id) {
      return items[project_id];
    }

    // == INITIALIZE ==============================================================

    buildElements(App.projects);

    render();
    bindEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.Grid = new GridUI();
  });

})(document, window, jQuery);
