import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Book, BookCategory, BookStatus } from '../../types';
import { useApp } from '../../context/AppContext';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'libraryId'>) => void;
  initialData?: Book | null;
}

const CATEGORIES: BookCategory[] = [
  'Computer Science',
  'Engineering',
  'Mathematics',
  'Physics',
  'Literature & Fiction',
  'Business & Economics',
  'History & Politics',
  'Medical & Health',
  'Arts & Design',
  'General Reference',
];

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { language: appLanguage } = useApp();
  const isHindi = appLanguage === 'hi';

  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishYear, setPublishYear] = useState<number>(new Date().getFullYear());
  const [edition, setEdition] = useState('');
  const [category, setCategory] = useState<BookCategory>('Computer Science');
  const [shelfNumber, setShelfNumber] = useState('');
  const [callNumber, setCallNumber] = useState('');
  const [totalCopies, setTotalCopies] = useState<number>(3);
  const [availableCopies, setAvailableCopies] = useState<number>(3);
  const [coverImage, setCoverImage] = useState('');
  const [language, setLanguage] = useState('English');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<BookStatus>('available');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setIsbn(initialData.isbn);
      setAuthor(initialData.author);
      setPublisher(initialData.publisher || '');
      setPublishYear(initialData.publishYear || new Date().getFullYear());
      setEdition(initialData.edition || '');
      setCategory(initialData.category);
      setShelfNumber(initialData.shelfNumber || '');
      setCallNumber(initialData.callNumber || '');
      setTotalCopies(initialData.totalCopies);
      setAvailableCopies(initialData.availableCopies);
      setCoverImage(initialData.coverImage || '');
      setLanguage(initialData.language || 'English');
      setDescription(initialData.description || '');
      setStatus(initialData.status);
    } else {
      setTitle('');
      setIsbn('');
      setAuthor('');
      setPublisher('');
      setPublishYear(new Date().getFullYear());
      setEdition('');
      setCategory('Computer Science');
      setShelfNumber('A1-Rack-01');
      setCallNumber('000 GEN');
      setTotalCopies(3);
      setAvailableCopies(3);
      setCoverImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80');
      setLanguage('English');
      setDescription('');
      setStatus('available');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!isbn.trim()) newErrors.isbn = 'ISBN is required';
    if (!author.trim()) newErrors.author = 'Author name is required';
    if (totalCopies < 1) newErrors.totalCopies = 'Must have at least 1 total copy';
    if (availableCopies < 0) newErrors.availableCopies = 'Available copies cannot be negative';
    if (availableCopies > totalCopies) {
      newErrors.availableCopies = 'Available copies cannot exceed total copies';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      isbn: isbn.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      publishYear: Number(publishYear),
      edition: edition.trim(),
      category,
      shelfNumber: shelfNumber.trim(),
      callNumber: callNumber.trim(),
      totalCopies: Number(totalCopies),
      availableCopies: Number(availableCopies),
      coverImage: coverImage.trim(),
      language: language.trim(),
      description: description.trim(),
      status,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialData
          ? isHindi ? 'किताब की जानकारी बदलें (Edit Book)' : 'Edit Book Details'
          : isHindi ? 'नई किताब जोड़ें (Add New Book)' : 'Catalog New Book'
      }
      subtitle={
        isHindi
          ? 'किताब का नाम, लेखक, शेल्फ/अलमारी नंबर और कुल प्रतियों की जानकारी भरें।'
          : 'Enter bibliographic information and shelf storage location'
      }
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'किताब का नाम (Book Title) *' : 'Book Title *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isHindi ? 'जैसे: गणित भाग 1, Data Structures...' : 'e.g. Introduction to Algorithms'}
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border ${
                errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden`}
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'लेखक का नाम (Author) *' : 'Author(s) *'}
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={isHindi ? 'जैसे: आर. के. नारायण, प्रेमचंद...' : 'e.g. Thomas H. Cormen, Charles E. Leiserson'}
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border ${
                errors.author ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden`}
            />
            {errors.author && <p className="text-[11px] text-rose-500 mt-1">{errors.author}</p>}
          </div>

          {/* ISBN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'ISBN नंबर (या बारकोड) *' : 'ISBN Number *'}
            </label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 978-0262046305"
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border font-mono ${
                errors.isbn ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden`}
            />
            {errors.isbn && <p className="text-[11px] text-rose-500 mt-1">{errors.isbn}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'विषय / शाखा (Category)' : 'Category / Discipline'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BookCategory)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Publisher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'पब्लिशर / प्रकाशक (Publisher)' : 'Publisher'}
            </label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="e.g. MIT Press, NCERT"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Publication Year & Edition */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'प्रकाशन वर्ष (Year)' : 'Publication Year'}
            </label>
            <input
              type="number"
              value={publishYear}
              onChange={(e) => setPublishYear(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'संस्करण (Edition)' : 'Edition'}
            </label>
            <input
              type="text"
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              placeholder="e.g. 4th Edition, 2024"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Shelf / Rack & Call Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'अलमारी / रैक नंबर (Shelf Location)' : 'Shelf Location'}
            </label>
            <input
              type="text"
              value={shelfNumber}
              onChange={(e) => setShelfNumber(e.target.value)}
              placeholder={isHindi ? 'जैसे: अलमारी A-1, Rack-02' : 'e.g. CS-Rack-02'}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'कॉल नंबर / बुक कोड (Call #)' : 'Call / Classification #'}
            </label>
            <input
              type="text"
              value={callNumber}
              onChange={(e) => setCallNumber(e.target.value)}
              placeholder="e.g. 005.1 COR"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
            />
          </div>

          {/* Copies */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'कुल प्रतियां (Total Copies) *' : 'Total Copies *'}
            </label>
            <input
              type="number"
              min={1}
              value={totalCopies}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTotalCopies(val);
                if (!initialData) setAvailableCopies(val);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
            {errors.totalCopies && <p className="text-[11px] text-rose-500 mt-1">{errors.totalCopies}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'उपलब्ध प्रतियां (Available Copies) *' : 'Available Copies *'}
            </label>
            <input
              type="number"
              min={0}
              max={totalCopies}
              value={availableCopies}
              onChange={(e) => setAvailableCopies(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
            {errors.availableCopies && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.availableCopies}</p>
            )}
          </div>

          {/* Cover Image URL */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'किताब की फोटो लिंक (Cover Image URL)' : 'Cover Image URL'}
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'विवरण या विषय सूची (Description)' : 'Description / Synopsis'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isHindi ? 'किताब के बारे में संक्षेप में लिखें...' : 'Key topics, syllabus relevance, edition notes...'}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
          >
            {initialData
              ? isHindi ? 'बदलाव सहेजें' : 'Save Changes'
              : isHindi ? 'किताब जोड़ें' : 'Catalog Book'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
