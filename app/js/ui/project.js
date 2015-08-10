/*
 *  Project UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */

 (function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var ProjectUI = function() {

    // == PRIVATE ==============================================================
   
    var _self = this;
    var editorContainer = '#charmEditor';
    var $editor = $(editorContainer);
    var projectItemView;
    var activeProject;

    var edit = false;

    var editorTpl = tplManager.get('editor');
    var messageTpl = tplManager.render('<div class="line validator-hint bg-red fg-white hint2" style="min-width: 0px; position: relative; width: 260px; z-index: 100;">{{message}}</div>');

    var findProject = function(project_id) {
      return _.findWhere(App.projects, {id: project_id});
    }

    var addProject = function(project) {
      App.projects.push(project);
      App.UI.Grid.addItem(project);
      App.File.saveProjects();
    }

    var removeProject = function(project) {
      App.projects = _.without(App.projects, project);
      App.UI.Grid.removeItem(project.id);
      App.File.saveProjects();
    }

    var bindEvents = function() {
      $('body').on('click', '.add-project', function(event) {
        event.preventDefault();
        _self.openAddProject();
      });
      $editor.on('click', '.button-save', function(event) {
        event.preventDefault();
        if (activeProject.name && activeProject.folder && activeProject.port && parseInt($('#projectPort').val().trim()) >= 3000 ) {
          addProject(activeProject);
          _self.charm.close();
        } else {
          $editor.find('#projectName').keyup();
          $editor.find('#projectFolderText').keyup();
          $editor.find('#projectPort').keyup();
        }
      });
      $editor.on('click', '.button-play', function(event) {
        event.preventDefault();
        projectItemView.play();
        _self.charm.close();
      });
      $editor.on('click', '.button-log', function(event) {
        event.preventDefault();
        projectItemView.viewLog();
      });
      $editor.on('click', '.button-remove', function(event) {
        event.preventDefault();
        var $this = $(event.currentTarget);
        var project_id = $this.data('project-id');
        var dialog = new Dialog('Remove Project', '<p>¿Are you sure you want to remove this project? There is no undo.</p><p class="small">This will only remove the project from Meteor Launcher. All project files will be kept in its folder.</p><div class="actions"><button class="button confirm bg-red bg-active-darkRed fg-white">Remove</button><button class="button cancel bg-grayLight bg-active-gray fg-white">Cancel</button></div>');
        dialog.on('click', '.confirm', function(event) {
          dialog.close();
          _self.charm.close();
          removeProject(activeProject);          
        });
        dialog.on('click', '.cancel', function(event) {
          dialog.close();
        });
        dialog.open();
      });
      /*$editor.on('click', '.button-cancel', function(event) {
        _self.charm.close();
      });*/
    }

    var getValue = function($input) {
      var $field = $input.closest('.input-control');
      var value = $input.val().trim();

      if (value) {
        $field.find('.validator-hint').remove();
        return value;
      } else {
        if (!$field.find('.validator-hint').get(0)) {
          $field.append(messageTpl({
            message: $input.data('validate-hint')
          }));
        }
        return false;
      }
    }

    var getPortValue = function($input) {
      var $field = $input.closest('.input-control');
      var value = parseInt($input.val().trim());

      if (value && value >= 3000) {
        $field.find('.validator-hint').remove();
        return value;
      } else {
        if (!$field.find('.validator-hint').get(0)) {
          $field.append(messageTpl({
            message: $input.data('validate-hint')
          }));
        }
        return false;
      }
    }

    var bindFormEvents = function() {
      $editor.on('keyup', '#projectName', function(event) {
        var $this = $(event.currentTarget);
        var name = getValue($this);

        if (name) {
          setProjectAttr('name', name);
          setProjectItem('Label', name);
        }
      });
      $editor.on('keyup', '#projectFolderText', function(event) {
        var $this = $(event.currentTarget);
        var folder = getValue($this);

        if (folder) {
          setProjectAttr('folder', folder);
        }
      });
      $editor.on('change', '#projectFolder', function(event) {
        var $this = $(event.currentTarget);
        var folder = getValue($this);

        if (folder) {
          setProjectAttr('folder', folder);
          $editor.find('#projectFolderText').val(folder);
        }
      });
      $editor.on('keypress', '#projectPort', function(event) {
        return event.charCode >= 48 && event.charCode <= 57;
      });
      $editor.on('keyup change', '#projectPort', function(event) {
        var $this = $(event.currentTarget);
        var port = getPortValue($this);

        if (port) {
          setProjectAttr('port', port);
          setProjectItem('Port', port);
        }
      });
      $editor.on('click', '.schemeButtons .square-button', function(event) {
        var $this = $(event.currentTarget);
        var color = $this.data('scheme');

        if (color) {
          setProjectAttr('color', color);
          setProjectItem('Color', color);
        }
      });
      $editor.on('keyup', '#projectImageText', function(event) {
        var $this = $(event.currentTarget);
        var image = $this.val().trim();

        if (image) {
          setProjectAttr('image', image);
          setProjectItem('Image', image);
        } else {
          setProjectItem('Image');
        }
      });
      $editor.on('change', '#projectImage', function(event) {
        var $this = $(event.currentTarget);
        var image = $this.val().trim();

        if (image) {
          setProjectAttr('image', image);
          $editor.find('#projectImageText').val(image);
          setProjectItem('Image', image);
        } else {
          setProjectItem('Image');
        }
      });
      $editor.on('click', '#projectImageClear', function(event) {
        setProjectAttr('image', '');
        $editor.find('#projectImageText').val('');
        setProjectItem('Image');
      });
    }

    var setProjectAttr = function(attr, value) {
      activeProject[attr] = value;
      if (edit) {
        App.File.saveProjects();
      }
    }

    var setProjectItem = function(property, value) {
      if (projectItemView) {
        projectItemView['set' + property](value);
      }
    }

    // == PUBLIC ==============================================================

    this.charm = new App.Components.Charm(editorContainer);

    this.openAddProject = function() {
      edit = false;

      activeProject = {
        id: App.uniqueId(),
        name: '',
        folder: '',
        port: 3000,
        color: 'bg-grayLight',
        image: '',
        size: 0, 
        x: 1000, 
        y: 1000
      };
      projectItemView = null;
      
      _self.charm.open(editorTpl({
        editionMode: edit,
        project: activeProject
      }));

      $editor.find('.schemeButtons .square-button.' + activeProject.color).addClass('active');
    }

    this.openEditProject = function(project_id) {
      edit = true;

      activeProject = findProject(project_id);
      projectItemView = App.UI.Grid.getItem(project_id);

      _self.charm.open(editorTpl({
        editionMode: edit,
        project_id: project_id,
        project: activeProject
      }));

      $editor.find('.schemeButtons .square-button.' + activeProject.color).addClass('active');
      //$editor.find('.button-stop').hide();
    }

    this.savePosition = function(project_id, size, x, y) {
      var project = findProject(project_id);

      project.size = size;
      project.x = x;
      project.y = y;

      App.File.saveProjects();
    }


    // == INITIALIZE ==============================================================

    bindEvents();
    bindFormEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.Project = new ProjectUI();
  });

})(document, window, jQuery);