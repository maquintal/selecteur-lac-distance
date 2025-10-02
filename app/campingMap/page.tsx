'use client';

import { useState } from 'react';

interface Location {
  name: string;
  lat: number;
  lng: number;
}

// Liste d'exemples de lacs
const EXAMPLE_LOCATIONS: Location[] = [
  { name: "Bouteille (Lac de la)", lat: 46.701653, lng: -73.695379 },
  { name: "Lac Tremblant", lat: 46.2176, lng: -74.6055 },
  { name: "Lac Saint-Jean", lat: 48.6000, lng: -72.0300 },
  { name: "Lac des Deux-Montagnes", lat: 45.4833, lng: -74.0000 }
];

export default function CampingMap() {
  const [selectedLocation, setSelectedLocation] = useState<Location>(EXAMPLE_LOCATIONS[0]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const location = EXAMPLE_LOCATIONS.find(loc => loc.name === e.target.value);
    if (location) {
      setSelectedLocation(location);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const googleMapsUrl = `https://www.google.com/maps/search/camping/@${selectedLocation.lat},${selectedLocation.lng},13z`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="location" className="text-lg font-semibold">
            Choisissez un lac :
          </label>
          <select
            id="location"
            value={selectedLocation.name}
            onChange={handleLocationChange}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EXAMPLE_LOCATIONS.map(location => (
              <option key={location.name} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Coordonnées :</h2>
          <p>Latitude : {selectedLocation.lat}</p>
          <p>Longitude : {selectedLocation.lng}</p>
        </div>

        <a 
          href={`https://www.google.com/maps/search/camping/@${selectedLocation.lat},${selectedLocation.lng},13z`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full"
        >
          <button
            type="button"
            onClick={handleButtonClick}
            className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <span role="img" aria-label="tent">🏕️</span>
            Voir les campings près de {selectedLocation.name}
          </button>
        </a>
      </div>
    </div>
  );
}