/*
 *  Project Item Component
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var ProjectItem = function($grid, item) {

    // == PRIVATE ==============================================================
   
    var _self = this;
    var $item;
    var $log

    var project_id;

    var activateClick = false;

    var tileSizes = [
      {w:1, h:1},
      {w:2, h:1},
      {w:2, h:2}
    ];

    var gridItemTpl = tplManager.get('project_item');

    var resizeItem = function() {
      var size = $item.data('size') + 1;
      if (size > tileSizes.length - 1) {
        size = 0;
      }

      var itemWidth = tileSizes[size].w;
      var itemHeight = tileSizes[size].h;

      $item.data('size', size);

      if (size == 2) {
        $item.find('.tile').removeClass('tile-wide').addClass('tile-large');
      } else if (size == 1) {
        $item.find('.tile').removeClass('tile-large').addClass('tile-wide');
      } else {
        $item.find('.tile').removeClass('tile-wide tile-large');
      }

      $grid.gridList('resizeItem', $item, {
        w: itemWidth,
        h: itemHeight
      });
    }

    var removeClassPrefix = function($element, prefix) {
      var classes = $element.attr('class').split(' ').filter(function(c) {
          return c.lastIndexOf(prefix, 0) !== 0;
      });
      $element.attr('class', $.trim(classes.join(' ')));
    };

    var bindEvents = function() {
      $item.on('mousedown', '.tile', function(e) {
        activateClick = true;
        setTimeout(function() {
          activateClick = false;
        }, 300);
      });
      $item.on('click', '.tile', function(e) {
        e.preventDefault();
        if (activateClick) {
          App.UI.ProjectView.viewProject(project_id);
        }
      });

      $item.on('click', '.resize', function(e) {
        e.preventDefault();
        e.stopPropagation();
        resizeItem();
      });

      $item.on('click', '.settings', function(e) {
        e.preventDefault();
        e.stopPropagation();
        App.UI.ProjectEditor.openEditProject(project_id);
      });
      $item.on('click', '.play', function(e) {
        e.preventDefault();
        e.stopPropagation();
        App.UI.ProjectView.play(project_id);
      });

      $item.on('click', '.stop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        App.UI.ProjectView.stop(project_id);
      });
      $item.on('click', '.open', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var url = $(e.currentTarget).attr('href');
        App.nwGui.Shell.openExternal(url);
      });

      $item.on('contextmenu', function(e) {
        App.UI.ProjectEditor.openEditProject(project_id);
      });
    }

    var init = function() {
      var tileClass;

      if (item.size == 2) {
        tileClass = 'tile-large';
      } else if (item.size == 1) {
        tileClass = 'tile-wide';
      }

      $item = $(gridItemTpl({
        item: item,
        tileClass: tileClass,
        image_url: item.image ? 'file://' + item.image.replace(/\\/g, '/') : null
      }));

      $item.attr({
        'data-size': item.size,
        'data-w': tileSizes[item.size].w,
        'data-h': tileSizes[item.size].h,
        'data-x': item.x,
        'data-y': item.y
      });

      project_id = $item.data('id');

      $grid.append($item);
    }


    // == PUBLIC ==============================================================

    this.setState = function(state) {
      removeClassPrefix($item, 'state-');
      if (state) {
        $item.addClass('state-' + state);
      }
    }

    this.setLabel = function(name) {
      $item.find('.tile-label').html(name);
    }

    this.setPort = function(port) {
      var $openProjectLink = $item.find('.open');
      var url = 'http://localhost:' + port;
      $openProjectLink.attr('href', url);
    }

    this.setColor = function(color) {
      var $tile = $item.find('.tile');
      removeClassPrefix($tile, 'bg-');
      $tile.addClass(color);
    }

    this.setImage = function(image) {
      if (image)  {
        $item.find('.tile-content').removeAttr('style').css({
          'background-image': 'url(\'' + 'file://' + image.replace(/\\/g, '/') + '\')'
        });
        $item.find('.project-icon').addClass('hidden');
      } else {
        $item.find('.tile-content').removeAttr('style');
        $item.find('.project-icon').removeClass('hidden');
      }
    }

    this.update = function(props) {
      var size = _.findIndex(tileSizes, function(s) { 
        return s.w == props.w && s.h == props.h;
      });

      $item.attr({
        'data-size': size,
        'data-w': props.w,
        'data-h': props.h,
        'data-x': props.x,
        'data-y': props.y
      });

      App.UI.ProjectEditor.savePosition(project_id, size, props.x, props.y);
    }

    this.remove = function() {
      $item.remove();
    }

    // == INITIALIZE ==============================================================

    init();
    bindEvents();

    return this;
  }

  App.Components = App.Components || {};
  App.Components.ProjectItem = ProjectItem;

})(document, window, jQuery);
