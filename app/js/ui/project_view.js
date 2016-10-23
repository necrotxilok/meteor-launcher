/*
 *  Project View UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2016-10-21
 */

 (function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var ProjectViewUI = function() {

    // == PRIVATE ==============================================================
   
    var _self = this;
    var projectItemView;
    var activeProject;

    var dialog;
    var $log;
    var $controls;

    var viewTpl = tplManager.get('project_view');

    var findProject = function(project_id) {
      return _.findWhere(App.projects, {id: project_id});
    }

    var playProject = function() {
      var meteor = App.Process.run(activeProject.id);

      if ($log && $log.length) {
        $log.empty();

        var log = App.Process.getLog(activeProject.id);
        _.each(log, function(line) {
          $log.append('<p>' + line + '</p>');
        });
      }

      if ($controls && $controls.length) {
        $controls.find('.button-play').hide();
        $controls.find('.button-stop').show();
      }
        
      if (meteor) {
        projectItemView.setState('launched');

        // Watch launched app

        // On process finished
        meteor.watch.done(function() {
          projectItemView.setState();
        });
        // On process fail
        meteor.watch.fail(function() {
          projectItemView.setState('exited');
        });
        // On process notification
        meteor.watch.progress(function(msg, project_id) {
          if (activeProject.id == project_id) {
            showLogMessage(msg);
          }
        });

      } else {
        // Meteor process unable to start
        projectItemView.setState('error');
      }
    }

    var stopProject = function() {
      App.Process.stop(activeProject.id);
      projectItemView.setState('stopped');
      if ($controls && $controls.length) {
        $controls.find('.button-play').show();
        $controls.find('.button-stop').hide();
      }
    }

    var showLogMessage = function(message) {
      if ($log && $log.length) {
        $log.append('<p>' + message + '</p>');
        var scrollHeight = $log.get(0).scrollHeight;
        $log.animate({'scrollTop': scrollHeight}, 500);
      }
    }

    var bindEvents = function($container) {
      $container.on('click', '.button-play', function(e) {
        playProject();
      });
      $container.on('click', '.button-stop', function(e) {
        stopProject();
      });
      $container.on('click', '.button-console', function(e) {
        App.cmd.run(activeProject.id);
      });
      $container.on('click', '.button-edit', function(e) {
        App.UI.ProjectEditor.openEditProject(activeProject.id);
      });
    }

    var render = function() {
      var project_id = activeProject.id;
      $log = dialog.find('.log-view');
      
      var log = App.Process.getLog(project_id);
      _.each(log, function(line) {
        $log.append('<p>' + line + '</p>');
      });
      
      $controls = dialog.find('.project-controls');

      if (App.Process.isRunning(project_id)) {
        $controls.find('.button-play').hide();
      } else {
        $controls.find('.button-stop').hide();
      }
    }


    // == PUBLIC ==============================================================

    this.viewProject = function(project_id) {
      activeProject = findProject(project_id);
      projectItemView = App.UI.Grid.getItem(project_id);

      dialog = new Dialog(
        'Project ' + activeProject.name, 
        viewTpl({
          project_id: project_id,
          project: activeProject,
          image_url: activeProject.image ? 'file://' + activeProject.image.replace(/\\/g, '/') : null
        }), 
        {
          className: 'project-dialog', 
          background: 'bg-grayDark', 
          color: 'fg-white'
        }
      );

      render();

      dialog.open();
      
      bindEvents(dialog.$el);
    }

    this.play = function(project_id) {
      activeProject = findProject(project_id);
      projectItemView = App.UI.Grid.getItem(project_id);
      playProject();
    }

    this.stop = function(project_id) {
      activeProject = findProject(project_id);
      projectItemView = App.UI.Grid.getItem(project_id);
      stopProject();
    }

    this.redraw = function() {
      if (dialog && dialog.$el && dialog.$el.length) {
        dialog.render(viewTpl({
          project_id: activeProject.id,
          project: activeProject,
          image_url: activeProject.image ? 'file://' + activeProject.image.replace(/\\/g, '/') : null
        }));
        render();
      }
    }

    // == INITIALIZE ==============================================================

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.ProjectView = new ProjectViewUI();
  });

})(document, window, jQuery);
