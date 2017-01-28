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
