import React, { useState } from 'react';
import { useAppContext } from '../store';

export const Settings: React.FC = () => {
  const { currentUser, companySettings, updateCompanySettings, updateUser } = useAppContext();
  const [name, setName] = useState(currentUser?.name || '');
  const [companyName, setCompanyName] = useState(companySettings.name);
  const [logo, setLogo] = useState<string | null>(companySettings.logo);

  const handleSave = () => {
    if (currentUser) updateUser(currentUser.id, { name });
    updateCompanySettings({ name: companyName, logo });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4">User Profile</h3>
        <div className="form-group mb-4">
          <label className="form-label">Full Name</label>
          <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4">Company Settings</h3>
        <div className="form-group mb-4">
          <label className="form-label">Company Name</label>
          <input type="text" className="form-input" value={companyName} onChange={e => setCompanyName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Company Logo</label>
          <input type="file" className="form-input" onChange={handleLogoUpload} accept="image/*" />
          {logo && <img src={logo} alt="Logo" className="mt-2 h-16" />}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
    </div>
  );
};
