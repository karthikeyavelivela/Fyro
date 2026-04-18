function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistance(origin, destination) {
  if (!origin || !destination) return 0;

  const earthRadiusKm = 6371;
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isWithinRadius(origin, destination, radiusKm) {
  return haversineDistance(origin, destination) <= radiusKm;
}

module.exports = {
  haversineDistance,
  isWithinRadius,
};
