const animate = function () {
  // set the animation targets
  const banner = document.getElementById('banner');

  // create our TimelineLite object
  const tl = gsap.timeline({ delay: 1 });

  // define the animation
  tl.to(banner, { opacity: 1 })
    .from('#txt1', { opacity: 0 })
    .to('#txt1', { opacity: 0 }, '+=2')
    .from('#txt2', { opacity: 0 }, '+=0.5')
    .from('#cta', { opacity: 0 }, '+=1');
};

// instantiate and initialize the ad
const ad = new Ad(animate);
ad.init();
