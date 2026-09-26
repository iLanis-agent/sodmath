/* SodMath engine - honest sod math. UMD: browser global + Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SodMath = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var up = function (x) { return Math.ceil(x - 1e-9); };

  var ROLL_SQFT = 10;      // the classic 2x5 ft roll
  var PALLET_SQFT = 450;   // a full pallet

  // Straight edges waste 5%; curves and angles waste 10% in cut-offs.
  function wastePct(shape) {
    return shape === 'curved' ? 0.10 : 0.05;
  }

  function orderSqFt(grossSqFt, bedsSqFt, shape) {
    var raw = Math.max(0, grossSqFt - (bedsSqFt || 0)) * (1 + wastePct(shape));
    return Math.round(raw * 100) / 100; // 800 * 1.1 = 880.0000000000001 otherwise
  }

  function rolls(sqft) { return up(sqft / ROLL_SQFT); }
  function pallets(sqft) { return Math.max(1, up(sqft / PALLET_SQFT)); }

  // The pallet clock: sod is cut to order and dies stacked - 24 hours in heat, 48 cool.
  function palletHours(tempF) {
    return tempF >= 75 ? 24 : 48;
  }

  // Establishment water: half an inch a day for two weeks, 0.623 gal per sq ft per inch.
  function waterGallons(sqft) {
    return Math.round(sqft * 0.623 * 0.5 * 14);
  }

  function estimate(opts) {
    var gross = opts.grossSqFt;
    var beds = opts.bedsSqFt || 0;
    var shape = opts.shape || 'straight';
    var palletPrice = opts.palletPrice != null ? opts.palletPrice : 450;
    var delivery = opts.delivery != null ? opts.delivery : 80;

    var net = Math.max(0, gross - beds);
    var sqft = orderSqFt(gross, beds, shape);
    var p = pallets(sqft);
    var delivered = p * PALLET_SQFT;
    var leftover = Math.round((delivered - sqft) * 10) / 10;
    var cost = Math.round((p * palletPrice + delivery + 25) * 100) / 100; // + roller rental
    return {
      netSqFt: net, orderSqFt: Math.round(sqft * 10) / 10, wastePct: wastePct(shape),
      rolls: rolls(sqft), pallets: p, deliveredSqFt: delivered, leftoverSqFt: leftover,
      waterGallons: waterGallons(net), total: cost
    };
  }

  function advice(est, tempF) {
    var clock = palletHours(tempF || 70);
    if (est.pallets >= 3) {
      return 'This is a ' + clock + '-hour clock starting at the farm, not at delivery - three-plus pallets means staging: have the ground raked, the crew ready, and the first pallet laid before the truck leaves.';
    }
    if (est.leftoverSqFt > 100) {
      return 'Pallet rounding leaves you ' + est.leftoverSqFt + ' sq ft extra - use it on the worst bare spot in the old lawn, not the trash. Sod keeps a week if you unroll it in shade.';
    }
    return 'Lay it the day it arrives, stagger the seams like brick, and roll it once flat. The pallet clock runs about ' + clock + ' hours at your forecast - dead sod is not returnable.';
  }

  return {
    ROLL_SQFT: ROLL_SQFT, PALLET_SQFT: PALLET_SQFT,
    wastePct: wastePct, orderSqFt: orderSqFt, rolls: rolls, pallets: pallets,
    palletHours: palletHours, waterGallons: waterGallons,
    estimate: estimate, advice: advice
  };
});
