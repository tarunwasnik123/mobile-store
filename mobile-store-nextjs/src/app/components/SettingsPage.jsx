'use client';

import { useEffect, useState } from 'react';
import './SettingsPage.css';

const DEFAULT_SETTINGS = {
  notifications: true,
  newsletter: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('app_settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page settings-page">
      <h1 className="settings-title">Settings</h1>

      <div className="settings-card">
        <div className="settings-section">
          <h3>Preferences</h3>

          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => updateSetting('notifications', e.target.checked)}
            />
            <span>Enable Notifications</span>
          </label>

          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.newsletter}
              onChange={(e) => updateSetting('newsletter', e.target.checked)}
            />
            <span>Subscribe to Newsletter</span>
          </label>
        </div>

        <button className="save-btn" onClick={handleSave}>
          Save Settings
        </button>

        {saved && <div className="save-success">Settings saved ✓</div>}
      </div>
    </div>
  );
}