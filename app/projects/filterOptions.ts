/** Room filter values mirrored from the Projects collection `room` select. */
export const ROOM_OPTIONS = [
  { value: "living-room", label: "Living Room" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "bedroom", label: "Bedroom" },
  { value: "office", label: "Office" },
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "hotel", label: "Hotel" },
  { value: "outdoor", label: "Outdoor" },
  { value: "feature-wall", label: "Feature Wall" },
  { value: "fireplace", label: "Fireplace" },
  { value: "prayer-room", label: "Prayer Room" },
  { value: "basement", label: "Basement" },
] as const;

export const PROJECT_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
] as const;
