var animate = function(){
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
};

// instantiate and initialize the ad
var ad = new Ad(animate);
ad.init();
