// ==============================================================================
// AgriSage AI: Weather Service (Open-Meteo Verified Meteorological Integration)
// ==============================================================================

import { WeatherReport, DailyForecast } from '../../shared/types/index.js';
import { findLocationCoords } from '../../shared/agriculture.js';

// WMO Weather Interpretation Codes (WW)
const WMO_WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog and depositing rime fog',
  48: 'Depositing rime fog',
  51: 'Drizzle: Light intensity',
  53: 'Drizzle: Moderate intensity',
  55: 'Drizzle: Dense intensity',
  61: 'Rain: Slight intensity',
  63: 'Rain: Moderate intensity',
  65: 'Rain: Heavy intensity',
  71: 'Snow fall: Slight',
  73: 'Snow fall: Moderate',
  75: 'Snow fall: Heavy',
  80: 'Rain showers: Slight',
  81: 'Rain showers: Moderate',
  82: 'Rain showers: Violent',
  95: 'Thunderstorm: Slight or moderate',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export class WeatherService {
  /**
   * Fetch current weather and 5-day forecast for a given Indian location
   */
  async getWeather(params: {
    state?: string | null;
    district?: string | null;
    lat?: number | null;
    lon?: number | null;
  }): Promise<WeatherReport | null> {
    try {
      let lat = params.lat;
      let lon = params.lon;
      let locationName = '';

      if (lat && lon) {
        locationName = `${params.district || 'Farm Location'}, ${params.state || 'India'}`;
      } else {
        const coords = findLocationCoords(params.state, params.district);
        lat = coords.lat;
        lon = coords.lon;
        locationName = coords.locationName;
      }

      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', lat.toFixed(4));
      url.searchParams.set('longitude', lon.toFixed(4));
      url.searchParams.set(
        'current',
        'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m'
      );
      url.searchParams.set(
        'daily',
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
      );
      url.searchParams.set('timezone', 'Asia/Kolkata');
      url.searchParams.set('forecast_days', '5');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AgriSage-AI-Crop-Advisory/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[WeatherService] Open-Meteo returned status ${response.status}`);
        return null;
      }

      const data = (await response.json()) as any;
      const current = data.current;
      const daily = data.daily;

      if (!current) {
        return null;
      }

      const weatherCode = current.weather_code ?? 0;
      const weatherDescription = WMO_WEATHER_CODES[weatherCode] || 'Clear sky';

      const dailyForecasts: DailyForecast[] = [];
      if (daily && daily.time && Array.isArray(daily.time)) {
        for (let i = 0; i < daily.time.length; i++) {
          const code = daily.weather_code?.[i] ?? 0;
          dailyForecasts.push({
            date: daily.time[i],
            maxTemp: Math.round(daily.temperature_2m_max?.[i] ?? 0),
            minTemp: Math.round(daily.temperature_2m_min?.[i] ?? 0),
            precipitationProbability: daily.precipitation_probability_max?.[i] ?? 0,
            weatherCode: code,
            weatherDescription: WMO_WEATHER_CODES[code] || 'Partly cloudy',
          });
        }
      }

      return {
        locationName,
        state: params.state || undefined,
        district: params.district || undefined,
        observationTime: current.time || new Date().toISOString(),
        temperature: Math.round(current.temperature_2m ?? 28),
        apparentTemperature: Math.round(current.apparent_temperature ?? 29),
        humidity: current.relative_humidity_2m ?? 65,
        precipitation: current.precipitation ?? 0,
        windSpeed: Math.round(current.wind_speed_10m ?? 10),
        weatherCode,
        weatherDescription,
        isForecast: false,
        dailyForecasts,
        providerAttribution: 'Open-Meteo Meteorological Data (Verified Provider)',
        dataFreshness: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      };
    } catch (err: any) {
      console.warn(`[WeatherService] Could not retrieve live weather: ${err.message}. Gracefully degrading.`);
      return null;
    }
  }
}

export const weatherService = new WeatherService();
