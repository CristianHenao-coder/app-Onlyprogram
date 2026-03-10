import * as geoip from 'geoip-lite';
const ip = '8.8.8.8';
const geo = geoip.lookup(ip);
console.log('Geo lookup for 8.8.8.8:', geo);
