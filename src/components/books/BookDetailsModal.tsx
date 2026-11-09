import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Book } from '../../types';
import { Badge } from '../common/Badge';
import { BookOpen, MapPin, Hash, Layers, CheckCircle2, AlertCircle, PlusCircle, BookmarkCheck, QrCode } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BookAssetTagModal } from './BookAssetTagModal';

interface BookDetailsModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueBook: (bookId: string) => void;
  onReserveBook: (bookId: string) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  isOpen,
  onClose,
  onIssueBook,
  onReserveBook,
}) => {
  const { loans, reservations, language } = useApp();
  const isHindi = language === 'hi';
  const [isAssetTagModalOpen, setIsAssetTagModalOpen] = useState(false);

  if (!book) return null;

  const activeBookLoans = loans.filter(
    (l) => l.bookId === book.id && (l.status === 'active' || l.status === 'overdue')
  );

  const activeReservations = reservations.filter(
    (r) => r.bookId === book.id && (r.status === 'pending' || r.status === 'ready_for_pickup')
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHindi ? 'किताब का संपूर्ण विवरण (Book Details)' : 'Bibliographic Item Details'}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Top Info Header */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-28 sm:w-36 h-40 sm:h-52 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-sm relative">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mb-1" />
                <span className="text-[10px]">No Cover Image</span>
              </div>
            )}
            <div className="absolute top-2 left-2">
              <Badge variant={book.status === 'available' ? 'emerald' : 'slate'}>
                {book.status === 'available' ? (isHindi ? 'उपलब्ध' : 'available') : book.status}
              </Badge>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              {book.category}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 leading-snug">
              {book.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
              {isHindi ? 'लेखक:' : 'By'} {book.author}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">ISBN</span>
                <span className="font-mono font-bold text-slate-800">{book.isbn}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  {isHindi ? 'पब्लिशर / वर्ष' : 'Publisher'}
                </span>
                <span className="truncate block">{book.publisher || 'N/A'} ({book.publishYear})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  {isHindi ? 'अलमारी / रैक' : 'Shelf Location'}
                </span>
                <span className="font-mono font-bold text-indigo-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  {book.shelfNumber || 'General Stacks'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  {isHindi ? 'कॉल नंबर' : 'Call Number'}
                </span>
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  {book.callNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Copies & Inventory Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {isHindi ? 'कुल प्रतियां' : 'Total Copies'}
            </span>
            <p className="text-lg font-black text-slate-800 mt-0.5">{book.totalCopies}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">
              {isHindi ? 'उपलब्ध (Shelf)' : 'Available'}
            </span>
            <p className="text-lg font-black text-emerald-800 mt-0.5">{book.availableCopies}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase">
              {isHindi ? 'बुकिंग कतार' : 'Hold Queue'}
            </span>
            <p className="text-lg font-black text-amber-800 mt-0.5">{activeReservations.length}</p>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'किताब का संक्षिप्त विवरण (Summary)' : 'Description & Summary'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {book.description}
            </p>
          </div>
        )}

        {/* Currently Checked Out To */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {isHindi
              ? `वर्तमान में किन छात्रों के पास है? (${activeBookLoans.length})`
              : `Current Borrowers (${activeBookLoans.length})`}
          </h4>
          {activeBookLoans.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              {isHindi
                ? 'यह किताब अभी किसी छात्र के पास नहीं है, सभी प्रतियां लाइब्रेरी में मौजूद हैं।'
                : 'No copies are currently checked out.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {activeBookLoans.map((l) => (
                <div key={l.id} className="p-2.5 bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{l.memberName}</span>
                    <span className="text-slate-400 ml-1.5 font-mono">({l.memberCode})</span>
                    <span className="block text-[11px] text-slate-500">
                      {isHindi ? 'जमा करने की अंतिम तारीख:' : 'Due:'} {new Date(l.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant={l.status === 'overdue' ? 'rose' : 'blue'}>
                    {l.status === 'overdue' ? (isHindi ? 'तय तारीख पार' : 'overdue') : (isHindi ? 'जारी' : 'issued')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsAssetTagModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            {isHindi ? 'किताब का QR / बारकोड टैग (Print Tag)' : 'Print Asset QR / Spine Tag'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onReserveBook(book.id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4" />
              {isHindi ? 'किताब बुक करें (Reserve)' : 'Place Hold / Reserve'}
            </button>
            <button
              onClick={() => {
                onClose();
                onIssueBook(book.id);
              }}
              disabled={book.availableCopies <= 0}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer ${
                book.availableCopies > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              {book.availableCopies > 0
                ? isHindi ? 'किताब दें (Issue)' : 'Issue Book'
                : isHindi ? 'स्टॉक उपलब्ध नहीं' : 'No Copies Available'}
            </button>
          </div>
        </div>
      </div>

      {/* Book Asset QR Tag Modal */}
      <BookAssetTagModal
        isOpen={isAssetTagModalOpen}
        onClose={() => setIsAssetTagModalOpen(false)}
        book={book}
      />
    </Modal>
  );
};
