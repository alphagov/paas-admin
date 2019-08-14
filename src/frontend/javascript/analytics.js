// Pull dimensions vals from meta ; else all script/origin combinations have to be in the CSP
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

var config = {
  // Paas-admin gets a relatively small number
  // of visits daily, so the default site speed
  // sample rate of 1% gives us too few data points.
  // Settings it to 30% gives us more data.
  siteSpeedSampleRate: 30
};

var originTag = document.querySelector('meta[name="x-user-identity-origin"]')
if (originTag && originTag.content) {
  config['dimension1'] = originTag.content;
}

gtag('config', 'UA-43115970-5', config);
