/**
 * @jest-environment jsdom
 */

import React from 'react';
import { shallow } from 'enzyme';
import { CookieBanner} from '../../layouts/partials';
import Cookies from './cookie-functions'

var cookies = new Cookies()

describe("Cookies", () => {
  beforeEach(() => {
    cookies.cookieDomain = ''; // to be able to set a cookie in test env
    document.body.innerHTML = shallow(<CookieBanner />).html();
    cookies.initAnalytics = jest.fn();
    document.querySelector(".cookie-banner").style.display = "none";
  });

  afterEach(() => {
    cookies.setCookie(cookies.cookieName, '', {days: -1});
    document.body.innerHTML = '';
  });

  describe("when existing user", () => {

    it(`should NOT see cookie banner but initialise analytics when cookie consent = true`, () => {
      cookies.setCookie(cookies.cookieName, JSON.stringify({ 'analytics': true }), {days: cookies.cookieDuration});
      if (cookies.hasConsentForAnalytics()) {
        cookies.initAnalytics();
      }
      expect(document.querySelector(".cookie-banner").style.display).toEqual("none");
      expect(cookies.initAnalytics).toHaveBeenCalledTimes(1);
    });

    it(`should NOT see cookie banner and not initialise analytics when cookie consent = false`, () => {
      cookies.setCookie(cookies.cookieName, JSON.stringify({ 'analytics': false }), {days: cookies.cookieDuration});
      if (cookies.hasConsentForAnalytics()) {
        cookies.initAnalytics();
      }
      expect(document.querySelector(".cookie-banner").style.display).toEqual("none");
      expect(cookies.initAnalytics).toHaveBeenCalledTimes(0);
    });
  });

  describe("when new user", () => {
    it(`should see cookie banner when no consent cookie present`, () => {
      const $cookieBanner = document.querySelector('[data-module="cookie-banner"]')
      if ($cookieBanner) {
        cookies.initCookieBanner($cookieBanner)
      }
      expect(document.querySelector(".cookie-banner").style.display).toEqual("block");
    });

    it(`clicks YES on the cookie banner - sets the consent to TRUE, shows the $message and fires analytics`, () => {
      const $cookieBanner = document.querySelector('[data-module="cookie-banner"]')
      if ($cookieBanner) {
        cookies.initCookieBanner($cookieBanner)
      };

      document.querySelector("button[data-accept-cookies=true]").click();
      
      const consentCookie = cookies.getCookie(cookies.cookieName)
      const consentCookieJson = JSON.parse(consentCookie);
      const $message = document.querySelector(".cookie-banner__confirmation");

      expect(consentCookieJson.analytics).toEqual(true);
      expect($message.style.display).toEqual("block");
      expect($message.textContent).toContain('You’ve accepted analytics cookies');
      expect(cookies.initAnalytics).toHaveBeenCalledTimes(1);
    });

    it(`clicks NO on the cookie banner -sets the consent to FALSE, shows the $message and does not fires analytics`, () => {
      const $cookieBanner = document.querySelector('[data-module="cookie-banner"]');
      if ($cookieBanner) {
        cookies.initCookieBanner($cookieBanner);
      };

      document.querySelector("button[data-accept-cookies=false]").click();

      const consentCookie = cookies.getCookie(cookies.cookieName);
      const consentCookieJson = JSON.parse(consentCookie);
      const $message = document.querySelector(".cookie-banner__confirmation");

      expect(consentCookieJson.analytics).toEqual(false);
      expect($message.style.display).toEqual("block");
      expect($message.textContent).toContain('You told us not to use analytics cookies');
      expect(cookies.initAnalytics).toHaveBeenCalledTimes(0);
    });
  });

  describe("confirmation mesage", () => {
    it(`hide button works`, () => {
      const $cookieBanner = document.querySelector('[data-module="cookie-banner"]');
      if ($cookieBanner) {
        cookies.initCookieBanner($cookieBanner);
      };

      document.querySelector("button[data-accept-cookies=true]").click();
      const $message = document.querySelector(".cookie-banner__confirmation");

      expect($message.style.display).toEqual("block");

      $message.querySelector(".cookie-banner__hide-button").click();
      expect($cookieBanner.style.display).toEqual("none");
    });
  });

  describe("functions", () => {
    it(`cookie banner javascript does not run if cookie banner isn't present`, () => {
      document.body.innerHTML = '';
      cookies.showCookieBanner = jest.fn()
      const $cookieBanner = document.querySelector('[data-module="cookie-banner"]');
      if ($cookieBanner) {
        cookies.initCookieBanner($cookieBanner);
      };

      expect(cookies.showCookieBanner).toHaveBeenCalledTimes(0);
    });

    it(`gtm script tag is added to the document head and dataLayer populated`, () => {
      global.dataLayer = [];
      cookies.setCookie(cookies.cookieName, JSON.stringify({ 'analytics': true }), {days: cookies.cookieDuration});
      document.documentElement.firstChild.appendChild(document.createElement("script"));
      cookies.loadGtmScript();
      cookies.setupGtm();
      expect(document.documentElement.innerHTML).toContain(`https://www.googletagmanager.com/gtag/js?id=${cookies.trackingId}`);
      expect(global.dataLayer[1]).toContain(cookies.trackingId);
    });

    it(`string is stripped of email address`, () => {
      const input = '/users/test.user@test.com';
      const result = cookies.PIIfy(input)
      expect(result).toBe('/users/[email]');
    });

    it(`string is stripped of uuid`, () => {
      const input = '/organisations/2b6275d6-6c39-484d-b6e1-71a05b3fab65';
      const result = cookies.PIIfy(input)
      expect(result).toBe('/organisations/…');
    });
  });

});
