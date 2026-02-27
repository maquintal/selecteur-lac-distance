'use client';

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from '../../convex/_generated/api';

const SearchFilter = () => {
  const [search, setSearch] = useState("");


  const results = useQuery(api.lacsCopy.getAllLacsDynamicFilters, { search });

  return (
    <React.Fragment>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher..."
      />

      {results?.map((item, index) => (
        <div key={`${item._id}-${index}`}>
          {item._id} - {item.nomDuLac}
        </div>
      ))}
    </React.Fragment>
  );
}

export default SearchFilter;