define(['handlebars'], function(Handlebars) {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['page.hbs'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {

  var buffer = "", stack1;
  buffer += "\n";
  if (stack1 = helpers.htmlTag) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.htmlTag; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;
  }

function program3(depth0,data) {


  return "\n<html>\n";
  }

function program5(depth0,data) {

  var buffer = "", stack1;
  buffer += "\n        <";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  stack1 = helpers.each.call(depth0, depth0.attributes, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.content) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.content; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ">\n    ";
  return buffer;
  }
function program6(depth0,data) {

  var buffer = "", stack1;
  buffer += escapeExpression(((stack1 = ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "=\""
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "\" ";
  return buffer;
  }

function program8(depth0,data) {

  var buffer = "";
  buffer += "\n        <link rel=\"stylesheet\" type=\"text/css\" href=\""
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "\">\n    ";
  return buffer;
  }

function program10(depth0,data) {

  var buffer = "", stack1;
  buffer += "\n        <script type=\"text/javascript\">\n            requirejs(['";
  if (stack1 = helpers.lib) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lib; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "'], function () {\n                var bootstrap = requirejs.config({\n                    baseUrl: '/',\n                    paths: {\n                        'resolver': 'lib/common/resolver',\n                        'text': 'vendor/text',\n                        'json': 'vendor/json'\n                    }\n                });\n\n                bootstrap(['bootstrap'], function () {});\n            });\n        </script>\n    ";
  return buffer;
  }

function program12(depth0,data) {


  return "\n        <script type=\"text/javascript\">\n            (function () {\n                var bootstrap = requirejs.config({\n                    baseUrl: '/',\n                    paths: {\n                        'resolver': 'lib/common/resolver',\n                        'text': 'vendor/text',\n                        'json': 'vendor/json'\n                    }\n                });\n\n                bootstrap(['bootstrap'], function () {});\n            })();\n        </script>\n    ";
  }

function program14(depth0,data) {

  var buffer = "", stack1;
  buffer += " class='";
  if (stack1 = helpers.bodyClass) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.bodyClass; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "'";
  return buffer;
  }

  buffer += "<!DOCTYPE html>\n<!-- handlebars -f simplePage.js -a simplePage.hbs -->\n\n";
  stack1 = helpers['if'].call(depth0, depth0.htmlTag, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<head>\n    <meta charset=\"UTF-8\">\n    ";
  stack1 = helpers.each.call(depth0, depth0.tags, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  stack2 = helpers.each.call(depth0, ((stack1 = depth0.dependencies),stack1 == null || stack1 === false ? stack1 : stack1.css), {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n    <script type=\"text/javascript\">\n        window.addEventListener('load', function (e) {\n            window.applicationCache.addEventListener('updateready', function (e) {\n                if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {\n                    window.location.reload();\n                }\n            }, false);\n        }, false);\n    </script>\n\n    <script type=\"text/javascript\">\n        var LAZO = {\n            initConf: {\n                layout: '";
  if (stack2 = helpers.layout) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.layout; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "',\n                rootCtx: ";
  if (stack2 = helpers.rootCtx) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.rootCtx; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ",\n                rootCtl: ";
  if (stack2 = helpers.rootCtl) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.rootCtl; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ",\n                shim: ";
  if (stack2 = helpers.shim) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.shim; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ",\n                paths: ";
  if (stack2 = helpers.paths) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.paths; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ",\n                args: ";
  if (stack2 = helpers.args) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.args; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n            }\n        };\n    </script>\n    <script src=\"/lib/vendor/require.js\"></script>\n    ";
  stack2 = helpers['if'].call(depth0, depth0.lib, {hash:{},inverse:self.program(12, program12, data),fn:self.program(10, program10, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</head>\n<body";
  stack2 = helpers['if'].call(depth0, depth0.bodyClass, {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">\n    ";
  if (stack2 = helpers.body) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.body; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</body>\n</html>";
  return buffer;
  });
});