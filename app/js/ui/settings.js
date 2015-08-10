/*
 *  Settings UI
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */

 (function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var Dialog = App.Components.Dialog;

  var SettingsUI = function() {

    // == PRIVATE ==============================================================
   
    var settingsContainer = '#charmSettings';
    var $settings = $(settingsContainer);   

    var charm = new App.Components.Charm(settingsContainer);

    var aboutTpl = tplManager.get('about');

    var showAbout = function() {
      var dialog = new Dialog('', aboutTpl({
        version: App.version
      }));
      dialog.on('click', 'a', function(event) {
        event.preventDefault();
        var url = $(event.currentTarget).attr('href');
        App.nwGui.Shell.openExternal(url);
      });
      dialog.on('click', '.close', function(event) {
        dialog.close();
      });
      dialog.open();
    }

    var bindEvents = function() {
        $settings.on('click', '.about-link', function(event) {
            event.preventDefault();
            showAbout();
        });
    }

    // == PUBLIC ==============================================================


    // == INITIALIZE ==============================================================

    bindEvents();

    return this;
  }

  $(function() {
    App.UI = App.UI || {};
    App.UI.Settings = new SettingsUI();
  });

})(document, window, jQuery);