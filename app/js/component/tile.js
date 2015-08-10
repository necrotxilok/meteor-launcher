/*
 *  Tile Component
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var Tile = function($grid, item) {

    // == PRIVATE ==============================================================
   
    var _self = this;
    var $item;

    var project_id;

    var activateClick = false;

    var tileSizes = [
      {w:1, h:1},
      {w:2, h:1},
      {w:2, h:2}
    ];

    var tileTpl = tplManager.get('tile');

    var removeClassPrefix = function($element, prefix) {
      var classes = $element.attr('class').split(' ').filter(function(c) {
          return c.lastIndexOf(prefix, 0) !== 0;
      });
      $element.attr('class', $.trim(classes.join(' ')));
    };

    var setState = function(state) {
      removeClassPrefix($item, 'state-');
      if (state) {
        $item.addClass('state-' + state);
      }
    }

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

    var playProject = function() {
      var meteor = App.Process.run(project_id);
      var $console = $item.find('.console');

      $console.empty();

      if (meteor) {
        setState('loading');

        // Controls meteor start up 
        meteor.up.done(function() {
          setState('launched');
        });
        meteor.up.fail(function() {
          setState('error');
          //viewProjectLog();
        });
        meteor.up.progress(function(data) {
          $console.append('<p>' + data + '</p>');
        });

        // Watch launched app
        meteor.watch.done(function() {
          setState();
        });
        meteor.watch.fail(function() {
          setState('exited');
          viewProjectLog();
        });
      } else {
        setState('error');
        viewProjectLog();
      }
    }

    var stopProject = function() {
      App.Process.stop(project_id);

      setState('stopped');
    }

    var viewProjectLog = function() {
      var log = App.Process.getLog(project_id);
      var dialog = new Dialog('Project Log', '<div class="log-file"></div>', {className: 'big-dialog', background: 'bg-grayDark', color: 'fg-white'});
      var $log = dialog.find('.log-file');
      _.each(log, function(line) {
        $log.append('<p>' + line + '</p>');
      });
      dialog.open();
    }

    var bindEvents = function() {
      $item.on('mousedown', '.project-controls', function(e) {
        activateClick = true;
        setTimeout(function() {
          activateClick = false;
        }, 300);
      });

      $item.on('click', '.project-play', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (activateClick) {
          playProject();
        }
      });

      $item.on('click', '.project-stop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (activateClick) {
          stopProject();
        }
      });

      $item.on('click', '.open-project', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var url = $(e.currentTarget).attr('href');
        App.nwGui.Shell.openExternal(url);
      });

      $item.on('click', '.view-log, .project-log', function(e) {
        e.stopPropagation();
        e.preventDefault();
        viewProjectLog();
      });

      $item.on('click', '.resize', function(e) {
        e.preventDefault();
        e.stopPropagation();
        resizeItem();
      });

      $item.on('click', '.project-settings', function(e) {
        e.preventDefault();
        e.stopPropagation();
        App.UI.Project.openEditProject(project_id);
      });
      $item.on('contextmenu', function(e) {
        if (!App.Process.isRunning(project_id)) {
          App.UI.Project.openEditProject(project_id);
        } else {
          if (!$item.hasClass('state-loading')) {
            viewProjectLog();
          }
        }
      });
    }

    var init = function() {
      var tileClass;

      if (item.size == 2) {
        tileClass = 'tile-large';
      } else if (item.size == 1) {
        tileClass = 'tile-wide';
      }

      $item = $(tileTpl({
        item: item,
        tileClass: tileClass,
        image_url: 'file://' + item.image.replace(/\\/g, '/')
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

      //$item.data('_tile', this);
    }


    // == PUBLIC ==============================================================

    this.setLabel = function(name) {
      $item.find('.tile-label').html(name);
    }

    this.setPort = function(port) {
      var $openProjectLink = $item.find('.open-project');
      var $viewPort = $item.find('.view-port');
      var url = 'http://localhost:' + port;
      $openProjectLink.attr('href', url);
      $openProjectLink.html(url);
      $viewPort.html(port);
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
      } else {
        $item.find('.tile-content').removeAttr('style');
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

      App.UI.Project.savePosition(project_id, size, props.x, props.y);
    }

    this.play = function() {
      playProject();
    }

    this.viewLog = function() {
      viewProjectLog();
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
  App.Components.Tile = Tile;

})(document, window, jQuery);
