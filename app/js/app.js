/*
 *  Meteor Launcher
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


App = {};

(function(document, window, $, undefined) {
  'use strict';

  var debugMode = true;

  App.nwGui = require('nw.gui');
  App.win = App.nwGui.Window.get();

  //App.win.showDevTools();

  App.uniqueId = function() {
      var date = Date.now();
      
      // If created at same millisecond as previous
      if (date <= App.uniqueId.previous) {
          date = ++App.uniqueId.previous;
      } else {
          App.uniqueId.previous = date;
      }
      
      return date;
  }
  App.uniqueId.previous = 0;

  $(function() {

    App.version = App.nwGui.App.manifest.version;

    App.settings = App.File.getSettings();
    App.projects = App.File.getProjects();

    // ------- DEBUG FUNCTIONS
    if (debugMode) {
      $('body').on('keyup', function(event) {
        // Reload by pressing F5
        if (event.keyCode == 116) {
          window.location.reload();
        }
        // Open Dev Tools by pressing F12
        if (event.keyCode == 123) {
          App.win.showDevTools();
        }
      });
    }    
  });

})(document, window, jQuery);
