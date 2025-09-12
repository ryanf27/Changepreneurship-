import React, { createContext, useContext, useEffect, useState } from 'react';
import { fromCode, toCode, normalizePath } from '../lib/navigation.js';
import { getNavigationStructure } from '../lib/navigation-structure.js';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [structure, setStructure] = useState([]);
  const [path, setPath] = useState({ phase: 1, tab: 1, section: 1, question: 1 });

  useEffect(() => {
    getNavigationStructure().then(setStructure);
  }, []);

  useEffect(() => {
    if (!structure.length) return;
    const saved = fromCode(localStorage.getItem('lastLocation') || '');
    const normalized = normalizePath(saved, structure);
    setPath(normalized);
  }, [structure]);

  useEffect(() => {
    if (!structure.length) return;
    localStorage.setItem('lastLocation', toCode(path));
  }, [path, structure]);

  const navigateTo = (next) => {
    setPath(normalizePath(next, structure));
  };

  return (
    <NavigationContext.Provider value={{ structure, path, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
