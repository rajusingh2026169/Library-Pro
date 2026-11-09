import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Archive,
  RefreshCw,
  PlusCircle,
  BookmarkCheck,
  Grid,
  List,
  Layers,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Book, BookCategory } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface BooksListProps {
  onOpenAddBook: () => void;
  onOpenEditBook: (book: Book) => void;
  onSelectBookDetails: (book: Book) => void;
  onIssueBook: (bookId: string) => void;
  onReserveBook: (bookId: string) => void;
}

export const BooksList: React.FC<BooksListProps> = ({
  onOpenAddBook,
  onOpenEditBook,
  onSelectBookDetails,
  onIssueBook,
  onReserveBook,
}) => {
  const { books, archiveBook, restoreBook, hasPermission, language } = useApp();
  const isHindi = language === 'hi';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'out_of_stock' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [bookToArchive, setBookToArchive] = useState<Book | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => set.add(b.category));
    return Array.from(set);
  }, [books]);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      // Search
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        b.title.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.shelfNumber.toLowerCase().includes(q);

      // Category
      const matchCategory = selectedCategory === 'all' || b.category === selectedCategory;

      // Status
      let matchStatus = true;
      if (statusFilter === 'available') {
        matchStatus = b.status === 'available' && b.availableCopies > 0;
      } else if (statusFilter === 'out_of_stock') {
        matchStatus = b.status === 'available' && b.availableCopies === 0;
      } else if (statusFilter === 'archived') {
        matchStatus = b.status === 'archived';
      } else {
        matchStatus = b.status !== 'archived'; // Default hide archived unless requested
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [books, search, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isHindi ? 'किताबें और स्टॉक (Book Management)' : 'Book Management & Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isHindi
              ? 'लाइब्रेरी की सभी किताबों की सूची, शेल्फ/अलमारी नंबर और बची हुई प्रतियों की जानकारी।'
              : 'Manage bibliographic records, editions, shelf locations, and physical copy counts.'}
          </p>
        </div>

        {hasPermission('LIBRARIAN') && (
          <button
            onClick={onOpenAddBook}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            {isHindi ? 'नई किताब जोड़ें (Add Book)' : 'Catalog New Book'}
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isHindi
                ? 'किताब का नाम, लेखक, ISBN या शेल्फ नंबर से खोजें...'
                : 'Search by title, author, ISBN or shelf number...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs sm:text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 text-xs text-slate-700 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 outline-hidden font-medium cursor-pointer"
          >
            <option value="all">{isHindi ? 'सभी विषय (All Categories)' : 'All Disciplines'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 text-xs text-slate-700 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 outline-hidden font-medium cursor-pointer"
          >
            <option value="all">{isHindi ? 'सभी चालू किताबें (Active Catalog)' : 'Active Inventory'}</option>
            <option value="available">{isHindi ? 'उपलब्ध किताबें (In Stock)' : 'In Stock (Available)'}</option>
            <option value="out_of_stock">{isHindi ? 'सभी जारी / स्टॉक खत्म (0 Left)' : 'Borrowed Out (0 Left)'}</option>
            <option value="archived">{isHindi ? 'हटाया गया रिकॉर्ड (Archived)' : 'Archived Records'}</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={isHindi ? 'टेबल लिस्ट दृश्य' : 'Table View'}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={isHindi ? 'कार्ड दृश्य' : 'Grid Card View'}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Book Catalog Contents */}
      {filteredBooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={isHindi ? 'कोई किताब नहीं मिली' : 'No books match criteria'}
          description={
            isHindi
              ? 'कृपया दूसरा नाम, लेखक या ISBN डालकर खोजें।'
              : 'Try broadening your search keyword or clearing the selected category filters.'
          }
          actionLabel={hasPermission('LIBRARIAN') ? (isHindi ? 'नई किताब जोड़ें' : 'Catalog New Book') : undefined}
          onAction={onOpenAddBook}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">{isHindi ? 'किताब व लेखक (Title & Author)' : 'Title & Bibliographic Info'}</th>
                  <th className="py-3 px-4">{isHindi ? 'विषय (Subject)' : 'Discipline'}</th>
                  <th className="py-3 px-4">{isHindi ? 'अलमारी / रैक (Shelf)' : 'Shelf & Call #'}</th>
                  <th className="py-3 px-4">{isHindi ? 'उपलब्ध / कुल प्रतियां (Copies)' : 'Copies (Avail / Total)'}</th>
                  <th className="py-3 px-4">{isHindi ? 'स्थिति (Status)' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'कार्य (Actions)' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {b.coverImage ? (
                            <img
                              src={b.coverImage}
                              alt={b.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-sm">
                          <p
                            onClick={() => onSelectBookDetails(b)}
                            className="font-bold text-slate-900 truncate hover:text-indigo-600 transition cursor-pointer"
                          >
                            {b.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{b.author}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ISBN: {b.isbn}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{b.category}</span>
                      {b.edition && <span className="block text-[10px] text-slate-400">{b.edition}</span>}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        {b.shelfNumber}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">{b.callNumber}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-sm font-black ${
                            b.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {b.availableCopies}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="font-mono text-xs font-semibold text-slate-600">{b.totalCopies}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {isHindi
                          ? b.availableCopies > 0
                            ? 'लाइब्रेरी में मौजूद'
                            : 'सभी जारी हैं'
                          : b.availableCopies > 0
                          ? 'Available'
                          : 'All issued'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          b.status === 'archived'
                            ? 'slate'
                            : b.availableCopies > 0
                            ? 'emerald'
                            : 'amber'
                        }
                      >
                        {b.status === 'archived'
                          ? isHindi ? 'पुराना रिकॉर्ड' : 'Archived'
                          : b.availableCopies > 0
                          ? isHindi ? 'उपलब्ध (In Stock)' : 'In Stock'
                          : isHindi ? 'छात्रों के पास' : 'Checked Out'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectBookDetails(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title={isHindi ? 'विवरण देखें' : 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {b.availableCopies > 0 && b.status === 'available' && (
                          <button
                            onClick={() => onIssueBook(b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 cursor-pointer"
                            title={isHindi ? 'छात्र को किताब जारी करें' : 'Issue book to member'}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            {isHindi ? 'किताब दें' : 'Issue'}
                          </button>
                        )}

                        {b.availableCopies === 0 && b.status === 'available' && (
                          <button
                            onClick={() => onReserveBook(b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition border border-amber-200 cursor-pointer"
                            title={isHindi ? 'किताब की बुकिंग करें' : 'Reserve book'}
                          >
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            {isHindi ? 'बुक करें' : 'Reserve'}
                          </button>
                        )}

                        {hasPermission('LIBRARIAN') && (
                          <button
                            onClick={() => onOpenEditBook(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                            title={isHindi ? 'जानकारी बदलें' : 'Edit Record'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {hasPermission('SUPER_ADMIN') && (
                          b.status === 'archived' ? (
                            <button
                              onClick={() => restoreBook(b.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition cursor-pointer"
                              title={isHindi ? 'दोबारा चालू करें' : 'Restore to Active Catalog'}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setBookToArchive(b)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                              title={isHindi ? 'हटाएं या आर्काइव करें' : 'Archive Record'}
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[3/4] w-full rounded-xl bg-slate-100 overflow-hidden border border-slate-200 mb-3">
                  {b.coverImage ? (
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        b.status === 'archived'
                          ? 'slate'
                          : b.availableCopies > 0
                          ? 'emerald'
                          : 'amber'
                      }
                    >
                      {b.availableCopies > 0
                        ? isHindi
                          ? `${b.availableCopies} स्टॉक में`
                          : `${b.availableCopies} in stock`
                        : isHindi
                        ? '0 उपलब्ध'
                        : '0 available'}
                    </Badge>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  {b.category}
                </span>
                <h4
                  onClick={() => onSelectBookDetails(b)}
                  className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-indigo-600 cursor-pointer mt-0.5"
                >
                  {b.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1">{b.author}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                  <span>{isHindi ? 'अलमारी:' : 'Shelf:'} {b.shelfNumber}</span>
                  <span>{b.publishYear}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectBookDetails(b)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  {isHindi ? 'विवरण' : 'Details'}
                </button>

                {b.availableCopies > 0 ? (
                  <button
                    onClick={() => onIssueBook(b.id)}
                    className="flex-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs cursor-pointer text-center"
                  >
                    {isHindi ? 'किताब दें' : 'Issue'}
                  </button>
                ) : (
                  <button
                    onClick={() => onReserveBook(b.id)}
                    className="flex-1 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition cursor-pointer text-center"
                  >
                    {isHindi ? 'बुक करें' : 'Reserve'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(bookToArchive)}
        onClose={() => setBookToArchive(null)}
        onConfirm={() => {
          if (bookToArchive) archiveBook(bookToArchive.id);
        }}
        title={isHindi ? 'किताब रिकॉर्ड हटाएं / आर्काइव करें' : 'Archive Catalog Record'}
        message={
          isHindi
            ? `क्या आप वाकई "${bookToArchive?.title}" को हटाना चाहते हैं? यह किताब अब नए छात्रों को जारी नहीं की जा सकेगी, लेकिन पुराना रिकॉर्ड सुरक्षित रहेगा।`
            : `Are you sure you want to archive "${bookToArchive?.title}"? Archived books are hidden from active circulation checkouts but preserve historical borrowing logs.`
        }
        confirmLabel={isHindi ? 'हाँ, आर्काइव करें' : 'Archive Book'}
        variant="danger"
      />
    </div>
  );
};
