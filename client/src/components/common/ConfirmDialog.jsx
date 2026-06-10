import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  requireReason = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) return;
    onConfirm(requireReason ? reason : undefined);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const confirmVariant = variant === 'warning' ? 'secondary' : 'danger';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <p className="text-sm text-neutral-600 mb-4">{message}</p>
      {requireReason && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
        />
      )}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={handleClose}>
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          disabled={requireReason && !reason.trim()}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
