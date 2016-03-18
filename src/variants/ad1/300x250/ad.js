/* global TimelineLite, Linear, Power1, Power2 */
/**
 Protect our code with a namespace so we don't collide with anything else.
 We need to do a check before we create the namespace
**/
if (typeof Ad === 'undefined') {
  var Ad = {
    init: function(){
      this.banner = document.getElementById('banner');

      // gets clickTAG variable, if it is not defined (e.g. banner is being tested locally) it will fallback to example.com
      function getClickTag() {
        return window.clickTag || 'http://www.google.com';
      }

      this.banner.onclick = function() {
        window.open(getClickTag(),'_blank');
      };

      Ad.animate();
    },
    animate: function(){
      // set the animation targets
      var txt1 = document.getElementById('txt1');
      var txt2 = document.getElementById('txt2');
      var cta = document.getElementById('cta');

      // create our TimelineLite object
      var tl = new TimelineLite({delay:1, defaultEase:Linear.easeNone});

      // define the animation
      tl.from(txt1, 0.5, {opacity:0})
        .to(txt1, 0.5, {opacity:0}, '+=2')
        .from(txt2, 0.5, {opacity:0}, '+=0.5')
        .from(cta, 0.5, {opacity:0}, '+=1');
    }
  };
}

// initialize
Ad.init();
