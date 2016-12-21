/*
 *  Dialog Component
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var tplManager = App.TplManager;
  var dialogTpl = tplManager.get('dialog');

  var Dialog = function(title, content, options) {
    var _self = this;

    var $dialog = $(dialogTpl({
      title: title,
      content: content,
      options: options
    }));

    this.open = function() {
      $dialog.appendTo('body');
      $dialog.on('click', '.dialog-close-button', function() {
        setTimeout(function() {
          $dialog.remove();
        }, 300);
      });
      setTimeout(function() {
        var dlg = $dialog.data('dialog');
        dlg.open();
      }, 1);
    }

    this.close = function() {
      $dialog.find('.dialog-close-button').click();
    }

    this.render = function(content) {
      $dialog.find('.dialog-body .content').html(content);
    }

    this.on = function(eventName, target, callback) {
      $dialog.on(eventName, target, callback);
    }

    this.find = function(selector) {
      return $dialog.find(selector);
    }

    this.$el = $dialog;

    // Stop Propagation
    $dialog.mousewheel(function(event) {
      event.stopPropagation();
    });

    return this;
  }

  App.Components = App.Components || {};
  App.Components.Dialog = Dialog;

})(document, window, jQuery);
