/*
 *  Charm Component
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var overlay = '<div class="charm-overlay"></div>';

  var Charm = function(element) {
    var _self = this;
    var $charm = $(element);

    this.open = function(html) {
      $('body').append(overlay);
      $charm.animate({
        right: 0
      }, 200);

      if (html) {
        $charm.find('.charm-content-container').html(html);
      }
    }

    this.close = function() {
      $('.charm-overlay').remove();
      $charm.animate({
        right: -350
      }, 200);
      _self.onClose();
    }

    this.onClose = function() {}

    // Find Charm Openers to assign open event
    $('.charm-open').each(function() {
      var $this = $(this);
      if ($this.data('target') == element) {
        $this.on('click', function(event) {
          event.preventDefault();
          _self.open();
        });
      }
    });

    // Close event
    $charm.find('.charm-close').on('click', function() {
      event.preventDefault();
      _self.close();      
    });
    $('body').on('click', '.charm-overlay', function() {
      event.preventDefault();
      _self.close();      
    });
    $('body').on('contextmenu', '.charm-overlay', function() {
      event.preventDefault();
      _self.close();      
    });

    // Stop Propagation
    $charm.mousewheel(function(event) {
      event.stopPropagation();
    });
    
    return this;
  }

  App.Components = App.Components || {};
  App.Components.Charm = Charm;

})(document, window, jQuery);
