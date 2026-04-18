const TRANSPORT_RATES = {
  mini_truck: { base: 80,  perKm: 12 },
  tempo:      { base: 110, perKm: 16 },
  truck_407:  { base: 160, perKm: 22 },
  truck_1ton: { base: 220, perKm: 30 },
  truck_2ton: { base: 300, perKm: 40 },
  heavy:      { base: 500, perKm: 60 }
}

const HAMALI_RATES = {
  solo:  { base: 180, perHr: 70 },   // teamSize === 1
  small: { base: 320, perHr: 130 },  // teamSize 2-4
  large: { base: 550, perHr: 220 }   // teamSize 5+
}

function calculateFare({ bookingType, vehicleType, distanceKm,
                          teamSize, estimatedHours, floorNumber,
                          heavyGoods, returnLoad }) {
  let baseFare = 0, distanceFare = 0, hourlyFare = 0
  let floorSurcharge = 0, heavySurcharge = 0, returnLoadDiscount = 0

  if (bookingType === 'transport') {
    const rates = TRANSPORT_RATES[vehicleType]
    if (!rates) throw new Error('Invalid vehicle type')
    baseFare = rates.base
    distanceFare = rates.perKm * (distanceKm || 0)
  } else {
    // hamali
    let rates
    if (teamSize === 1) rates = HAMALI_RATES.solo
    else if (teamSize <= 4) rates = HAMALI_RATES.small
    else rates = HAMALI_RATES.large
    baseFare = rates.base
    const extraHours = Math.max(0, (estimatedHours || 1) - 1)
    hourlyFare = rates.perHr * extraHours

    if (floorNumber > 0) floorSurcharge = 40 * floorNumber
    if (heavyGoods) heavySurcharge = Math.round((baseFare + hourlyFare) * 0.25)
  }

  const subtotalBeforeDiscount = baseFare + distanceFare + hourlyFare + floorSurcharge + heavySurcharge

  if (returnLoad) returnLoadDiscount = Math.round(subtotalBeforeDiscount * 0.15)

  const subtotal = subtotalBeforeDiscount - returnLoadDiscount
  const gst = Math.round(subtotal * 0.18)
  const total = subtotal + gst

  return {
    baseFare, distanceFare, hourlyFare,
    floorSurcharge, heavySurcharge, returnLoadDiscount,
    subtotal, gst, total
  }
}

module.exports = { calculateFare, TRANSPORT_RATES, HAMALI_RATES }
