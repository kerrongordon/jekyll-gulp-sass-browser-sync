$(document).ready(function() {
  $(".button-collapse").sideNav();
});

var test1 = (function(){
  console.log('this is test one');
})();

var test2 = (function(){
  var testTwo = 'this is test two';
  console.log(testTwo);
})();
