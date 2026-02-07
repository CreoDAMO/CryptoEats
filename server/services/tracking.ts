interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  orderId?: string;
}

interface ETAResult {
  durationMinutes: number;
  distanceKm: number;
  polyline?: string;
}

const activeDriverLocations = new Map<string, DriverLocation>();
const orderDriverMap = new Map<string, string>();

export function updateDriverLocation(driverId: string, location: DriverLocation) {
  activeDriverLocations.set(driverId, {
    ...location,
    timestamp: Date.now(),
  });

  if (location.orderId) {
    orderDriverMap.set(location.orderId, driverId);
  }
}

export function getDriverLocation(driverId: string): DriverLocation | null {
  const loc = activeDriverLocations.get(driverId);
  if (!loc) return null;

  if (Date.now() - loc.timestamp > 5 * 60 * 1000) {
    activeDriverLocations.delete(driverId);
    return null;
  }

  return loc;
}

export function getOrderDriverLocation(orderId: string): DriverLocation | null {
  const driverId = orderDriverMap.get(orderId);
  if (!driverId) return null;
  return getDriverLocation(driverId);
}

export function removeDriverTracking(driverId: string) {
  activeDriverLocations.delete(driverId);
  for (const [orderId, did] of orderDriverMap.entries()) {
    if (did === driverId) orderDriverMap.delete(orderId);
  }
}

export function assignDriverToOrder(orderId: string, driverId: string) {
  orderDriverMap.set(orderId, driverId);
}

export function getActiveDriverCount(): number {
  return activeDriverLocations.size;
}

export function getAllActiveDrivers(): Array<{ driverId: string; location: DriverLocation }> {
  const result: Array<{ driverId: string; location: DriverLocation }> = [];
  for (const [driverId, location] of activeDriverLocations.entries()) {
    if (Date.now() - location.timestamp < 5 * 60 * 1000) {
      result.push({ driverId, location });
    }
  }
  return result;
}

export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateETA(distanceKm: number): number {
  const avgSpeedKmh = 30;
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
}

export async function getDirectionsETA(
  originLat: number, originLng: number,
  destLat: number, destLng: number
): Promise<ETAResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.status === "OK" && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        return {
          durationMinutes: Math.ceil(leg.duration.value / 60),
          distanceKm: leg.distance.value / 1000,
          polyline: route.overview_polyline?.points,
        };
      }
    } catch (err) {
      console.warn("[Tracking] Google Maps API error, falling back to estimate:", err);
    }
  }

  const distance = calculateDistance(originLat, originLng, destLat, destLng);
  return {
    durationMinutes: estimateETA(distance),
    distanceKm: distance,
  };
}

export function setupTrackingSocket(io: any) {
  io.on("connection", (socket: any) => {
    socket.on("driver:location", (data: { driverId: string; lat: number; lng: number; heading?: number; speed?: number; orderId?: string }) => {
      updateDriverLocation(data.driverId, {
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
        speed: data.speed,
        timestamp: Date.now(),
        orderId: data.orderId,
      });

      if (data.orderId) {
        io.to(`order:${data.orderId}`).emit("driver:location:update", {
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
          speed: data.speed,
        });
      }
    });

    socket.on("track:order", (data: { orderId: string }) => {
      socket.join(`order:${data.orderId}`);
      const location = getOrderDriverLocation(data.orderId);
      if (location) {
        socket.emit("driver:location:update", {
          lat: location.lat,
          lng: location.lng,
          heading: location.heading,
          speed: location.speed,
        });
      }
    });

    socket.on("driver:online", (data: { driverId: string; lat: number; lng: number }) => {
      updateDriverLocation(data.driverId, {
        lat: data.lat,
        lng: data.lng,
        timestamp: Date.now(),
      });
      socket.join(`driver:${data.driverId}`);
    });

    socket.on("driver:offline", (data: { driverId: string }) => {
      removeDriverTracking(data.driverId);
    });
  });
}
