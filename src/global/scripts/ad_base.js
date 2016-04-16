function Ad (anim) { // eslint-disable-line
  this.init = function(){
    this.banner = document.getElementById('banner');

    // gets clickTAG variable, if it is not defined (e.g. banner is being tested locally) it will fallback to example.com
    function getClickTag() {
      return window.clickTag || 'http://www.google.com';
    }

    this.banner.onclick = function() {
      window.open(getClickTag(),'_blank');
    };

    // call the passed animation function
    anim();
  };
}
