import { useState, useEffect } from 'react';
import { t } from '../utils/translations';

// Crop types for Bangladesh
const CROP_TYPES = [
  { id: 'Paddy', name: 'Paddy/Rice', nameBn: 'ধান/চাল', icon: '🌾' },
  { id: 'Wheat', name: 'Wheat', nameBn: 'গম', icon: '🌿' },
  { id: 'Maize', name: 'Maize/Corn', nameBn: 'ভুট্টা', icon: '🌽' },
  { id: 'Potato', name: 'Potato', nameBn: 'আলু', icon: '🥔' },
  { id: 'Onion', name: 'Onion', nameBn: 'পেঁয়াজ', icon: '🧅' },
  { id: 'Tomato', name: 'Tomato', nameBn: 'টমেটো', icon: '🍅' },
  { id: 'Vegetables', name: 'Vegetables', nameBn: 'শাকসবজি', icon: '🥬' },
  { id: 'Mango', name: 'Mango', nameBn: 'আম', icon: '🥭' },
  { id: 'Banana', name: 'Banana', nameBn: 'কলা', icon: '🍌' },
  { id: 'Jute', name: 'Jute', nameBn: 'পাট', icon: '🧵' },
  { id: 'Sugarcane', name: 'Sugarcane', nameBn: 'আখ', icon: '🎋' },
  { id: 'Lentils', name: 'Lentils/Dal', nameBn: 'ডাল', icon: '🫘' },
  { id: 'Mustard', name: 'Mustard', nameBn: 'সরিষা', icon: '🌻' },
  { id: 'Chili', name: 'Chili', nameBn: 'মরিচ', icon: '🌶️' },
  { id: 'Other', name: 'Other', nameBn: 'অন্যান্য', icon: '🌱' }
];

// Location data
const LOCATIONS = {
  divisions: [
    { name: 'Dhaka', nameBn: 'ঢাকা', districts: ['Dhaka', 'Gazipur', 'Manikganj', 'Narayanganj', 'Narsingdi'] },
    { name: 'Rajshahi', nameBn: 'রাজশাহী', districts: ['Rajshahi', 'Bogra', 'Pabna', 'Naogaon', 'Natore'] },
    { name: 'Khulna', nameBn: 'খুলনা', districts: ['Khulna', 'Jessore', 'Satkhira', 'Bagerhat', 'Kushtia'] },
    { name: 'Chittagong', nameBn: 'চট্টগ্রাম', districts: ['Chittagong', 'Comilla', 'Noakhali', 'Feni', 'Coxs Bazar'] },
    { name: 'Rangpur', nameBn: 'রংপুর', districts: ['Rangpur', 'Dinajpur', 'Kurigram', 'Lalmonirhat', 'Thakurgaon'] },
    { name: 'Sylhet', nameBn: 'সিলেট', districts: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'] },
    { name: 'Barisal', nameBn: 'বরিশাল', districts: ['Barisal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Jhalokathi'] },
    { name: 'Mymensingh', nameBn: 'ময়মনসিংহ', districts: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'] }
  ],
  storageTypes: [
    { id: 'Jute Bag Stack', nameBn: 'পাটের বস্তার স্তূপ', icon: '👜' },
    { id: 'Silo', nameBn: 'সাইলো', icon: '🏭' },
    { id: 'Open Area', nameBn: 'খোলা জায়গা', icon: '🌤️' },
    { id: 'Warehouse', nameBn: 'গুদাম', icon: '🏠' },
    { id: 'Cold Storage', nameBn: 'হিমাগার', icon: '❄️' },
    { id: 'Earthen Pot', nameBn: 'মাটির পাত্র', icon: '🏺' }
  ]
};

// Form styles
const styles = {
  container: {
    background: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    border: '2px solid #bbf7d0',
    maxWidth: '500px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #dcfce7'
  },
  headerIcon: {
    fontSize: '2.5rem',
    marginBottom: '8px'
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#166534',
    margin: 0
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '0.95rem'
  },
  required: {
    color: '#dc2626',
    marginLeft: '4px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#1f2937',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box'
  },
  inputFocus: {
    borderColor: '#16a34a',
    boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.15)'
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#1f2937',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '20px',
    paddingRight: '44px',
    boxSizing: 'border-box'
  },
  selectDisabled: {
    background: '#f3f4f6',
    cursor: 'not-allowed',
    color: '#9ca3af'
  },
  dateInputWrapper: {
    position: 'relative'
  },
  dateInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#1f2937',
    cursor: 'pointer',
    outline: 'none',
    boxSizing: 'border-box'
  },
  weightWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  weightInput: {
    width: '100%',
    padding: '14px 60px 14px 16px',
    fontSize: '1.1rem',
    fontFamily: 'inherit',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#1f2937',
    outline: 'none',
    boxSizing: 'border-box'
  },
  weightUnit: {
    position: 'absolute',
    right: '16px',
    color: '#6b7280',
    fontWeight: '600',
    pointerEvents: 'none'
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#1f2937',
    resize: 'vertical',
    minHeight: '80px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '28px'
  },
  submitBtn: {
    flex: 1,
    padding: '16px 24px',
    fontSize: '1.1rem',
    fontWeight: '700',
    fontFamily: 'inherit',
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)'
  },
  cancelBtn: {
    padding: '16px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    fontFamily: 'inherit',
    background: '#ffffff',
    color: '#6b7280',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  }
};

