'use strict';

var templates = require('templates');
var questions = require('base-questions');
var app = templates();
app.use(questions());

app.engine('md', require('engine-base'));
app.asyncHelper('askInclude', require('./')(app));

app.create('pages');
app.create('includes');

app.include('a.md', {content: 'this is AAA'});
app.include('b.md', {content: 'this is BBB'});
app.include('c.md', {content: 'this is CCC'});

var index = app.page('index.md', {
  content: 'Before\n<%= askInclude("includes") %>\nAfter'
});

// app.option('askWhen', 'not-answered');
// app.option('askInclude', ['a.md', 'foo.md']);

app.render(index, function(err, res) {
  if (err) return console.log(err);
  console.log(res.content);
});
