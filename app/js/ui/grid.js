/*
 *  Grid UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var Tile = App.Components.Tile;

  var tplManager = App.TplManager;

  var GridUI = function() {

    // == PRIVATE ==============================================================
   
    var _self = this;
    var searchContainer = '#charmSearch';
    var $search = $(searchContainer);
    var $grid = $('#grid');

    var currentSize = 3;

    var items = {};

    var buildElements = function(projects) {
      _.each(projects, function(project) {
        items[project.id] = new Tile($grid, project);
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
          var page = $(document);
          var scroll_value = delta * 50;
          page.scrollLeft(page.scrollLeft() - scroll_value);
          return false;
      });
    }

    var bindSearchEvents = function() {
      $search.on('keyup', '.input-search', _.debounce(function(event) {
        var $this = $(event.currentTarget);
        var $results = $search.find('.search-results');
        var searchText = $this.val();

        if (searchText) {

          var filteredProjects = _.filter(App.projects, function(project) {
            if (project.name.match(new RegExp(searchText, 'i'))) {
              return true;
            }
            if (project.port.toString().match(new RegExp(searchText, 'i'))) {
              return true;
            }
            return false;
          });

          $results.empty();

          if (filteredProjects.length) {
            _.each(filteredProjects, function(project) {
              var $res = $('<div/>').append('<div class="result" data-id="' + project.id + '"><div class="helper ' + project.color + '"></div><div class="name">' + project.name + '</div><div class="port">' + project.port + '</div></div>');
              if (project.image) {
                console.log(project.image);
                var image_url = 'file://' + project.image.replace(/\\/g, '/');
                $res.find('.helper').append('<div class="img" style="background-image: url(' + image_url + ');"></div>');
              }
              $results.append($res.html());
            });
          } else {
            $results.html('<p>Not found!</p>');
          }

        } else {
          $results.empty();
        }

      }, 300));
  
      $search.on('click', '.result', function(event) {
        event.preventDefault();
        var $this = $(event.currentTarget);
        var project_id = $this.data('id');

        _self.charm.close();
        App.UI.Project.openEditProject(project_id);
      });

    }


    // == PUBLIC ==============================================================

    this.charm = new App.Components.Charm(searchContainer);
    this.charm.onClose = function() {
      $search.find('.input-search').val('');
      $search.find('.search-results').empty();
    }


    this.addItem = function(project) {
      items[project.id] = new Tile($grid, project);
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

    bindSearchEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.Grid = new GridUI();
  });

})(document, window, jQuery);