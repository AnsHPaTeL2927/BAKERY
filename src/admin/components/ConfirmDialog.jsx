import Modal from './Modal';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-cocoa-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-blush px-4 py-2 text-sm font-semibold text-cocoa hover:bg-blush-soft"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-rose hover:bg-rose-deep'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
