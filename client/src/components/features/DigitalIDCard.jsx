import Badge from '../common/Badge';

export default function DigitalIDCard({ identity, showActions = false }) {
  if (!identity) return null;

  const {
    fullName = 'John Doe',
    digitalId = 'DID-2024-00001',
    role = 'Student',
    accessLevel = 'Standard',
    department = 'Computer Science',
    matricId = '2021/12345',
    photoUrl,
    issueDate = '2024-01-15',
    expiryDate = '2025-01-15',
    qrCodeUrl,
    status = 'active',
    institution = 'DSPoly Library',
  } = identity;

  const statusColors = {
    active: 'bg-status-active',
    suspended: 'bg-status-suspended',
    expired: 'bg-status-expired',
    revoked: 'bg-status-revoked',
    pending: 'bg-status-pending',
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB');
  };

  const handleDownload = () => {};
  const handlePrint = () => window.print();

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div
        className="relative overflow-hidden rounded-xl shadow-lg border border-neutral-200"
        style={{ aspectRatio: '85.6 / 54' }}
      >
        <div className="h-full flex flex-col">
          <div className="bg-primary-dark px-4 py-2 flex items-center justify-between relative">
            <div className="text-white">
              <p className="text-xs font-bold tracking-wider uppercase">
                {institution}
              </p>
              <p className="text-[10px] text-accent font-medium">
                Digital Identity Card
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent via-accent-light to-accent" />
          </div>

          <div className="flex-1 bg-white px-4 py-2 flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-[72px] w-[72px] rounded-full bg-neutral-100 border-2 border-neutral-200 overflow-hidden flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {fullName.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-neutral-900 truncate">
                {fullName}
              </h3>
              <p className="text-[10px] font-mono text-neutral-400 truncate">
                {digitalId}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant={status} size="sm">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <span className="text-[10px] font-medium text-neutral-500 uppercase">
                  {role}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {department} | {matricId}
              </p>
              <p className="text-[10px] text-neutral-400">
                Level: {accessLevel}
              </p>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center justify-center">
              <div className="h-10 w-10 bg-neutral-100 rounded flex items-center justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="grid grid-cols-3 gap-0.5">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 ${i % 2 === 0 ? 'bg-neutral-900' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[8px] text-neutral-300 mt-0.5">SCAN ME</span>
            </div>
          </div>

          <div className="bg-white px-4 py-1.5 border-t border-neutral-100 flex items-center justify-between text-[9px] text-neutral-400">
            <span>Issued: {formatDate(issueDate)}</span>
            <span>Expires: {formatDate(expiryDate)}</span>
          </div>

          <div className="h-1 bg-gradient-to-r from-accent via-accent-light to-accent" />
        </div>

        <div
          className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full border border-white shadow ${statusColors[status] || 'bg-neutral-300'}`}
        />
      </div>

      {showActions && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary-pale transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            Print Card
          </button>
        </div>
      )}
    </div>
  );
}
