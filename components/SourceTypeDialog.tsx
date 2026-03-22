'use client';

interface SourceTypeDialogProps {
  onSelect: (type: 'source' | 'background') => void;
  hasBackground: boolean;
}

export function SourceTypeDialog({ onSelect, hasBackground }: SourceTypeDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Typ měření
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Vyber typ vybraného intervalu:
        </p>

        <div className="flex gap-4">
          {!hasBackground && (
            <button
              onClick={() => onSelect('background')}
              className="flex-1 py-4 px-6 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-semibold transition-all border-2 border-blue-300 hover:border-blue-500"
            >
              Hluk pozadí
            </button>
          )}
          <button
            onClick={() => onSelect('source')}
            className={`${!hasBackground ? 'flex-1' : 'w-full'} py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg`}
          >
            Zdroj hluku
          </button>
        </div>
      </div>
    </div>
  );
}
