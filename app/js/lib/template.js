/*
 *  Template Lib
 * ------------------------------------------------
 *  @Author:    necro_txilok
 *  @Date:      2015-07-24
 */


(function(document, window, $, undefined) {
  'use strict';

  var Template = function() {

    // == PRIVATE ==============================================================

    var fs = require('fs');
 
    var DS = '/';
    if (process.platform === 'win32') {
      DS = '\\';
    }

    var templates = {};

    var loadTemplates = function() {
      var currentPath = process.cwd();
      var tplPath = currentPath + DS + 'tpl';
      var files = fs.readdirSync(tplPath);

      _.each(files, function(file) {
        var extension = file.split('.').pop();
        var name = file.replace('.' + extension, '');
        
        if (extension === 'html') {
          var html = fs.readFileSync(tplPath + DS + file);
          templates[name] = Handlebars.compile(html.toString());
        }
      });

      Handlebars.registerHelper('active', function(variable, text) {
        var result = '';
        if (variable == text) {
          result = 'active';
        }
        return new Handlebars.SafeString(result);
      });
    }

    // == PUBLIC ==============================================================

    this.get = function(name) {
      if (!name) {
        console.error('Invalid name');
        return;
      }
      if (!templates[name]) {
        console.error('Undefined template')
        return;
      }
      return templates[name];
    }

    this.render = function(html) {
      if (!html) {
        console.error('Invalid html');
        return;
      }
      return Handlebars.compile(html);
    }

    // Initialize
    loadTemplates();

    return this;
  }

  App.TplManager = new Template();

})(document, window, jQuery);
