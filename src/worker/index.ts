import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateRouteSchema, FindRouteSchema } from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// Calculate time based on distance and mode
function calculateTime(distance: number, mode: string): number {
  const speeds: Record<string, number> = {
    BUS: 60,
    METRO: 80,
    WALK: 5,
    CAR: 90,
  };
  const speed = speeds[mode] || 90;
  return (distance / speed) * 60;
}

// Calculate cost based on distance and mode
function calculateCost(distance: number, mode: string): number {
  const costs: Record<string, number> = {
    CAR: 0.5, // AED per km (fuel cost)
    BUS: 0.15, // AED per km (ticket price)
    METRO: 0.2, // AED per km (ticket price)
    WALK: 0, // Free
  };
  return (costs[mode] || 0.5) * distance;
}

// Calculate CO2 emissions based on distance and mode (kg CO2)
function calculateCO2(distance: number, mode: string): number {
  const emissions: Record<string, number> = {
    CAR: 0.171, // kg CO2 per km
    BUS: 0.089, // kg CO2 per km
    METRO: 0.041, // kg CO2 per km
    WALK: 0, // Zero emissions
  };
  return (emissions[mode] || 0.171) * distance;
}

// Get all cities
app.get("/api/cities", async (c) => {
  const cities = await c.env.DB.prepare("SELECT * FROM cities ORDER BY name").all();
  return c.json(cities.results);
});

// Get all routes
app.get("/api/routes", async (c) => {
  const routes = await c.env.DB.prepare(`
    SELECT 
      r.*,
      c1.name as from_city,
      c2.name as to_city
    FROM routes r
    JOIN cities c1 ON r.from_city_id = c1.id
    JOIN cities c2 ON r.to_city_id = c2.id
    ORDER BY r.created_at DESC
  `).all();
  return c.json(routes.results);
});

