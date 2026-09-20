import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { propertyAPI, amenityAPI, aiAPI, mlAPI } from '../../lib/apiCalls';
import { 
  Building, DollarSign, Sparkles,
  CheckSquare, Image as ImageIcon, 
  ArrowLeft, ArrowRight, Save, Plus, X,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

export default function AddEditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);

  // AI Prediction state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [locality, setLocality] = useState('');
  const [type, setType] = useState('FLAT');
  const [bhk, setBhk] = useState(2);
  const [floor, setFloor] = useState(1);
  const [totalFloors, setTotalFloors] = useState(4);
  const [rent, setRent] = useState(15000);
  const [sqft, setSqft] = useState(1000);
  const [furnished, setFurnished] = useState('SEMI_FURNISHED');
  const [availableFrom, setAvailableFrom] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [reqDocs, setReqDocs] = useState({
    aadhaar: true,
    salarySlip: true,
    companyId: false,
    panCard: false,
  });

  const [amenities, setAmenities] = useState({
    WiFi: false,
    Parking: false,
    Gym: false,
    PowerBackup: false,
    Lift: false,
    Security: false,
    Garden: false,
    SwimmingPool: false,
  });

  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [availableCities, setAvailableCities] = useState([
    'Hyderabad', 'Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Kolkata',
  ]);

  // Photo state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);

  // Fetch amenities and cities
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [amenitiesList, citiesList] = await Promise.all([
          amenityAPI.getAll().catch(() => []),
          mlAPI.getCities()
            .then(r => Array.isArray(r) ? r : (r.cities || r))
            .catch(() => null),
        ]);

        if (amenitiesList && amenitiesList.length > 0) {
          setAvailableAmenities(amenitiesList);
          const initialChecklist = {};
          amenitiesList.forEach(a => { initialChecklist[a.name] = false; });
          setAmenities(prev => ({ ...initialChecklist, ...prev }));
        }
        if (citiesList && citiesList.length > 0) {
          setAvailableCities(citiesList);
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      }
    };
    fetchDropdownData();
  }, []);

  // Load property in edit mode
  useEffect(() => {
    if (isEditMode) {
      const loadPropertyDetails = async () => {
        setInitialLoading(true);
        try {
          const prop = await propertyAPI.getById(id);
          setTitle(prop.title);
          setDescription(prop.description);
          setCity(prop.city);
          setLocality(prop.locality);
          setType(prop.propertyType || prop.type || 'FLAT');
          setBhk(prop.bhk);
          setFloor(prop.floor || 1);
          setTotalFloors(prop.totalFloors || 4);
          setRent(prop.rent);
          setSqft(prop.sqft);
          setFurnished(prop.furnishingStatus || prop.furnished || 'SEMI_FURNISHED');
          setAvailableFrom(
            prop.availableFrom || new Date().toISOString().split('T')[0]
          );

          if (prop.images && prop.images.length > 0) {
            setExistingImages(prop.images);
            setImageUrls(prop.images.map(img => img.url));
          } else if (prop.imageUrls && prop.imageUrls.length > 0) {
            const fallback = prop.imageUrls.map((url, i) => ({
              id: `mock-${i}`, url,
            }));
            setExistingImages(fallback);
            setImageUrls(prop.imageUrls);
          }

          if (prop.amenities) {
            const mappedAmenities = { ...amenities };
            Object.keys(mappedAmenities).forEach(k => {
              mappedAmenities[k] = prop.amenities.includes(k);
            });
            setAmenities(mappedAmenities);
          }
        } catch (err) {
          toast.error('Listing not found.');
          navigate('/landlord/dashboard');
        } finally {
          setInitialLoading(false);
        }
      };
      loadPropertyDetails();
    }
  }, [id]);

  // Dropzone — no compression, just validate size and count
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Show rejected file errors
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(err => {
          if (err.code === 'file-too-large') {
            toast.error(`${file.name} is too large. Max 10MB per image.`);
          } else {
            toast.error(`${file.name} could not be added.`);
          }
        });
      });
    }

    if (acceptedFiles.length === 0) return;

    // Check total count
    const totalImages = imageUrls.length + acceptedFiles.length;
    if (totalImages > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - imageUrls.length} more.`);
      // Only take what fits
      const canAdd = MAX_IMAGES - imageUrls.length;
      if (canAdd <= 0) return;
      acceptedFiles = acceptedFiles.slice(0, canAdd);
    }

    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    const previews = acceptedFiles.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...previews]);
    toast.success(`${acceptedFiles.length} photo(s) added.`);
  }, [imageUrls]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxSize: MAX_FILE_SIZE,
    disabled: loading,
    onDrop,
  });

  const handleRemovePhoto = (idx) => {
    if (idx < existingImages.length) {
      const imgToRemove = existingImages[idx];
      if (typeof imgToRemove.id === 'number') {
        setDeletedImageIds(prev => [...prev, imgToRemove.id]);
      }
      setExistingImages(prev => prev.filter((_, i) => i !== idx));
    } else {
      const fileIdx = idx - existingImages.length;
      setUploadedFiles(prev => prev.filter((_, i) => i !== fileIdx));
    }
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  // AI prediction
  const handleGetAIPrediction = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await aiAPI.predictRent({
        bhk,
        sqft,
        floor,
        furnished,
        city,
        locality,
      });
      setAiResult(result);
      toast.success('AI Rent prediction loaded!');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Could not query AI valuation model.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySuggestedRent = () => {
    if (aiResult?.suggested) {
      setRent(aiResult.suggested);
      toast.success(`Rent set to AI suggested: ₹${aiResult.suggested.toLocaleString()}`);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
        if (!title.trim() || !locality.trim() || !description.trim() || !city.trim()) {
          toast.error('Please fill in title, city, locality, and description.');
          return;
        }
      }
    if (currentStep === 2) {
      if (rent <= 0 || sqft <= 0) {
        toast.error('Rent and size must be positive values.');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    const propertyPayload = {
      title,
      description,
      city,
      locality,
      propertyType: type,
      bhk: Number(bhk),
      floor: Number(floor),
      totalFloors: Number(totalFloors),
      rent: Number(rent),
      sqft: Number(sqft),
      furnishingStatus: furnished,
      availableFrom,
    };

    const activeAmenityIds = availableAmenities
      .filter(a =>
        amenities[a.name] === true ||
        (a.name === 'Power Backup' && amenities['PowerBackup'] === true) ||
        (a.name === 'Swimming Pool' && amenities['SwimmingPool'] === true)
      )
      .map(a => a.id);

    try {
      let savedProperty;

      if (isEditMode) {
        // Step 1 — Update property
        savedProperty = await propertyAPI.update(id, propertyPayload);

        // Step 2 — Delete removed images
        if (deletedImageIds.length > 0) {
          await Promise.all(
            deletedImageIds.map(imgId => propertyAPI.deleteImage(imgId))
          );
        }

        // Step 3 — Upload new images with progress
        if (uploadedFiles.length > 0) {
          const uploadToast = toast.loading(
            `Uploading ${uploadedFiles.length} image(s)... 0%`,
            { id: 'img-upload' }
          );
          try {
            await propertyAPI.uploadImages(id, uploadedFiles, (percent) => {
              setUploadProgress(percent);
              toast.loading(
                `Uploading ${uploadedFiles.length} image(s)... ${percent}%`,
                { id: 'img-upload' }
              );
            });
            toast.dismiss('img-upload');
          } catch (uploadErr) {
            toast.dismiss('img-upload');
            toast.error('Images failed to upload. You can add them from Edit.');
          }
        }

        // Step 4 — Link amenities
        if (activeAmenityIds.length > 0) {
          await amenityAPI.linkAmenities(id, activeAmenityIds);
        }

        toast.success('Listing updated successfully!');

      } else {
        // Step 1 — Create property
        savedProperty = await propertyAPI.create(propertyPayload);

        // Step 2 — Upload images with progress
        if (uploadedFiles.length > 0) {
          const uploadToast = toast.loading(
            `Uploading ${uploadedFiles.length} image(s)... 0%`,
            { id: 'img-upload' }
          );
          try {
            await propertyAPI.uploadImages(
              savedProperty.id,
              uploadedFiles,
              (percent) => {
                setUploadProgress(percent);
                toast.loading(
                  `Uploading ${uploadedFiles.length} image(s)... ${percent}%`,
                  { id: 'img-upload' }
                );
              }
            );
            toast.dismiss('img-upload');
          } catch (uploadErr) {
            toast.dismiss('img-upload');
            toast.error('Images failed to upload. You can add them from Edit.');
          }
        }

        // Step 3 — Link amenities
        if (activeAmenityIds.length > 0) {
          await amenityAPI.linkAmenities(savedProperty.id, activeAmenityIds);
        }

        toast.success('Property listed successfully! ✨');
      }

      navigate('/landlord/dashboard');

    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Could not save property. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (initialLoading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090915] to-[#07070F] z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col space-y-6 pt-6 text-left">

        <div>
          <Badge variant="primary" className="mb-2">Landlord Desk</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
            {isEditMode ? 'Edit Listing Details' : 'List New Property'}
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Fill in details across the 4 steps to publish your listing on RentEase.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between py-4 px-6 bg-white/[0.01] border border-white/5 rounded-2xl max-w-md mx-auto w-full">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center space-x-1.5 select-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                currentStep >= step
                  ? 'bg-brand-primary text-text-primary border-brand-primary'
                  : 'bg-surface-raised text-text-muted border-white/10'
              }`}>
                {step}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:inline ${
                currentStep === step ? 'text-text-primary' : 'text-text-muted'
              }`}>
                {step === 1 ? 'Info' : step === 2 ? 'Finance' : step === 3 ? 'Amenities' : 'Photos'}
              </span>
            </div>
          ))}
        </div>

        <Card className="p-6 md:p-8 bg-surface-raised/40 border border-white/5 space-y-6">

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-3">
                <Building size={18} className="text-brand-primary" />
                Step 1: Base Information
              </h3>

              <Input
                label="Property Listing Title"
                placeholder="e.g. Spacious 2BHK in Banjara Hills"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5 text-left relative">
                  <label className="text-xs font-semibold text-text-secondary">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad, Nashik, Pune..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white text-black border border-white/5 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200"
                    list="city-suggestions"
                  />
                  {/* Datalist gives dropdown suggestions but allows free typing */}
                  <datalist id="city-suggestions">
                    {availableCities.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <Input
                  label="Locality / Sector"
                  placeholder="e.g. Banjara Hills, Hitec City"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-text-secondary">Property Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white text-black border border-white/5 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200"
                  >
                    <option value="FLAT">Flat</option>
                    <option value="VILLA">Villa</option>
                    <option value="INDEPENDENT_HOUSE">Independent House</option>
                  </select>
                </div>

                <Input
                  label="BHK Configuration"
                  type="number"
                  min={1}
                  max={6}
                  placeholder="e.g. 2"
                  value={bhk}
                  onChange={(e) => setBhk(Number(e.target.value))}
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Floor Level"
                    type="number"
                    min={0}
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    required
                  />
                  <Input
                    label="Total Floors"
                    type="number"
                    min={1}
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-text-secondary">Property Description</label>
                <textarea
                  placeholder="Describe your property: proximity to metro, school, security features..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-white text-black border border-white/5 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-3">
                <DollarSign size={18} className="text-brand-secondary" />
                Step 2: Details & Pricing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Monthly Rent (₹)"
                  type="number"
                  min={1000}
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value))}
                  required
                />
                <Input
                  label="Size (Sqft)"
                  type="number"
                  min={100}
                  value={sqft}
                  onChange={(e) => setSqft(Number(e.target.value))}
                  required
                />
                <div className="flex flex-col space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-text-secondary">Furnished Status</label>
                  <select
                    value={furnished}
                    onChange={(e) => setFurnished(e.target.value)}
                    className="w-full bg-white text-black border border-white/5 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200"
                  >
                    <option value="FURNISHED">Furnished</option>
                    <option value="SEMI_FURNISHED">Semi-Furnished</option>
                    <option value="UNFURNISHED">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Available From"
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  required
                />
              </div>

              {/* Document checklist */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-xs font-semibold text-text-secondary">
                  Required Documents from Applicants
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'aadhaar', label: 'Aadhaar Card' },
                    { key: 'salarySlip', label: 'Salary Slip' },
                    { key: 'companyId', label: 'Company ID' },
                    { key: 'panCard', label: 'PAN Card' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center space-x-2 bg-white/[0.01] hover:bg-white/[0.03] p-2.5 rounded-xl border border-white/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={reqDocs[key]}
                        onChange={(e) => setReqDocs({ ...reqDocs, [key]: e.target.checked })}
                        className="rounded text-brand-primary focus:ring-brand-primary bg-surface-raised border-white/10"
                      />
                      <span className="text-xs text-text-secondary">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* AI Widget */}
              <div className="p-5 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl text-left space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="text-brand-accent animate-pulse" size={16} />
                    <span className="text-xs font-bold text-text-primary">
                      AI Rent Valuation Assist
                    </span>
                  </div>
                  <Button
                    onClick={handleGetAIPrediction}
                    variant="accent"
                    size="sm"
                    loading={aiLoading}
                  >
                    Calculate Fair Price
                  </Button>
                </div>

                {aiResult && (
                  <div className="pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-text-primary">
                        AI Suggested:{' '}
                        <b className="font-mono text-brand-accent">
                          ₹{aiResult.suggested?.toLocaleString()}
                        </b>
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        Range: ₹{aiResult.minRent?.toLocaleString()} –{' '}
                        ₹{aiResult.maxRent?.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center md:justify-end">
                      <Button
                        onClick={handleApplySuggestedRent}
                        variant="outline"
                        size="sm"
                      >
                        Apply Suggested Rent
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-3">
                <CheckSquare size={18} className="text-brand-accent" />
                Step 3: Amenities Checklist
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(amenities).map((a) => (
                  <label
                    key={a}
                    className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer select-none transition ${
                      amenities[a]
                        ? 'bg-brand-primary/10 border-brand-primary/80 text-brand-primary'
                        : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={amenities[a]}
                      onChange={(e) =>
                        setAmenities({ ...amenities, [a]: e.target.checked })
                      }
                      className="sr-only"
                    />
                    <span className="text-xs font-bold">{a}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-3">
                <ImageIcon size={18} className="text-text-secondary" />
                Step 4: Property Photos
              </h3>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                  loading
                    ? 'opacity-50 cursor-not-allowed border-white/5'
                    : isDragActive
                    ? 'border-brand-primary bg-brand-primary/5 cursor-copy'
                    : imageUrls.length >= MAX_IMAGES
                    ? 'opacity-40 cursor-not-allowed border-white/5'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer'
                }`}
              >
                <input {...getInputProps()} />
                <Plus
                  size={32}
                  className="mx-auto text-text-muted mb-2 animate-bounce"
                />
                <p className="text-sm font-semibold text-text-primary">
                  {imageUrls.length >= MAX_IMAGES
                    ? `Maximum ${MAX_IMAGES} photos reached`
                    : isDragActive
                    ? 'Drop photos here...'
                    : 'Drag & drop photos, or click to browse'}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  PNG, JPG accepted · Max 10MB per image · Up to {MAX_IMAGES} photos
                </p>
              </div>

              {/* Counter */}
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-muted">
                  First image will be the cover photo
                </p>
                <p className={`text-xs font-semibold ${
                  imageUrls.length >= MAX_IMAGES
                    ? 'text-warning'
                    : 'text-text-secondary'
                }`}>
                  {imageUrls.length} / {MAX_IMAGES} photos
                </p>
              </div>

              {/* Previews */}
              {imageUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-secondary">
                    Preview ({imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''})
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative h-20 bg-white/5 border border-white/5 rounded-xl overflow-hidden group"
                      >
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-red-400 hover:text-red-500 transition"
                          title="Remove photo"
                          disabled={loading}
                        >
                          <X size={10} />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[8px] bg-brand-primary/80 text-white px-1.5 py-0.5 rounded-md font-bold">
                            COVER
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload progress bar */}
              {loading && uploadedFiles.length > 0 && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-brand-accent">
                      <Upload size={12} className="animate-bounce" />
                      <span>Uploading to Cloudinary...</span>
                    </div>
                    <span className="text-text-secondary font-semibold">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-brand-accent h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="border-t border-white/5 pt-6 flex justify-between">
            {currentStep > 1 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev - 1)}
                variant="outline"
                icon={ArrowLeft}
                disabled={loading}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                onClick={handleNextStep}
                variant="primary"
                icon={ArrowRight}
                iconPosition="right"
                disabled={loading}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                variant="primary"
                loading={loading}
                icon={Save}
              >
                {isEditMode ? 'Update Listing' : 'Publish Listing'}
              </Button>
            )}
          </div>

        </Card>
      </div>
    </PageWrapper>
  );
}