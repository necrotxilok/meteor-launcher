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
    var addTpl = tplManager.get('project_package_add');
    var removeTpl = tplManager.get('project_package_remove');

    var typeNames = {
      'meteor': 'Meteor Package',
      'node': 'Node Module',
      'cordova': 'Cordova Plugin'
    };

    var findProject = function(project_id) {
      return _.findWhere(App.projects, {id: project_id});
    }

    var addPackage = function(type) {
      var dialog = new Dialog('', addTpl({
        typeName: typeNames[type]
      }));
      dialog.on('click', '.button-add', function(event) {
        event.preventDefault();
        var packageName = dialog.find('.input-name').val().trim();
        App.Process.addPackage(activeProject.id, type, packageName);
        dialog.close();
        _self.charm.close();
      });
      dialog.on('click', '.close', function(event) {
        dialog.close();
      });
      dialog.open();
      setTimeout(function() {
        dialog.find('.input-name').focus();
      }, 100);
    }

    var removePackage = function(type, packageName) {
      var dialog = new Dialog('', removeTpl({
        typeName: typeNames[type],
        packageName: packageName
      }));
      dialog.on('click', '.button-remove', function(event) {
        event.preventDefault();
        App.Process.removePackage(activeProject.id, type, packageName);
        dialog.close();
        _self.charm.close();
      });
      dialog.on('click', '.close', function(event) {
        dialog.close();
      });
      dialog.open();
    }

    var bindEvents = function() {

      $container.on('keyup', '.input-search', _.debounce(function(event) {
        var $this = $(event.currentTarget);
        var searchText = $this.val().trim();
        var $items = $container.find('.list .item');

        if (searchText) {
          $items.each(function() {
            var $item = $(this);
            var name = $item.find('.name').text();
            if (name.match(new RegExp(searchText, 'i'))) {
              $item.show();
            } else {
              $item.hide();
            }
          });
        } else {
          $items.show();
        }

      }, 300));

      $container.on('click', '.button-add', function(e) {
        var $this = $(e.currentTarget);
        var type = $this.data('type');
        addPackage(type);
      });

      $container.on('click', '.button-remove', function(e) {
        var $this = $(e.currentTarget);
        var packageName = $this.data('name');
        var $list = $this.closest('.list');
        var type = $list.data('type');
        removePackage(type, packageName);
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
