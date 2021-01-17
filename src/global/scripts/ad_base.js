// eslint-disable-next-line
function Ad(anim) {
  this.init = function () {
    this.banner = document.getElementById('banner');

    // gets clickTAG variable, if it is not defined (e.g. banner is being tested locally) it will fallback to example.com
    function getClickTag() {
      return window.clickTag || 'http://www.google.com';
    }

    this.banner.onclick = () => {
      window.open(getClickTag(), '_blank');
    };

    // GSAP defaults
    gsap.defaults({
      ease: 'none',
      duration: 0.5,
    });

    // call the passed animation function
    anim();
  };
}
