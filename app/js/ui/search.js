/*
 *  Search UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */

 (function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var SearchUI = function() {

    // == PRIVATE ==============================================================
   
    var searchContainer = '#charmSearch';
    var $search = $(searchContainer);

    var charm = new App.Components.Charm(searchContainer);


    var bindEvents = function() {
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
                var image_url = project.image ? 'file://' + project.image.replace(/\\/g, '/') : null;
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

        charm.close();
        App.UI.ProjectView.viewProject(project_id);
      });

      charm.onClose = function() {
        $search.find('.input-search').val('');
        $search.find('.search-results').empty();
      }
    }

    // == PUBLIC ==============================================================


    // == INITIALIZE ==============================================================

    bindEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.Search = new SearchUI();
  });

})(document, window, jQuery);
