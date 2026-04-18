// Returns distance in km between two [lng, lat] coordinate pairs
function haversine(coord1, coord2) {
  const R = 6371
  const [lng1, lat1] = coord1
  const [lng2, lat2] = coord2
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

module.exports = haversine
