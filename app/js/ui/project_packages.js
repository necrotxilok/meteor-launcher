/*
 *  Project Packages UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */

 (function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var ProjectPackagesUI = function() {

    // == PRIVATE ==============================================================

    var _self = this;
    var container = '#charmPackages';
    var $container = $(container);
    var activeProject;

    var editorTpl = tplManager.get('project_packages');

    var findProject = function(project_id) {
      return _.findWhere(App.projects, {id: project_id});
    }

    var bindEvents = function() {
      $container.on('click', '.button-add', function(e) {
        //
      });
      $container.on('click', '.button-remove', function(e) {
        //
      });
    }

    // == PUBLIC ==============================================================

    this.charm = new App.Components.Charm(container);

    this.open = function(project_id) {
      activeProject = findProject(project_id);
      var packages = App.File.getMeteorPackages(activeProject.folder);

      _self.charm.open(editorTpl({
        error: (typeof packages == "string") ? packages : null,
        project_id: project_id,
        project: activeProject,
        packages: packages
      }));
    }


    // == INITIALIZE ==============================================================

    bindEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.ProjectPackages = new ProjectPackagesUI();
  });

})(document, window, jQuery);
