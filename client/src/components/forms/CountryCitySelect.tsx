import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CountryCitySelectProps {
  selectedCountry: string;
  selectedCity: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
}

// Country data with their respective cities
const countryData: Record<string, string[]> = {
  "United States": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", 
    "San Antonio", "San Diego", "Dallas", "San Jose", "Boston", "Austin", 
    "Seattle", "Denver", "San Francisco", "Washington DC"
  ],
  "United Kingdom": [
    "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", 
    "Sheffield", "Edinburgh", "Bristol", "Cardiff", "Belfast", "Newcastle", 
    "Leicester", "Aberdeen", "Cambridge", "Oxford"
  ],
  "Germany": [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", 
    "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", 
    "Hannover", "Nuremberg", "Duisburg", "Heidelberg"
  ],
  "France": [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", 
    "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", 
    "Saint-Étienne", "Toulon", "Le Havre", "Grenoble"
  ],
  "Japan": [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Kobe", 
    "Kyoto", "Fukuoka", "Kawasaki", "Saitama", "Hiroshima", "Sendai", 
    "Chiba", "Kitakyushu", "Sakai", "Niigata"
  ],
  "Canada": [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", 
    "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Victoria", 
    "Halifax", "Oshawa", "Windsor", "Saskatoon"
  ],
  "Australia": [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", 
    "Canberra", "Newcastle", "Wollongong", "Logan City", "Geelong", "Hobart", 
    "Townsville", "Cairns", "Darwin", "Toowoomba"
  ],
  "China": [
    "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Tianjin", "Chongqing", 
    "Wuhan", "Chengdu", "Nanjing", "Xi'an", "Hangzhou", "Shenyang", 
    "Harbin", "Jinan", "Zhengzhou", "Qingdao"
  ],
  "India": [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", 
    "Ahmedabad", "Pune", "Surat", "Jaipur", "Lucknow", "Kanpur", 
    "Nagpur", "Indore", "Thane", "Bhopal"
  ],
  "Switzerland": [
    "Zurich", "Geneva", "Basel", "Lausanne", "Bern", "Winterthur", 
    "Lucerne", "St. Gallen", "Lugano", "Biel", "Thun", "Köniz", 
    "La Chaux-de-Fonds", "Fribourg", "Schaffhausen", "Vernier"
  ]
};

const CountryCitySelect: React.FC<CountryCitySelectProps> = ({
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange
}) => {
  // List of cities based on selected country
  const [cities, setCities] = useState<string[]>([]);

  // When country changes, update cities list and reset selected city if it's not in the new list
  useEffect(() => {
    if (selectedCountry && countryData[selectedCountry]) {
      setCities(countryData[selectedCountry]);
      
      // If the currently selected city is not in the new country's cities, reset it
      if (selectedCity && !countryData[selectedCountry].includes(selectedCity)) {
        onCityChange('');
      }
    } else {
      setCities([]);
      onCityChange('');
    }
  }, [selectedCountry, selectedCity, onCityChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Country Select */}
        <FormItem>
          <FormLabel>Country</FormLabel>
          <Select
            value={selectedCountry}
            onValueChange={onCountryChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.keys(countryData).map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>

        {/* City Select */}
        <FormItem>
          <FormLabel>City</FormLabel>
          <Select
            value={selectedCity}
            onValueChange={onCityChange}
            disabled={!selectedCountry || cities.length === 0}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </div>
    </div>
  );
};

export default CountryCitySelect;