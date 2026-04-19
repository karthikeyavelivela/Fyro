export const calculateTransportFare = (vehicleType: string, distanceKm: number) => {
  const rates: { [key: string]: { base: number, perKm: number } } = {
    mini_truck: { base: 80, perKm: 12 },
    tempo: { base: 110, perKm: 16 },
    truck_407: { base: 160, perKm: 22 },
    truck_1ton: { base: 220, perKm: 30 },
    truck_2ton: { base: 300, perKm: 40 },
    heavy: { base: 500, perKm: 60 },
  };

  const rate = rates[vehicleType] || rates.mini_truck;
  const baseFare = rate.base;
  const distanceFare = Math.round(distanceKm * rate.perKm);
  const subtotal = baseFare + distanceFare;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  return {
    baseFare,
    distanceFare,
    hourlyFare: 0,
    floorSurcharge: 0,
    heavySurcharge: 0,
    returnLoadDiscount: 0,
    subtotal,
    gst,
    total
  };
};

export const calculateHamaliFare = (teamSize: number, hours: number, floors: number, isHeavy: boolean) => {
  let base = 0;
  let perHour = 0;

  if (teamSize === 1) {
    base = 180;
    perHour = 70;
  } else if (teamSize >= 2 && teamSize <= 4) {
    base = 320;
    perHour = 130;
  } else if (teamSize >= 5) {
    base = 550;
    perHour = 220;
  }

  const baseFare = base;
  const hourlyFare = Math.round(hours * perHour);
  let subtotal = baseFare + hourlyFare;

  let heavySurcharge = 0;
  if (isHeavy) {
    heavySurcharge = Math.round(subtotal * 0.25);
    subtotal += heavySurcharge;
  }

  let floorSurcharge = 0;
  if (floors > 0) {
    floorSurcharge = floors * 40;
    subtotal += floorSurcharge;
  }

  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  return {
    baseFare,
    distanceFare: 0,
    hourlyFare,
    floorSurcharge,
    heavySurcharge,
    returnLoadDiscount: 0,
    subtotal,
    gst,
    total
  };
};