// Get statistics
app.get("/api/statistics", async (c) => {
  const routes = await c.env.DB.prepare("SELECT * FROM routes").all();
  const cities = await c.env.DB.prepare("SELECT * FROM cities").all();
  
  // Transport mode distribution
  const modeCount: Record<string, number> = {};
  let totalDistance = 0;
  
  for (const route of routes.results as any[]) {
    modeCount[route.mode] = (modeCount[route.mode] || 0) + 1;
    totalDistance += route.distance;
  }
  
  const transportModeDistribution = Object.entries(modeCount).map(([mode, count]) => ({
    mode,
    count,
  }));
  
  // Most connected cities
  const cityConnections: Record<number, { name: string; count: number }> = {};
  
  for (const route of routes.results as any[]) {
    if (!cityConnections[route.from_city_id]) {
      const city = cities.results.find((c: any) => c.id === route.from_city_id) as any;
      cityConnections[route.from_city_id] = { name: city?.name || '', count: 0 };
    }
    if (!cityConnections[route.to_city_id]) {
      const city = cities.results.find((c: any) => c.id === route.to_city_id) as any;
      cityConnections[route.to_city_id] = { name: city?.name || '', count: 0 };
    }
    
    cityConnections[route.from_city_id].count++;
    cityConnections[route.to_city_id].count++;
  }
  
  const mostConnectedCities = Object.values(cityConnections)
    .map(({ name, count }) => ({ city: name, connections: count }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 5);
  
  return c.json({
    totalRoutes: routes.results.length,
    totalCities: cities.results.length,
    transportModeDistribution,
    averageDistance: routes.results.length > 0 ? totalDistance / routes.results.length : 0,
    totalDistanceCovered: totalDistance,
    mostConnectedCities,
  });
});

// Add a new route
app.post("/api/routes", zValidator("json", CreateRouteSchema), async (c) => {
  const data = c.req.valid("json");
  
  // Get city IDs
  const fromCity = await c.env.DB.prepare("SELECT id FROM cities WHERE name = ?").bind(data.from_city).first();
  const toCity = await c.env.DB.prepare("SELECT id FROM cities WHERE name = ?").bind(data.to_city).first();
  
  if (!fromCity || !toCity) {
    return c.json({ error: "Invalid city name" }, 400);
  }
  
  const timeMinutes = calculateTime(data.distance, data.mode);
  
  await c.env.DB.prepare(`
    INSERT INTO routes (from_city_id, to_city_id, distance, mode, time_minutes)
    VALUES (?, ?, ?, ?, ?)
  `).bind(fromCity.id, toCity.id, data.distance, data.mode, timeMinutes).run();
  
  return c.json({ success: true });
});

// Find shortest path using Dijkstra's algorithm
app.post("/api/find-route", zValidator("json", FindRouteSchema), async (c) => {
  const { from, to } = c.req.valid("json");
  
  // Get all cities and routes
  const cities = await c.env.DB.prepare("SELECT * FROM cities").all();
  const routes = await c.env.DB.prepare(`
    SELECT 
      r.*,
      c1.name as from_city,
      c2.name as to_city
    FROM routes r
    JOIN cities c1 ON r.from_city_id = c1.id
    JOIN cities c2 ON r.to_city_id = c2.id
  `).all();
  
  const cityMap = new Map(cities.results.map((c: any) => [c.name, c]));
  const startCity = cityMap.get(from);
  const endCity = cityMap.get(to);
  
  if (!startCity || !endCity) {
    return c.json({ error: "Invalid city name" }, 400);
  }
  
  // Build adjacency list
  const graph = new Map<number, Array<{ cityId: number, distance: number, time: number, route: any }>>();
  
  for (const route of routes.results as any[]) {
    if (!graph.has(route.from_city_id)) graph.set(route.from_city_id, []);
    if (!graph.has(route.to_city_id)) graph.set(route.to_city_id, []);
    
    graph.get(route.from_city_id)!.push({
      cityId: route.to_city_id,
      distance: route.distance,
      time: route.time_minutes,
      route,
    });
    
    graph.get(route.to_city_id)!.push({
      cityId: route.from_city_id,
      distance: route.distance,
      time: route.time_minutes,
      route,
    });
  }
  
  // Dijkstra's algorithm
  const distances = new Map<number, number>();
  const previous = new Map<number, { cityId: number, route: any } | null>();
  const unvisited = new Set<number>();
  
  for (const city of cities.results as any[]) {
    distances.set(city.id, Infinity);
    previous.set(city.id, null);
    unvisited.add(city.id);
  }
  
  distances.set(startCity.id, 0);
  
  while (unvisited.size > 0) {
    let current: number | null = null;
    let minDist = Infinity;
    
    for (const cityId of unvisited) {
      const dist = distances.get(cityId)!;
      if (dist < minDist) {
        minDist = dist;
        current = cityId;
      }
    }
    
    if (current === null || minDist === Infinity) break;
    if (current === endCity.id) break;
    
    unvisited.delete(current);
    
    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.cityId)) continue;
      
      const newDist = distances.get(current)! + neighbor.distance;
      if (newDist < distances.get(neighbor.cityId)!) {
        distances.set(neighbor.cityId, newDist);
        previous.set(neighbor.cityId, { cityId: current, route: neighbor.route });
      }
    }
  }
  
  // Reconstruct path
  if (distances.get(endCity.id) === Infinity) {
    return c.json({ error: "No route found" }, 404);
  }
  
  const path: any[] = [];
  const routesUsed: any[] = [];
  let current: number | null = endCity.id;
  
  while (current !== null) {
    const city = cities.results.find((c: any) => c.id === current);
    path.unshift(city);
    
    const prev = previous.get(current);
    if (prev) {
      routesUsed.unshift(prev.route);
      current = prev.cityId;
    } else {
      current = null;
    }
  }
  
  const totalDistance = distances.get(endCity.id)!;
  const totalTime = routesUsed.reduce((sum, r) => sum + r.time_minutes, 0);
  const estimatedCost = routesUsed.reduce((sum, r) => sum + calculateCost(r.distance, r.mode), 0);
  const co2Emissions = routesUsed.reduce((sum, r) => sum + calculateCO2(r.distance, r.mode), 0);
  
  return c.json({
    path,
    totalDistance,
    totalTime,
    routes: routesUsed,
    estimatedCost,
    co2Emissions,
  });
});

