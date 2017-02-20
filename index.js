'use strict';

var reduce = require('async-array-reduce');
var isAnswer = require('is-answer');
var isObject = require('isobject');

module.exports = function(name, message, options, cb) {
  var args = [].slice.call(arguments, 1);
  cb = args.pop();

  if (typeof cb !== 'function') {
    throw new TypeError('expected a callback function');
  }

  var app = (this && this.app) || {};
  if (!app.isTemplates) {
    cb(new Error('expected an instance of Templates'));
    return;
  }

  if (typeof this.app.questions === 'undefined') {
    cb(new Error('expected the base-questions plugin to be registered'));
    return;
  }

  if (typeof name !== 'string') {
    cb(new TypeError('expected collection name to be a string'));
    return;
  }

  var last = args[args.length - 1];
  if (isObject(last)) {
    options = args.pop();
  }

  var opts = this.options.merge(this.context, options);
  var msg = opts.message || 'Which includes would you like to render?';

  last = args[args.length - 1];
  if (typeof last === 'string') {
    opts.message = args.pop();
  }

  var views = app[name];
  if (typeof views === 'undefined') {
    cb(null, '');
    return;
  }

  var list = new this.app.List(views);
  var val = opts.get('askInclude');
  var isAnswered = isAnswer(val);

  if (typeof opts.force === 'undefined') {
    opts.force = true;
  }

  opts.force = opts.required = !isAnswered;
  opts.save = false;

  // conditionally prompt the user
  switch (opts.askWhen) {
    case 'never':
      cb(null, val);
      return;
    case 'not-answered':
      if (isAnswered) {
        reduceIncludes(app, views, val, opts, cb);
        return;
      }
      break;
    case 'always':
    default: {
      break;
    }
  }

  app.choices('askInclude', msg, list.keys);
  app.ask('askInclude', opts, function(err, answers) {
    if (err) {
      cb(err);
      return;
    }

    var keys = answers.askInclude;
    if (!keys) {
      cb(null, '');
      return;
    }

    reduceIncludes(app, views, keys, opts, cb);
  });
};

function reduceIncludes(app, views, keys, opts, cb) {
  reduce(keys, '\n', function(acc, key, next) {
    var view = views.getView(key);

    if (!view) {
      next(null, acc);
      return;
    }

    app.render(view, opts, function(err, view) {
      if (err) {
        next(err);
        return;
      }

      acc += view.content + '\n';
      return next(null, acc);
    });
  }, cb);
}
