import React, { createContext, useContext, useEffect, useState } from 'react';
import { fromCode, toCode, normalizePath } from '../lib/navigation.js';
import { getNavigationStructure } from '../lib/navigation-structure.js';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [structure, setStructure] = useState([]);
  const [path, setPath] = useState({ phase: 1, tab: 1, section: 1, question: 1 });
  const [progress, setProgress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('questionProgress')) || {};
    } catch {
      return {};
    }
  });

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

  useEffect(() => {
    localStorage.setItem('questionProgress', JSON.stringify(progress));
  }, [progress]);

  const navigateTo = (next) => {
    setPath(normalizePath(next, structure));
  };

  const markVisited = (id) => {
    setProgress((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  return (
    <NavigationContext.Provider value={{ structure, path, navigateTo, progress, markVisited }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
