(function() {
  'use strict';

  var WIDGET_VERSION = '1.0.0';
  var API_BASE = '';
  var API_KEY = '';
  var WIDGET_CONFIG = null;

  function CryptoEatsWidget(options) {
    if (!options || !options.apiKey) {
      console.error('[CryptoEats] API key is required. Get one at /developers');
      return;
    }

    API_KEY = options.apiKey;
    API_BASE = options.apiBase || window.location.origin;

    var container = document.querySelector(options.container || '.cryptoeats-delivery');
    if (!container) {
      console.error('[CryptoEats] Container element not found:', options.container || '.cryptoeats-delivery');
      return;
    }

    this.container = container;
    this.options = options;
    this.init();
  }

  CryptoEatsWidget.prototype.init = function() {
    var self = this;
    this.container.innerHTML = '<div class="ce-widget-loading" style="text-align:center;padding:40px;font-family:-apple-system,sans-serif;color:#999;">Loading CryptoEats...</div>';

    this.fetchConfig().then(function(config) {
      WIDGET_CONFIG = config;
      self.render(config);
    }).catch(function(err) {
      self.container.innerHTML = '<div style="text-align:center;padding:40px;color:#f44;font-family:sans-serif;">Failed to load CryptoEats widget. Check your API key.</div>';
      console.error('[CryptoEats]', err);
    });
  };

  CryptoEatsWidget.prototype.fetchConfig = function() {
    return fetch(API_BASE + '/api/v1/widget/config', {
      headers: { 'X-API-Key': API_KEY }
    }).then(function(r) {
      if (!r.ok) throw new Error('API error: ' + r.status);
      return r.json();
    });
  };

  CryptoEatsWidget.prototype.render = function(config) {
    var primary = config.primaryColor || '#FF6B00';
    var secondary = config.secondaryColor || '#1A1A2E';
    var accent = config.accentColor || '#00D4AA';
    var brand = config.brandName || 'CryptoEats';

    var html = '<div class="ce-widget" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:' + secondary + ';border-radius:16px;overflow:hidden;color:#fff;max-width:480px;margin:0 auto;">';

    html += '<div class="ce-header" style="background:linear-gradient(135deg,' + primary + ',' + accent + ');padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">';
    if (config.logoUrl) {
      html += '<img src="' + config.logoUrl + '" alt="' + brand + '" style="height:32px;" />';
    } else {
      html += '<span style="font-size:20px;font-weight:700;">' + brand + '</span>';
    }
    html += '<span style="font-size:13px;opacity:0.8;">Order Delivery</span>';
    html += '</div>';

    if (config.restaurants && config.restaurants.length > 0) {
      html += '<div class="ce-restaurants" style="padding:16px;">';
      html += '<div style="font-size:14px;font-weight:600;margin-bottom:12px;color:#ccc;">Featured Restaurants</div>';

      config.restaurants.forEach(function(r) {
        html += '<div class="ce-restaurant" style="display:flex;align-items:center;padding:12px;margin-bottom:8px;background:rgba(255,255,255,0.05);border-radius:12px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.05)\'">';
        if (r.imageUrl) {
          html += '<img src="' + r.imageUrl + '" style="width:48px;height:48px;border-radius:8px;object-fit:cover;margin-right:12px;" />';
        }
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:600;font-size:14px;">' + r.name + '</div>';
        html += '<div style="font-size:12px;color:#999;margin-top:2px;">' + r.cuisineType + ' &middot; $' + r.deliveryFee + ' delivery</div>';
        html += '</div>';
        html += '<div style="text-align:right;">';
        html += '<div style="font-size:13px;color:' + accent + ';">' + (r.rating || '4.5') + ' ★</div>';
        html += '</div>';
        html += '</div>';
      });

      html += '</div>';
    }

    html += '<div style="padding:16px;text-align:center;">';
    html += '<a href="' + API_BASE + '" target="_blank" style="display:inline-block;background:' + primary + ';color:#fff;padding:12px 32px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;">Order Now</a>';
    html += '</div>';

    html += '<div style="padding:8px 16px 12px;text-align:center;font-size:11px;color:#666;">Powered by ' + brand + ' v' + WIDGET_VERSION + '</div>';
    html += '</div>';

    this.container.innerHTML = html;
  };

  if (typeof window !== 'undefined') {
    window.CryptoEatsWidget = CryptoEatsWidget;
  }
})();
