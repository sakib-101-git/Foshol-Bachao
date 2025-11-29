// Weather routes - fetch weather data for upazilas
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Load mock weather data
const mockWeatherPath = path.join(__dirname, '../db/mockWeather.json');
const mockWeather = JSON.parse(fs.readFileSync(mockWeatherPath, 'utf8'));

// Load locations for lat/lon lookup
const locationsPath = path.join(__dirname, '../db/locations.json');
const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

/**
 * Find coordinates by name - searches divisions, districts, and upazilas
 */
function findLocationCoords(locationName) {
  const searchName = locationName.toLowerCase();
  
  // First check divisions (e.g., "Rajshahi", "Dhaka")
  for (const division of locations.divisions) {
    if (division.name.toLowerCase() === searchName || division.nameBn === locationName) {
      return { lat: division.lat, lon: division.lon };
    }
  }
  
  // Then check districts
  for (const division of locations.divisions) {
    for (const district of division.districts) {
      if (district.name.toLowerCase() === searchName || district.nameBn === locationName) {
        // Use first upazila's coords for district
        if (district.upazilas && district.upazilas.length > 0) {
          return { lat: district.upazilas[0].lat, lon: district.upazilas[0].lon };
        }
      }
    }
  }
  
  // Finally check upazilas
  for (const division of locations.divisions) {
    for (const district of division.districts) {
      for (const upazila of district.upazilas) {
        if (upazila.name.toLowerCase() === searchName || upazila.nameBn === locationName) {
          return { lat: upazila.lat, lon: upazila.lon };
        }
      }
    }
  }
  
  return null;
}

/**
 * Generate Bangla weather advisories based on conditions
 */
function generateAdvisories(forecast, language = 'bn') {
  const advisories = [];
  
  // Check for high rain probability in next 3 days
  const next3Days = forecast.slice(0, 3);
  const maxRain = Math.max(...next3Days.map(d => d.rainProbability || 0));
  
  if (maxRain >= 70) {
    advisories.push({
      type: 'rain-warning',
      priority: 'high',
      message: language === 'bn'
        ? `আগামী ৩ দিন বৃষ্টি ${maxRain}% → আজই ধান কাটুন অথবা ঢেকে রাখুন।`
        : `Rain ${maxRain}% likely in next 3 days → Harvest today or cover crops.`,
      icon: '🌧️'
    });
  }
  
  // Check for high humidity + high temp
  const current = forecast[0] || {};
  if (current.humidity >= 80 && current.temp >= 30) {
    advisories.push({
      type: 'humidity-warning',
      priority: 'high',
      message: language === 'bn'
        ? 'উচ্চ আর্দ্রতা ও তাপমাত্রা → তাৎক্ষণিকভাবে ভেন্টিলেশন/শুকানোর ব্যবস্থা নিন।'
        : 'High humidity & temperature → Ensure ventilation/drying immediately.',
      icon: '💨'
    });
  }
  
  // Good drying conditions
  if (current.humidity < 65 && current.temp >= 25 && current.temp <= 32 && maxRain < 30) {
    advisories.push({
      type: 'good-conditions',
      priority: 'low',
      message: language === 'bn'
        ? 'ভালো আবহাওয়া → ফসল শুকানোর উপযুক্ত সময়।'
        : 'Good weather → Ideal time for drying crops.',
      icon: '☀️'
    });
  }
  
  // Default advisory if none
  if (advisories.length === 0) {
    advisories.push({
      type: 'normal',
      priority: 'low',
      message: language === 'bn'
        ? 'স্বাভাবিক আবহাওয়া → নিয়মিত পর্যবেক্ষণ চালিয়ে যান।'
        : 'Normal conditions → Continue regular monitoring.',
      icon: '✅'
    });
  }
  
  return advisories;
}

module.exports = function(db) {
  
  /**
   * GET /api/weather
   * Get weather for an upazila
   * Query params: upazila, lang (bn/en)
   */
  router.get('/', async (req, res) => {
    try {
      const { upazila, lang = 'bn' } = req.query;
      
      if (!upazila) {
        return res.status(400).json({ 
          error: 'Upazila parameter required',
          errorBn: 'উপজেলা পরামিতি প্রয়োজন'
        });
      }
      
      const coords = findLocationCoords(upazila);
      const apiKey = process.env.OPENWEATHER_API_KEY;
      
      // If we have a valid API key and coordinates, fetch real data
      if (apiKey && apiKey !== 'demo' && coords) {
        try {
          // Fetch CURRENT weather (real-time) and FORECAST (5-day) in parallel
          const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;
          
          const [currentResponse, forecastResponse] = await Promise.all([
            axios.get(currentUrl, { timeout: 5000 }),
            axios.get(forecastUrl, { timeout: 5000 })
          ]);
          
          // Get REAL-TIME current weather
          const currentData = currentResponse.data;
          const current = {
            temp: Math.round(currentData.main.temp),
            humidity: currentData.main.humidity,
            feelsLike: Math.round(currentData.main.feels_like),
            description: currentData.weather[0]?.description || 'Clear',
            windSpeed: currentData.wind?.speed || 0,
            rainProbability: 0 // Current weather doesn't have probability
          };
          
          // Transform forecast response to our format
          const forecast = [];
          const dailyData = {};
          
          forecastResponse.data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyData[date]) {
              dailyData[date] = {
                temps: [],
                humidity: [],
                rain: []
              };
            }
            dailyData[date].temps.push(item.main.temp);
            dailyData[date].humidity.push(item.main.humidity);
            dailyData[date].rain.push(item.pop * 100);
          });
          
          let dayCount = 0;
          for (const [date, data] of Object.entries(dailyData)) {
            if (dayCount >= 5) break;
            forecast.push({
              day: dayCount + 1,
              date,
              temp: Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length),
              humidity: Math.round(data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length),
              rainProbability: Math.round(Math.max(...data.rain)),
              description: 'From API'
            });
            dayCount++;
          }
          
          // Use real-time current for advisories
          const advisoryData = [{ ...current, rainProbability: forecast[0]?.rainProbability || 0 }, ...forecast.slice(1)];
          const advisories = generateAdvisories(advisoryData, lang);
          
          return res.json({
            upazila,
            source: 'openweathermap',
            current,
            forecast,
            advisories,
            labels: {
              temp: lang === 'bn' ? 'তাপমাত্রা' : 'Temperature',
              humidity: lang === 'bn' ? 'আর্দ্রতা' : 'Humidity',
              rain: lang === 'bn' ? 'বৃষ্টির সম্ভাবনা' : 'Rain Probability'
            }
          });
          
        } catch (apiErr) {
          console.log('API fetch failed, using mock data:', apiErr.message);
        }
      }
      
      // Fallback to mock data
      const weatherData = mockWeather.default;
      const advisories = generateAdvisories(weatherData.forecast, lang);
      
      res.json({
        upazila,
        source: 'mock',
        current: weatherData.current,
        forecast: weatherData.forecast,
        advisories,
        labels: {
          temp: lang === 'bn' ? 'তাপমাত্রা' : 'Temperature',
          humidity: lang === 'bn' ? 'আর্দ্রতা' : 'Humidity',
          rain: lang === 'bn' ? 'বৃষ্টির সম্ভাবনা' : 'Rain Probability'
        }
      });
      
    } catch (err) {
      console.error('Weather error:', err);
      res.status(500).json({ error: 'Failed to fetch weather' });
    }
  });
  
  /**
   * GET /api/locations
   * Get all locations (divisions, districts, upazilas)
   */
  router.get('/locations', (req, res) => {
    res.json(locations);
  });
  
  return router;
};

