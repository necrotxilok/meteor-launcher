/*
 *  Project Platforms UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */

 (function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var ProjectPlatformsUI = function() {

    // == PRIVATE ==============================================================

    var _self = this;
    var container = '#charmPlatforms';
    var $container = $(container);
    var activeProject;

    var editorTpl = tplManager.get('project_platforms');

    var findProject = function(project_id) {
      return _.findWhere(App.projects, {id: project_id});
    }

    var bindEvents = function() {
      $container.on('click', '.item', function(e) {
        var $this = $(e.currentTarget);
        var platform = $this.data('platform');
        var active = $this.data('active');

        _self.charm.close();

        if (active) {
          App.Process.removePlatform(activeProject.id, platform);
        } else {
          App.Process.addPlatform(activeProject.id, platform);
        }
      });
    }

    // == PUBLIC ==============================================================

    this.charm = new App.Components.Charm(container);

    this.open = function(project_id) {
      activeProject = findProject(project_id);
      var platforms = App.File.getMeteorPlatforms(activeProject.folder);

      _self.charm.open(editorTpl({
        error: (typeof platforms == "string") ? platforms : null,
        project_id: project_id,
        project: activeProject,
        platforms: platforms
      }));
    }


    // == INITIALIZE ==============================================================

    bindEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.ProjectPlatforms = new ProjectPlatformsUI();
  });

})(document, window, jQuery);
