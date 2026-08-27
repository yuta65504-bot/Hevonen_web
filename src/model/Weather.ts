export enum Weather {
  SUNNY = "SUNNY",
  RAINY = "RAINY",
  WINDY = "WINDY",
}

export function randomWeather(): Weather {
  const values = Object.values(Weather);
  return values[Math.floor(Math.random() * values.length)];
}
