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

    var setState = function(state) {
        switch (state) {
          case 'running':
            if ($controls && $controls.length) {
              $controls.find('.runner').hide();
              $controls.find('.button-stop').show();
            }
            if ($log && $log.length) {
              $log.addClass(state);
            }
            break;

          default:
            if ($controls && $controls.length) {
              $controls.find('.runner').css('display', 'inline-block');
              $controls.find('.button-stop').hide();
            }
            if ($log && $log.length) {
              $log.removeClass('running');
            }
        }
    }

    var playProject = function(platform) {
      var meteor = App.Process.run(activeProject.id, platform);

      if ($log && $log.length) {
        $log.empty();

        var log = App.Process.getLog(activeProject.id);
        _.each(log, function(line) {
          $log.append('<p>' + line + '</p>');
        });
      }

      setState('running');

      if (meteor.run) {
        projectItemView.setState('launched');

        // On process finished
        meteor.run.done(function() {
          projectItemView.setState();
        });

        // On process fail
        meteor.run.fail(function() {
          projectItemView.setState('exited');
          setState('stopped');
        });
      } else {
        // Meteor process unable to start
        projectItemView.setState('error');
      }
    }

    var stopProject = function() {
      App.Process.stop(activeProject.id);
      projectItemView.setState('stopped');
      setState('stopped');
    }

    var clearProjectLog = function() {
      App.Process.clearLog(activeProject.id);
      $log.empty();
    }

    var animateScroll = _.debounce(function() {
      var scrollHeight = $log.get(0).scrollHeight;
      $log.animate({'scrollTop': scrollHeight}, 500);
    }, 50);

    var showLogMessage = function(message) {
      if ($log && $log.length) {
        $log.append('<p>' + message + '</p>');
        animateScroll();
      }
    }

    var render = function(project_id) {
      activeProject = findProject(project_id);
      projectItemView = App.UI.Grid.getItem(project_id);

      var meteor = App.Process.connectTerminal(project_id);
      if (meteor) {
        // On process notification
        meteor.watch.progress(function(msg, project_id) {
          if (activeProject.id == project_id) {
            showLogMessage(msg);
          }
        });
      }

      var platforms = App.File.getMeteorPlatforms(activeProject.folder);
      var androidActive = false;
      var iosActive = false;
      if (typeof platforms != "string") {
        _.each(platforms, function(p, name) {
          if (p.active) {
            if (name == "android") {
              androidActive = true;
            }
            if (name == "ios") {
              iosActive = true;
            }
          }
        });
      }
      var platformsActive = androidActive || iosActive;

      dialog = new Dialog(
        'Project ' + activeProject.name,
        viewTpl({
          project_id: project_id,
          project: activeProject,
          image_url: activeProject.image ? 'file://' + activeProject.image.replace(/\\/g, '/') : null,
          platformsActive: platformsActive,
          androidActive: androidActive,
          iosActive: iosActive
        }),
        {
          className: 'project-dialog',
          background: 'bg-grayDark',
          color: 'fg-white'
        }
      );

      $log = dialog.find('.log-view');

      var log = App.Process.getLog(project_id);
      _.each(log, function(msg) {
        showLogMessage(msg);
      });

      $controls = dialog.find('.project-controls');

      if (App.Process.isRunning(project_id)) {
        setState('running');
      } else {
        setState('stopped');
      }

      var $meteorInfo = dialog.find('.meteor-info');
      $meteorInfo.html(App.File.getMeteorVersion(activeProject.folder));

      dialog.open(true);
    }

    var bindEvents = function($container) {
      $container.on('click', '.button-play', function(e) {
        playProject();
      });
      $container.on('click', '.button-play-platform', function(e) {
        e.preventDefault();
        var $this = $(e.currentTarget);
        var platform = $this.data('platform');
        playProject(platform);
      });
      $container.on('click', '.button-stop', function(e) {
        stopProject();
      });
      $container.on('click', '.button-clear-log', function(e) {
        clearProjectLog();
      });

      $container.on('click', '.button-console', function(e) {
        App.cmd.run(activeProject.id);
      });

      $container.on('click', '.button-packages', function(e) {
        App.UI.ProjectPackages.open(activeProject.id);
      });
      $container.on('click', '.button-platforms', function(e) {
        App.UI.ProjectPlatforms.open(activeProject.id);
      });

      $container.on('click', '.button-edit', function(e) {
        App.UI.ProjectEditor.openEditProject(activeProject.id);
      });
    }

    // == PUBLIC ==============================================================

    this.viewProject = function(project_id) {
      render(project_id);

      bindEvents(dialog.$el);
    }

    /*this.play = function(project_id) {
      activeProject = findProject(project_id);
      projectItemView = App.UI.Grid.getItem(project_id);
      playProject();
    }

    this.stop = function(project_id) {
      activeProject = findProject(project_id);
      projectItemView = App.UI.Grid.getItem(project_id);
      stopProject();
    }*/

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