/**
 * Form for adding a new crop batch
 */
function BatchForm({ lang, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    cropType: '',
    estimatedWeightKg: '',
    harvestDate: new Date().toISOString().split('T')[0],
    division: '',
    district: '',
    storageType: '',
    notes: ''
  });
  
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [focusedField, setFocusedField] = useState(null);
  
  // Update districts when division changes
  useEffect(() => {
    if (formData.division) {
      const div = LOCATIONS.divisions.find(d => d.name === formData.division);
      setAvailableDistricts(div ? div.districts : []);
      setFormData(prev => ({ ...prev, district: '' }));
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.division]);
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // For number inputs, keep as string but validate
    if (type === 'number') {
      // Allow empty string or valid numbers only
      if (value === '' || !isNaN(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.cropType || !formData.estimatedWeightKg || !formData.division || !formData.storageType) {
      alert(lang === 'bn' ? 'সব প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }
    
    onSubmit({
      ...formData,
      estimatedWeightKg: Number(formData.estimatedWeightKg)
    });
  };
  
  const getInputStyle = (fieldName) => ({
    ...styles.input,
    ...(focusedField === fieldName ? styles.inputFocus : {})
  });
  
  const getSelectStyle = (fieldName, disabled = false) => ({
    ...styles.select,
    ...(focusedField === fieldName ? styles.inputFocus : {}),
    ...(disabled ? styles.selectDisabled : {})
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>🌾</div>
        <h2 style={styles.headerTitle}>
          {lang === 'bn' ? 'নতুন ফসল ব্যাচ যোগ করুন' : 'Add New Crop Batch'}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Crop Type Dropdown */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            🌱 {lang === 'bn' ? 'ফসলের ধরন' : 'Crop Type'}
            <span style={styles.required}>*</span>
          </label>
          <select
            name="cropType"
            value={formData.cropType}
            onChange={handleChange}
            onFocus={() => setFocusedField('cropType')}
            onBlur={() => setFocusedField(null)}
            style={getSelectStyle('cropType')}
            required
          >
            <option value="">{lang === 'bn' ? '-- ফসল নির্বাচন করুন --' : '-- Select Crop --'}</option>
            {CROP_TYPES.map(crop => (
              <option key={crop.id} value={crop.id}>
                {crop.icon} {lang === 'bn' ? crop.nameBn : crop.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Weight Input */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            ⚖️ {lang === 'bn' ? 'আনুমানিক ওজন' : 'Estimated Weight'}
            <span style={styles.required}>*</span>
          </label>
          <div style={styles.weightWrapper}>
            <input
              type="number"
              name="estimatedWeightKg"
              value={formData.estimatedWeightKg}
              onChange={handleChange}
              onFocus={() => setFocusedField('weight')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.weightInput,
                ...(focusedField === 'weight' ? styles.inputFocus : {})
              }}
              placeholder={lang === 'bn' ? 'যেমন: 500' : 'e.g., 500'}
              min="1"
              required
            />
            <span style={styles.weightUnit}>
              {lang === 'bn' ? 'কেজি' : 'kg'}
            </span>
          </div>
        </div>
        
        {/* Harvest Date */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            📅 {lang === 'bn' ? 'ফসল কাটার তারিখ' : 'Harvest Date'}
            <span style={styles.required}>*</span>
          </label>
          <input
            type="date"
            name="harvestDate"
            value={formData.harvestDate}
            onChange={handleChange}
            onFocus={() => setFocusedField('date')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...styles.dateInput,
              ...(focusedField === 'date' ? styles.inputFocus : {})
            }}
            required
          />
        </div>
        
        {/* Division & District Row */}
        <div style={styles.row}>
          {/* Division */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              📍 {lang === 'bn' ? 'বিভাগ' : 'Division'}
              <span style={styles.required}>*</span>
            </label>
            <select
              name="division"
              value={formData.division}
              onChange={handleChange}
              onFocus={() => setFocusedField('division')}
              onBlur={() => setFocusedField(null)}
              style={getSelectStyle('division')}
              required
            >
              <option value="">{lang === 'bn' ? '-- নির্বাচন --' : '-- Select --'}</option>
              {LOCATIONS.divisions.map(div => (
                <option key={div.name} value={div.name}>
                  {lang === 'bn' ? div.nameBn : div.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* District */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              🏘️ {lang === 'bn' ? 'জেলা' : 'District'}
            </label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              onFocus={() => setFocusedField('district')}
              onBlur={() => setFocusedField(null)}
              style={getSelectStyle('district', !formData.division)}
              disabled={!formData.division}
            >
              <option value="">{lang === 'bn' ? '-- নির্বাচন --' : '-- Select --'}</option>
              {availableDistricts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Storage Type */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            🏠 {lang === 'bn' ? 'সংরক্ষণের ধরন' : 'Storage Type'}
            <span style={styles.required}>*</span>
          </label>
          <select
            name="storageType"
            value={formData.storageType}
            onChange={handleChange}
            onFocus={() => setFocusedField('storage')}
            onBlur={() => setFocusedField(null)}
            style={getSelectStyle('storage')}
            required
          >
            <option value="">{lang === 'bn' ? '-- সংরক্ষণের ধরন নির্বাচন করুন --' : '-- Select Storage Type --'}</option>
            {LOCATIONS.storageTypes.map(st => (
              <option key={st.id} value={st.id}>
                {st.icon} {lang === 'bn' ? st.nameBn : st.id}
              </option>
            ))}
          </select>
        </div>
        
        {/* Notes */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            📝 {lang === 'bn' ? 'অতিরিক্ত তথ্য' : 'Additional Notes'}
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            onFocus={() => setFocusedField('notes')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...styles.textarea,
              ...(focusedField === 'notes' ? styles.inputFocus : {})
            }}
            placeholder={lang === 'bn' ? 'যেকোনো অতিরিক্ত তথ্য লিখুন...' : 'Write any additional information...'}
            rows={3}
          />
        </div>
        
        {/* Buttons */}
        <div style={styles.buttonGroup}>
          <button 
            type="submit" 
            style={styles.submitBtn}
            onMouseOver={e => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(22, 163, 74, 0.4)';
            }}
            onMouseOut={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(22, 163, 74, 0.3)';
            }}
          >
            ✅ {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Batch'}
          </button>
          <button 
            type="button" 
            style={styles.cancelBtn}
            onClick={onCancel}
            onMouseOver={e => {
              e.target.style.background = '#f3f4f6';
            }}
            onMouseOut={e => {
              e.target.style.background = '#ffffff';
            }}
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BatchForm;
