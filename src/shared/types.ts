import z from "zod";

export const CitySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type City = z.infer<typeof CitySchema>;

export const RouteSchema = z.object({
  id: z.number(),
  from_city_id: z.number(),
  to_city_id: z.number(),
  distance: z.number(),
  mode: z.enum(["CAR", "BUS", "METRO", "WALK"]),
  time_minutes: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Route = z.infer<typeof RouteSchema>;

export const RouteWithCitiesSchema = RouteSchema.extend({
  from_city: z.string(),
  to_city: z.string(),
});

export type RouteWithCities = z.infer<typeof RouteWithCitiesSchema>;

export const CreateRouteSchema = z.object({
  from_city: z.string(),
  to_city: z.string(),
  distance: z.number().positive(),
  mode: z.enum(["CAR", "BUS", "METRO", "WALK"]),
});

export type CreateRoute = z.infer<typeof CreateRouteSchema>;

export const FindRouteSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export type FindRoute = z.infer<typeof FindRouteSchema>;

export const PathResultSchema = z.object({
  path: z.array(CitySchema),
  totalDistance: z.number(),
  totalTime: z.number(),
  routes: z.array(RouteWithCitiesSchema),
  estimatedCost: z.number().optional(),
  co2Emissions: z.number().optional(),
});

export type PathResult = z.infer<typeof PathResultSchema>;

export const StatisticsSchema = z.object({
  totalRoutes: z.number(),
  totalCities: z.number(),
  transportModeDistribution: z.array(z.object({
    mode: z.string(),
    count: z.number(),
  })),
  averageDistance: z.number(),
  totalDistanceCovered: z.number(),
  mostConnectedCities: z.array(z.object({
    city: z.string(),
    connections: z.number(),
  })),
});

export type Statistics = z.infer<typeof StatisticsSchema>;
