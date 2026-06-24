import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('anora_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [incognitoMode, setIncognitoMode] = useState(() => {
    const saved = localStorage.getItem('anora_incognito_mode');
    return saved !== null ? saved === 'true' : false;
  });

  const [friendsOnlyPM, setFriendsOnlyPM] = useState(() => {
    const saved = localStorage.getItem('anora_friends_only_pm');
    return saved !== null ? saved === 'true' : false;
  });

  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    const saved = localStorage.getItem('anora_vibration_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('anora_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('anora_incognito_mode', incognitoMode.toString());
  }, [incognitoMode]);

  useEffect(() => {
    localStorage.setItem('anora_friends_only_pm', friendsOnlyPM.toString());
  }, [friendsOnlyPM]);

  useEffect(() => {
    localStorage.setItem('anora_vibration_enabled', vibrationEnabled.toString());
  }, [vibrationEnabled]);

  return (
    <SettingsContext.Provider value={{ 
      soundEnabled, setSoundEnabled, 
      incognitoMode, setIncognitoMode,
      friendsOnlyPM, setFriendsOnlyPM,
      vibrationEnabled, setVibrationEnabled
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