// Compare all possible routes
app.post("/api/compare-routes", zValidator("json", FindRouteSchema), async (c) => {
  const { from, to } = c.req.valid("json");
  
  // Get all cities and routes
  const cities = await c.env.DB.prepare("SELECT * FROM cities").all();
  const routes = await c.env.DB.prepare(`
    SELECT 
      r.*,
      c1.name as from_city,
      c2.name as to_city
    FROM routes r
    JOIN cities c1 ON r.from_city_id = c1.id
    JOIN cities c2 ON r.to_city_id = c2.id
  `).all();
  
  const cityMap = new Map(cities.results.map((c: any) => [c.name, c]));
  const startCity = cityMap.get(from);
  const endCity = cityMap.get(to);
  
  if (!startCity || !endCity) {
    return c.json({ error: "Invalid city name" }, 400);
  }
  
  // Build adjacency list
  const graph = new Map<number, Array<{ cityId: number, distance: number, time: number, cost: number, co2: number, route: any }>>();
  
  for (const route of routes.results as any[]) {
    if (!graph.has(route.from_city_id)) graph.set(route.from_city_id, []);
    if (!graph.has(route.to_city_id)) graph.set(route.to_city_id, []);
    
    const cost = calculateCost(route.distance, route.mode);
    const co2 = calculateCO2(route.distance, route.mode);
    
    graph.get(route.from_city_id)!.push({
      cityId: route.to_city_id,
      distance: route.distance,
      time: route.time_minutes,
      cost,
      co2,
      route,
    });
    
    graph.get(route.to_city_id)!.push({
      cityId: route.from_city_id,
      distance: route.distance,
      time: route.time_minutes,
      cost,
      co2,
      route,
    });
  }
  
  // Find paths optimized for different criteria: time, cost, eco-friendly
  const optimizationCriteria = ['time', 'cost', 'co2'];
  const results = [];
  
  for (const criterion of optimizationCriteria) {
    const distances = new Map<number, number>();
    const previous = new Map<number, { cityId: number, route: any } | null>();
    const unvisited = new Set<number>();
    
    for (const city of cities.results as any[]) {
      distances.set(city.id, Infinity);
      previous.set(city.id, null);
      unvisited.add(city.id);
    }
    
    distances.set(startCity.id, 0);
    
    while (unvisited.size > 0) {
      let current: number | null = null;
      let minDist = Infinity;
      
      for (const cityId of unvisited) {
        const dist = distances.get(cityId)!;
        if (dist < minDist) {
          minDist = dist;
          current = cityId;
        }
      }
      
      if (current === null || minDist === Infinity) break;
      if (current === endCity.id) break;
      
      unvisited.delete(current);
      
      const neighbors = graph.get(current) || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.cityId)) continue;
        
        let weight = 0;
        if (criterion === 'time') weight = neighbor.time;
        else if (criterion === 'cost') weight = neighbor.cost;
        else if (criterion === 'co2') weight = neighbor.co2;
        
        const newDist = distances.get(current)! + weight;
        if (newDist < distances.get(neighbor.cityId)!) {
          distances.set(neighbor.cityId, newDist);
          previous.set(neighbor.cityId, { cityId: current, route: neighbor.route });
        }
      }
    }
    
    // Reconstruct path
    if (distances.get(endCity.id) === Infinity) continue;
    
    const path: any[] = [];
    const routesUsed: any[] = [];
    let current: number | null = endCity.id;
    
    while (current !== null) {
      const city = cities.results.find((c: any) => c.id === current);
      path.unshift(city);
      
      const prev = previous.get(current);
      if (prev) {
        routesUsed.unshift(prev.route);
        current = prev.cityId;
      } else {
        current = null;
      }
    }
    
    const totalDistance = routesUsed.reduce((sum, r) => sum + r.distance, 0);
    const totalTime = routesUsed.reduce((sum, r) => sum + r.time_minutes, 0);
    const estimatedCost = routesUsed.reduce((sum, r) => sum + calculateCost(r.distance, r.mode), 0);
    const co2Emissions = routesUsed.reduce((sum, r) => sum + calculateCO2(r.distance, r.mode), 0);
    
    results.push({
      path,
      totalDistance,
      totalTime,
      routes: routesUsed,
      estimatedCost,
      co2Emissions,
    });
  }
  
  return c.json(results);
});

export default app;
