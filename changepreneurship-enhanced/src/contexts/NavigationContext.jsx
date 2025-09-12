import React, { createContext, useContext, useEffect, useState } from 'react';
import { normalizePath } from '../lib/navigation.js';
import { getNavigationStructure } from '../lib/navigation-structure.js';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [structure, setStructure] = useState([]);
  const [path, setPath] = useState({ phase: 1, tab: 1, section: 1, question: 1 });
  const [ids, setIds] = useState({
    phaseId: '',
    tabId: '',
    sectionId: '',
    questionId: '',
  });

  useEffect(() => {
    getNavigationStructure().then(setStructure);
  }, []);

  useEffect(() => {
    if (!structure.length) return;
    const saved = JSON.parse(localStorage.getItem('lastLocation') || '{}');
    const { codes, ids } = normalizePath(saved, structure);
    setPath(codes);
    setIds(ids);
  }, [structure]);

  useEffect(() => {
    if (!structure.length) return;
    localStorage.setItem('lastLocation', JSON.stringify(ids));
  }, [ids, structure]);

  const navigateTo = (next) => {
    const { codes, ids } = normalizePath(next, structure);
    setPath(codes);
    setIds(ids);
  };

  return (
    <NavigationContext.Provider value={{ structure, path, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
