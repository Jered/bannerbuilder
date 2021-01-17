var animate = function () {
  // set the animation targets
  var banner = document.getElementById('banner');
  var txt1 = document.getElementById('txt1');
  var txt2 = document.getElementById('txt2');
  var cta = document.getElementById('cta');

  // create our TimelineLite object
  var tl = gsap.timeline({ delay: 1 });

  // define the animation
  tl.to(banner, { opacity: 1 })
    .from(txt1, { opacity: 0 })
    .to(txt1, { opacity: 0 }, '+=2')
    .from(txt2, { opacity: 0 }, '+=0.5')
    .from(cta, { opacity: 0 }, '+=1');
};

// instantiate and initialize the ad
var ad = new Ad(animate);
ad.init();
